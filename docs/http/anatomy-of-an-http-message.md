---
title: 深入解說 HTTP message
description: Anatomy of an HTTP message
last_update:
  date: "2025-03-09T08:00:00+08:00"
---

## 關於本系列

這是一個 30 篇 HTTP 文章的挑戰，記錄我身為前端工程師，透過 NodeJS HTTP 模組的實際 Coding，學習 HTTP/1.1 的過程。文章內出現的程式碼，都會放在我的另一個 Repo [yusheng-tech-blog-nodejs](https://github.com/samuel871211/yusheng-tech-blog-nodejs)，歡迎大家 fork 一份自己來玩玩呦！

## raw HTTP 介紹

HTTP 簡單來說就是一個文本（字串）傳輸的協議，就像小學的時候，學校會教書信格式:

```
小明：
    您好，近來身體可好
    內容......
    祝
身體健康、工作順利
　　　　　　　　　　　　　　　　　　　　學生：王大明
　　　　　　　　　　　　　　　　　　　　　　１月１日
```

HTTP（Hyper Text Transfe Protocol）其實也是各種大神們訂的一個格式，主要分為 Request 跟 Response

HTTP Request:

https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_requests

```
POST /users HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 50

name=FirstName%20LastName&email=bsmth%40example.com
```

HTTP Response:

https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: http://example.com/users/123

{
  "message": "New user created",
  "user": {
    "id": 123,
    "firstName": "Example",
    "lastName": "Person",
    "email": "bsmth@example.com"
  }
}
```

可以看到 Request 跟 Response 都分成三個區塊

```
start-line
headers

body
```

區塊之間是透過 `\r\n`(也就是所謂的 CRLF) 來切開的，其中 headers 跟 bodys 區塊則是透過兩個 `\r\n` 來分隔

## CRLF Injection

講到這邊，有些聰明的小夥伴可能就會想到，那如果我在 header 的 value 插入 `\r\n` 會發生什麼事情？

還真的有人發現這種漏洞，漏洞名為 CRLF Injection，簡單來說就是 server 端沒有驗證使用者傳入的參數，就直接塞進 header 的 value。假設 server 有實作一個功能是把網址的 `?redirect=some-url` 解析，然後塞進 `Location` header，但因為缺乏驗證，所以攻擊者可能會構造這樣的字串:

```js
// 假設這段是從 req.url 取出來的字串
const queryStringRedirect = "https://google.com\r\nSet-Cookie: xxx";
res.setHeader("Location", queryStringRedirect);
```

實際回傳的 response header 就會變成

```
Location: https://google.com
Set-Cookie: xxx
```

透過這個 CRLF Injection 漏洞，就可以設定很多惡意的 header

但如果你實際上用 NodeJS 跑上面的程式碼，會發現噴錯

```
TypeError: Invalid character in header content ["Location"]
    ......
  code: 'ERR_INVALID_CHAR'
```

為什麼呢？因為 NodeJS 在 `setHeader` 這邊有實作過濾，避免 CRLF Injection 的情況發生

https://github.com/nodejs/node/blob/main/lib/_http_outgoing.js#L697

```js
OutgoingMessage.prototype.setHeader = function setHeader(name, value) {
  if (this._header) {
    throw new ERR_HTTP_HEADERS_SENT('set');
  }
  validateHeaderName(name);
  validateHeaderValue(name, value);

  ......
};
```

其中過濾的邏輯就是這個 `validateHeaderValue`

https://github.com/nodejs/node/blob/main/lib/_http_outgoing.js#L673

```js
const validateHeaderValue = hideStackFrames((name, value) => {
  if (value === undefined) {
    throw new ERR_HTTP_INVALID_HEADER_VALUE.HideStackFramesError(value, name);
  }
  if (checkInvalidHeaderChar(value)) {
    debug('Header "%s" contains invalid characters', name);
    throw new ERR_INVALID_CHAR.HideStackFramesError("header content", name);
  }
});
```

`ERR_INVALID_CHAR` 這個就是剛剛看到的錯誤，我們再繼續往下追 `checkInvalidHeaderChar` 的實作:

https://github.com/nodejs/node/blob/main/lib/_http_common.js#L214

```js
const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 */
function checkInvalidHeaderChar(val) {
  return headerCharRegex.test(val);
}
```

上面的 regex 其實是有定義在 HTTP/1.1 的規範，有興趣的朋友可以參考

- https://www.rfc-editor.org/rfc/rfc7230#section-3.2.6

由於 `\r` 跟 `\n` 都不是規範內合法的字元，所以就會噴錯

這就是為什麼了解 HTTP 的規範，還有其他的底層邏輯很重要，我相信能發現這些資安漏洞的大神們，一定對於這些規範也都很了解，才能想得出有這種資安漏洞可以鑽

如果大家對 CRLF Injection 有興趣，可參考以下 CVE 資料庫紀載的資安漏洞

- https://nvd.nist.gov/vuln/detail/CVE-2023-0040
- https://nvd.nist.gov/vuln/detail/CVE-2024-53693

今天的內容到這裡，開頭是介紹 Anatomy of an HTTP message，但沒想到卻延伸到了 CRLF Injection XDD

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#anatomy_of_an_http_message
- https://ithelp.ithome.com.tw/m/articles/10242682
- https://ithelp.ithome.com.tw/m/articles/10353840

<!-- todo 可補充 startline 更詳細 -->

---
title: Node.js http 冷知識：1xx、Upgrade、clientError 事件解析
description: "各種冷門事件：1xx Informational、103 Early Hints 的資安考量、clientError 觸發情境等等"
last_update:
  date: "2026-07-19T08:00:00+08:00"
---

## `request.on("information")`

<!-- https://nodejs.org/docs/latest-v24.x/api/http.html#event-information -->

會在 `ClientRequest` 收到 1xx status code（除了 [101 Switching Protocols](#onupgrade)）的時候觸發，通常包含

- [100 Continue](#100-continue)
- [102 Processing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/102)
- [103 Early Hints](#103-early-hints)

server

```ts
import net from "net";

const server = net.createServer((socket) =>
  socket.on("data", () => {
    socket.write("HTTP/1.1 199 WhatTheHack\r\nFoo: bar\r\n\r\n");
  }),
);
server.listen(5000);
```

client

```ts
import http from "http";

const clientRequest = http.request({ host: "localhost", port: 5000 });
clientRequest.end();
clientRequest.on("information", console.log);
```

output

```ts
{
  statusCode: 199,
  statusMessage: 'WhatTheHack',
  httpVersion: '1.1',
  httpVersionMajor: 1,
  httpVersionMinor: 1,
  headers: { foo: 'bar' },
  rawHeaders: [ 'Foo', 'bar' ]
}
```

## 100 Continue

<!-- - [request.on("continue")](https://nodejs.org/docs/latest-v24.x/api/http.html#event-continue)
- [server.on("checkContinue")](https://nodejs.org/docs/latest-v24.x/api/http.html#event-checkcontinue)
- [response.writeContinue()](https://nodejs.org/docs/latest-v24.x/api/http.html#responsewritecontinue) -->

參考我寫過的 [Expect: 100-Continue](../http/expect-100-continue.md)

## 103 Early Hints

<!-- Node.js http server 提供以下 method 來寫入 Early Hints
[response.writeEarlyHints(hints[, callback])](https://nodejs.org/docs/latest-v24.x/api/http.html#responsewriteearlyhintshints-callback) -->

103 Early Hints 最常用的情境就是告訴瀏覽器 **"response body 還在準備中，但你可以先載入這些 `Link` 的資源"**

```mermaid
sequenceDiagram

  participant B as browser
  participant S as server

  B ->> S: GET /index.html HTTP/1.1<br/>Host: example.com
  S ->> B: HTTP/1.1 103 Early Hints<br/>Link: </style.css>#59; rel=preload#59; as=style

  Note over B: preload http://example.com/style.css

  B ->> S: GET /style.css HTTP/1.1<br/>Host: example.com
  S ->> B: HTTP/1.1 200 OK<br/>Content-Type: text/css<br/>Content-Length: 999<br/><br/>CSS Content Here...

  Note over S: after few seconds
  S ->> B: HTTP/1.1 200 OK<br/>Content-Type: text/html<br/>Content-Length: 999<br/><br/>HTML Content Here...
```

<!-- ![](../../static/http-103-early-hints.svg) -->

server

```ts
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";

const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  if (req.url === "/") {
    const indexHTML = readFileSync(join(import.meta.dirname, "index.html"));
    res.writeEarlyHints({ link: "</style.css>; rel=preload; as=style" });
    setTimeout(() => res.end(indexHTML), 1000);
    return;
  }
  if (req.url === "/style.css") {
    res.end("body { color: red; }");
    return;
  }
  res.writeHead(404).end();
});
```

index.html

```html
<h1>hello world</h1>
```

瀏覽器打開 http://localhost:5000/ ，發現 103 Early Hints 提供的 `/style.css` 沒正確被載入

![http1.1-no-early-hints](../../static/img/http1.1-no-early-hints.jpg)

但還是可以用 `curl -v http://localhost:5000/` 戳看看

```
< HTTP/1.1 103 Early Hints
< Link: </style.css>; rel=preload; as=style
<
< HTTP/1.1 200 OK
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 20
<
<h1>hello world</h1>
```

### Browser compatibility

查詢 MDN 文件關於 [103 Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103#browser_compatibility) 的描述，發現主流瀏覽器都是在 HTTP/2 才有支援～

至於為何 HTTP/1.1 不建議使用呢？原因是ㄧ些老舊的 proxy 不支援 1xx Informational response

如果把 103 Early Hints 當成正常 HTTP response 的話

```
HTTP/1.1 103 Early Hints
Link: </style.css>; rel=preload; as=style


```

就有可能把 final rsponse 留在 TCP socket，造成 [Response Queue Poisoning](https://portswigger.net/web-security/request-smuggling/advanced/response-queue-poisoning)

```
HTTP/1.1 103 Early Hints
Link: </style.css>; rel=preload; as=style

HTTP/1.1 200 OK
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 20

<h1>hello world</h1>
```

通常 MDN 這種面對大眾的文件都會寫的比較隱晦

```
For compatibility and security reasons, it is recommended to only send HTTP 103 Early Hints responses over HTTP/2 or later unless the client is known to handle informational responses correctly.
```

### Multiple 103 Early Hints

我們接著看看 [RFC 9110 Section 15.2. Informational 1xx](https://datatracker.ietf.org/doc/html/rfc9110#section-15.2) 的介紹

```
A client MUST be able to parse one or more 1xx responses received prior to a final response, even if the client does not expect one. A user agent MAY ignore unexpected 1xx responses.
```

調整 Node.js `http.Server`，回傳兩個 Early Hints

```ts
import http from "http";

const httpServer = http.createServer();
httpServer.listen(5000);

httpServer.on("request", (req, res) => {
  if (req.url === "/") {
    res.writeEarlyHints({ link: "</style.css>; rel=preload; as=style" });
    res.writeEarlyHints({ link: "</script.js>; rel=preload; as=script" });
    res.end("hello world");
    return;
  }
  res.writeHead(404).end();
});
```

用 `curl -v http://localhost:5000/` 戳看看

```
< HTTP/1.1 103 Early Hints
< Link: </style.css>; rel=preload; as=style
<
< HTTP/1.1 103 Early Hints
< Link: </script.js>; rel=preload; as=script
<
< HTTP/1.1 200 OK
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 11
<
hello world
```

client 改用 Node.js

```ts
import http from "http";

const clientRequest = http.request({ host: "localhost", port: 5000 });
clientRequest.on("information", console.log);
clientRequest.end();
```

印出以下資訊，Node.js 有正確處理多個 1xx Informational response

```ts
{
  statusCode: 103,
  statusMessage: 'Early Hints',
  httpVersion: '1.1',
  httpVersionMajor: 1,
  httpVersionMinor: 1,
  headers: { link: '</style.css>; rel=preload; as=style' },
  rawHeaders: [ 'Link', '</style.css>; rel=preload; as=style' ]
}
{
  statusCode: 103,
  statusMessage: 'Early Hints',
  httpVersion: '1.1',
  httpVersionMajor: 1,
  httpVersionMinor: 1,
  headers: { link: '</script.js>; rel=preload; as=script' },
  rawHeaders: [ 'Link', '</script.js>; rel=preload; as=script' ]
}
```

### RFC 8297

不過很有趣的是，雖然 103 Early Hints 並不在 [RFC 9110: HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110#section-15.2) 的規範內

而是定義在 [RFC8297: An HTTP Status Code for Indicating Hints](https://datatracker.ietf.org/doc/html/rfc8297)

雖然只是 Proposed Standard，但主流瀏覽器在 HTTP/2 以後都有實作

## `server.on("checkExpectation")`

<!-- Node.js `http.Server` 提供以下 event 來監聽 `Expect: 100-continue` 以外的 Expectation
[server.on('checkExpectation')](https://nodejs.org/docs/latest-v24.x/api/http.html#event-checkexpectation) -->

[RFC 9110 Section 10.1.1. Expect](https://datatracker.ietf.org/doc/html/rfc9110#section-10.1.1) 有提到

```
The only expectation defined by this specification is "100-continue" (with no defined parameters).
```

不過 `Expect` 在語意上是可以支援其他 Expectation 的，所以 Node.js 預留了一個空間

```ts
import http from "http";

const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("checkExpectation", (req, res) => {
  res.writeHead(417);
  res.end(`Sorry, ${req.headers.expect} is not supported`);
});
```

用 `curl -H "Expect: 104-helloworld" -v http://localhost:5000/` 戳看看

```
< HTTP/1.1 417 Expectation Failed
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
<
Sorry, 104-helloworld is not supported
```

若 user program 沒有監聽 `server.on("checkExpectation")`，則 Node.js 預設也會回 417 Expectation Failed

```
HTTP/1.1 417 Expectation Failed
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

0


```

## `server.on("clientError")`

<!-- https://nodejs.org/docs/latest-v24.x/api/http.html#event-clienterror -->

觸發情境包含但不限於以下：

| Node.js Error Code                                                                                | Description                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ERR_HTTP_REQUEST_TIMEOUT](https://nodejs.org/api/errors.html#err_http_request_timeout)           | [Incomplete request exceeded headersTimeout or requestTimeout](./http-server-security.md#prevent-incomplete-request)                                            |
| [HPE_CHUNK_EXTENSIONS_OVERFLOW](https://nodejs.org/api/errors.html#hpe_chunk_extensions_overflow) | [Transfer-Encoding: chunked](../http/transfer-encoding.md) 的 [chunked extensions](https://datatracker.ietf.org/doc/html/rfc9112#section-7.1.1) exceeds maximum |
| [HPE_HEADER_OVERFLOW](https://nodejs.org/api/errors.html#hpe_header_overflow)                     | [Exceeded maxHeaderSize](./http-server-security.md#限制-headers-大小)                                                                                           |

- 這些情境，基本上都是 DoS 或是 [HTTP request smuggling](https://portswigger.net/web-security/request-smuggling) 的溫床
- Node.js 會在 user program 沒有註冊 `on("clientError")` 的情況，直接用 `socket.destroy` 關閉連線
- 如果 user program 有註冊 `"clientError"` 的話，則需要自行調用 `socket.destroy` 來關閉連線
- 細節使用方法，在 [Node.js http.Server 資安防護](./http-server-security.md#onclienterror) 有介紹到

<!-- ## `server.on("connect")`

https://nodejs.org/docs/latest-v24.x/api/http.html#event-connect_1

參考我寫過的 [HTTP CONNECT Method](../http/http-request-methods-1.md#connect) -->

<!-- ## `server.on("connection")`

參考我寫過的 [HTTP/1.1 為何只能 6 個連線?](../http/browser-max-tcp-connection-6-per-host.md) -->

## `on("upgrade")`

Node.js 在 `ClientRequest` 跟 `http.Server` 分別提供了 `on("upgrade")` 事件

- [server.on("upgrade")](https://nodejs.org/docs/latest-v24.x/api/http.html#event-upgrade_1)
- [request.on("upgrade")](https://nodejs.org/docs/latest-v24.x/api/http.html#event-upgrade)

```ts
import http from "http";

const upgradeResponse =
  "HTTP/1.1 101 Switching Protocols\r\n" +
  "Connection: Upgrade\r\n" +
  "Upgrade: Websocket\r\n\r\n";
const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("upgrade", (req, socket, head) => {
  // ✅ client 會觸發 `request.on("upgrade")`
  socket.write(upgradeResponse);
});

// ✅ client 若送 Upgrade 請求，就會觸發 `server.on("upgrade")`
const clientRequest = http.request({
  host: "localhost",
  port: 5000,
  headers: {
    connection: "Upgrade",
    upgrade: "Websocket",
  },
});
clientRequest.end();
clientRequest.on("upgrade", (response, socket, head) => {
  // ✅ It's now your responsibility to handle TCP socket
});
```

- 99% 的使用情境是需要 Upgrade 到 WebSocket，server 才必須監聽此事件
- 不過 [ws: a Node.js WebSocket library](https://github.com/websockets/ws) 已經處理好這個細節了
- 如果真的要學習的話，我會等到之後需要學習 WebSocket，再去翻 ws 的原始碼來讀

<!-- ## validate header

這些是 Node.js 原始碼在 [設定 header](./http-request-response-classes.md#寫入流程-1何時才會送出-header--了解-nodejs-api-的設計) 的時候會先驗證 key value 是否合法，user program 通常不會需要用到以下 methods

- [http.validateHeaderName(name[, label])](https://nodejs.org/docs/latest-v24.x/api/http.html#httpvalidateheadernamename-label)
- [http.validateHeaderValue(name, value)](https://nodejs.org/docs/latest-v24.x/api/http.html#httpvalidateheadervaluename-value) -->

## 小結

在這篇文章，我們學到了

- `ClientRequest` 的 `on("information")`
- 103 Early Hints 的用法跟 Browser compatibility，以及為何瀏覽器僅在 HTTP/2 之後才支援
- `server.on("checkExpectation")` 的觸發情境跟用法
- `server.on("clientError")` 的觸發情境
- `on("upgrade")` 的觸發情境跟用法

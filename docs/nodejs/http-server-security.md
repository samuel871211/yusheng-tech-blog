---
title: Node.js http uncommon features
description: "100 Continue, 103 Early Hints, server.on('clientError'), server.on('connect'), server.on('connection'), on('upgrade')"
last_update:
  date: "2026-03-03T08:00:00+08:00"
---

## 前言

http server 承受來自四面八方的 HTTP Request，需要有一套機制防止 DoS, DDos 以及 Slowloris Attack，避免 server 的資源被消耗完

## Prevent Incomplete Request

Node.js 提供以下 properties 可以設定 http server 的 timeout

- [http.createServer([options.connectionsCheckingInterval])](https://nodejs.org/docs/latest-v24.x/api/http.html#httpcreateserveroptions-requestlistener)
- [server.headersTimeout](https://nodejs.org/docs/latest-v24.x/api/http.html#serverheaderstimeout)
- [server.requestTimeout](https://nodejs.org/docs/latest-v24.x/api/http.html#serverrequesttimeout)

一個正常的 HTTP Request 如下

```
POST /user HTTP/1.1
Host: example.com
Content-Length: 23
Content-Type: application/json

{ "username": "hello" }
```

Node.js http server 只要收到完整的 headers 就可以觸發 `'request'` 事件。寫個 PoC 驗證：

```ts
import http from "http";

// http server
const httpServer = http.createServer().listen(5000);
httpServer.on("request", (req, res) => {
  console.log(req.headers);
});

// http client (use net.Socket to control raw bytes)
const socket = net.createConnection({ host: "localhost", port: 5000 });
socket.write(
  "POST /user HTTP/1.1\r\nHost: example.com\r\nContent-Length: 23\r\nContent-Type: application/json\r\n\r\n",
);

// Prints
// {
//   host: 'example.com',
//   'content-length': '23',
//   'content-type': 'application/json'
// }
```

[RFC 9110#section-5.3](https://datatracker.ietf.org/doc/html/rfc9110#section-5.3) 也有提到，http server 需要收到完整的 request headers section，才可以發送回應。所以 Node.js 選擇在 request headers 完整以後，才觸發 `'reuqest'` 事件，這邊是合理的（不需要等到 body 送完才觸發）

```
A server MUST NOT apply a request to the target resource until it receives the entire request header section
```

我們現在知道 request headers 區塊的邊界了，若 Client 刻意不發送完整的 request headers

```ts
import http from "http";

// http server
// ✅ 調低 connectionsCheckingInterval，比較好觀察 headersTimeout 的秒數
const httpServer = http.createServer({ connectionsCheckingInterval: 0 });
httpServer.headersTimeout = 3000;
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  console.log(req.headers);
});

// http client (use net.Socket to control raw bytes)
const socket = net.createConnection({ host: "localhost", port: 5000 });
// ✅ 刻意不包含 headers 結尾的 `\r\n\r\n`，觸發 `headersTimeout`
const data =
  "POST /user HTTP/1.1\r\nHost: example.com\r\nContent-Length: 23\r\nContent-Type: application/json";
socket.write(data, () => console.log(performance.now())); // 884.3236
socket.on("data", (chunk) => {
  console.log(performance.now()); // 3892.4877
  console.log({ chunk }); // { chunk: 'HTTP/1.1 408 Request Timeout\r\nConnection: close\r\n\r\n' }
});
```

粗略的計算 "client 送出 data" 到 "client 收到 408 Request Timeout" 的時間差，剛好 3 秒 => 符合預期

再來測試 [server.requestTimeout](https://nodejs.org/docs/latest-v24.x/api/http.html#serverrequesttimeout)

```ts
import http from "http";

// http server
// ✅ 調低 connectionsCheckingInterval，比較好觀察 headersTimeout 的秒數
const httpServer = http.createServer({ connectionsCheckingInterval: 0 });
// ✅ 由於 headersTimeout 的預設值是 Math.min(60000, requestTimeout)，故刻意設定一個比 requestTimeout 小的數字，方便觀察
httpServer.headersTimeout = 3000;
httpServer.requestTimeout = 4000;
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  req.resume();
  console.log(performance.now()); // 871.1117
  console.log(req.headers); // { 'content-length': '3', host: 'localhost:5000', connection: 'close' }
});

// http client
const clientRequest = http.request({
  host: "localhost",
  port: 5000,
  method: "POST",
  agent: false,
  // ✅ 宣告有 3 bytes 的 body
  headers: { "content-length": 3 },
});
// ✅ 送出完整的 headers，但不送出 body，以此觸發 requestTimeout
clientRequest.flushHeaders();
clientRequest.on("response", (res) => {
  console.log(performance.now()); // 4888.897
  console.log(res.statusCode, res.headers); // 408 { connection: 'close' }
});
```

粗略的計算 "client 送出 headers" 到 "client 收到 408 Request Timeout" 的時間差，剛好 4 秒 => 符合預期

如果想要自行處理 Request Timeout 的邏輯，可以在 http server 監聽 `'clientError'` 事件：

```ts
// 參考 lib/_http_server.js function socketOnError 的邏輯
httpServer.on("clientError", (err, socket) => {
  // ✅ 當 'clientError' 事件觸發時，Node.js 可能沒有收到完整的 HTTP Request Headers => 無法組出 `IncomingMessage`
  // ✅ 所以這個情況，user program 需要自行處理 `socket.write`, `socket.end` 以及 `socket.destroy`
  // ✅ The socket must be closed or destroyed before the listener ends.
  if (
    err instanceof Error &&
    (err as any).code === "ERR_HTTP_REQUEST_TIMEOUT" &&
    // @ts-ignore
    socket.writable &&
    (!socket._httpMessage || !socket._httpMessage._headerSent)
  ) {
    socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  }

  if (!socket.destroyed) socket.destroy();
});
```

## 限制 headers 大小

Node.js 提供以下 properties 可以限制 http client, server 的 headers 大小

- [http.maxHeaderSize](https://nodejs.org/docs/latest-v24.x/api/http.html#httpmaxheadersize)
- [http.createServer([options.maxHeaderSize])](https://nodejs.org/docs/latest-v24.x/api/http.html#httpcreateserveroptions-requestlistener)
- [http.request(url[, options.maxHeaderSize])](https://nodejs.org/docs/latest-v24.x/api/http.html#httprequesturl-options-callback)
- [request.maxHeadersCount](https://nodejs.org/docs/latest-v24.x/api/http.html#requestmaxheaderscount)
- [server.maxHeadersCount](https://nodejs.org/docs/latest-v24.x/api/http.html#servermaxheaderscount)

先來測試 http server 的 `maxHeaderSize`

```ts
const httpServer = http.createServer({ maxHeaderSize: 100 });
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  res.end("hello world");
});
```

http client 使用 `net.Socket` 精準計算 100 bytes

```ts
const socket = net.createConnection({
  host: "localhost",
  port: 5000,
});
const dummy80Bytes = Array(80).fill(0).join("");
socket.write(`GET / HTTP/1.1\r\nHost: localhost:5000${dummy80Bytes}\r\n\r\n`);
socket.setEncoding("latin1");
socket.on("data", console.log);
```

正常回傳 200

```
HTTP/1.1 200 OK
Date: Thu, 19 Feb 2026 13:08:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 11

hello world
```

接著增加 1 byte

```ts
const socket = net.createConnection({
  host: "localhost",
  port: 5000,
});
const dummy81Bytes = Array(81).fill(0).join("");
socket.write(`GET / HTTP/1.1\r\nHost: localhost:5000${dummy81Bytes}\r\n\r\n`);
socket.setEncoding("latin1");
socket.on("data", console.log);
```

收到 431，符合預期

```
HTTP/1.1 431 Request Header Fields Too Large
Connection: close


```

<!-- todo-yus -->不過如果處理多個 headers，計算 bytes 的邏輯就跟我預期的有點不一樣，這邊應該是要看 [llhttp](https://github.com/nodejs/llhttp) 的實作，但目前還沒讀到這裡～

再來測試 http server 的 `maxHeadersCount`

```ts
const httpServer = http.createServer();
httpServer.maxHeadersCount = 2;
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  // ✅ 將 req.headers 回寫到 response body 方便觀察
  res.end(JSON.stringify(req.headers));
});
```

送出以下 HTTP Request

```
GET / HTTP/1.1
Host: localhost:5000
Test: 67890
Foo: bar
AAA: 123


```

收到的 HTTP Response，發現 Node.js 把第三個以後的 headers 都切掉了

```
HTTP/1.1 200 OK
Date: Thu, 19 Feb 2026 15:11:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 40

{"host":"localhost:5000","test":"67890"}
```

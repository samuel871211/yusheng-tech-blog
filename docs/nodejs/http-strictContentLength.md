---
title: Node.js ServerResponse.strictContentLength
description: 實測 Content-Length 大於或小於實際 body bytes 時，client 卡住、截斷或 parse error 的行為差異
last_update:
  date: "2026-07-16T08:00:00+08:00"
---

## 給 Server 加上防呆：`response.strictContentLength`

Node.js `http.Server` 預設 **"不會"** 檢查 response header 的 `Content-Length` 跟實際送出的 body byte length 是否一致

設定 [response.strictContentLength](https://nodejs.org/docs/latest-v24.x/api/http.html#responsestrictcontentlength) 之後，才會去檢查

## `Content-Length` 大於 actual bytes

server 若宣告 `Content-Length: 3`，實際只送 2 bytes，就會造成 HTTP client 的錯誤

```ts
import http from "http";

const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  res.setHeader("Content-Length", 3);
  res.end("12");
});
```

client 用 `curl http://localhost:5000/ -v` 測試，發現 curl 等待幾秒左右就關閉連線了

```
< HTTP/1.1 200 OK
< Content-Length: 3
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* transfer closed with 1 bytes remaining to read
* Closing connection
curl: (18) transfer closed with 1 bytes remaining to read
12
```

用 [Wireshark](https://www.wireshark.org/download.html) 抓 Loopback: lo0，加上篩選 tcp.port == 5000。發現 server 回傳 HTTP response 的 6 秒後，server 主動關閉連線

![curl-cl-bigger](../../static/img/curl-cl-bigger.jpg)

這 6 秒是以下兩個的預設值相加得來的

- [server.keepAliveTimeout](https://nodejs.org/docs/latest-v24.x/api/http.html#serverkeepalivetimeout)
- [server.keepAliveTimeoutBuffer](https://nodejs.org/docs/latest-v24.x/api/http.html#serverkeepalivetimeoutbuffer)

## `Content-Length` 小於 actual bytes

server 若宣告 `Content-Length: 3`，實際送了 4 bytes，也會造成 HTTP client 的錯誤

```ts
import http from "http";

const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  res.setHeader("Content-Length", 3);
  res.end("1234");
});
```

client 用 `curl http://localhost:5000/ -v` 測試，發現 curl 會把超過的 body 截斷，並且 curl 會立即關閉連線

```
< HTTP/1.1 200 OK
< Content-Length: 3
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Excess found writing body: excess = 1, size = 3, maxdownload = 3, bytecount = 3
* Closing connection
123
```

client 改用 Node.js `http.request` 測試

```ts
import http from "http";

const clientRequest = http.request({
  host: "localhost",
  port: 5000,
  agent: false,
});
clientRequest.end();
clientRequest.on("error", console.log); // ✅ Error: Parse Error: Data after `Connection: close`
clientRequest.on("response", (res) => {
  console.log(res.headers); // ✅ 會正確觸發
  res.setEncoding("latin1");
  res.on("data", console.log); // ✅ 123
  res.on("end", () => console.log("end")); // ✅ 會正確觸發
});

// Prints

// {
//   'content-length': '3',
//   connection: 'close'
// }

// Error: Parse Error: Data after `Connection: close`

// 123

// end
```

## 設定 `response.strictContentLength`

server 為了預防上述情境，可以設定 `response.strictContentLength`

```ts
import http from "http";

const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  res.strictContentLength = true;
  res.setHeader("Content-Length", 3);
  res.end("123G");
});
```

client 用 `curl http://localhost:5000/` 測試，收到 `curl: (52) Empty reply from server`，並且 Node.js 的 log 顯示

```
Error: Response body's content-length of 4 byte(s) does not match the content-length of 3 byte(s) set in header
```

這是在 `OutgoingMessage.prototype.end` 拋出的錯誤，無法透過 `on("error")` 捕捉

```ts
function strictContentLength(msg) {
  return (
    msg.strictContentLength &&
    msg._contentLength != null &&
    msg._hasBody &&
    !msg._removedContLen &&
    !msg.chunkedEncoding &&
    !msg.hasHeader("transfer-encoding")
  );
}

OutgoingMessage.prototype.end = function end(chunk, encoding, callback) {
  // other logic...

  if (
    strictContentLength(this) &&
    this[kBytesWritten] !== this._contentLength
  ) {
    throw new ERR_HTTP_CONTENT_LENGTH_MISMATCH(
      this[kBytesWritten],
      this._contentLength,
    );
  }

  // other logic...
};
```

## 小結

在這篇文章，我們學到了

- 預設情況下，Node.js 不會檢查 `Content-Length` 跟實際送出的 body bytes 是否一致
- `Content-Length` 大於實際 bytes：client 會卡住，直到 `keepAliveTimeout` 才斷線
- `Content-Length` 小於實際 bytes：多餘的 body 會被截斷，甚至造成 client 端 parse error
- 設定 `response.strictContentLength` 後，長度不一致會在 `end()` 直接拋出同步錯誤，且無法用 `on("error")` 捕捉

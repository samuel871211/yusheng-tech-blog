---
title: Node.js net.Socket
description: 用 net 模組創建 TCP Server / Client
---

## 前言

Node.js 的 net.Socket 是一個 TCP 的抽象 & 封裝，讓開發者不必理解 TCP (Layer 4) 的架構，使用封裝好的 API 就可以建立 TCP 連線、傳輸資料

所謂的 TCP 架構，包含但不限於以下：

1. TCP Finite State Machine
2. TCP Header
3. TCP Flags
4. TCP HandShake
5. TCP Checksum

透過封裝好的 API，就可以不必關注以上細節

## From HTTP Point of View

✅ 為了簡化邏輯，我們先以 HTTP/1.1 Plain Text 當作舉例

### As a HTTP Client

正常要發起 HTTP Request

```ts
fetch("http://example.com")
  .then((res) => res.text())
  .then(console.log);

// <!doctype html><html lang="en"><head><title>Example Domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#eee;width:60vw;margin:15vh auto;font-family:system-ui,sans-serif}h1{font-size:1.5em}div{opacity:0.8}a:link,a:visited{color:#348}</style><body><div><h1>Example Domain</h1><p>This domain is for use in documentation examples without needing permission. Avoid use in operations.<p><a href="https://iana.org/domains/example">Learn more</a></div></body></html>
```

若以 net 模組來達成這件事情

```ts
const socket = net.connect({
  host: "example.com",
  port: 80,
});
socket.setEncoding("utf8"); // ✅ setEncoding 是 stream.Readable 的 method
socket.write("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"); // ✅ write 是 stream.Writable 的 method
socket.on("data", console.log); // ✅ on('data') 是 stream.Readable 的 event

// HTTP/1.1 200 OK
// Date: Thu, 29 Jan 2026 06:50:35 GMT
// Content-Type: text/html
// Transfer-Encoding: chunked
// Connection: keep-alive
// CF-RAY: 9c56cbd4d8fe8a97-TPE
// Last-Modified: Tue, 27 Jan 2026 13:22:54 GMT
// Allow: GET, HEAD
// Accept-Ranges: bytes
// Age: 8132
// cf-cache-status: HIT
// Server: cloudflare

// 201
// <!doctype html><html lang="en"><head><title>Example Domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#eee;width:60vw;margin:15vh auto;font-family:system-ui,sans-serif}h1{font-size:1.5em}div{opacity:0.8}a:link,a:visited{color:#348}</style><body><div><h1>Example Domain</h1><p>This domain is for use in documentation examples without needing permission. Avoid use in operations.<p><a href="https://iana.org/domains/example">Learn more</a></div></body></html>

// 0
//
//
```

- 我們平常用的 HTTP Client (curl, fetch, Postman...)，底層也是透過 TCP Socket 來傳輸 raw bytes
- 在 net 模組的範例，可以看到 16 進位的 201 跟 0，這是 [Transfer-Encoding](../http/transfer-encoding.md) 用來宣告下一行的資料有多少 bytes
- HTTP Client 幫開發者處理好了 HTTP Parsing, Connection Reuse 等等底層細節
- 在 [stream-overview](stream-overview.md#streamduplex) 有提到 Socket 繼承 stream.Duplex，故包含 Readable 跟 Writable 的所有 methods

### As a HTTP Server

正常要創建一個 HTTP Server

```ts
const httpServer = http.createServer();
httpServer.on("request", (req, res) => {
  res.end("ok");
});
httpServer.listen(5000);

// curl http://localhost:5000 -v
// * Host localhost:5000 was resolved.
// * IPv6: ::1
// * IPv4: 127.0.0.1
// *   Trying [::1]:5000...
// * Connected to localhost (::1) port 5000
// > GET / HTTP/1.1
// > Host: localhost:5000
// > User-Agent: curl/8.7.1
// > Accept: */*
// >
// * Request completely sent off
// < HTTP/1.1 200 OK
// < Date: Thu, 29 Jan 2026 08:27:19 GMT
// < Connection: keep-alive
// < Keep-Alive: timeout=5
// < Content-Length: 2
// <
// * Connection #0 to host localhost left intact
// ok%
```

若以 net 模組來達成這件事情

```ts
const server = net.createServer({ allowHalfOpen: true });
server.on("connection", (socket) => {
  socket.on("data", (chunk) => {
    // todo: implement HTTP Parser to parse chunk...
    socket.write("HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok");
  });
});
server.listen(5000);

// curl http://localhost:5000 -v
// * Host localhost:5000 was resolved.
// * IPv6: ::1
// * IPv4: 127.0.0.1
// *   Trying [::1]:5000...
// * Connected to localhost (::1) port 5000
// > GET / HTTP/1.1
// > Host: localhost:5000
// > User-Agent: curl/8.7.1
// > Accept: */*
// >
// * Request completely sent off
// < HTTP/1.1 200 OK
// < Content-Length: 2
// <
// * Connection #0 to host localhost left intact
// ok%
```

## net.Server (net.createServer)

## net.connect (net.createConnection)

<!-- ## net.Socket -->

<!-- NodeJS HTTP 就是繼承 Socket -->

## 參考資料

- https://nodejs.org/api/net.html

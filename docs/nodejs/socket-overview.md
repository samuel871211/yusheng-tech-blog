---
title: Node.js TCP Socket overview
description: 用 net 模組創建 TCP Server / Client，並且了解 Socket 的概念、用法
last_update:
  date: "2026-02-04T08:00:00+08:00"
---

## 前言

Node.js 的 net.Socket 是一個 TCP (Layer 4) 的抽象 & 封裝，讓開發者不必理解 TCP 的架構，直接使用封裝好的 API 就可以建立 TCP 連線、傳輸資料

所謂的 TCP 架構，包含但不限於以下：

1. TCP Finite State Machine
2. TCP Header
3. TCP Flags
4. TCP HandShake
5. TCP Checksum

透過封裝好的 API，就可以不必關注以上細節

:::info
TCP Socket 這個抽象 & 封裝並非 Node.js 獨有的概念，許多程式語言都有實作 Socket 模組
:::

## From HTTP Point of View

✅ 為了簡化邏輯，我們先以 HTTP/1.1 Plain Text 當作舉例

### As a HTTP Client

身為前端工程師，正常要發起 HTTP Request

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

- 我們平常用的 HTTP Client (curl, fetch, Postman...) 底層也是透過 TCP Client Socket 來傳輸 raw bytes
- 在 net 模組的範例，可以看到 16 進位的 201 跟 0，這是 [Transfer-Encoding](../http/transfer-encoding.md) 用來宣告下一行的資料有多少 bytes
- HTTP Client 幫開發者處理好了 HTTP Parsing, Connection Reuse 等等底層細節
- 在 [stream-overview](stream-overview.md#streamduplex) 有提到 Socket 繼承 stream.Duplex，故包含 Readable 跟 Writable 的所有 methods

### As a HTTP Server

正常要用 Node.js 創建一個 HTTP Server

```ts
const httpServer = http.createServer();
httpServer.on("request", (req, res) => {
  res.end("ok");
});
httpServer.listen(5000);
```

用 curl 戳看看，確認真的有收到 HTTP Response

```ts
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
```

用 curl 戳看看，確認真的有收到 HTTP Response

```ts
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

要創建一個 TCP Server 的話，可以使用

```ts
const server5000 = new net.Server();
server5000.listen(5000);

const server5001 = net.createServer();
server5001.listen(5001);
```

這兩者是等效的，其中 `createServer` 是一個 wrapper function，單純是語意上比較好理解，這也是 Node.js 的一貫風格

https://github.com/nodejs/node/blob/main/lib/net.js

```ts
function createServer(options, connectionListener) {
  return new Server(options, connectionListener);
}
```

## net.connect (net.createConnection)

要創建一個 TCP Client 連線到 localhost:5000 的話，可以使用

```ts
const socket = net.connect({
  host: "localhost",
  port: 5000,
});

const socket = net.createConnection({
  host: "localhost",
  port: 5000,
});
```

這兩者是完全一樣的 function，只是名稱不一樣

https://github.com/nodejs/node/blob/main/lib/net.js

```ts
module.exports = {
  connect,
  createConnection: connect,
};
```

並且從 [Node.js 官方文件](https://nodejs.org/api/net.html#netcreateconnection) 可以得知這是一個用來創建 [net.Socket](https://nodejs.org/api/net.html#class-netsocket) 的 factory function

```
A factory function, which creates a new net.Socket, immediately initiates connection with socket.connect(), then returns the net.Socket that starts the connection.
```

直接看 [Node.js 原始碼](https://github.com/nodejs/node/blob/main/lib/net.js) 的話

```ts
function connect(...args) {
  const normalized = normalizeArgs(args);
  const options = normalized[0];
  debug("createConnection", normalized);
  const socket = new Socket(options);

  if (options.timeout) {
    socket.setTimeout(options.timeout);
  }

  return socket.connect(normalized);
}
```

其實就是幫忙設定 `socket.setTimeout` 跟 `socket.connect` 而已XD

## Client / Server 小結

我們現在學會了創建 TCP Client / Server 的語法，並且也成功傳輸 HTTP/1.1 Plain Text。接下來要針對 `net.Socket` 深入講解

:::info
`net.Socket` 跟 TCP Socket 在本篇文章會大量提到，並且代表的是同樣的概念
:::

## TCP Socket 也有 keepAlive ?!

我在去年寫的 HTTP 文章 [Keep-Alive 和 Connection](../http/keep-alive-and-connection.md) 有提到 keepAlive，但 HTTP 層級跟 TCP Socket 層級的 keepAlive 是不同的概念

HTTP 層級的 `keepAlive: timeout=5, max=200` 代表的是

- 這條 TCP Connection 若 5 秒沒有傳輸資料則關閉
- 這條 TCP Connection 最多只能傳送 200 個 HTTP Round Trip 就要關閉

而 TCP 層級的 `keepAlive` 則是一個 "heartbeat" 機制，可由 Client 或 Server 發出，確認對方是否還活著

以 Server 發出 "keepAlive heartbeat" 為例

```ts
const server = net.createServer({
  keepAlive: true,
  keepAliveInitialDelay: 3000,
});
server.listen(5000);
server.on("listening", () => {
  const socket = net.connect({
    host: "localhost",
    port: 5000,
    keepAlive: false,
  });
});
```

用 [Wireshark](https://www.wireshark.org/download.html) 抓 Loopback: lo0，加上篩選 tcp.port == 5000
![tcp-keep-alive](../../static/img/tcp-keep-alive.jpg)

- 可以看到每 3 秒，由 TCP Server 發出 TCP Keep-Alive 封包，Client 回應 TCP Keep-Alive ACK 封包
- 雖說 `keepAliveInitialDelay: 3000` 的語意是指 TCP 三方交握，過了 3 秒都沒傳輸資料的話，Server 就會發出 "heartbeat"
- 但實際上我用 Node.js v24.13.0 (LTS) + macOS 15.6.1 測試的結果，每 3 秒就會傳送一次 TCP Keep-Alive，這邊我沒深入研究原因

## BlockList

Node.js 在 [createServer](https://nodejs.org/api/net.html#netcreateserveroptions-connectionlistener) 時，有個參數是 [blockList](https://nodejs.org/api/net.html#class-netblocklist)，可以阻擋特定 IP addresses, ranges, 或 subnets 的連線

使用方式也很簡單，先創建一個 blockList

```ts
const blockList = new BlockList();
blockList.addAddress("127.0.0.1", "ipv4");
```

再來創建一個最小 TCP Server

```ts
const server = net.createServer({ blockList });
server.listen(5000);
server.on("connection", (serverSocket) => console.log("connection"));
```

最後創建一個 TCP Client 連過去

<!-- prettier-ignore -->
```ts
const clientSocket = net.createConnection({
  host: "localhost",
  port: 5000,
  family: 4,
  allowHalfOpen: true
});
clientSocket.on("connectionAttempt", () => console.log("connectionAttempt"));
clientSocket.on("connect", () => console.log("connect"));
clientSocket.on("connectionAttemptFailed", () => console.log("connectionAttemptFailed"));
clientSocket.on("connectionAttemptTimeout", () => console.log("connectionAttemptTimeout"));
clientSocket.on("finish", () => console.log("finish"));
clientSocket.on("end", () => console.log("end"));
clientSocket.on("error", () => console.log("err"));
clientSocket.on("close", () => console.log("close"));

// Prints
// connectionAttempt
// connect
// end
```

若用 [Wireshark](https://www.wireshark.org/download.html) 抓 Loopback: lo0，加上篩選 tcp.port == 5000
![wireshark-blocklist](../../static/img/wireshark-blocklist.jpg)

透過以上觀察，我們可以發現：

- TCP 有成功三次交握，並且 Server 後續立即發送 FIN (Finish) 封包
- 由於 TCP Client 有設定 allowHalfOpen，所以連線還是會維持半開
- 對 TCP Server 來說，不會觸發 `on("connection")`，因為 blockList 已經擋掉了這個連線

## maxConnections

Node.js 的 [net.Server](https://nodejs.org/api/net.html#class-netserver) 有個 [maxconnections](https://nodejs.org/api/net.html#servermaxconnections) 可以控制，我們來測測看

啟動 TCP Server，將 maxConnections 設成 1

```ts
const server = net.createServer();
server.maxConnections = 1;
server.listen(5000);
server.on("connection", (serverSocket) => {
  console.log("connection");
});
server.on("drop", console.log);
```

建立 2 個 TCP Client，依序連過去

```ts
// TCP Client
const clientSocket1 = net.createConnection({
  host: "localhost",
  port: 5000,
  family: 4,
  allowHalfOpen: true,
});
clientSocket1.on("connect", () => {
  const clientSocket2 = net.createConnection({
    host: "localhost",
    port: 5000,
    family: 4,
    allowHalfOpen: true,
  });
});
```

最終結果，第 1 個成功建立連線，第 2 個觸發 `on("drop")`

```ts
connection
[Object: null prototype] {
  localAddress: '::ffff:127.0.0.1',
  localPort: 5000,
  localFamily: 'IPv6',
  remoteAddress: '::ffff:127.0.0.1',
  remotePort: 7278,
  remoteFamily: 'IPv6'
}
```

若用 [Wireshark](https://www.wireshark.org/download.html) 抓 Loopback: lo0，加上篩選 tcp.port == 5000
![wireshark-maxconnections](../../static/img/wireshark-maxconnections.jpg)

透過以上觀察，我們可以發現第二個連線，其行為與觸發 [blocklist](#blocklist) 幾乎是一樣的：

- TCP 有成功三次交握，並且 Server 後續立即發送 FIN (Finish) 封包
- 由於 TCP Client 有設定 allowHalfOpen，所以連線還是會維持半開
- 對 TCP Server 來說，不會觸發 `on("connection")`，而是會觸發 `on("drop")`

## 小結

這篇文章，我們以 HTTP 的視角來對比 TCP Client / Server，並且也學會了基本的語法跟參數。接下來，會進到 TCP Socket 的生命週期～

## 參考資料

- https://nodejs.org/api/net.html

---
title: Node.js http.Server Graceful Shutdown 完整教學
description: "close、closeAllConnections、closeIdleConnections 差異，並實作 SIGINT/SIGTERM 與 timeout 強制退出"
last_update:
  date: "2026-07-15T08:00:00+08:00"
---

## 前言

本機開發都是直接 Ctrl + C 去砍 Node.js process，所以對於 graceful shutdown HTTP server 無感。但如果是 production 環境的 HTTP server，每個 HTTP request 都可能對應到資料庫的 CRUD，中斷就有可能造成不可預期的後果，所以如何優雅的關閉 server 也是一門學問！

## methods

Node.js 提供以下 methods 來關閉 `http.Server`

- [server.close([callback])](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback)
- [server.closeAllConnections()](https://nodejs.org/docs/latest-v24.x/api/http.html#servercloseallconnections)
- [server.closeIdleConnections()](https://nodejs.org/docs/latest-v24.x/api/http.html#servercloseidleconnections)

## Cheat Sheet

| method                          | Description                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `server.close([callback])`      | Graceful shutdown.                                                                    |
| `server.closeAllConnections()`  | Destroy all sockets immediately.<br/>Use with caution.                                |
| `server.closeIdleConnections()` | Graceful shutdown.<br/>This function is called inside<br/>`server.close([callback]) ` |

## 研究官方文件 & 原始碼

再來看看官方文件對於 [server.close([callback])](https://nodejs.org/api/http.html#serverclosecallback) 的描述：

```
Stops the server from accepting new connections and closes all connections connected to this server which are not sending a request or waiting for a response.
```

搭配原始碼服用，直接看看背後做了哪些事情

`server.close([callback])`

```js
Server.prototype.close = function close() {
  httpServerPreClose(this);
  // ✅ http.Server 繼承 net.Server，故這邊直接呼叫 net.Server 的 close
  ReflectApply(net.Server.prototype.close, this, arguments);
  return this;
};

function httpServerPreClose(server) {
  // ✅ 背後會幫你呼叫 closeIdleConnections
  server.closeIdleConnections();
  clearInterval(server[kConnectionsCheckingInterval]);
}
```

`server.closeIdleConnections()`

```ts
Server.prototype.closeIdleConnections = function closeIdleConnections() {
  if (!this[kConnections]) {
    return;
  }

  const connections = this[kConnections].idle();

  for (let i = 0, l = connections.length; i < l; i++) {
    if (
      connections[i].socket._httpMessage &&
      !connections[i].socket._httpMessage.finished
    ) {
      continue;
    }

    connections[i].socket.destroy();
  }
};
```

`server.closeAllConnections()`

```ts
Server.prototype.closeAllConnections = function closeAllConnections() {
  if (!this[kConnections]) {
    return;
  }

  const connections = this[kConnections].all();

  for (let i = 0, l = connections.length; i < l; i++) {
    connections[i].socket.destroy();
  }
};
```

## 優雅的關閉 `http.Server`

實務上在寫 production HTTP server 時，通常都會處理優雅關閉 server 的邏輯：

```ts
// server
const httpServer = http.createServer();
httpServer.listen(5000);
httpServer.on("request", (req, res) => {
  // 模擬延遲
  setTimeout(() => res.end("hello world"), 5000);
});

let closed = false;
function gracefulClose() {
  // 確保 gracefulClose 只被執行一次
  if (closed) return;
  closed = true;

  // 主邏輯
  httpServer.close(() => {
    console.log("httpServer closed");
    process.exit(0);
  });

  // 避免惡意 client 掛著連線導致 process 永遠不結束，設定 10 秒的 timeout
  const timeout = setTimeout(() => {
    console.error("force exit");
    process.exit(1);
  }, 10000);
  // 若 10 秒內就 close，別讓 timeout 掛著 Node.js process event loop
  timeout.unref();
}
// 通常是 Ctrl + C
process.once("SIGINT", gracefulClose);
// Termination signal
process.once("SIGTERM", gracefulClose);
```

假設在 process `SIGINT` 或 `SIGTERM` 之前，剛好有個 HTTP request 正在處理中，預期的時間軸如下

```mermaid
timeline
    0s: HTTP request
      : SIGINT or SIGTERM
      : gracefulClose
    5s: end("hello world")
      : httpServer closed
```

<!-- ![](../../static/http-server-close-timeline-5s.svg) -->

若將 HTTP server 的延遲改成 20 秒

```ts
httpServer.on("request", (req, res) => {
  // 模擬延遲
  setTimeout(() => res.end("hello world"), 20000);
});
```

則預期的時間軸如下

```mermaid
timeline
    0s : HTTP request
       : SIGINT or SIGTERM
       : gracefulClose
    10s: force exit
```

<!-- ![](../../static/http-server-close-timeline-10s.svg) -->

## 小結

在這篇，我們學到了

- `server.close()` / `closeAllConnections()` / `closeIdleConnections()` 三個關閉 method 的差異
- `server.close()` 背後其實會呼叫 `closeIdleConnections()`，只砍 idle 的連線，正在處理中的 request 不受影響
- 搭配 `SIGINT` / `SIGTERM` 實作 graceful shutdown，並用 timeout 強制 exit，避免惡意或掛住的連線讓 process 卡住

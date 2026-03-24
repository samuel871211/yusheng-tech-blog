---
title: "為何 undici 跟 node:http 都選擇在 HEAD 請求之後關閉連線？"
description: "為何 undici 跟 node:http 都選擇在 HEAD 請求之後關閉連線？"
last_update:
  date: "2026-03-23T08:00:00+08:00"
---

## 前言

在研究 undici 跟 node:http 的時候，我發現這兩個 http client 都選擇在 HEAD 請求之後關閉連線，背後究竟是怎樣的技術決策，讓我們來看看吧！

## `node:http` PoC

http server

```js
const server = http.createServer();
server.listen(5000);
server.on("request", (req, res) => res.end("123"));
```

http client 記得要啟用 `keepAlive: true`

```js
const agent = new http.Agent({ keepAlive: true });
// ✅ client close the TCP Connection after HEAD
const clientReqeust = http.request({
  agent,
  host: "localhost",
  port: 5000,
  method: "HEAD",
  path: "/",
});
clientReqeust.end();
```

送出的 raw HTTP Request

<div className="httpRawRequest">
  <div className="blue">HEAD / HTTP/1.1</div>
  <div className="blue">Host: localhost:5000</div>
  <div className="blue">Connection: keep-alive</div>
  <div className="blue"></div>
  <div className="blue"></div>
</div>

收到的 raw HTTP Response

<div className="httpRawRequest">
  <div className="blue">HTTP/1.1 200 OK</div>
  <div className="blue">Date: Tue, 24 Mar 2026 06:54:11 GMT</div>
  <div className="blue">Connection: keep-alive</div>
  <div className="blue">Keep-Alive: timeout=5</div>
  <div className="blue"></div>
  <div className="blue"></div>
</div>

用 [Wireshark](https://www.wireshark.org/download.html) 抓封包，發現是 client 主動關閉連線的！
![http-client-close-connection-after-head](../../static/img/http-client-close-connection-after-head.jpg)

## trace `node:http` 原始碼

稍微追了一下 `lib/_http_client.js` 原始碼

```js
function parserOnIncomingClient(res, shouldKeepAlive) {
  // ...省略

  if (req.shouldKeepAlive && !shouldKeepAlive && !req.upgradeOrConnect) {
    // Server MUST respond with Connection:keep-alive for us to enable it.
    // If we've been upgraded (via WebSockets) we also shouldn't try to
    // keep the connection open.
    req.shouldKeepAlive = false;
  }

  // ...省略
}
```

parser 應該是用 C 語言寫的，然後再透過以下方式 binding（這塊我沒深入研究實際是怎麼 binding 的）

```js
const { HTTPParser } = internalBinding("http_parser");
```

調整 http client 的程式碼，觀察 `shouldKeepAlive` 的變化

```js
const agent = new http.Agent({ keepAlive: true });
// ✅ client close the TCP Connection after HEAD
const clientReqeust = http.request({
  agent,
  host: "localhost",
  port: 5000,
  method: "HEAD",
  path: "/",
});
clientReqeust.end(() => console.log(clientReqeust.shouldKeepAlive)); // true
clientReqeust.on("response", () => console.log(clientReqeust.shouldKeepAlive)); // false
```

## 對照 RFC 9112 Section 6.3. Message Body Length

我突然想到之前看過 [RFC 9112 Section 6.3. Message Body Length](https://datatracker.ietf.org/doc/html/rfc9112#section-6.3)，理論上 Node.js 的 `HTTPParser` 應該進到第一條規則：

```
Any response to a HEAD request and any response with a 1xx (Informational), 204 (No Content), or 304 (Not Modified) status code is always terminated by the first empty line after the header fields, regardless of the header fields present in the message, and thus cannot contain a message body or trailer section.
```

也就是說，這是一個 HEAD Request 的合法 HTTP Response

<div className="httpRawRequest">
  <div className="blue">HTTP/1.1 200 OK</div>
  <div className="blue">Date: Tue, 24 Mar 2026 06:54:11 GMT</div>
  <div className="blue">Connection: keep-alive</div>
  <div className="blue">Keep-Alive: timeout=5</div>
  <div className="blue"></div>
  <div className="blue"></div>
</div>

但同時第八條規則也說了

```
Otherwise, this is a response message without a declared message body length, so the message body length is determined by the number of octets received prior to the server closing the connection.
```

若 `HTTPParser` 讀出來的 raw HTTP Responses 長這樣

<div className="httpRawRequest">
  <div className="blue">HTTP/1.1 200 OK</div>
  <div className="blue">Date: Tue, 24 Mar 2026 06:54:11 GMT</div>
  <div className="blue">Connection: keep-alive</div>
  <div className="blue">Keep-Alive: timeout=5</div>
  <div className="blue"></div>
  <div className="blue">HTTP/1.1 404 Not Found</div>
  <div className="blue"></div>
  <div className="blue"></div>
</div>

1. `HTTPParser` 必須知道第一個 HTTP Response（200 OK）對應的 HTTP Request Method 是 "HEAD"
2. 並且同時嚴格遵守第一條規定
3. 否則 `HTTPParser` 就會把第二個 HTTP Response（404 Not Found）視為第一個 HTTP Response（200 OK）的 body

我推測 `HTTPParser` 可能採取比較保守的做法：

**一定要看到 `Content-Length` 或是 `Transfer-Encoding: chunked` 才會將此連線視為 `shouldKeepAlive`**

## response 明確宣告 `Content-Length: 0`

server 改成用 `net.createServer`，明確宣告 `Content-Length: 0`

```js
const server = net.createServer();
server.listen(5000);
server.on("connection", (socket) => {
  socket.on("data", () =>
    socket.write(
      "HTTP/1.1 200 OK\r\n" +
        "Connection: keep-alive\r\n" +
        "Keep-Alive: timeout=5\r\n" +
        "Content-Length: 0\r\n" +
        "\r\n",
    ),
  );
});
```

http client 程式碼不變

```js
const agent = new http.Agent({ keepAlive: true, keepAliveMsecs: Infinity });
const clientReqeust = http.request({
  agent,
  host: "localhost",
  port: 5000,
  method: "HEAD",
  path: "/",
});
clientReqeust.end(() => console.log(clientReqeust.shouldKeepAlive)); // true
clientReqeust.on("response", () => console.log(clientReqeust.shouldKeepAlive)); // true
```

<!-- todo-yus -->

## undici PoC

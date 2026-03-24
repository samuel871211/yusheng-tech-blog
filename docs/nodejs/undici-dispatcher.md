---
title: undici Class Dispatcher
description: undici Class Dispatcher
last_update:
  date: "2026-03-23T08:00:00+08:00"
---

- Dispatcher 是 undici 最底層、最核心的 Class，用來 "發起各式各樣的 HTTP Request"
- Dispatcher 繼承 [EventEmiiter](./events.md#eventemitter)
- [Client](./undici-client.md) 就是繼承 Dispatcher

也因此，在進入 undici 的其他 Class 之前，若要先把基礎打好，就得先從 Dispatcher 開始！

## Dispatcher.close([callback]): Promise

## Dispatcher.destroy([error, callback]): Promise

## Dispatcher.connect(options[, callback])

### 正常使用情境

- client (企業內網) => forward proxy (企業內網出口) => 外網
- client 無法直接連到外網
- client 會跟 forward proxy 發起 CONNECT 請求，forward proxy 會根據防火牆/ACL規則，決定是否連到外網

詳細請參考 [Round Trip 時序圖](../http/http-request-methods-1.md#round-trip-時序圖)

### node:http 發起 CONNECT 請求

forward proxy 我們使用 `node:http` 寫一個極簡的 `http.Server`，先回傳 400 Bad Request 即可

```js
const server = http.createServer();
server.listen(5000);
server.on("connect", (req, socket, head) => {
  console.log("server receives", {
    url: req.url,
    method: req.method,
    headers: req.headers,
    head: head.toString(),
  });
  socket.write("HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n");
  socket.write("tunnel payload from server"); // 刻意在 HTTP Response 結束後多塞一些 payload
});
```

client 我們使用 `node:http` 的 `http.request` 發起 CONNECT 請求

```js
const clientReqeust = http.request({
  host: "localhost",
  port: 5000,
  method: "CONNECT",
  path: "exmaple.com:80",
});
// 刻意在 HTTP Request 結束後多塞一些 payload
clientReqeust.end(() =>
  clientReqeust.socket?.write("tunnel payload from client"),
);
clientReqeust.on("connect", (res, socket, head) => {
  console.log("client receives", {
    headers: res.headers,
    statusCode: res.statusCode,
    isInstanceofSocket: socket instanceof net.Socket,
    head: head.toString(),
  });
});
```

最終會印出

```js
server receives {
  url: 'exmaple.com:80',
  method: 'CONNECT',
  headers: { host: 'localhost:5000', connection: 'keep-alive' },
  head: 'tunnel payload from client'
  // head 是 TCP raw bytes 解析完 HTTP Request 之後，殘存的資料
  // 有可能是下一包 tunnel 的 payload，故 Node.js 將這些資料交給 user program 來處理
  // 正常情況都會是空字串
}
client receives {
  headers: { 'content-length': '0' },
  statusCode: 400,
  isInstanceofSocket: true,
  head: 'tunnel payload from server'
  // head 是 TCP raw bytes 解析完 HTTP Response 之後，殘存的資料
  // 有可能是下一包 tunnel 的 payload，故 Node.js 將這些資料交給 user program 來處理
  // 正常情況都會是空字串
}
```

### undici 發起 CONNECT 請求

forward proxy 的程式碼不變，client 改成用 undici，感受一下 API 設計的差異

```js
const client = new Client("http://localhost:5000/");
const connectData = await client.connect({
  path: "example.com:80",
  headers: { "x-custom-header": "hello-world" },
});
console.log("client receives", {
  headers: connectData.headers,
  statusCode: connectData.statusCode,
  isInstanceofSocket: connectData.socket instanceof net.Socket,
});
```

最終會印出

```js
server receives {
  url: 'example.com:80',
  method: 'CONNECT',
  headers: {
    host: 'localhost:5000',
    connection: 'close',
    'x-custom-header': 'hello-world'
  },
  head: ''
}
client receives {
  headers: { 'content-length': '0' },
  statusCode: 400,
  isInstanceofSocket: true
}
```

### 實作面的小眉角

CONNECT 請求結束後，下一個正常的請求會開一條新的 TCP Connection，因為第一條已經拿去 tunnel 了

```js
const client = new Client("http://localhost:5000/");
await client.connect({ path: "example.com:80" });
await client.request({ method: "GET", path: "/" }); // ✅ 會開一條新的 TCP Connection，因為第一條已經拿去 tunnel 了
```

## Dispatcher.dispatch(options, handler)

## Dispatcher.pipeline(options, handler)

要先搞懂 Node.js 的 [stream.pipeline](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options)，暫不研究

## Dispatcher.stream(options, factory[, callback])

比 [Dispatcher.request](#dispatcherrequestoptions-callback) 還要快一點，因為可以節省一個 [stream.Readable](./stream-readable.md) 的創建成本，直接把 response body pipe 到 [stream.Writable](./stream-writable.md)

## Dispatcher.upgrade(options[, callback])

## Dispatcher.request(options[, callback])

## 參考資料

- https://undici.nodejs.org/#/docs/api/Dispatcher.md

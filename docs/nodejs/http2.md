---
title: Node.js http2 模組 API 介紹
description: 將 Node.js http2 模組所有的 API 都使用過一輪（包含一般開發者平常用不到的 API）
last_update:
  date: "2026-04-30T08:00:00+08:00"
---

## maxHeaderListPairs

- 測試目標：超出 `maxHeaderListPairs` 的 HTTP request 會如何處理
- server (Node.js http2)

  ```js
  const http2Server = http2.createServer();
  http2Server.on("request", (req, res) => {
    console.log(req.headers);
    res.end("ok");
  });
  http2Server.listen(5000);
  ```

- client (curl)

  ```
  curl --http2-prior-knowledge http://localhost:5000
  ```

- server output（得知 curl 預設會送 6 個 headers）

  ```js
  [Object: null prototype] {
    ':method': 'GET',
    ':scheme': 'http',
    ':authority': 'localhost:5000',
    ':path': '/',
    'user-agent': 'curl/8.7.1',
    accept: '*/*',
    Symbol(sensitiveHeaders): []
  }
  ```

- 調整 server 的 `maxHeaderListPairs`

  ```js
  const http2Server = http2.createServer({ maxHeaderListPairs: 5 });
  ```

- client (curl) 再次送 HTTP request

  ```
  curl --http2-prior-knowledge http://localhost:5000
  ```

- curl output

  ```
  curl: (92) HTTP/2 stream 1 was not closed cleanly: ENHANCE_YOUR_CALM (err 11)
  ```

- Wireshark 抓包

  | field                                  | hex         | description                                                         |
  | -------------------------------------- | ----------- | ------------------------------------------------------------------- |
  | Length                                 | 00 00 04    | frame payload has 4 bytes                                           |
  | Type                                   | 03          | RST_STREAM frame (type=0x03)                                        |
  | Flags                                  | 00          | unset (0x00)                                                        |
  | Reserved + Stream Identifier           | 00 00 00 01 | Reserved: 1-bit field (0)<br/>Stream Identifier: 31-bit integer (1) |
  | [Error Code](../http/http-2-errors.md) | 00 00 00 0b | ENHANCE_YOUR_CALM                                                   |

## goaway 語法

延續我在之前的文章介紹到的 [GOAWAY frame](../http/http-2-raw-bytes-2.md#goaway-frame)

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.on("session", (serverHttp2Session) => {
    const code = http2.constants.NGHTTP2_NO_ERROR;
    const lastStreamID = 2 ** 31 - 1;
    const opaqueData = Buffer.from("Additional Debug Data", "utf8");
    serverHttp2Session.goaway(code, lastStreamID, opaqueData);
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  clientHttp2Session.on("goaway", (errorCode, lastStreamID, opaqueData) => {
    console.log({
      errorCode,
      lastStreamID,
      opaqueData: opaqueData?.toString("utf8"),
    });
  });
  ```

- client output

  ```js
  {
    errorCode: 0,
    lastStreamID: 2147483647,
    opaqueData: 'Additional Debug Data'
  }
  ```

## ping 語法

延續我在之前的文章介紹到的 [PING frame](../http/http-2-raw-bytes-2.md#ping-frame)

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.on("session", (serverHttp2Session) => {
    serverHttp2Session.on("ping", (payload: Buffer) => console.log(payload)); // <Buffer 31 32 33 34 35 36 37 38>
  });
  http2Server.listen(5000);
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  // 需等到 `on("connect")` 之後才能正確送出 PING frame
  await new Promise((resolve) => clientHttp2Session.on("connect", resolve));
  const payload = Buffer.from("12345678", "latin1");
  clientHttp2Session.ping(payload, (err, duration, payload) => {
    console.log({ err, duration, payload });
    //
  });
  ```

- client output

  ```js
  {
    err: null,
    duration: 0.838084,
    payload: <Buffer 31 32 33 34 35 36 37 38>
  }
  ```

## maxOutstandingPings

**outstanding 在這邊的含義是 "sender 已經送出 (PING frame)，但尚未收到回應 (PING ACK)"**

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000", {
    maxOutstandingPings: 1,
  });
  // 需等到 `on("connect")` 之後才能正確送出 PING frame
  await new Promise((resolve) => clientHttp2Session.on("connect", resolve));
  const payload = Buffer.from("12345678", "latin1");
  clientHttp2Session.ping(payload, (err, duration, payload) => {
    console.log({ err, duration, payload });
  });
  clientHttp2Session.ping(payload, (err) => console.log(err));
  ```

- client output

  ```js
  Error [ERR_HTTP2_PING_CANCEL]: HTTP2 ping cancelled
      at Http2Ping.pingCallback (node:internal/http2/core:986:10)
      at ClientHttp2Session.ping (node:internal/http2/core:1462:26)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5) {
    code: 'ERR_HTTP2_PING_CANCEL'
  }
  {
    err: null,
    duration: 1.473291,
    payload: <Buffer 31 32 33 34 35 36 37 38>
  }
  ```

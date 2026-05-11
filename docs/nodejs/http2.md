---
title: Node.js http2 模組 API 介紹
description: 將 Node.js http2 模組所有的 API 都使用過一輪（包含一般開發者平常用不到的 API）
last_update:
  date: "2026-05-11T08:00:00+08:00"
---

## goaway 語法

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-goaway
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessiongoawaycode-laststreamid-opaquedata

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

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-ping
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionpingpayload-callback

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

## push 語法

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-push
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampushallowed
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampushstreamheaders-options-callback
- https://nodejs.org/docs/latest-v24.x/api/http2.html#push-streams-on-the-client

延續我在之前的文章介紹到的 [PUSH_PROMISE frame](../http/http-2-raw-bytes-2.md#push_promise-frame)

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (serverHttp2Stream) => {
    if (!serverHttp2Stream.pushAllowed) return;
    // server 猜測 client 接下來需要 style.css
    const reqHeaders = { ":path": "/style.css" };
    serverHttp2Stream.pushStream(
      reqHeaders,
      (err, pushStream, finalReqHeaders) => {
        if (err) return console.error(err);
        // 真正在 stream id = 2 回傳 style.css 的內容
        pushStream.respond();
        pushStream.end("content of style.css");
      },
    );
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000", {
    settings: { enablePush: true },
  });
  clientHttp2Session.request({ ":path": "/index.html" });
  clientHttp2Session.on("stream", (pushedStream) => {
    pushedStream.on("push", (headers, flags) => {
      console.log({ headers, flags });
    });
    pushedStream.setEncoding("latin1");
    pushedStream.on("data", console.log);
  });
  ```

- client output

  ```js
  {
    headers: [Object: null prototype] {
      ':status': 200,
      date: 'Fri, 08 May 2026 06:39:28 GMT',
      Symbol(sensitiveHeaders): []
    },
    flags: 4 // END_HEADERS
  }
  content of style.css
  ```

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

## http2session.socket

**文件**

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionref
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionsocket
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionunref
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2session-and-sockets

**解釋**

- `http2session` 是 Node.js http2 模組的抽象，代表一個 "http2 的長連線"，跟 Layer 4 的 TCP socket 是 1:1 的關聯
- 建議不要用 `http2session.socket.write()`, `http2session.socket.on("data")` 來破壞 `http2session` 的狀態機
- Node.js 會阻擋 user code 去 get/set `http2session.socket` 的部分 properties 或 methods，背後使用 JS 的 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

  ```js
  class Http2Session extends EventEmitter {
    get socket() {
      const proxySocket = this[kProxySocket];
      if (proxySocket === null)
        return (this[kProxySocket] = new Proxy(this, proxySocketHandler));
      return proxySocket;
    }
  }

  const proxySocketHandler = {
    get(session, prop) {
      switch (prop) {
        case "setTimeout":
        case "ref":
        case "unref":
          return session[prop].bind(session);
        // ... other cases 省略
      }
    },
  };
  ```

## maxSendHeaderBlockLength

https://nodejs.org/docs/latest-v24.x/api/http2.html#http2createserveroptions-onrequesthandler

## maxSessionMemory

https://nodejs.org/docs/latest-v24.x/api/http2.html#http2createserveroptions-onrequesthandler

## ORIGIN frame

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionoriginset
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2createsecureserveroptions-onrequesthandler
- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverhttp2sessionoriginorigins
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-origin
- https://datatracker.ietf.org/doc/html/rfc8336

## http2.performServerHandshake

## trailers

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-trailers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-wanttrailers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsenttrailers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsendtrailersheaders
- https://nodejs.org/docs/latest-v24.x/api/http2.html#requestrawtrailers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#requesttrailers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#responseaddtrailersheaders
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsenttrailers

## SETTINGS

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-localsettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-remotesettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionlocalsettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionpendingsettingsack
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionremotesettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionsetlocalwindowsizewindowsize
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionsettingssettings-callback
- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverupdatesettingssettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverupdatesettingssettings_1
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2getdefaultsettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2getpackedsettingssettings
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2getunpackedsettingsbuf
- https://nodejs.org/docs/latest-v24.x/api/http2.html#settings-object

## timeout

- http2Session
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#event-timeout
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionsettimeoutmsecs-callback
- http2Stream
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#event-timeout_1
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsettimeoutmsecs-callback
- httpServer
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#event-timeout_2
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#serversettimeoutmsecs-callback
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#servertimeout
- http2SecureServer
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#event-timeout_3
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#serversettimeoutmsecs-callback_1
  - https://nodejs.org/docs/latest-v24.x/api/http2.html#servertimeout_1

## 加密相關

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionalpnprotocol
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionencrypted

## Http2Session

### Event: 'close'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-close
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionclosecallback
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionclosed
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessiondestroyerror-code
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessiondestroyed

### Event: 'connect'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-connect
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionconnecting

### Event: 'error'

https://nodejs.org/docs/latest-v24.x/api/http2.html#event-error

### Event: 'frameError'

https://nodejs.org/docs/latest-v24.x/api/http2.html#event-frameerror

### Event: 'stream'

https://nodejs.org/docs/latest-v24.x/api/http2.html#event-stream

### state

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionstate

### properties

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessiontype

### altsvc

- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverhttp2sessionaltsvcalt-originorstream
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-altsvc

## clienthttp2session.request

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2connectauthority-options-listener
- https://nodejs.org/docs/latest-v24.x/api/http2.html#clienthttp2sessionrequestheaders-options

## ClientHttp2Stream

### 繼承鍊

```mermaid
flowchart LR
    A[ClientHttp2Stream] --> B[Http2Stream]
    B --> C[stream.Duplex]
```

### events

**ClientHttp2Stream 有以下 events（不包含從 stream.Duplex 繼承來的）**

- `'aborted'`
- `'close'`
- `'error'`
- `'frameError'`
- `'ready'`
- `'timeout'`
- `'trailers'`
- `'wantTrailers'`
- `'continue'`
- `'headers'`
- `'push'`
- `'response'`

### 正常情境的生命週期

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers, flag, rawHeaders) => {
    stream.respond();
    stream.end("ok");
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  const clientHttp2Stream = clientHttp2Session.request();
  console.log({ id: clientHttp2Stream.id });
  clientHttp2Stream.on("ready", () => {
    console.log("ready", { id: clientHttp2Stream.id });
  });
  clientHttp2Stream.on("response", (headers, flags, rawHeaders) => {
    console.log("response", { headers, flags, rawHeaders });
  });
  clientHttp2Stream.on("data", (chunk) => console.log("data", chunk));
  clientHttp2Stream.on("end", () => {
    const { readableEnded } = clientHttp2Stream;
    console.log("end", { readableEnded });
  });
  clientHttp2Stream.on("close", () => {
    const { destroyed, closed, rstCode } = clientHttp2Stream;
    console.log("close", { destroyed, closed, rstCode });
  });
  ```

- client output

  ```js
  { id: undefined }
  ready { id: 1 }
  response {
    headers: [Object: null prototype] {
      ':status': 200,
      date: 'Sat, 09 May 2026 08:59:36 GMT',
      Symbol(sensitiveHeaders): []
    },
    flags: 4, // END_HEADERS
    rawHeaders: [ ':status', '200', 'date', 'Sat, 09 May 2026 08:59:36 GMT' ]
  }
  data ok
  end { readableEnded: true }
  close { destroyed: true, closed: true, rstCode: 0 }
  ```

**會依序觸發**

```mermaid
flowchart LR
    A["ready"] --> B["response"]
    B --> C["data"]
    C --> D["end"]
    D --> E["close"]
```

**各個 event 代表的含意：**

| event    | description                                       |
| -------- | ------------------------------------------------- |
| ready    | TCP 連線建立，成功從 nghttp2 分配到一個 stream ID |
| response | 收到完整的 response headers 觸發（END_HEADERS）   |
| data     | 收到 chunk of response body 時觸發                |
| end      | 收到完整的 HTTP response 觸發（END_STREAM）       |
| close    | `end` 之後觸發                                    |

### request body 寫到一半就中斷

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers, flag, rawHeaders) => {
    // 模擬讀取 request body 到一半就中斷
    stream.on("data", () => stream.close());
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  const clientHttp2Stream = clientHttp2Session.request({ ":method": "POST" });
  clientHttp2Stream.write("123");
  console.log({ id: clientHttp2Stream.id });
  clientHttp2Stream.on("ready", () => {
    console.log("ready", { id: clientHttp2Stream.id });
  });
  clientHttp2Stream.on("aborted", () => {
    const { aborted } = clientHttp2Stream;
    console.log("aborted", { aborted });
  });
  clientHttp2Stream.on("end", () => {
    const { readableEnded } = clientHttp2Stream;
    console.log("end", { readableEnded });
  });
  clientHttp2Stream.on("close", () => {
    const { destroyed, closed, rstCode } = clientHttp2Stream;
    console.log("close", { destroyed, closed, rstCode });
  });
  ```

- client output

  ```js
  { id: undefined }
  ready { id: 1 }
  aborted { aborted: true }
  end { readableEnded: true }
  close { destroyed: true, closed: true, rstCode: 0 }
  ```

**會依序觸發**

```mermaid
flowchart LR
    A["ready"] --> B["aborted"]
    B --> C["end"]
    C --> D["close"]
```

**各個 event 代表的含意：**

| event   | description                 |
| ------- | --------------------------- |
| aborted | request body 寫到一半就中斷 |

### close with error

**基本概念**

- [正常情境](#正常情境的生命週期)不需要自行呼叫 `stream.close()`，stream 也會走到 `closed` 狀態
- `stream.close()` 對應的 HTTP/2 frame 是 [RST_STREAM](../http/http-2-raw-bytes-2.md#rst_stream-frame)

**`stream.close()` 若搭配 [Error Code](../http/http-2-errors.md#7-error-codes) > 0，則 client 跟 server 皆需要監聽 `stream.on("error")` 來捕捉此錯誤**

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers, flag, rawHeaders) => {
    stream.on("error", console.log);
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  const clientHttp2Stream = clientHttp2Session.request();
  clientHttp2Stream.close(http2.constants.NGHTTP2_INTERNAL_ERROR);
  clientHttp2Stream.on("error", console.log);
  ```

- output

  ```js
  Error [ERR_HTTP2_STREAM_ERROR]: Stream closed with error code NGHTTP2_INTERNAL_ERROR
      at ClientHttp2Stream._destroy (node:internal/http2/core:2475:13)
      at _destroy (node:internal/streams/destroy:122:10)
      at ClientHttp2Stream.destroy (node:internal/streams/destroy:84:5)
      at Writable.destroy (node:internal/streams/writable:1120:11)
      at [kMaybeDestroy] (node:internal/http2/core:2515:14)
      at ClientHttp2Stream.<anonymous> (node:internal/http2/core:1949:28)
      at ClientHttp2Stream.emit (node:events:509:28)
      at finish (node:internal/streams/writable:953:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
    code: 'ERR_HTTP2_STREAM_ERROR'
  }
  Error [ERR_HTTP2_STREAM_ERROR]: Stream closed with error code NGHTTP2_INTERNAL_ERROR
      at ServerHttp2Stream._destroy (node:internal/http2/core:2475:13)
      at _destroy (node:internal/streams/destroy:122:10)
      at ServerHttp2Stream.destroy (node:internal/streams/destroy:84:5)
      at Writable.destroy (node:internal/streams/writable:1120:11)
      at Http2Stream.onStreamClose (node:internal/http2/core:609:12) {
    code: 'ERR_HTTP2_STREAM_ERROR'
  }
  ```

### informational response

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers, flag, rawHeaders) => {
    stream.additionalHeaders({ test: "123", ":status": 100 });
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  const clientHttp2Stream = clientHttp2Session.request();
  clientHttp2Stream.on("continue", () => console.log("continue"));
  clientHttp2Stream.on("headers", (headers, flags, rawHeaders) => {
    console.log("headers", { headers, flags, rawHeaders });
  });
  ```

- client output

  ```js
  continue
  headers {
    headers: [Object: null prototype] {
      ':status': 100,
      test: '123',
      Symbol(sensitiveHeaders): []
    },
    flags: 4, // END_HEADERS
    rawHeaders: [ ':status', '100', 'test', '123' ]
  }
  ```

**各個 event 代表的含意：**

| event    | description                |
| -------- | -------------------------- |
| continue | 收到 `:status: 100` 時觸發 |
| headers  | 收到 `:status: 1xx` 時觸發 |

### properties

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streambuffersize
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamendafterheaders
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamid
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampending
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsentheaders
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsentinfoheaders
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamsession
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamstate
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamheaderssent

### respond

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampushstreamheaders-options-callback

### respondWithFD

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamrespondwithfdfd-headers-options

### respondWithFiles

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamrespondwithfilepath-headers-options

## frameError

**送出 frame 失敗時觸發**

- server（使用 `maxSendHeaderBlockLength` 來限制 server 回傳給 client 的 headers 大小）

  ```js
  const http2Server = http2.createServer({ maxSendHeaderBlockLength: 1 });
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers, flag, rawHeaders) => {
    stream.on("frameError", (frameType, errorCode, streamID) => {
      console.log({ frameType, errorCode, streamID });
    });
    stream.on("error", console.log);
    stream.respond();
  });
  ```

- client

  ```js
  const clientHttp2Session = http2.connect("http://localhost:5000");
  const clientHttp2Stream = clientHttp2Session.request();
  clientHttp2Stream.on("error", console.log);
  ```

- output

  ```js
  { frameType: 1, errorCode: 6, streamID: 1 } // frameType = HEADERS, errorCode = FRAME_SIZE_ERROR
  Error [ERR_HTTP2_STREAM_ERROR]: Stream closed with error code NGHTTP2_FRAME_SIZE_ERROR
      at ServerHttp2Stream._destroy (node:internal/http2/core:2475:13)
      at _destroy (node:internal/streams/destroy:122:10)
      at ServerHttp2Stream.destroy (node:internal/streams/destroy:84:5)
      at Writable.destroy (node:internal/streams/writable:1120:11)
      at Http2Stream.onStreamClose (node:internal/http2/core:609:12) {
    code: 'ERR_HTTP2_STREAM_ERROR'
  }
  Error [ERR_HTTP2_STREAM_ERROR]: Stream closed with error code NGHTTP2_FRAME_SIZE_ERROR
      at ClientHttp2Stream._destroy (node:internal/http2/core:2475:13)
      at _destroy (node:internal/streams/destroy:122:10)
      at ClientHttp2Stream.destroy (node:internal/streams/destroy:84:5)
      at Writable.destroy (node:internal/streams/writable:1120:11)
      at Http2Stream.onStreamClose (node:internal/http2/core:609:12) {
    code: 'ERR_HTTP2_STREAM_ERROR'
  }
  ```

## Http2Server

### Event: 'connection'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-connection
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-connection_1

### Event: 'session'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-session
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-session_1

### Event: 'sessionError'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-sessionerror
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-sessionerror_1

### Event: 'stream'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-stream_1
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-stream_2

### Event: 'unknownProtocol'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-unknownprotocol

### close

- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverclosecallback
- https://nodejs.org/docs/latest-v24.x/api/http2.html#serversymbolasyncdispose
- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverclosecallback_1

### Compatibility API

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-request
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-request_1
- https://nodejs.org/docs/latest-v24.x/api/http2.html#class-http2http2serverrequest
- https://nodejs.org/docs/latest-v24.x/api/http2.html#class-http2http2serverresponse

## CONNECT

- https://nodejs.org/docs/latest-v24.x/api/http2.html#the-extended-connect-protocol

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

### maxSendHeaderBlockLength

https://nodejs.org/docs/latest-v24.x/api/http2.html#http2createserveroptions-onrequesthandler

### maxSessionMemory

https://nodejs.org/docs/latest-v24.x/api/http2.html#http2createserveroptions-onrequesthandler

### maxOutstandingPings

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

## push

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-push
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampushallowed
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streampushstreamheaders-options-callback

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

### socket

- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionref
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionsocket
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sessionunref

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

## Http2Stream

### Event: 'aborted'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-aborted
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamaborted

### Event: 'close'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-close_1
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamaborted
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamclosed
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamdestroyed
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamrstcode

### Event: 'error'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-error_1

### Event: 'frameError'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-frameerror_1

### Event: 'ready'

https://nodejs.org/docs/latest-v24.x/api/http2.html#event-ready

### Event: 'continue'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-continue
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-checkcontinue
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-checkcontinue_1

### Event: 'headers'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-headers
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2streamadditionalheadersheaders

### Event: 'response'

- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-response

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

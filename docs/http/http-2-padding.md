---
title: 深入瞭解 HTTP/2 Padding
description: 深入瞭解 HTTP/2 Padding
last_update:
  date: "2026-06-09T08:00:00+08:00"
---

## PADDING

**使用情境：隱藏真實 HEADERS, DATA, PUSH_PROMISE frame 的 payload length，故添加 PADDING 來混淆**

**實測（以 client 發送 HEADERS frame 為範例）**

- server

  ```js
  const http2Server = http2.createServer();
  http2Server.listen(5000);
  http2Server.on("stream", (stream, headers) => console.log(headers));
  ```

- client

  ```js
  const socket = net.connect({ host: "localhost", port: 5000 });
  await http2ConnectionPreface(socket);

  const headersFrame = getHeadersFrame({
    streamID: 1,
    flags: 13,
    headerArray: [
      ":method: GET",
      ":scheme: http",
      ":path: /",
      ":authority: localhost:5000",
    ],
    padLength: 1,
    paddingFill: 0,
  });
  socket.write(headersFrame);
  ```

- server output

  ```js
  [Object: null prototype] {
    ':method': 'GET',
    ':scheme': 'http',
    ':path': '/',
    ':authority': 'localhost:5000',
    Symbol(sensitiveHeaders): []
  }
  ```

**拆解 HEADERS frame**

client 會送以下 bytes (hex)

```
00 00 11 01 0d 00 00 00 01                         // frame heaader
01 82 86 84 41 8a a0 e4 1d 13 9d 09 b8 d8 00 0f 00 // frame payload
```

- frame header

  | field                        | hex         | description                                           |
  | ---------------------------- | ----------- | ----------------------------------------------------- |
  | Length                       | 00 00 11    | frame payload has 17 bytes                            |
  | Type                         | 01          | HEADERS frame (type=0x01)                             |
  | Flags                        | 0d          | PADDED + END_HEADERS + END_STREAM                     |
  | Reserved + Stream Identifier | 00 00 00 01 | Reserved: 1-bit (0)<br/>Stream Identifier: 31-bit (1) |

- frame payload

  | field                | hex                                              | description                                     |
  | -------------------- | ------------------------------------------------ | ----------------------------------------------- |
  | Pad Length           | 01                                               | Padding has 1 byte(s)                           |
  | Field Block Fragment | 82 86 84 41 8a a0 e4<br/>1d 13 9d 09 b8 d8 00 0f | HPACKED bytes                                   |
  | Padding              | 00                                               | Padding octets MUST be set to zero when sending |

**重點**

- Pad Length 佔 1 byte (0 ~ 255)，代表 Padding 的區間是 0 ~ 255 bytes
- Pad Length 跟 Padding 都算 frame payload，在計算 payload length 的時候要注意

## 參考資料

- https://nodejs.org/docs/latest-v24.x/api/http2.html
- https://datatracker.ietf.org/doc/html/rfc9113

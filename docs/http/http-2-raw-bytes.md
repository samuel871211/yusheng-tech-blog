---
title: 深入瞭解 HTTP/2 raw bytes
description: 深入瞭解 HTTP/2 raw bytes
last_update:
  date: "2026-04-16T08:00:00+08:00"
---

## 目標

參考 [RFC 9113](https://datatracker.ietf.org/doc/html/rfc9113)，拆解 `curl --http2-prior-knowledge http://localhost:5001` 背後傳送的 HTTP/2 raw bytes
![curl-http2-wireshark](../../static/img/curl-http2-wireshark.jpg)

## Step 1: HTTP/2 Connection Preface

[Section 3.4. HTTP/2 Connection Preface](https://datatracker.ietf.org/doc/html/rfc9113#section-3.4)

### Step 1-1: Magic

- client 會送 `PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n`
- 原因：確保 HTTP/1.x Server 將其視為 invalid request，進一步關閉連線

### Step 1-2: SETTINGS Frame

- [Section 4.1. Frame Format](https://datatracker.ietf.org/doc/html/rfc9113#section-4.1)
- [Section 5.1.1. Stream Identifiers](https://datatracker.ietf.org/doc/html/rfc9113#section-5.1.1)
- [Section 6.5.1. SETTINGS](https://datatracker.ietf.org/doc/html/rfc9113#section-6.5)
- [Section 6.5.1. SETTINGS Format](https://datatracker.ietf.org/doc/html/rfc9113#section-6.5.1)
- [Section 6.5.2. Defined Settings](https://datatracker.ietf.org/doc/html/rfc9113#section-6.5.2)

client 會送以下 bytes (hex)

```
00 00 12 04 00 00 00 00 00 // frame header
00 03 00 00 00 64          // frame payload
00 04 00 a0 00 00          // frame payload
00 02 00 00 00 00          // frame payload
```

可以解讀成 frame header 跟 frame payload 兩個大區塊

- fixed 9-octet frame header

  | field                        | hex         | description                                                 |
  | ---------------------------- | ----------- | ----------------------------------------------------------- |
  | Length                       | 00 00 12    | frame payload has 18 bytes                                  |
  | Type                         | 04          | SETTINGS frame (type=0x04)                                  |
  | Flags                        | 00          | reserved for boolean flags specific to the frame type       |
  | Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer |

- frame payload（參考 [Defined Settings](#section-652-defined-settings)）

  | hex               | Description                                                   |
  | ----------------- | ------------------------------------------------------------- |
  | 00 03 00 00 00 64 | SETTINGS_MAX_CONCURRENT_STREAMS = 0x00000064 = 100            |
  | 00 04 00 a0 00 00 | SETTINGS_INITIAL_WINDOW_SIZE = 0x00a00000 = 10485760 = 10 MiB |
  | 00 02 00 00 00 00 | SETTINGS_ENABLE_PUSH = false                                  |

## Step 2: WINDOW_UPDATE frame

https://datatracker.ietf.org/doc/html/rfc9113#section-6.9

client 會送以下 bytes (hex)

```
00 00 04 08 00 00 00 00 00 // frame header
3e 7f 00 01                // frame payload
```

可以解讀成 frame header 跟 frame payload 兩個大區塊

- fixed 9-octet frame header

  | field                        | hex         | description                                                                                                |
  | ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
  | Length                       | 00 00 04    | frame payload has 4 bytes                                                                                  |
  | Type                         | 08          | WINDOW_UPDATE frame (type=0x08)                                                                            |
  | Flags                        | 00          | reserved for boolean flags specific to the frame type                                                      |
  | Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer (zero is used for connection control messages) |

- frame payload
  - Reserved: 1 bit = 0
  - Window Size Increment: 31 bit = 3e 7f 00 01 = 1,048,510,465

:::info
1,048,510,465 + connection flow-control window (default 65,535) = 1000 MiB
:::

## Step 3: HEADERS frame

## Step 4: server connection preface (SETTINGS frame)

[Section 3.4. HTTP/2 Connection Preface](https://datatracker.ietf.org/doc/html/rfc9113#section-3.4)

server 會送以下 bytes (hex)

```
00 00 00 04 00 00 00 00 00 // frame header
```

| field                        | hex         | description                                                 |
| ---------------------------- | ----------- | ----------------------------------------------------------- |
| Length                       | 00 00 00    | frame payload has 0 bytes                                   |
| Type                         | 04          | SETTINGS frame (type=0x04)                                  |
| Flags                        | 00          | reserved for boolean flags specific to the frame type       |
| Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer |

代表 server 沒有要修改任何設定

## Step 5: client ACK (SETTINGS frame)

[Section 6.5.1. SETTINGS](https://datatracker.ietf.org/doc/html/rfc9113#section-6.5)

client 會送以下 bytes (hex)

```
00 00 00 04 01 00 00 00 00
```

| field                        | hex         | description                                                 |
| ---------------------------- | ----------- | ----------------------------------------------------------- |
| Length                       | 00 00 00    | frame payload has 0 bytes                                   |
| Type                         | 04          | SETTINGS frame (type=0x04)                                  |
| Flags                        | 01          | ACK flag                                                    |
| Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer |

代表 client 收到 server 的 SETTINGS frame 了

## Step 6: server ACK (SETTINGS frame)

server 會送以下 bytes (hex)

```
00 00 00 04 01 00 00 00 00
```

| field                        | hex         | description                                                 |
| ---------------------------- | ----------- | ----------------------------------------------------------- |
| Length                       | 00 00 00    | frame payload has 0 bytes                                   |
| Type                         | 04          | SETTINGS frame (type=0x04)                                  |
| Flags                        | 01          | ACK flag                                                    |
| Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer |

代表 server 收到 client 的 SETTINGS frame 了

## Step 7: server send HEADERS frame

<!-- todo-yus -->

```
0000   00 00 19 01 04 00 00 00 01 88 61 96 d0 7a be 94
0010   10 14 86 bb 14 10 04 e2 80 15 c6 83 70 0e 29 8b
0020   46 ff

```

## Step 8: server send DATA frame

server 會送以下 bytes (hex)

```
00 00 18 00 00 00 00 00 01                                               // frame header
57 65 6c 63 6f 6d 65 20 74 6f 20 48 54 54 50 2f 32 20 53 65 72 76 65 72  // frame payload
```

- fixed 9-octet frame header

  | field                        | hex         | description                                                         |
  | ---------------------------- | ----------- | ------------------------------------------------------------------- |
  | Length                       | 00 00 18    | frame payload has 24 bytes                                          |
  | Type                         | 00          | DATA frame (type=0x00)                                              |
  | Flags                        | 00          | unset (0x00)                                                        |
  | Reserved + Stream Identifier | 00 00 00 01 | Reserved: 1-bit field (0)<br/>Stream Identifier: 31-bit integer (1) |

- frame payload
  - 57 65 6c 63 6f 6d 65 20 74 6f 20 48 54 54 50 2f 32 20 53 65 72 76 65 72 = Welcome to HTTP/2 Server

## Step 9: server send DATA frame (END_STREAM)

server 會送以下 bytes (hex)

```
00 00 00 00 01 00 00 00 01 // frame header
```

| field                        | hex         | description                                                         |
| ---------------------------- | ----------- | ------------------------------------------------------------------- |
| Length                       | 00 00 00    | frame payload has 0 bytes                                           |
| Type                         | 00          | DATA frame (type=0x00)                                              |
| Flags                        | 01          | END_STREAM                                                          |
| Reserved + Stream Identifier | 00 00 00 01 | Reserved: 1-bit field (0)<br/>Stream Identifier: 31-bit integer (1) |

代表 stream ID = 1 的 request / response 已經傳輸完成，進入 [half-closed 或 closed state](https://datatracker.ietf.org/doc/html/rfc9113#section-5.1)

## Section 6.5.2 Defined Settings

https://datatracker.ietf.org/doc/html/rfc9113#section-6.5.2

| Defined Settings                | hex   | Description                               |
| ------------------------------- | ----- | ----------------------------------------- |
| SETTINGS_HEADER_TABLE_SIZE      | 00 01 | -                                         |
| SETTINGS_ENABLE_PUSH            | 00 02 | server push                               |
| SETTINGS_MAX_CONCURRENT_STREAMS | 00 03 | -                                         |
| SETTINGS_INITIAL_WINDOW_SIZE    | 00 04 | stream-level flow control, max = 2^31 - 1 |
| SETTINGS_MAX_FRAME_SIZE         | 00 05 | frame payload, max = 2^24 - 1             |
| SETTINGS_MAX_HEADER_LIST_SIZE   | 00 06 | -                                         |

<!-- ## frame header

[Section 4.1. Frame Format](https://datatracker.ietf.org/doc/html/rfc9113#section-4.1)

| field | hex | description |
| ----- | -------- | ----------- |
| Length | 00 00 04 | frame payload has 4 bytes |
| Type | 08 | WINDOW_UPDATE frame (type=0x08) |
| Flags | 00 | reserved for boolean flags specific to the frame type |
| Reserved + Stream Identifier | 00 00 00 00 | Reserved: 1-bit field<br/>Stream Identifier: 31-bit integer | -->

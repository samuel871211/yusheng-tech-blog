---
title: 深入瞭解 HTTP/2 raw bytes
description: 深入瞭解 HTTP/2 raw bytes
last_update:
  date: "2026-04-16T08:00:00+08:00"
---

## 目標

參考 [RFC 9113](https://datatracker.ietf.org/doc/html/rfc9113)，拆解 `curl --http2-prior-knowledge http://localhost:5001` 背後傳送的 HTTP/2 raw bytes

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

- frame payload（參考 [Defined Settings](#defined-settings)）

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

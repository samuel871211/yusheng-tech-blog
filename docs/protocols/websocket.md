---
title: WebSocket
description: WebSocket
---

## 先備知識

[HTTP Upgrade Header](../http/upgrade.md)

## RFC 6455 Base Framing Protocol

**1st byte**

| field  | bits | description                                            |
| ------ | ---- | ------------------------------------------------------ |
| FIN    | 1    | Indicates that this is the final fragment in a message |
| RSV1   | 1    |                                                        |
| RSV2   | 1    |                                                        |
| RSV3   | 1    |                                                        |
| Opcode | 4    | See [Opcode](#opcode)                                  |

**2nd byte**

| field          | bits | description                           |
| -------------- | ---- | ------------------------------------- |
| Mask           | 1    | whether the "Payload data" is masked  |
| Payload length | 7    | See [Payload length](#payload-length) |

**Following 0, 2, or 8 bytes**

| field                   | description                           |
| ----------------------- | ------------------------------------- |
| Extended Payload length | See [Payload length](#payload-length) |

**Following 0 or 4 bytes**

| field       | description                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| Masking-key | This field is present if the mask bit is set to 1 and is absent if the mask bit is set to 0. |

**Following x + y bytes**

| field            | description                           |
| ---------------- | ------------------------------------- |
| Payload data     | "Extension data" + "Application data" |
| Extension data   | x bytes                               |
| Application data | y bytes                               |

### Opcode

| Opcode      | description                             |
| ----------- | --------------------------------------- |
| 0x00        | continuation frame                      |
| 0x01        | text frame                              |
| 0x02        | binary frame                            |
| 0x03 ~ 0x07 | reserved for further non-control frames |
| 0x08        | See [Close frame](#close-frame)         |
| 0x09        | See [Ping frame](#ping-pong-frame)      |
| 0x0a        | See [Pong frame](#ping-pong-frame)      |
| 0x0b ~ 0x0f | reserved for further control frames     |

### Payload length

Payload length 欄位一開始只有 7 bits。Receiver 先讀這 7 bits，再決定要不要繼續讀後面的 bytes。

| 7 bits 的值 | Payload length<br/>欄位總長度 | Payload length<br/>區間 | Payload length 怎麼計算                                                      |
| ----------- | ----------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| 0 ~ 125     | 7 bits                        | 0 ~ 125                 | 7 bits 的值就是 payload length                                               |
| 126         | 7 + 16 bits                   | 126 ~ 65,535            | 讀取後面 2 bytes，視為 16-bit unsigned integer<br/>該數字就是 payload length |
| 127         | 7 + 64 bits                   | 65,536 ~ 2^63 - 1       | 讀取後面 8 bytes，視為 64-bit unsigned integer<br/>該數字就是 payload length |

注意：當 7 bits 的值為 127 時，64-bit 數字的最高位元（most significant bit）必須是 0，所以上限是 2^63 - 1。

**範例**

| payload length | 7 bits 的值 | 後續 bytes (HEX)            |
| -------------- | ----------- | --------------------------- |
| 5              | 5           | -                           |
| 300            | 126         | 01 2C                       |
| 70000          | 127         | 00 00 00 00<br/>00 01 11 70 |

### Close frame

概念類似 HTTP/2 的 [GOAWAY frame](../http/http-2-raw-bytes-2.md#goaway-frame)

|        | Close frame                                   | GOAWAY frame                              |
| ------ | --------------------------------------------- | ----------------------------------------- |
| 狀態碼 | Status Codes (optional, 2 bytes)              | Error Code (required, 4 bytes)            |
| 原因   | reason,UTF-8-encoded data (optional, n bytes) | Additional Debug Data (optional, n bytes) |

### Ping, Pong frame

概念類似 HTTP/2 的 [PING frame](../http/http-2-raw-bytes-2.md#ping-frame)，列出差異部分：

|                    | WebSocket Ping / Pong                                    | HTTP/2 PING frame                    |
| ------------------ | -------------------------------------------------------- | ------------------------------------ |
| request / response | Ping: `0x9`；Pong: `0xA`                                 | 用 ACK flag 區分 request 與 response |
| Payload 長度       | Application data (optional, 0 ~ 125 bytes)               | Opaque Data (required, 8 bytes)      |
| response 的用途    | Pong 可回應 Ping，也可單獨送（unidirectional heartbeat） | 只用於回應 PING                      |
| 回應多個 request   | 若尚未回應前一個 Ping，可只回應最近處理的那一個 Ping     | 每個 PING 都要回應                   |

## Sec-WebSocket-Protocol

## Sec-WebSocket-Extensions

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers

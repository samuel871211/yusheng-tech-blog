---
title: WebSocket
description: WebSocket
---

## 先備知識

[HTTP Upgrade Header](../http/upgrade.md)

## Base Framing Protocol

| field          | bits             | description                                            |
| -------------- | ---------------- | ------------------------------------------------------ |
| FIN            | 1                | Indicates that this is the final fragment in a message |
| RSV1           | 1                |                                                        |
| RSV2           | 1                |                                                        |
| RSV3           | 1                |                                                        |
| Opcode         | 4                | See [Opcode](#opcode)                                  |
| Mask           | 1                | whether the "Payload data" is masked                   |
| Payload length | 7, 7+16, or 7+64 |

### Opcode

| Opcode      | description                             |
| ----------- | --------------------------------------- |
| 0x00        | continuation frame                      |
| 0x01        | text frame                              |
| 0x02        | binary frame                            |
| 0x03 ~ 0x07 | reserved for further non-control frames |
| 0x08        | connection close                        |
| 0x09        | ping                                    |
| 0x0a        | pong                                    |
| 0x0b ~ 0x0f | reserved for further control frames     |

## Sec-WebSocket-Protocol

## Sec-WebSocket-Extensions

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers

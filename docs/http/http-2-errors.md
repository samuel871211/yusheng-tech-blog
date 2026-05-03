---
title: 深入瞭解 HTTP/2 error types
description: 深入瞭解 HTTP/2 error types
last_update:
  date: "2026-04-16T08:00:00+08:00"
---

## 5.4.1. Connection Error Handling

https://datatracker.ietf.org/doc/html/rfc9113#section-5.4.1

## 5.4.2. Stream Error Handling

https://datatracker.ietf.org/doc/html/rfc9113#section-5.4.2

## 7. Error Codes

https://datatracker.ietf.org/doc/html/rfc9113#section-7

| Error Code            | value  | description                             |
| --------------------- | ------ | --------------------------------------- |
| `NO_ERROR`            | `0x00` | graceful shutdown                       |
| `PROTOCOL_ERROR`      | `0x01` | generic protocol error                  |
| `INTERNAL_ERROR`      | `0x02` | implementation internal error           |
| `FLOW_CONTROL_ERROR`  | `0x03` | flow-control violation                  |
| `SETTINGS_TIMEOUT`    | `0x04` | SETTINGS ACK timeout                    |
| `STREAM_CLOSED`       | `0x05` | frame received after stream half-closed |
| `FRAME_SIZE_ERROR`    | `0x06` | frame size invalid                      |
| `FLOW_CONTROL_ERROR`  | `0x07` | stream refused before processing        |
| `CANCEL`              | `0x08` | stream no longer needed                 |
| `COMPRESSION_ERROR`   | `0x09` | HPACK compression state failure         |
| `CONNECT_ERROR`       | `0x0a` | CONNECT tunnel failure                  |
| `ENHANCE_YOUR_CALM`   | `0x0b` | peer is generating excessive load       |
| `INADEQUATE_SECURITY` | `0x0c` | TLS/security requirements not met       |
| `HTTP_1_1_REQUIRED`   | `0x0d` | endpoint requires HTTP/1.1              |

## 8.1.1. Malformed Messages

https://datatracker.ietf.org/doc/html/rfc9113#section-8.1.1

---
title: "(RFC 7541) HPACK: Header Compression for HTTP/2"
description: "(RFC 7541) HPACK: Header Compression for HTTP/2"
last_update:
  date: "2026-06-10T08:00:00+08:00"
---

## Node.js 跟 headers 相關的設定

| option                     | description |
| -------------------------- | ----------- |
| maxDeflateDynamicTableSize | -           |
| maxHeaderListPairs         | -           |
| maxSendHeaderBlockLength   | -           |
| settings.headerTableSize   | -           |
| settings.maxHeaderListSize | -           |

## Terminology

| term                        | description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| Header Field                | :authority: localhost:5000                                             |
| Dynamic Table               | -                                                                      |
| Static Table                | [Appendix A](https://datatracker.ietf.org/doc/html/rfc7541#appendix-A) |
| Header List                 | Multiple "Header Field"                                                |
| Header Field Representation | "Header Field" converted to HPACK raw bytes                            |
| Header Block                | "Header List" converted to HPACK raw bytes                             |

## 參考資料

- https://datatracker.ietf.org/doc/html/rfc7541
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sensitiveheaders
- maxDeflateDynamicTableSize
- maxSendHeaderBlockLength
- sensitiveHeaders

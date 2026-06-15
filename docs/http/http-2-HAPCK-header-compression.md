---
title: "(RFC 7541) HPACK: Header Compression for HTTP/2"
description: "(RFC 7541) HPACK: Header Compression for HTTP/2"
last_update:
  date: "2026-06-10T08:00:00+08:00"
---

## Node.js 跟 headers 相關的設定

<!-- todo-yus -->

| option                     | description |
| -------------------------- | ----------- |
| maxDeflateDynamicTableSize | -           |
| maxHeaderListPairs         | -           |
| maxSendHeaderBlockLength   | -           |
| settings.headerTableSize   | -           |
| settings.maxHeaderListSize | -           |

## Terminology

| term                          | description                                 |
| ----------------------------- | ------------------------------------------- |
| Header Field                  | :authority: localhost:5000                  |
| Dynamic Table                 | -                                           |
| [Static Table](#static-table) | -                                           |
| Header List                   | Multiple "Header Field"                     |
| Header Field Representation   | "Header Field" converted to HPACK raw bytes |
| Header Block                  | "Header List" converted to HPACK raw bytes  |

## Static Table

- https://datatracker.ietf.org/doc/html/rfc7541#appendix-A
- RFC 7541 預先定義好 61 組高頻率使用到的 header name, value

```
+-------+-----------------------------+---------------+
| Index | Header Name                 | Header Value  |
+-------+-----------------------------+---------------+
| 1     | :authority                  |               |
| 2     | :method                     | GET           |
| 3     | :method                     | POST          |
| 4     | :path                       | /             |
| 5     | :path                       | /index.html   |
| 6     | :scheme                     | http          |
| 7     | :scheme                     | https         |
| 8     | :status                     | 200           |
| 9     | :status                     | 204           |
| 10    | :status                     | 206           |
| 11    | :status                     | 304           |
| 12    | :status                     | 400           |
| 13    | :status                     | 404           |
| 14    | :status                     | 500           |
| 15    | accept-charset              |               |
| 16    | accept-encoding             | gzip, deflate |
| 17    | accept-language             |               |
| 18    | accept-ranges               |               |
| 19    | accept                      |               |
| 20    | access-control-allow-origin |               |
| 21    | age                         |               |
| 22    | allow                       |               |
| 23    | authorization               |               |
| 24    | cache-control               |               |
| 25    | content-disposition         |               |
| 26    | content-encoding            |               |
| 27    | content-language            |               |
| 28    | content-length              |               |
| 29    | content-location            |               |
| 30    | content-range               |               |
| 31    | content-type                |               |
| 32    | cookie                      |               |
| 33    | date                        |               |
| 34    | etag                        |               |
| 35    | expect                      |               |
| 36    | expires                     |               |
| 37    | from                        |               |
| 38    | host                        |               |
| 39    | if-match                    |               |
| 40    | if-modified-since           |               |
| 41    | if-none-match               |               |
| 42    | if-range                    |               |
| 43    | if-unmodified-since         |               |
| 44    | last-modified               |               |
| 45    | link                        |               |
| 46    | location                    |               |
| 47    | max-forwards                |               |
| 48    | proxy-authenticate          |               |
| 49    | proxy-authorization         |               |
| 50    | range                       |               |
| 51    | referer                     |               |
| 52    | refresh                     |               |
| 53    | retry-after                 |               |
| 54    | server                      |               |
| 55    | set-cookie                  |               |
| 56    | strict-transport-security   |               |
| 57    | transfer-encoding           |               |
| 58    | user-agent                  |               |
| 59    | vary                        |               |
| 60    | via                         |               |
| 61    | www-authenticate            |               |
+-------+-----------------------------+---------------+
```

## Binary Format

### Indexed Header Field

https://datatracker.ietf.org/doc/html/rfc7541#section-6.1

**header field (name + value) 都在 static 或 dynamic table，可直接 index 引用**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 1 |        Index (7+)         |
+---+---------------------------+
```

**範例**

`:method: GET`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 1 | 0   0   0   0   0   1   0 |
+---+---------------------------+
```

`:path: /`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 1 | 0   0   0   0   1   0   0 |
+---+---------------------------+
```

### Literal Header Field with Incremental Indexing

- https://datatracker.ietf.org/doc/html/rfc7541#section-6.2.1
- with Incremental Indexing = 這個 header field 要被存到 dynamic table

**header field name 在 static 或 dynamic table，可直接 index 引用，header field value 用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 1 |      Index (6+)       |
+---+---+-----------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`:method: hello`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 1 | 0   0   0   0   1   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+-------------------------------+
```

`www-authenticate: helloworld`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 1 | 1   1   1   1   0   1 |
+---+---+-----------------------+
| 0 | 0   0   0   1   0   1   0 |
+---+---------------------------+
|          helloworld           |
+-------------------------------+
```

**header field (name + value) 都用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 1 |           0           |
+---+---+-----------------------+
| H |     Name Length (7+)      |
+---+---------------------------+
|  Name String (Length octets)  |
+---+---------------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`hello: world`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 1 | 0   0   0   0   0   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+---+---------------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             world             |
+-------------------------------+
```

### Literal Header Field without Indexing

- https://datatracker.ietf.org/doc/html/rfc7541#section-6.2.2
- without Indexing = 這個 header field 不需要存到 dynamic table
- proxy 可以修改此設定再 forward 給下一個節點

**header field name 在 static 或 dynamic table，可直接 index 引用，header field value 用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 0 |  Index (4+)   |
+---+---+-----------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`:method: hello`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 0 | 0   0   1   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+-------------------------------+
```

**header field (name + value) 都用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 0 |       0       |
+---+---+-----------------------+
| H |     Name Length (7+)      |
+---+---------------------------+
|  Name String (Length octets)  |
+---+---------------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`hello: world`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 0 | 0   0   0   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+---+---------------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             world             |
+-------------------------------+
```

### Literal Header Field Never Indexed

- https://datatracker.ietf.org/doc/html/rfc7541#section-6.2.3
- Never Indexed = 這個 header field 不需要存到 dynamic table
- proxy 禁止修改此設定

**header field name 在 static 或 dynamic table，可直接 index 引用，header field value 用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 1 |  Index (4+)   |
+---+---+-----------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`:method: hello`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 1 | 0   0   1   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+-------------------------------+
```

**header field (name + value) 都用 String Literal Representation 表示**

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 1 |       0       |
+---+---+-----------------------+
| H |     Name Length (7+)      |
+---+---------------------------+
|  Name String (Length octets)  |
+---+---------------------------+
| H |     Value Length (7+)     |
+---+---------------------------+
| Value String (Length octets)  |
+-------------------------------+
```

**範例**

`hello: world`

```
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
| 0 | 0 | 0 | 1 | 0   0   0   0 |
+---+---+-----------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             hello             |
+---+---------------------------+
| 0 | 0   0   0   0   1   0   1 |
+---+---------------------------+
|             world             |
+-------------------------------+
```

## 參考資料

- https://datatracker.ietf.org/doc/html/rfc7541
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sensitiveheaders
- maxDeflateDynamicTableSize
- maxSendHeaderBlockLength
- sensitiveHeaders

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

<!-- todo-yus -->

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

<!-- todo-yus -->

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

<!-- todo-yus -->

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

<!-- todo-yus -->

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

<!-- todo-yus -->

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

<!-- todo-yus -->

## 參考資料

- https://datatracker.ietf.org/doc/html/rfc7541
- https://nodejs.org/docs/latest-v24.x/api/http2.html#http2sensitiveheaders
- maxDeflateDynamicTableSize
- maxSendHeaderBlockLength
- sensitiveHeaders

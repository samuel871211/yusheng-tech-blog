---
title: ABNF Cheat Sheet
description: 想讀懂 HTTP 的 RFC 嗎？ABNF 跟 RFC 9110 是入場券
last_update:
  date: "2026-02-22T08:00:00+08:00"
---

## 前言

這是 [RFC 9110](https://datatracker.ietf.org/doc/html/rfc9110#name-expect) 對 `Expect` Request Header 的語法介紹

```
Expect =      #expectation
expectation = token [ "=" ( token / quoted-string ) parameters ]
```

每次看到這個就覺得是天書，有看沒有懂XD 但如果想要當 Layer 7 協議的資安研究員，這是一個必須跨過的坎！

## Terminal Values

[Terminal Values](https://datatracker.ietf.org/doc/html/rfc5234#section-2.3) = 不可再被拆解、直接對應到實際字元或數值

| Base | Description |
| ---- | ----------- |
| b    | binary      |
| d    | decimal     |
| x    | hexadecimal |

| Rule | Terminal Value | Description |
| ---- | -------------- | ----------- |
| CR   | %d13           | \r          |
| CR   | %x0D           | \r          |
| CRLF | %d13.10        | \r\n        |

:::info
`.` 在這邊是拼接多個數字
:::

## Core Rules

[Core Rules](https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1) = 定義基礎字符集

| Core Rule | Description                                                |
| --------- | ---------------------------------------------------------- |
| ALPHA     | A-Z / a-z                                                  |
| OCTET     | %x00-FF<br/>8 bits of data                                 |
| CHAR      | %x01-7F<br/>any 7-bit US-ASCII character<br/>excluding NUL |
| SP        | %x20 (SPace)                                               |
| HTAB      | %x09 (Horizontal TAB)                                      |
| WSP       | SP / HTAB<br/>(White SPace)                                |
| DIGIT     | %x30-39<br/>0-9                                            |
| HEXDIG    | DIGIT / "A" / "B" / "C" / "D" / "E" / "F"                  |
| DQUOTE    | %x22 (Double QUOTE)                                        |

## Concatenation: Rule1 Rule2

[Concatenation](https://datatracker.ietf.org/doc/html/rfc5234#section-3.1) = 把多個 Rule 拼接

| Rule    | Description       |
| ------- | ----------------- |
| Foo     | %x61 (a)          |
| Bar     | %x62 (b)          |
| Combine | Foo Bar Foo (aba) |

## Incremental Alternatives: Rule1 =/ Rule2

[Incremental Alternatives](https://datatracker.ietf.org/doc/html/rfc5234#section-3.3) 可以理解為

```ts
interface Rule1 extends Rule2
```

假設在 RFC xxxx 定義了 Authorization 的基本 scheme

- Foo = %x61
- Bar = %x62
- Combine = Foo / Bar

到了 RFC yyyy 需要繼承基本 scheme，然後添加一個新的

- Hel = %x63
- Combine =/ %x63

最終 Combine 這個 Rule 就等於 Foo / Bar / Hel

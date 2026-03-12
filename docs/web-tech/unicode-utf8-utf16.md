---
title: Unicode, UTF-8 跟 UTF-16 一篇搞懂
description: Unicode, UTF-8 跟 UTF-16 一篇搞懂
last_update:
  date: "2026-03-12T08:00:00+08:00"
---

## Unicode

https://developer.mozilla.org/en-US/docs/Glossary/Unicode

```
Unicode is a standard character set that numbers and defines characters from the world's different languages, writing systems, and symbols.

By assigning each character a number, programmers can create character encodings, to let computers store, process, and transmit any combination of languages in the same file or program.
```

| Terminology | Description |
| codespace | 0x0000 to 0x10FFFF |
| Code point | Any value in the Unicode codespace |
| Plane 0 | U+0000 ~ U+FFFF |
| Plane 1 | U+10000 ~ U+1FFFF<br/>BMP |
| Plane 2 | U+20000 ~ U+2FFFF |
| Plane 15 | U+0F0000 .. U+0FFFFF |
| Plane 16 | U+100000 .. U+10FFFF |

## UTF-8

- UTF = Unicode Transformation Format
- 8 = 8 bits
- UTF-8 is a type of [character encoding](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding) which defines a mapping between bytes and text

## UTF-16

| Terminology | Description |
| high surrogate | 0xD800 ~ 0xDBFF |
| low surrogate | 0xDC00 ~ 0xDFFF |

## basic multilingual plane (BMP)

## surrogate pairs

## long surrogate

## 參考資料

- https://developer.mozilla.org/en-US/docs/Glossary/Unicode
- https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/

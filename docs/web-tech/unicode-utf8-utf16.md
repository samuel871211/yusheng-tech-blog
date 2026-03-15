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

在 JavaScript，可以用 `\u` 來表示特定 Unicode 字元

```js
"\u0030"; // '0'
"\u0041"; // 'A'
"\u{1F600}"; // '😀'
```

| Terminology | Description                           |
| ----------- | ------------------------------------- |
| codespace   | 0x0000 to 0x10FFFF                    |
| Code point  | Any value in the Unicode codespace    |
| Plane 0     | 0x0000 ~ 0xFFFF<br/>Also known as BMP |
| Plane 1     | 0x10000 ~ 0x1FFFF                     |
| Plane 2     | 0x20000 ~ 0x2FFFF                     |
| Plane 15    | 0x0F0000 .. 0x0FFFFF                  |
| Plane 16    | 0x100000 .. 0x10FFFF                  |

## UTF 家族基本概念

- UTF = Unicode Transformation Format
- 8 = 8 bits (1 byte)
- 16 = 16 bits (2 bytes)
- Both UTF-8 and UTF-16 are types of [Character encoding](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding) which defines a mapping between bytes and text

## 為何需要 Character encoding

若要用 bytes 呈現 codespace 的每個 Code point，需要 3 bytes

```
00 00 00
10 FF FF
```

但大部分常用的文字都在 0 ~ 65535 的區間，只要 2 bytes 就能表達，用 3 bytes 會浪費很多空間

```
00 00 // 0
FF FF // 65535
```

加上有些用 Null Byte 當字串結尾的程式語言（例如 C）會無法正確解析 `00 00 41` 這種格式

```c
#include <stdio.h>

int main()
{
    char str[] = "Hi";
    printf("size = %d\n", sizeof(str));
    if (str[2] == '\0') {
        printf("last byte is null byte");
    };
}

// size = 3
// last byte is null byte
```

並且 `00 00 00` ~ `10 FF FF` 這種 3 bytes 格式也無法兼容 ASCII，我們用二進位的視角來看

```
ASCII:
[A] = 01000001

若每個 Code point 都固定使用 3 bytes 儲存:
[A] = 00000000 00000000 01000001
```

舊的 ASCII 系統會先讀到兩個 Null Byte (00000000)，也不會被自動理解成「只是補零」，故無法直接照原本方式讀取

## UTF-8

https://datatracker.ietf.org/doc/html/rfc3629#section-3

- 每個 Code point 使用 1 ~ 4 bytes 來編碼
- 向下兼容 ASCII

| hexadecimal         | UTF-8 octet sequence                |
| ------------------- | ----------------------------------- |
| 0x0000 ~ 0x007F     | 0xxxxxxx                            |
| 0x0080 ~ 0x07FF     | 110xxxxx 10xxxxxx                   |
| 0x0800 ~ 0xFFFF     | 1110xxxx 10xxxxxx 10xxxxxx          |
| 0x010000 ~ 0x10FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

上面的表格，有幾個重點

- 若為 1 byte(s)，則開頭是 `0`
- 若為 2 byte(s)，則開頭是 `110`，後續的 byte(s) 開頭是 `10`
- 若為 3 byte(s)，則開頭是 `1110`，後續的 byte(s) 開頭是 `10`
- 若為 4 byte(s)，則開頭是 `11110`，後續的 byte(s) 開頭是 `10`
- ASCII 的編號是 0 ~ 127，換算成 octet sequence 是 `00000000` ~ `01111111`，UTF-8 的 1 byte(s) 剛好可以兼容

## Syntax of UTF-8 Byte Sequences

https://datatracker.ietf.org/doc/html/rfc3629#section-4

| Rule        | ABNF Definition                     | Description                                                  |
| ----------- | ----------------------------------- | ------------------------------------------------------------ |
| UTF8-octets | `*( UTF8-char )`                    | 0 ~ ∞ ( UTF8-char )                                          |
| UTF8-char   | `UTF8-1 / UTF8-2 / UTF8-3 / UTF8-4` | enum                                                         |
| UTF8-1      | `%x00-7F`                           | 0 ~ 127, as known as ASCII                                   |
| UTF8-2      | `%xC2-DF UTF8-tail`                 | [Why UTF8-2 Disallow C0, C1](#why-utf8-2-disallow-c0-c1)     |
| UTF8-3      | [UTF8-3](#utf8-3)                   | -                                                            |
| UTF8-4      | [UTF8-4](#utf8-4)                   | -                                                            |
| UTF8-tail   | `%x80-BF`                           | 10000000 ~ 10111111,<br/>as known as UTF-8 continuation byte |

## Why UTF8-2 Disallow `%xC0` and `%xC1`

UTF8-2 的 leading byte 是 `110xxxxx`，理論上的範圍是 `11000000 ~ 11011111`，也就是 `%xC0-DF`

正常來說 UTF8-2 的 ABNF Definition 應該要是 `%xC2-DF UTF8-tail`，但為何少了 `%xC0` 跟 `%xC1` 呢？

我們來逐步拆解

| hex   | UTF8-2<br/>octet sequence | Parser                                   | ASCII Code<br/>(Decimal) | UTF8-1<br/>octet sequence |
| ----- | ------------------------- | ---------------------------------------- | ------------------------ | ------------------------- |
| C0 80 | 11000000 10000000         | 110(00000) 10(000000) => (00000)(000000) | 0                        | 00000000                  |
| C0 81 | 11000000 10000001         | 110(00000) 10(000001) => (00000)(000001) | 1                        | 00000001                  |
| C0 BF | 11000000 10111111         | 110(00000) 10(111111) => (00000)(111111) | 63                       | 00111111                  |
| C1 80 | 11000001 10000000         | 110(00001) 10(000000) => (00001)(000000) | 64                       | 01000000                  |
| C1 81 | 11000001 10000001         | 110(00001) 10(000001) => (00001)(000001) | 65                       | 01000001                  |
| C1 BF | 11000001 10111111         | 110(00001) 10(111111) => (00001)(111111) | 127                      | 01111111                  |

為了避免同一個 Code point 出現「一個合法、另一個非法 overlong」的多重表示，UTF-8 要求使用最短形式（shortest form）

原因是 "overlong UTF-8 sequence" 有可能造成資安漏洞

1. 若 parser 禁止 NULL Byte (00) 但卻容忍 C0 80 的話，可能造成 [Obfuscating file extensions](../port-swigger/file-upload-vulnerabilities.md#obfuscating-file-extensions)
2. 若 parser 禁止 2F 2E 2E 2F ("/../") 但卻容忍 2F C0 AE 2E 2F 的話，可能造成 [Path Traversal](../port-swigger/path-traversal.md)

## UTF8-3

ABNF Definition: `%xE0 %xA0-BF UTF8-tail / %xE1-EC 2( UTF8-tail ) / %xED %x80-9F UTF8-tail / %xEE-EF 2( UTF8-tail )`

我們先看 UTF8-3 的理論區間

|                                        | Leading Byte        | First continuation byte | Second continuation byte |
| -------------------------------------- | ------------------- | ----------------------- | ------------------------ |
| octet sequence                         | 1110xxxx            | 10xxxxxx                | 10xxxxxx                 |
| theoretical range<br/>(octet sequence) | 11100000 ~ 11101111 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| theoretical range<br/>(hex)            | E0 ~ EF             | 80 ~ BF                 | 80 ~ BF                  |

再來把 ABNF Definition 展開看看

| ABNF Definition                               | Leading Byte        | First continuation byte | Second continuation byte |
| --------------------------------------------- | ------------------- | ----------------------- | ------------------------ |
| `%xE0 %xA0-BF UTF8-tail`<br/>(octet sequence) | 11100000            | 10100000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xE0 %xA0-BF UTF8-tail`<br/>(hex)            | E0                  | A0 ~ BF                 | 80 ~ BF                  |
| `%xE1-EC 2( UTF8-tail )`<br/>(octet sequence) | 11100001 ~ 11101100 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xE1-EC 2( UTF8-tail )`<br/>(hex)            | E1 ~ EC             | 80 ~ BF                 | 80 ~ BF                  |
| `%xED %x80-9F UTF8-tail`<br/>(octet sequence) | 11101101            | 10000000 ~ 10011111     | 10000000 ~ 10111111      |
| `%xED %x80-9F UTF8-tail`<br/>(hex)            | ED                  | 80 ~ 9F                 | 80 ~ BF                  |
| `%xEE-EF 2( UTF8-tail )`<br/>(octet sequence) | 11101110 ~ 11101111 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xEE-EF 2( UTF8-tail )`<br/>(hex)            | EE ~ EF             | 80 ~ BF                 | 80 ~ BF                  |

將這四組 ABNF Definition 與理論值互相比對，可以得出以下結論

|                       | `%xE0 %xA0-BF UTF8-tail` | `%xE1-EC 2( UTF8-tail )`  | `%xED %x80-9F UTF8-tail` | `%xEE-EF 2( UTF8-tail )`  |
| --------------------- | ------------------------ | ------------------------- | ------------------------ | ------------------------- |
| ABNF <br/>(hex)       | E0, A0 ~ BF, 80 ~ BF     | E1 ~ EC, 80 ~ BF, 80 ~ BF | ED, 80 ~ 9F, 80 ~ BF     | EE ~ EF, 80 ~ BF, 80 ~ BF |
| theoretical<br/>(hex) | E0, 80 ~ BF, 80 ~ BF     | E1 ~ EC, 80 ~ BF, 80 ~ BF | ED, 80 ~ BF, 80 ~ BF     | EE ~ EF, 80 ~ BF, 80 ~ BF |
| Same                  | No                       | Yes                       | No                       | Yes                       |

### Why `%xE0 %xA0-BF UTF8-tail` instead of `%xE0 %x80-BF UTF8-tail`

回憶一下這張表

| hexadecimal     | UTF-8 octet sequence       |
| --------------- | -------------------------- |
| 0x0800 ~ 0xFFFF | 1110xxxx 10xxxxxx 10xxxxxx |

將 `0x0800` 進行轉換

| hexadecimal | octet sequence    | UTF-8 octet sequence       | UTF-8 hex |
| ----------- | ----------------- | -------------------------- | --------- |
| 0x0800      | 00001000 00000000 | 11100000 10100000 10000000 | E0 A0 80  |

得出 Code point `0x0800` 對應的 UTF-8 hex 為 `E0 A0 80`，故 First continuation byte 必須 >= A0，才不會造成 "overlong UTF-8 sequence"

### Why `%xED %x80-9F UTF8-tail` instead of `%xED %x80-BF UTF8-tail`

<!-- todo-yus long surrogate -->

## UTF8-4

ABNF Definition: `%xF0 %x90-BF 2( UTF8-tail ) / %xF1-F3 3( UTF8-tail ) / %xF4 %x80-8F 2( UTF8-tail )`

## UTF-16

| Terminology    | Description     |
| -------------- | --------------- |
| high surrogate | 0xD800 ~ 0xDBFF |
| low surrogate  | 0xDC00 ~ 0xDFFF |

## basic multilingual plane (BMP)

## surrogate pairs

## long surrogate

## 參考資料

- https://developer.mozilla.org/en-US/docs/Glossary/Unicode
- https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/
- https://datatracker.ietf.org/doc/html/rfc3629

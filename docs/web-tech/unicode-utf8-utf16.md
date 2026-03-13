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

## RFC

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
- https://datatracker.ietf.org/doc/html/rfc3629#section-3

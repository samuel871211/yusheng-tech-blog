---
title: Unicode, UTF-8 跟 UTF-16 一篇搞懂
description: Unicode, UTF-8 跟 UTF-16 一篇搞懂
last_update:
  date: "2026-03-16T08:00:00+08:00"
---

## Unicode

先看看 [MDN](https://developer.mozilla.org/en-US/docs/Glossary/Unicode) 的原文解說

```
Unicode is a standard character set that numbers and defines characters from the world's different languages, writing systems, and symbols.

By assigning each character a number, programmers can create character encodings, to let computers store, process, and transmit any combination of languages in the same file or program.
```

在 JavaScript 字串 literal 中：

- `\uXXXX` 可用來寫入單一 UTF-16 code unit
- `\u{X...X}` 可用來寫入一個 Unicode code point

```js
"\u0030"; // '0'
"\u0041"; // 'A'
"\u{1F600}"; // '😀'
```

大致上有這些名詞需要記得

| Terminology | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| codespace   | 0x0000 to 0x10FFFF                                               |
| code point  | Any value in the Unicode codespace                               |
| code unit   | The basic unit of an encoding, such as 8, 16, or 32 bits         |
| Plane 0     | 0x0000 ~ 0xFFFF<br/>Also known as BMP (Basic Multilingual Plane) |
| Plane 1     | 0x10000 ~ 0x1FFFF                                                |
| Plane 2     | 0x20000 ~ 0x2FFFF                                                |
| Plane 15    | 0x0F0000 ~ 0x0FFFFF                                              |
| Plane 16    | 0x100000 ~ 0x10FFFF                                              |

## UTF 家族基本概念

- UTF = Unicode Transformation Format
- 8 = 8 bits (1 byte)
- 16 = 16 bits (2 bytes)
- Both UTF-8 and UTF-16 are types of [Character encoding](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding) which defines a mapping between bytes and text

## 為何需要 Character encoding

如果天真地用固定 3 bytes 去直接存放每個 code point，21 bits 的確已足夠覆蓋整個 codespace（0x0000 ~ 0x10FFFF），但這不是 Unicode 標準實際採用的 encoding form

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

若每個 code point 都固定使用 3 bytes 儲存:
[A] = 00000000 00000000 01000001
```

舊的 ASCII 系統會先讀到兩個 Null Byte (00000000)，也不會被自動理解成「只是補零」，故無法直接照原本方式讀取

## UTF-16

https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G31699

- 每個 code point 使用 2 或 4 bytes（1 或 2 個 16 bits）來編碼

| code point          | UTF-16 code unit sequence                      |
| ------------------- | ---------------------------------------------- |
| 0x0000 ~ 0xD7FF     | 0x0000 ~ 0xD7FF                                |
| 0xD800 ~ 0xDBFF     | Reserved for use as high-surrogate code points |
| 0xDC00 ~ 0xDFFF     | Reserved for use as low-surrogate code points  |
| 0xE000 ~ 0xFFFF     | 0xE000 ~ 0xFFFF                                |
| 0x010000 ~ 0x10FFFF | high-surrogate low-surrogate                   |

與 UTF-8 使用 `11110`, `1110`, `110`, `10` 當作前綴不同的地方是，UTF-16 使用 "high-surrogate" + "low-surrogate" 來表示 `0x010000 ~ 0x10FFFF`

## surrogate pairs

[unicode.org](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G1654) 針對 "Surrogate pair" 的解釋是

```
A representation for a single abstract character that consists of a sequence of two 16-bit code units, where the first value of the pair is a high-surrogate code unit and the second value is a low-surrogate code unit.
```

我們直接用 JavaScript 來理解

```js
const a = "\u{1F600}"; // 😀
const codePoint = a.codePointAt(0).toString(16); // 1f600
const highSurrogate = a.charCodeAt(0).toString(16); // d83d
const lowSurrogate = a.charCodeAt(1).toString(16); // de00
```

至於 high-surrogate 跟 low-surrogate 是怎麼算出來的呢？

- `0x010000 ~ 0x10FFFF` 總共有 `0x100000` 個值
- `0x100000` = `2^20`
- 也就是說，`0x010000 ~ 0x10FFFF` 只需要 20 bits 就能編完

而 surrogate pair 剛好提供 `2^20` 個 possible value：

- high-surrogate: `0xD800 ~ 0xDBFF`，總共有 `2^10` 個 possible value
- low-surrogate: `0xDC00 ~ 0xDFFF`，總共有 `2^10` 個 possible value

所以本質上就是：

1. 先把範圍平移到從 0 開始 (codePoint - 0x10000)
2. 再把這個 20-bit 數字拆成兩段 10-bit
3. 分別塞進 `0xD800` 與 `0xDC00` 後面

用 JavaScript 寫個 PoC

```js
// 1. 先把範圍平移到從 0 開始 (codePoint - 0x10000)
const target = 0x1f600 - 0x10000;

// 2. 再把這個 20-bit 數字拆成兩段 10-bit
const high10 = target >> 10; // >> 10 代表把 2 進位的數值右移 10 個 bits，等同於只保留 high10
// 11110110,00000000 (0xF600) => 右移 10 個 bits => 111101 => 等同於 00,00111101

const low10 = target & 0b1111111111; // & 0b1111111111 代表 bit mask，只保留最後的 10 bits
// 11110110,00000000 (0xF600)
// 00000011,11111111 (0b1111111111)
// ----------------- AND 運算
// 00000010,00000000

// 3. 分別塞進 `0xD800` 與 `0xDC00` 後面
const highSurrogate = 0xd800 + high10;
const lowSurrogate = 0xdc00 + low10;

console.log(highSurrogate.toString(16), lowSurrogate.toString(16)); // d83d de00
```

## lone surrogate

若 high-surrogate 或 low-surrogate 單獨出現，則稱為 lone surrogate

JavaScript 有提供 API 可以檢測字串是否包含 lone surrogate

```js
const loneSurrogate = "\uD800";
loneSurrogate.isWellFormed(); // false
```

同時也有提供 API 可以把 lone surrogate 轉換成 `0xFFFD`，也就是 Replacement Character `�`

```js
const loneSurrogate = "\uD800";
loneSurrogate.toWellFormed(); // �
loneSurrogate.toWellFormed().codePointAt(0).toString(16); // fffd
```

JavaScript 宣告含有 lone surrogate 的字串時不會噴錯，但若轉換成其他格式時，就有可能噴錯

```js
encodeURI("\uD800"); // Uncaught URIError: URI malformed
encodeURIComponent("\uD800"); // Uncaught URIError: URI malformed
```

## UTF-8

https://datatracker.ietf.org/doc/html/rfc3629#section-3

- 每個 code point 使用 1 ~ 4 bytes 來編碼
- ASCII 的所有合法 byte sequence，也是合法的 UTF-8 byte sequence，且語意不變

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

| Rule        | ABNF Definition                     | Description                                                    |
| ----------- | ----------------------------------- | -------------------------------------------------------------- |
| UTF8-octets | `*( UTF8-char )`                    | 0 ~ ∞ ( UTF8-char )                                            |
| UTF8-char   | `UTF8-1 / UTF8-2 / UTF8-3 / UTF8-4` | enum                                                           |
| UTF8-1      | `%x00-7F`                           | 0 ~ 127, as known as ASCII                                     |
| UTF8-2      | `%xC2-DF UTF8-tail`                 | [Why UTF8-2 Disallow C0, C1](#why-utf8-2-disallow-xc0-and-xc1) |
| UTF8-3      | [UTF8-3](#utf8-3)                   | -                                                              |
| UTF8-4      | [UTF8-4](#utf8-4)                   | -                                                              |
| UTF8-tail   | `%x80-BF`                           | 10000000 ~ 10111111,<br/>as known as UTF-8 continuation byte   |

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

為了避免同一個 code point 出現「一個合法、另一個非法 overlong」的多重表示，UTF-8 要求使用最短形式（shortest form）

原因是 "overlong UTF-8 sequence" 有可能造成資安漏洞

1. 若 parser 禁止 NULL Byte (00) 但卻容忍 C0 80 的話，可能造成 [Obfuscating file extensions](../port-swigger/file-upload-vulnerabilities.md#obfuscating-file-extensions)
2. 若 parser 禁止 2F 2E 2E 2F ("/../") 但卻容忍 2F C0 AE 2E 2F 的話，可能造成 [Path Traversal](../port-swigger/path-traversal.md)

## UTF8-3

ABNF Definition

```
%xE0 %xA0-BF UTF8-tail / %xE1-EC 2( UTF8-tail ) /
%xED %x80-9F UTF8-tail / %xEE-EF 2( UTF8-tail )
```

我們先看 UTF8-3 的理論區間

|                                        | Leading Byte        | First continuation byte | Second continuation byte |
| -------------------------------------- | ------------------- | ----------------------- | ------------------------ |
| octet sequence                         | 1110xxxx            | 10xxxxxx                | 10xxxxxx                 |
| theoretical range<br/>(octet sequence) | 11100000 ~ 11101111 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| theoretical range<br/>(hex)            | E0 ~ EF             | 80 ~ BF                 | 80 ~ BF                  |

再來把 ABNF Definition 展開看看

| ABNF Definition          | Leading Byte | First continuation byte | Second continuation byte |
| ------------------------ | ------------ | ----------------------- | ------------------------ |
| `%xE0 %xA0-BF UTF8-tail` | E0           | A0 ~ BF                 | 80 ~ BF                  |
| `%xE1-EC 2( UTF8-tail )` | E1 ~ EC      | 80 ~ BF                 | 80 ~ BF                  |
| `%xED %x80-9F UTF8-tail` | ED           | 80 ~ 9F                 | 80 ~ BF                  |
| `%xEE-EF 2( UTF8-tail )` | EE ~ EF      | 80 ~ BF                 | 80 ~ BF                  |

<!-- | ABNF Definition                               | Leading Byte        | First continuation byte | Second continuation byte |
| --------------------------------------------- | ------------------- | ----------------------- | ------------------------ |
| `%xE0 %xA0-BF UTF8-tail`<br/>(octet sequence) | 11100000            | 10100000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xE0 %xA0-BF UTF8-tail`<br/>(hex)            | E0                  | A0 ~ BF                 | 80 ~ BF                  |
| `%xE1-EC 2( UTF8-tail )`<br/>(octet sequence) | 11100001 ~ 11101100 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xE1-EC 2( UTF8-tail )`<br/>(hex)            | E1 ~ EC             | 80 ~ BF                 | 80 ~ BF                  |
| `%xED %x80-9F UTF8-tail`<br/>(octet sequence) | 11101101            | 10000000 ~ 10011111     | 10000000 ~ 10111111      |
| `%xED %x80-9F UTF8-tail`<br/>(hex)            | ED                  | 80 ~ 9F                 | 80 ~ BF                  |
| `%xEE-EF 2( UTF8-tail )`<br/>(octet sequence) | 11101110 ~ 11101111 | 10000000 ~ 10111111     | 10000000 ~ 10111111      |
| `%xEE-EF 2( UTF8-tail )`<br/>(hex)            | EE ~ EF             | 80 ~ BF                 | 80 ~ BF                  | -->

將這四組 ABNF Definition 與理論值互相比對，可以得出以下結論

|                       | `%xE0 %xA0-BF UTF8-tail` | `%xE1-EC 2( UTF8-tail )`  | `%xED %x80-9F UTF8-tail` | `%xEE-EF 2( UTF8-tail )`  |
| --------------------- | ------------------------ | ------------------------- | ------------------------ | ------------------------- |
| ABNF <br/>(hex)       | E0, A0 ~ BF, 80 ~ BF     | E1 ~ EC, 80 ~ BF, 80 ~ BF | ED, 80 ~ 9F, 80 ~ BF     | EE ~ EF, 80 ~ BF, 80 ~ BF |
| theoretical<br/>(hex) | E0, 80 ~ BF, 80 ~ BF     | E1 ~ EC, 80 ~ BF, 80 ~ BF | ED, 80 ~ BF, 80 ~ BF     | EE ~ EF, 80 ~ BF, 80 ~ BF |
| Is Same               | No                       | Yes                       | No                       | Yes                       |

### 為何第一組區間是 `%xE0 %xA0-BF UTF8-tail`

回憶一下這張表

| hexadecimal     | UTF-8 octet sequence       |
| --------------- | -------------------------- |
| 0x0800 ~ 0xFFFF | 1110xxxx 10xxxxxx 10xxxxxx |

將最小值 `0x0800` 進行轉換

| hexadecimal | octet sequence    | UTF-8 octet sequence       | UTF-8 hex |
| ----------- | ----------------- | -------------------------- | --------- |
| 0x0800      | 00001000 00000000 | 11100000 10100000 10000000 | E0 A0 80  |

得出 code point `0x0800` 對應的 UTF-8 hex 為 `E0 A0 80`

✅ 故 First continuation byte 必須 >= A0，才不會造成 "overlong UTF-8 sequence"

### 為何第三組區間是 `%xED %x80-9F UTF8-tail`

回憶一下這張表

| code point      | UTF-16 code unit sequence           |
| --------------- | ----------------------------------- |
| 0xD800 ~ 0xDBFF | Unicode reserved for high-surrogate |
| 0xDC00 ~ 0xDFFF | Unicode reserved for low-surrogate  |

比較一下 "理論的區間"（`%xED %x80-BF UTF8-tail`） 跟 "真實的區間"（`%xED %x80-9F UTF8-tail`）

| hexadecimal | octet sequence    | UTF-8 octet sequence       | UTF-8 hex | Description         |
| ----------- | ----------------- | -------------------------- | --------- | ------------------- |
| 0xD000      | 11010000 00000000 | 11101101 10000000 10000000 | ED 80 80  | theoretical minimum |
| 0xD7FF      | 11010111 11111111 | 11101101 10011111 10111111 | ED 9F BF  | ABNF maximum        |
| 0xDFFF      | 11011111 11111111 | 11101101 10111111 10111111 | ED BF BF  | theoretical maximum |

✅ 可以發現 ABNF maximum (不含) ~ theoretical maximum (含)，剛好就是 "high-surrogate" + "low-surrogate" 的區間

## UTF8-4

ABNF Definition

```
%xF0 %x90-BF 2( UTF8-tail ) / %xF1-F3 3( UTF8-tail ) / %xF4 %x80-8F 2( UTF8-tail )
```

根據前面 UTF8-2 跟 UTF8-3 的經驗，我大膽的猜測

| ABNF Definition               | My Guess                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| `%xF0 %x90-BF 2( UTF8-tail )` | `%xF0 %x80-8F 2( UTF8-tail )` will result in "overlong UTF-8 sequence" |
| `%xF1-F3 3( UTF8-tail )`      | Normal range                                                           |
| `%xF4 %x80-8F 2( UTF8-tail )` | `%xF4 %x90-BF 2( UTF8-tail )` will out of Unicode range                |

不過為了實驗精神，我們還是一組一組來計算

### 為何第一組區間是 `%xF0 %x90-BF 2( UTF8-tail )`

回憶一下這張表

| hexadecimal         | UTF-8 octet sequence                |
| ------------------- | ----------------------------------- |
| 0x010000 ~ 0x10FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

將最小值 `0x010000` 進行轉換

| hexadecimal | 21 bits                 | UTF-8 octet sequence                | UTF-8 hex   |
| ----------- | ----------------------- | ----------------------------------- | ----------- |
| 0x010000    | 00001 00000000 00000000 | 11110000 10010000 10000000 10000000 | F0 90 80 80 |

得出 code point `0x010000` 對應的 UTF-8 hex 為 `F0 90 80 80`

✅ 故 First continuation byte 必須 >= 90，才不會造成 "overlong UTF-8 sequence"

### 為何第三組區間是 `%xF4 %x80-8F 2( UTF8-tail )`

回憶一下這張表

| hexadecimal         | UTF-8 octet sequence                |
| ------------------- | ----------------------------------- |
| 0x010000 ~ 0x10FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

將最大值 `0x10FFFF` 進行轉換

| hexadecimal | 21 bits                 | UTF-8 octet sequence                | UTF-8 hex   |
| ----------- | ----------------------- | ----------------------------------- | ----------- |
| 0x10FFFF    | 10000 11111111 11111111 | 11110100 10001111 10111111 10111111 | F4 8F BF BF |

得出 code point `0x10FFFF` 對應的 UTF-8 hex 為 `F4 8F BF BF`

✅ 故 First continuation byte 必須 &lt;= 8F，才不會造成 "out of Unicode range"

## Unicode 一些你可能不知道的特性

- ZWSP = Zero Width SPace = `U+200B`

<!-- ## basic multilingual plane (BMP) -->

## 參考資料

- https://developer.mozilla.org/en-US/docs/Glossary/Unicode
- https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/
- https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G31699
- https://datatracker.ietf.org/doc/html/rfc3629

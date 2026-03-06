---
title: Built-in Proxy Support
description: "帶你了解 Node.js 在 v24.5.0 加入的 Built-in Proxy Support"
last_update:
  date: "2026-03-06T08:00:00+08:00"
---

## authority-form

authority-form = [uri-host](../http/ABNF-cheat-sheet.md#rfc-3986-host) ":" port

用在 [CONNECT](../http/http-request-methods-1.md) Method，格式如下

```
CONNECT example.com:443 HTTP/1.1
Host: example.com
```

其中一個使用情境就是 [HTTPS_PROXY](#https_proxy)

## HTTPS_PROXY

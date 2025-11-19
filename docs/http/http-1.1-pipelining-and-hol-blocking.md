---
title: HTTP/1.1 pipelining and HOL Blocking
description: HTTP/1.1 pipelining and HOL Blocking
---

## 前言

打完 [portSwigger 的 HTTP Request Smuggling](https://portswigger.net/web-security/request-smuggling) 之後，我開始在真實世界研究這種技巧，結果卻不小心踩到 HTTP/1.1 pipelining 的坑，於是這篇文章就誕生了

## Safe Methods

<!-- https://www.rfc-editor.org/rfc/rfc9110#section-9.2.1 -->

## Idempotent Methods

<!-- https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2 -->

## nc instead of burp suite

<!-- (echo -ne "GET /?sleepMs=0 HTTP/1.1\r\nHost: localhost\r\n\r\nGET /?sleepMs=5000 HTTP/1.1\r\nHost: localhost\r\n\r\nGET /?sleepMs=2000 HTTP/1.1\r\nHost: localhost\r\n\r\n"; sleep 10) | nc localhost 5000 -->

<!-- burp suite not good -->

## 參考資料

- https://www.rfc-editor.org/rfc/rfc9110#section-9.2.1
- https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2
- https://datatracker.ietf.org/doc/html/rfc9112#section-9.3.2
  <!-- - https://tkoce.teaches.cc/training -->
  <!-- - https://www.oce.tku.edu.tw/ -->
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x

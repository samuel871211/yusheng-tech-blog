---
title: HTTP/1.1 pipelining
description: HTTP/1.1 pipelining
---

## 前言

打完 [portSwigger 的 HTTP Request Smuggling](https://portswigger.net/web-security/request-smuggling) 之後，我開始在真實世界研究這種技巧，結果卻不小心踩到 HTTP/1.1 pipelining 的坑...

##

<!-- (echo -ne "GET /?sleepMs=0 HTTP/1.1\r\nHost: localhost\r\n\r\nGET /?sleepMs=5000 HTTP/1.1\r\nHost: localhost\r\n\r\nGET /?sleepMs=2000 HTTP/1.1\r\nHost: localhost\r\n\r\n"; sleep 10) | nc localhost 5000 -->

<!-- burp suite not good -->

- https://tkoce.teaches.cc/training
- https://www.oce.tku.edu.tw/

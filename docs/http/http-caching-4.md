---
title: HTTP caching (第四篇)
description: HTTP caching (第四篇)
last_update:
  date: "2025-11-22T08:00:00+08:00"
---

## 前言

在 2025/07/16 寫了三篇關於 HTTP caching 的文章之後，我發現真實世界還有很多有趣的案例可以研究，也意識到 HTTP caching 其實還有很多東西值得深入研究，光是 [RFC 9111 - HTTP Caching](https://datatracker.ietf.org/doc/html/rfc9111) 就有很多寶可以挖了，於是決定開第四篇，把真實世界遇到的案例整理起來

## no-cache="Set-Cookie"

某天在逛線上購物時，發現 Response Headers 竟然有我沒看過的 pattern

```
Cache-Control: public, no-cache="Set-Cookie", max-age=60
```

當下覺得超興奮，於是馬上詢問 AI 這是不是合法的設定，有無 RFC 章節可以參考？AI 說可以參考 [RFC 9111 section-5.2.2.4](https://datatracker.ietf.org/doc/html/rfc9111#section-5.2.2.4)

```
The qualified form of the no-cache response directive, with an argument that lists one or more field names, indicates that a cache MAY use the response to satisfy a subsequent request
```

:::info
unqualified form => no-cache

qualified form => no-cache="Set-Cookie"
:::

RFC 原文有點難懂，白話文來說，`Cache-Control: public, no-cache="Set-Cookie", max-age=60` 的意思是："這個 HTTP Response 可以被 Cache Server 快取，但如果 Response Header 有包含 Set-Cookie 的話，就必須跟 Origin Server 驗證"

但 RFC 並沒有規定 Cache Server 一定要實作此功能，加上實作這個功能會增加許多複雜度，所以 RFC 原文最後有一段

```
the special handling for the qualified form is not widely implemented
```

連 RFC 自己都說這項功能並未被廣泛實作，實務上確實有點困難，假設 Cache Server 真的跟 Origin Server 驗證，然後 Origin Server 回傳

```
HTTP/1.1 304 Not Modified
ETag: "123"
Cache-Control: public, no-cache="Set-Cookie", max-age=60
Set-Cookie: SessionID=123
```

那 Cache Server 要更新 Cache 的 Set-Cookie 嗎？還是單純把新的 Set-Cookie 回傳給 Browser 就好？另外如果 Origin Server 回傳

```
HTTP/1.1 304 Not Modified
ETag: "123"
Cache-Control: public, no-cache="Set-Cookie", max-age=60
```

那是直接把 Cache 的 Set-Cookie 回傳給 Browser 就好嗎？還是要把 Set-Cookie 移除呢？

閱讀 RFC 原文有趣的地方是，有時候可以找到理論跟實作上的差異，若深入了解其中的原因，就會發現 RFC 規範其實存在不少模糊的區塊，頂尖的資安研究員就會研究這些 "模糊地帶"，找到 Protocol Level 的資安漏洞

## 304 Not Modified Required Headers

<!-- todo-yus -->
<!-- ```mermaid
sequenceDiagram
  participant Browser
  participant Cache Server
  participant Origin Server

  Note over Browser, Origin Server: First Round Trip
  Browser ->> Cache Server: GET / HTTP/1.1
  Note over Cache Server: No Cache Found
  Cache Server ->> Origin Server: GET / HTTP/1.1
  Origin Server ->> Cache Server: HTTP/1.1 200 OK<br/>Set-Cookie: sessionID=123<br/>Cache-Control: public, no-cache="Set-Cookie"<br/>Content-Type: text/html<br/>Content-Length: 9487<br/>ETag: "123"<br/>Last-Modified: Sat, 22 Nov 2025 13:09:58 GMT<br/><br/><html>...
  Note over Cache Server: Store Cache
  Cache Server ->> Browser: HTTP/1.1 200 OK<br/>Set-Cookie: sessionID=123<br/>Cache-Control: public, no-cache="Set-Cookie"<br/>Content-Type: text/html<br/>Content-Length: 9487<br/>ETag: "123"<br/>Last-Modified: Sat, 22 Nov 2025 13:09:58 GMT<br/><br/><html>...

  Note over Browser, Origin Server: Second Round Trip
  Browser ->> Cache Server: GET / HTTP/1.1<br/>If-Modified-Since: Sat, 22 Nov 2025 13:09:58 GMT<br/>If-None-Match: "123"
  Note over Cache Server: Cache contains "Set-Cookie" header,<br/>revalidate with Origin Server.
  Cache Server ->> Origin Server: GET / HTTP/1.1<br/>If-Modified-Since: Sat, 22 Nov 2025 13:09:58 GMT<br/>If-None-Match: "123"
  Origin Server ->> Cache Server: HTTP/1.1 304 Not Modified<br/>
``` -->

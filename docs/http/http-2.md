---
title: HTTP/2
description: HTTP/2
last_update:
  date: "2025-11-02T08:00:00+08:00"
---

## 前言

2025 iThome 鐵人賽，我發表了 30 篇 [Learn HTTP With JS](https://ithelp.ithome.com.tw/users/20155705/ironman/8162) 系列文。時隔兩個月，為了打 portSwigger [Race conditions](https://portswigger.net/web-security/all-labs#race-conditions) 跟 [HTTP request smuggling](https://portswigger.net/web-security/all-labs#http-request-smuggling) 的 Labs，我打算先把 HTTP2 的基本知識補齊，所以又開始寫 HTTP 系列文啦～

## HTTP2 Over HTTPS

### NodeJS http2.createServer

在開始寫這篇文章前，我就有依稀記得 HTTP2 不支援 Over HTTP，如果細看 NodeJS HTTP2 Module 的話，可以看到主流瀏覽器都不支援 HTTP2 Over HTTP

```js
/**
 * Returns a `net.Server` instance that creates and manages `Http2Session` instances.
 *
 * Since there are no browsers known that support [unencrypted HTTP/2](https://http2.github.io/faq/#does-http2-require-encryption), the use of {@link createSecureServer} is necessary when
 * communicating
 * with browser clients.
 */
export function createServer(
    onRequestHandler?: (request: Http2ServerRequest, response: Http2ServerResponse) => void,
): Http2Server;
```

### Starting HTTP/2 for "http" URIs

回到 2015 年的 [RFC7540 #section-3.2](https://datatracker.ietf.org/doc/html/rfc7540#section-3.2)，有說到 HTTP2 Over HTTP 的協商機制

```
A client that makes a request for an "http" URI without prior knowledge about support for HTTP/2 on the next hop uses the HTTP Upgrade mechanism.
```

具體來說，client 會構造

```
GET / HTTP/1.1
Host: server.example.com
Connection: Upgrade, HTTP2-Settings
Upgrade: h2c
HTTP2-Settings: <base64url encoding of HTTP/2 SETTINGS payload>
```

其中 h2c 代表 HTTP/2 over cleartext TCP

Server 若不支援，則回傳

```
HTTP/1.1 200 OK
```

Server 若支援，則回傳

```
HTTP/1.1 101 Switching Protocols
Connection: Upgrade
Upgrade: h2c
```

### HTTP/2 for "http" URIs has been deprecated

看起來很美好，但實務上支援的 Server 並不多，畢竟各大瀏覽器廠商都說只支援 HTTP2 Over HTTPS，那這樣的場景自然就不需要實作。並且在 HTTP2 最新的 [RFC 9113 #section-3.1](https://datatracker.ietf.org/doc/html/rfc9113#section-3.1) 有提到這個機制已被棄用

```
The "h2c" string was previously used as a token for use in the HTTP Upgrade mechanism's Upgrade header field (Section 7.8 of [HTTP]). This usage was never widely deployed and is deprecated by this document. The same applies to the HTTP2-Settings header field, which was used with the upgrade to "h2c".
```

### firefox does not implement h2c

根據 [bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1418832) 在 2017 年的某則討論，裡面就有明確說到不實作 h2c 的原因，參考 [comment 7](https://bugzilla.mozilla.org/show_bug.cgi?id=1418832#c7)

在 client 跟 HTTP/2 Server 中間可能會有很多 transparent proxies 只支援 HTTP/1.0, HTTP/1.1，並且會攔截/修改 HTTP 流量。這些 transparent proxies 遇到 HTTPS 就會直接轉發，遇到 h2c 可能會導致解析失敗，所以讓 HTTP/2 for "https" 算是一種向後兼容的作法

## NodeJS HTTP2 Server

## Header Compression

## 參考資料

- https://nodejs.org/api/http2.html
- https://developer.mozilla.org/en-US/docs/Glossary/HTTP_2
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103
- https://datatracker.ietf.org/doc/html/rfc7540
- https://datatracker.ietf.org/doc/html/rfc7541
- https://datatracker.ietf.org/doc/html/rfc9113

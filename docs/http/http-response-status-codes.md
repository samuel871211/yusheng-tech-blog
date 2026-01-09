---
title: HTTP response status codes
description: HTTP response status codes
last_update:
  date: "2025-11-27T08:00:00+08:00"
---

## 前言

大概在 2025/06 就把這篇定在最後再寫，因為介紹各種 HTTP Header 的時候，就會順便講到各種 Status Codes 了；所以這邊主要會是網羅 "平常很少見的" Status Codes

後來我在現實世界遇到很多特殊案例，想說就從這些案例當中，學習這些 Status Codes，所以這篇文章會持續更新補齊～

## 100 Continue

## 202 Accepted

## 203 Non-Authoritative Information

## 205 Reset Content

## 207 Multi-Status

## 208 Already Reported

## 226 IM Used

## 402 Payment Required

## 408 Request Timeout

## 409 Conflict

## 410 Gone

## 411 Length Required

有些 Server 會希望 POST 或是 PUT Request 必須要帶上 Body，若沒帶的話，Server 就可以回傳 411 Length Required

其中一個範例就是微軟生態系（HTTPAPI/2.0, IIS, ASP.NET）

Request

```
POST / HTTP/1.1
Host: example.com


```

Response

```
HTTP/1.1 411 Length Required
Content-Type: text/html; charset=us-ascii
Server: Microsoft-HTTPAPI/2.0
Date: Thu, 20 Nov 2025 08:21:06 GMT
Connection: close
Content-Length: 344

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN""http://www.w3.org/TR/html4/strict.dtd">
<HTML>
    <HEAD>
        <TITLE>Length Required</TITLE>
        <META HTTP-EQUIV="Content-Type" Content="text/html; charset=us-ascii">
    </HEAD>
    <BODY>
        <h2>Length Required</h2>
        <hr>
        <p>HTTP Error 411. The request must be chunked or have a content length.</p>
    </BODY>
</HTML>
```

## 414 URI Too Long

## 417 Expectation Failed

常見情境是 [`Expect: 100-continue`](#100-continue)，如果刻意構造錯誤的 value 的話

Request

```
POST / HTTP/2
Host: example.com
Expect: 123


```

Response

```
HTTP/2 417 Expectation Failed
Date: Sun, 16 Nov 2025 11:42:49 GMT
Server: Apache
Content-Length: 483
Content-Type: text/html; charset=iso-8859-1

<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>417 Expectation Failed</title>
</head><body>
<h1>Expectation Failed</h1>
<p>The expectation given in the Expect request-header
field could not be met by this server.
The client sent<pre>
    Expect: 123
</pre>
</p><p>Only the 100-continue expectation is supported.</p>
<p>Additionally, a 417 Expectation Failed
error was encountered while trying to use an ErrorDocument to handle the request.</p>
</body></html>
```

## 421 Misdirected Request

有些 Apache Web Server 會檢查 SNI 跟 Host 是否相同

Request https://example.com

```
GET / HTTP/1.1
Host: localhost


```

Response

```
HTTP/1.1 421 Misdirected Request
Date: Wed, 26 Nov 2025 12:55:27 GMT
Server: Apache/2.4.33 (Win32) OpenSSL/1.1.0h PHP/7.2.7
Content-Length: 422
Content-Type: text/html; charset=iso-8859-1

<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>421 Misdirected Request</title>
</head><body>
<h1>Misdirected Request</h1>
<p>The client needs a new connection for this
request as the requested host name does not match
the Server Name Indication (SNI) in use for this
connection.</p>
<hr>
<address>Apache/2.4.33 (Win32) OpenSSL/1.1.0h PHP/7.2.7 Server at localhost Port 443</address>
</body></html>
```

## 423 Locked

## 424 Failed Dependency

## 426 Upgrade Required

有些 istio-envoy proxy 不支援老舊的 HTTP/1.0

Request

```
GET / HTTP/1.0
Host: example.com


```

Response

```
HTTP/1.1 426 Upgrade Required
content-length: 16
content-type: text/plain
date: Fri, 21 Nov 2025 09:39:54 GMT
server: istio-envoy
connection: close

Upgrade Required
```

另外還有一個情境是 [Websocket](./upgrade.md)

Request

```
GET /chat HTTP/2
Host: example.com


```

Response

```
HTTP/2 426 Upgrade Required
Content-Length: 0
Date: Thu, 27 Nov 2025 01:31:08 GMT
Sec-Websocket-Version: 13
X-Cache: Error from cloudfront
Via: 1.1 91497c7d9eb98069bdcff6f49956c240.cloudfront.net (CloudFront)
X-Amz-Cf-Pop: TPE53-P1
X-Amz-Cf-Id: j6tCHFjEuMRdXwHRuByKBvEKWOkA9pfWyaQRxJbpZ_OqwBQPz46xjg==


```

## 431 Request Header Fields Too Large

## 451 Unavailable For Legal Reasons

## 501 Not Implemented

根據 [MDN 文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/501) 的描述

```
501 is the appropriate response when the server does not recognize the request method and is incapable of supporting it for any resource.
```

我在一些 cloudflare 的 Server 有看過這個 Status Code，刻意傳送不支援的 Request Method 的話

Request

```
HELLO /404 HTTP/1.1
Host: example.com


```

Response

```
HTTP/1.1 501 Not Implemented
Date: Thu, 20 Nov 2025 11:48:17 GMT
Content-Length: 0
Connection: keep-alive
CF-RAY: 9a17b7aaaed44a82-TPE
Strict-Transport-Security: max-age=15552000; includeSubDomains
Server: cloudflare
alt-svc: h3=":443"; ma=86400


```

有些微軟生態系（HTTPAPI/2.0, IIS, ASP.NET）也會阻擋不支援的 [Transfer-Encoding](./transfer-encoding.md)

Request

```
POST / HTTP/1.1
Host: example.com
Transfer-Encoding: 1


```

Response

```
HTTP/1.1 501 Not Implemented
Content-Type: text/html; charset=us-ascii
Server: Microsoft-HTTPAPI/2.0
Date: Thu, 27 Nov 2025 01:38:16 GMT
Connection: close
Content-Length: 343

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN""http://www.w3.org/TR/html4/strict.dtd">
<HTML>
    <HEAD>
        <TITLE>Not Implemented</TITLE>
        <META HTTP-EQUIV="Content-Type" Content="text/html; charset=us-ascii">
    </HEAD>
    <BODY>
        <h2>Not Implemented</h2>
        <hr>
        <p>HTTP Error 501. The request transfer encoding type is not supported.</p>
    </BODY>
</HTML>
```

## 502 Bad Gateway

## 503 Service Unavailable

Response

```
HTTP/2 503 Service Unavailable
Date: Thu, 27 Nov 2025 06:34:57 GMT
Content-Type: text/html; charset=utf-8
Retry-After: 5
Accept-Ranges: bytes
Age: 0
X-Bcache: UC MISS from 29
Cf-Cache-Status: DYNAMIC
Server-Timing: cfCacheStatus;desc="DYNAMIC"
Server-Timing: cfEdge;dur=6,cfOrigin;dur=149
Server: cloudflare
Alt-Svc: h3=":443"; ma=86400


<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
    <head>
        <title>503 Service Unavailable</title>
    </head>
    <body>
        <h1>Error 503 Service Unavailable</h1>
        <p>Service Unavailable</p>
        <h3>Guru Meditation:</h3>
        <p>XID: 957548437</p>
    </body>
</html>;

```

## 504 Gateway Timeout

通常會在 SSRF 或是 Host Header Injection 成功，但內網 IP 沒有服務

```
HTTP/1.1 504 Gateway Timeout
Server: nginx
Date: Tue, 23 Dec 2025 13:44:41 GMT
Content-Type: text/html
Content-Length: 160
X-Source: bs
Via: 1.1 google
Alt-Svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000

<html>
    <head>
        <title>504 Gateway Time-out</title>
    </head>
    <body>
        <center>
            <h1>504 Gateway Time-out</h1>
        </center>
        <hr>
        <center>nginx</center>
    </body>
</html>
```

## 505 HTTP Version Not Supported

## 506 Variant Also Negotiates

## 507 Insufficient Storage

## 508 Loop Detected

## 510 Not Extended

## 511 Network Authentication Required

## 520 Unknown Error

這是 [Cloudflare 自訂的 Status Code](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-520/)

Response

```
HTTP/2 520 Unknown Error
Date: Thu, 27 Nov 2025 06:17:47 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 15
Cache-Control: private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0
Expires: Thu, 01 Jan 1970 00:00:01 GMT
Referrer-Policy: same-origin
Server-Timing: cfEdge;dur=7,cfOrigin;dur=0
X-Frame-Options: SAMEORIGIN
Server: cloudflare
Cf-Ray: 9a4f8128fc3ba343-TPE
Alt-Svc: h3=":443"; ma=86400

error code: 520
```

## 530 Origin DNS Error

這是 [Cloudflare 自訂的 Status Code](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-530/)，[Error Code 是 1016](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1016/)

Request: https://tech.udn.com

```
GET /tech/cate/123454 HTTP/2
Host: udn.com
User-Agent: 123


```

Response

```
HTTP/2 530 Origin DNS Error
Date: Fri, 19 Dec 2025 01:13:32 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 16
X-Frame-Options: SAMEORIGIN
Referrer-Policy: same-origin
Cache-Control: private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0
Expires: Thu, 01 Jan 1970 00:00:01 GMT
Server: cloudflare
Cf-Ray: 9b0309b91d808a97-TPE
Alt-Svc: h3=":443"; ma=86400

error code: 1016
```

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/202
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/203
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/205
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/207
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/208
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/226
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/408
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/409
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/410
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/411
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/414
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/417
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/421
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/423
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/424
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/431
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/451
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/501
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/502
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/504
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/505
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/506
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/507
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/508
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/510
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/511

---
title: HTTP response status codes
description: HTTP response status codes
---

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

## 414 URI Too Long

## 417 Expectation Failed

Request

```
POST / HTTP/2
Host: www.wanhsyan.com.tw
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

## 423 Locked

## 424 Failed Dependency

## 431 Request Header Fields Too Large

## 451 Unavailable For Legal Reasons

## 501 Not Implemented

## 502 Bad Gateway

## 503 Service Unavailable

## 504 Gateway Timeout

## 505 HTTP Version Not Supported

## 506 Variant Also Negotiates

## 507 Insufficient Storage

## 508 Loop Detected

## 510 Not Extended

## 511 Network Authentication Required

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

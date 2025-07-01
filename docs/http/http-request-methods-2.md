---
title: HTTP Request Methods (下篇)
description: HTTP Request Methods (下篇)
---

## OPTIONS

## TRACE

### 簡介

### XAMPP For Windows 下載

https://sourceforge.net/projects/xampp/files/XAMPP%20Windows/8.2.12/xampp-windows-x64-8.2.12-0-VS16-installer.exe/download

Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12 Server at localhost Port 80

<!-- todo -->

由於支援 TRACE Method 的 Web Server 很少

httpd.conf

```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

<VirtualHost *:80>
    ServerName localhost
    ProxyPreserveHost On
    ProxyRequests Off
    <Location />
        ProxyPass http://localhost:5000/
        ProxyPassReverse http://localhost:5000/
    </Location>
</VirtualHost>
```

### Max-Forwards

<!-- todo -->

curl -X TRACE -H "Max-Forwards: -1" http://localhost/TRACE

## XST (Cross Site Tracing)

### PoC

以下 PoC 無法在現代瀏覽器還原，程式碼是參考 [XMLHttpRequest2-20080225#response-metadata](https://www.w3.org/TR/2008/WD-XMLHttpRequest2-20080225/#response-metadata) 這份文件，僅供參考

1. 攻擊者會架一個惡意網站，內含以下程式碼

```js
var client = new XMLHttpRequest();
client.open("TRACE", "https://www.facebook.com/", true);
client.send();
client.onreadystatechange = function() {
 if(this.readyState == 3) {
  print(this.getAllResponseHeaders());
 }
}

// ...should output something similar to the following text:
Date: Sun, 24 Oct 2004 04:58:38 GMT
Server: Apache/1.3.31 (Unix)
Keep-Alive: timeout=15, max=99
Connection: Keep-Alive
Transfer-Encoding: chunked
Content-Type: text/plain; charset=utf-8
```

2. 受害者進到惡意網站，就會執行惡意程式碼
3. 攻擊者就可以竊取受害者在 `https://www.facebook.com/` 登入狀態的 Cookies 等等資訊

### 時間軸（不一定 100% 正確）

- 這是一個古早時期（約 2022 ~ 2003 年公布）的資安漏洞，詳細可參考 [這篇文章](https://www.kb.cert.org/vuls/id/867593)
- 參考 https://www.w3.org/TR/2008/WD-XMLHttpRequest2-20080225/#response-metadata 這篇文章，在 2008 年，開始禁止 cross-origin 的 XMLHttpRequest 去讀取 ResponseHeaders（代表以前可能沒禁止，所以 XST 漏洞才會成立）

```
The getAllResponseHeaders() method provides access to all response headers as a single string. When invoked, the user agent must act as if it had run the following steps:
1. ......
2. If the error flag is "true" or the same-origin flag is "false" return null and terminate these steps.
```

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/OPTIONS
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/TRACE
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Max-Forwards
- https://httpwg.org/specs/rfc9110.html#rfc.section.9.3.2
- https://fetch.spec.whatwg.org/#methods

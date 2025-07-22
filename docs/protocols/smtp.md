---
title: SMTP
description: SMTP
---

## Port

| Port | Description                                               |
| ---- | --------------------------------------------------------- |
| 25   | SMTP，最古老的，主要用來 Server ->> Server 之間的信件傳送 |
| 465  | SMTPS，已棄用，建議使用 587                               |
| 587  | SMTPS，主要用來接收 SMTP Client 發送的信件                |
| 2525 | Fallback，沒有在規範內                                    |

<!-- todo-yus 看到這裡 https://nodemailer.com/usage#create-a-transporter -->

## 參考資料

- https://datatracker.ietf.org/doc/html/rfc5321
- https://datatracker.ietf.org/doc/html/rfc5322
- https://github.com/nodemailer/nodemailer
- https://github.com/nodemailer/smtp-server
- https://nodemailer.com/
- https://ethereal.email/
- https://chatgpt.com/c/687e2fed-c4c0-8011-a382-6dc667f75b5a
  <!-- - https://emailengine.app/ -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc3207 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc4954 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc1870 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc2920 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc6152 -->

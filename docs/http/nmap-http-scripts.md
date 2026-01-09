---
title: nmap http scripts
description: nmap http scripts
last_update:
  date: "2025-06-22T08:00:00+08:00"
---

進入本篇之前，建議先看過 [nmap-basic](../web-security/nmap-basic.md) 呦！

## 本機 NodeJS http server 環境設定

nmap 有一份超大的字典，維護每個 port 對應的服務是什麼，可參考 [Github 原始碼](https://github.com/nmap/nmap/blob/master/nmap-services)。總之，我們需要把 port 開在 80, 443 或 8080，nmap 才會正確識別這是 HTTP 服務

使用 NodeJS 在 80 port 開一個 http server

```ts
import { type IncomingMessage } from "http";
import { faviconListener } from "../listeners/faviconListener";
import { notFoundListener } from "../listeners/notFoundlistener";
import http80Server from "./http80Server";

const scannedRoutes: Array<
  Pick<IncomingMessage, "url" | "method" | "headers">
> = [];

// clear state because of nodemon HMR
scannedRoutes.length = 0;
http80Server.removeAllListeners("request");

http80Server.on("request", function requestListener(req, res) {
  // favicon
  if (req.method?.toLowerCase() === "get" && req.url === "/favicon.ico") {
    return faviconListener(req, res);
  }

  // 下載報表的路由
  if (
    req.method?.toLowerCase() === "get" &&
    req.url === "/generateScannedRoutes"
  ) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=scannedRoutes.json",
    );
    return res.end(JSON.stringify(scannedRoutes, null, 2));
  }

  // 其餘 nmap 掃描的路由，都先回傳 404
  scannedRoutes.push({
    url: req.url,
    method: req.method,
    headers: req.headers,
  });
  return notFoundListener(req, res);
});
```

## nmap http-enum 掃描

終端機輸入

```cmd
nmap --script http-enum --script-args http.useragent="Mozilla/5.0" -p 80 127.0.0.1
```

應該會看到以下結果

```
Starting Nmap 7.97 ( https://nmap.org ) at 2025-06-16 15:32 +0800
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00012s latency).

PORT   STATE SERVICE
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 1.42 seconds
```

因為本機訪問幾乎沒有延遲，加上我們沒有限制同一個 IP 短時間的請求次數，所以幾乎是瞬間就完成掃描

這時候我們透過瀏覽器訪問 http://localhost/generateScannedRoutes ，就可以看到 nmap 所有掃描的路徑了，以下節錄部分：

```json
[
  {
    "url": "/../../../../../../../../../../etc/passwd",
    "method": "GET",
    "headers": {
      "host": "localhost",
      "connection": "close",
      "user-agent": "Mozilla/5.0"
    }
  },
  {
    "url": "/../../../../../../../../../../boot.ini",
    "method": "GET",
    "headers": {
      "host": "localhost",
      "connection": "close",
      "user-agent": "Mozilla/5.0"
    }
  }
]
```

## nmap http-enum 會掃描哪些路徑

根據 nmap 在 github 的原始碼描述，[http-enum.nse](https://github.com/nmap/nmap/blob/master/scripts/http-enum.nse)

```
Currently, the database can be found under Nmap's directory in the nselib/data folder. The file is called
http-fingerprints and has a long description of its functionality in the file header.
```

我們可以在 [http-fingerprints.lua](https://github.com/nmap/nmap/blob/master/nselib/data/http-fingerprints.lua) 找到所有掃描的路徑，也確實可以對應到上面輸出的 json 檔

```lua
table.insert(fingerprints, {
    category = 'attacks',
    probes = {
      {
        path = '/../../../../../../../../../../etc/passwd',
        method = 'GET',
        nopipeline = true
      },
      {
        path = '/../../../../../../../../../../boot.ini',
        method = 'GET',
        nopipeline = true
      }
    },
    matches = {
      {
        match = 'root:',
        output = 'Simple path traversal in URI (Linux)'
      },
      {
        match = 'boot loader',
        output = 'Simple path traversal in URI (Windows)'
      },
      {
        match = '',
        output = 'Possible path traversal in URI'
      }
    }
  });
```

## nmap http-enum 什麼情況會終止掃描

在看 [http-enum.nse](https://github.com/nmap/nmap/blob/master/scripts/http-enum.nse) 的時候，我發現部分情境會終止 http-enum 的掃描，接下來就逐步嘗試

```lua
  -- Identify servers that answer 200 to invalid HTTP requests and exit as these would invalidate the tests
  local status_404, result_404, known_404 = http.identify_404(host,port)
  if ( status_404 and result_404 == 200 ) then
    stdnse.debug1("Exiting due to ambiguous response from web server on %s:%s. All URIs return status 200.", host.ip, port.number)
    return nil
  end
```

判斷的邏輯，是定義在 [http.lua](https://github.com/nmap/nmap/blob/master/nselib/http.lua) 的 `function identify_404`

我們嘗試修改 NodeJS 程式碼，讓不存在的路徑回傳 200

```ts
// case 1: 嘗試回傳 200 頁面 + 固定內容，觸發 http-enum 腳本終止
res.setHeader("Content-Type", "text/html; charset=utf-8");
res.end("<h1>Hello World</h1>");
return;
```

重新掃描

```
nmap --script http-enum --script-args http.useragent="Mozilla/5.0" -p 80 127.0.0.1 -d
```

加上 -d，會看到詳細的執行過程，其中就有

```
NSE: [http-enum 127.0.0.1:80] HTTP: Host returns 200 instead of 404.
NSE: [http-enum 127.0.0.1:80] Exiting due to ambiguous response from web server on 127.0.0.1:80. All URIs return status 200.
NSE: Finished http-enum against 127.0.0.1:80.
```

因為我們把所有路由都回傳 200 + 固定內容，nmap 無法判斷接下來要掃描的 fingerprints 是否真的存在，為了避免大量的誤報，故直接終止掃描

## nmap http-enum 什麼情況會產生大量的誤報

```ts
// case2: 嘗試回傳 200 頁面 + 不同內容，讓 nmap 產生大量誤報
res.setHeader("Content-Type", "text/html; charset=utf-8");
res.end(`<h1>${crypto.randomUUID()}</h1>`);
return;
```

重新掃描

```
nmap --script http-enum --script-args http.useragent="Mozilla/5.0" -p 80 127.0.0.1
```

就會看到所有掃描的路徑列出來了（僅節錄部分）

```
PORT   STATE SERVICE
80/tcp open  http
| http-enum:
|   /blog/: Blog
|   /weblog/: Blog
|   /weblogs/: Blog
|   /wordpress/: Blog
|   /wiki/: Wiki
```

## nmap http- 開頭的 scripts 還有哪些

nmap 所有的 scripts 可在 https://nmap.org/nsedoc/scripts/ 查詢，其中 `http-` 開頭的就有 100 多個，這邊整理一些常用的

1. Apache Web Server

- http-apache-negotiation
- http-apache-server-status
- http-userdir-enum
- http-vuln-cve2011-3192
- http-vuln-cve2011-3368
- http-vuln-cve2017-5638

2. ASP.NET

- http-aspnet-debug

3. Auth 相關

- http-auth
- http-auth-finder

4. 備份相關

- http-backup-finder
- http-config-backup

5. CakePHP

- http-cakephp-version

6. PHP

- http-php-version
- http-vuln-cve2012-1823

7. PHPMYADMIN

- http-phpmyadmin-dir-traversal

6. Cisco AnyConnect (VPN)

- http-cisco-anyconnect

7. IIS

- http-iis-short-name-brute
- http-iis-webdav-vuln
- http-vuln-cve2015-1635

8. JSONP

- http-jsonp-detection

9. WordPress

- http-vuln-cve2014-8877
- http-vuln-cve2017-1001000
- http-wordpress-brute
- http-wordpress-enum
- http-wordpress-users

## http-passwd

檢查 Web Server 是否有 Path Traversal 的漏洞，可以取得 `/etc/passwd` 或是 `/boot.ini`

<!-- todo-yus -->
<!-- ## http-sql-injection -->

## 參考資料

- https://nmap.org/nsedoc/lib/http.html
- https://nmap.org/nsedoc/scripts/
- https://nmap.org/nsedoc/scripts/http-enum.html

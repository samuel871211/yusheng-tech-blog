---
title: 從滲透測試的角度看一篇演講稿【常見的網站弱點與修補方法】
description: 從滲透測試的角度看一篇演講稿【常見的網站弱點與修補方法】
last_update:
  date: "2025-12-26T08:00:00+08:00"
---

最近在研究 WordPress 時，意外發現了一份來自國立臺灣大學計算機及網路中心網路組的精彩演講稿 - [常見的網站弱點與修補方法](https://www.tp1rc.edu.tw/tpnet2024/training/1131201.pdf)。
非常感謝陳思蘊和游子興的分享！這份演講稿不僅系統性地整理了常見的 Web Security 議題，更難能可貴的是，它從防禦者的角度出發，提供了實用的修補方法和配置建議。
作為一名前端工程師，我平時較少接觸 Web Server 配置和系統運維，但透過這份演講稿，我學到了很多 Apache、PHP、WordPress 的安全配置實務。以下分享幾個我在真實滲透測試中有遇到的案例：

🔍 對外開放非必要的 Port、服務與權限 (Page 15)
在偵查階段，我通常會用 nmap 掃描目標 IP，常見的敏感 ports 包括：

FTP (預設 21)
SMB (預設 445)
RDP (預設 3389)
SSH (預設 22)

掃到這些 Port 不代表有漏洞，但從藍隊(防禦方)的角度來看，"對外開放非必要的 Port" 本身就是一個潛藏的風險 - 它增加了攻擊面，給了攻擊者更多入口點。

📄 帳號密碼洩漏在公開網路上 (Page 15)
雖然聽起來很扯，但我確實發現過某單位的離職文件暴露在公網，導致數十組帳密外洩。有興趣的可以參考我在 HITCON Zeroday 上的報告：[ZD-2025-01268](https://zeroday.hitcon.org/vulnerability/ZD-2025-01268) ~ [ZD-2025-01288](https://zeroday.hitcon.org/vulnerability/ZD-2025-01288)
這類問題往往不是技術漏洞，而是資訊管理流程的缺失。

🎁 phpinfo 公開訪問 (Page 17)
phpinfo 本身不算漏洞，但卻是白帽駭客在偵查階段的大禮物！它會洩漏：

PHP 版本號
主機架構
Document Root

這些資訊對後續的 exploitation 非常有幫助，從防禦角度來看，絕對不該公開訪問。

🔎 網頁技術棧 Fingerprinting (Page 18)
透過以下資訊可以描繪出目標的技術棧：

HTTP Response Headers (如 X-Powered-By, Server, Via)
Error Page
404 Page

例如，構造一個不存在的 URL Path，就能引出 Apache Web Server 的預設 404 頁面，從中識別出 Web Server 類型和版本。

⚠️ XST - Cross Site Tracing (Page 20)
這個漏洞我在 [2025 iThome 鐵人賽 - Learn HTTP With JS系列 第 22 篇](https://ithelp.ithome.com.tw/articles/10375332) 也有寫過。
結論：現代瀏覽器的安全機制，基本上不允許發 TRACE 請求，所以這漏洞已經不太成立了。
💡 小知識：Cross Site Tracing (XST) 是 2002 年發現的漏洞
不過，老舊網站若允許 TRACE Method，還是有機會讓白帽駭客捕捉到中間節點(如 Proxy、CDN)添加的 Custom HTTP Headers。

🎯 Host Header Injection (Page 31)
這是 [PortSwigger 的經典 Lab](https://portswigger.net/web-security/host-header)，常見的利用場景包括：

Password reset poisoning
Web cache poisoning
SSRF via Host header

📂 Directory Listing (Page 37)
測試成本低，但資訊收集效果顯著!
常見的利用場景：

洩漏 .git 目錄 → 還原 source code
洩漏 backup files (.bak, .sql, .zip)
洩漏 configuration files

🔧 OPTIONS Method (Page 39)
演講稿的標題是 "已啟用不安全的 OPTIONS HTTP 方法"，但我想補充一個重要觀點：
在現代前後端分離架構中，假設：

前端：example.com
後端：api.example.com

當前端要發送 POST request 且 Content-Type: application/json 時，瀏覽器會先發送 CORS preflight request，使用的就是 OPTIONS method。
在這種情況下，後端必須允許 OPTIONS，並回傳支援的 HTTP methods。
所以不能一概而論地說 "OPTIONS 不安全"，要看具體使用場景。

🎯 WordPress xmlrpc.php (Page 66)
看到 WordPress 網站，我第一件事就是測 xmlrpc.php 是否開啟：

✅ 有開啟 → 恭喜，多了一個攻擊入口
❌ 沒開啟 → 別氣餒，還有其他 API endpoints 可測

從滲透測試角度來看：

system.multicall 可以在單一 HTTP request 內執行多個 method calls，有機會 bypass 登入頁的 rate limit，讓 brute-force attack 更有效率
pingback.ping 有機會達成 SSRF 或 DDoS (可搭配 system.multicall 放大攻擊)

從防禦角度來看：
關閉 xmlrpc.php 是最一勞永逸的方法。

💡 心得總結
這份演講稿的最大優勢在於：不僅告訴你「有什麼常見的網站弱點」，還教你「怎麼修補」!
以我自己前端工程師的工作經驗，其實很少碰到網站運維、Web Server 配置。我雖然略懂一些 Web Pentest 的攻擊手法，但這份演講稿是從防禦的角度出發，讓我在閱讀過程中，學到了很多 Apache、PHP、WordPress 的安全配置實務知識。
這種結合理論與實務、攻防兼備的教材，對於想要提升 Web Security 能力的工程師來說，真的是非常珍貴的資源!

#WebSecurity #PenetrationTesting #WordPress #InfoSec #CyberSecurity #臺灣大學 #資訊安全

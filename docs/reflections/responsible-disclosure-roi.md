---
title: 我找了 140 個漏洞後才懂：Responsible Disclosure 的真實 ROI
description: 從 140 個漏洞到暫停投稿：一個資安研究員的反思
last_update:
  date: "2025-10-11T08:00:00+08:00"
---

## 前言

我在 2025/05/23 加入 [zeroday.hitcon.org](https://zeroday.hitcon.org)，遞交了在平台上的第一份漏洞回報，開啟了屬於自己的新篇章。一路到 2025/10/01，累積將近 140 個回報，然而在這過程中，我逐漸領悟到一個更深的道理，於是做了一個決定-------暫停 [zeroday.hitcon.org](https://zeroday.hitcon.org) 上繼續回報 "重複" 的漏洞。

## 初衷

當初在 [zeroday.hitcon.org](https://zeroday.hitcon.org) 回報漏洞的初衷很簡單，只是想要累積 Web Security 的實戰經驗，僅此而已。

## 刷排行榜

第一次體會到 "刷排行榜" 竟然可以這樣做，是在 2025/08/08 刷完 [PortSwigger SQL Injection](../port-swigger/sql-injection.md) 之後。某天因緣際會在查資料時，一間介面略顯老舊的公司網站進入我的視線，成了我最初的試驗場，利用新學到的 SQLi 技能，意外順利成功 exploit。在 [zeroday.hitcon.org](https://zeroday.hitcon.org) 回報漏洞，填寫公司名稱時，意外發現這個網站是 Design By YYY 數位科技，於是我填了 XXX 海鮮宅配（Design By YYY 數位科技）。

追根究柢了 YYY 數位科技，發現是一間台灣中南部的公司，專門幫客戶做網站設計，網站首頁映入眼簾的是眾多 "成功案例"，我便逐一點開測試exploit，短時間內累積了 11 個漏洞回報。

我必須說，第一次成功在真實世界 exploit 不同的 SQLi，包含

- UNION Based SQLi
- exploit SQLi via URL Path with space not allowed

真的會很有成就感，且可以學到 [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection) 以外的 Bypass 技巧，算是額外的收穫，也讓我對 SQLi 的理解更上一層樓。

但在多次回報相同類型的漏洞後（第二次、第三次以至第十次），那種興奮感早已褪去，取而代之的是麻木感——彷彿自己只是重複一連串指令的機器人，既未學到新東西，也沒有實質成長。這讓我開始質疑回報的價值：我不再追求數字排名，只有對修復的微弱期盼：這次提交，請讓它成為改變的起點。

我這次回報的列表如下：

- https://zeroday.hitcon.org/vulnerability/ZD-2025-00972
- https://zeroday.hitcon.org/vulnerability/ZD-2025-00978
- https://zeroday.hitcon.org/vulnerability/ZD-2025-00980
- https://zeroday.hitcon.org/vulnerability/ZD-2025-00994
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01012
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01013
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01014
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01015
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01016
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01017
- https://zeroday.hitcon.org/vulnerability/ZD-2025-01018

## zeroday.hitcon.org 的現況

那段時間的我（2025/05/23—2025/10/01）養成每天查看公開漏洞的習慣：看新名詞、試新技巧、吸收新的攻擊思路，加上經歷過 [刷排行榜](#刷排行榜) 的洗禮，但我卻逐漸看到一個令人沮喪的現象——即使白帽們洋洋灑灑提供詳細修補建議，最終換來的就是 "已公開但是未回報修補狀況"。
曾經滿腔熱血的我，面對如此的無作為感到心寒無力；久而久之，我已然能把這些失落轉化為理性的收穫：學會新技術、盡到回報責任，將情緒放在次要位置。

另外，在 SQLi 的漏洞，根據我對平台的觀察，基本上 10 個有 9 個都是用 [sqlmap](https://github.com/sqlmapproject/sqlmap) 掃出來的，感覺審核漏洞的人員應該會看到很厭世(?)

## 壓倒駱駝的最後一根草

偶爾會在 [公開的漏洞](https://zeroday.hitcon.org/vulnerability/disclosed) 挖到一些新技術/名詞/工具，實測後常驚訝地發現漏洞雖已揭露，企業卻仍未修補，面對這種情況我會再回報——那種實驗與驗證的過程，對我來說就像是 PortSwigger 的 Lab，第一次解題可以學到新技術，且有正確答案可參考，exploit 起來完全沒壓力。

我在 2025/09/29 ~ 2025/09/30 回報了一連串的 "離職交接檔案公開訪問且包含許多帳密" 漏洞。第一次 exploit 的過程覺得很驚喜，原來 Google Search 還可以這樣用呀，我都沒想到。但後續回報的過程極度枯燥乏味，因為總共有 10 幾組帳密外洩，我面臨兩種選擇：

- A: 總共回報一個漏洞
- B: 每個外洩的帳密獨立一個回報，迫使企業針對這 10 幾組外洩的帳密 "獨立處理"

我最後選擇了 B，提交後卻只剩懊悔，覺得自己就像"低階漏洞清掃機器人"，用一堆回報數字營造進度假象，其實不過是在自欺欺人。這種以數量掩蓋成長的行為，讓我開始重新審視自己。

## SQLi 學習

雖然在 exploit SQLi 的過程，我真的學到很多 [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection) 以外的 Bypass 技巧，除了上面提到的，還有：

- [exploit SQLi via querystring with bracket not allowed](https://zeroday.hitcon.org/vulnerability/ZD-2025-01101)
- [SQL Injection via INTO OUTFILE Leading to Remote Code Execution](https://zeroday.hitcon.org/vulnerability/ZD-2025-01107)
- [Cookie-Based-Blind-SQL-Injection](https://zeroday.hitcon.org/vulnerability/ZD-2025-01124)
- [Boolean-Based-SQLi](https://zeroday.hitcon.org/vulnerability/ZD-2025-01254)

我不敢說我是 SQLi 大師，但至少我可以很驕傲地說，這些漏洞都是我手動找到的，不是用 [sqlmap](https://github.com/sqlmapproject/sqlmap) 掃出來的。因為我想要理解 SQLi 的成因跟技巧，直接上工具掃的話，我覺得就會剝奪學習的過程。

## 問題點

同樣的技巧 exploit N 次，並且回報 N 個漏洞，這件事情本身就很浪費時間。偏偏會犯 SQLi 這種漏洞的中小企業，很大的機率，整個 Codebase 都是用 SQL 字串拼接的，所以找到 1 個漏洞，基本上就可以再找到 N 個用同樣技巧就能輕鬆 exploit 的漏洞。同理，完全可以套用到其他漏洞類型，例如 XSS，以及我上面提到的 [離職交接檔案公開訪問且包含許多帳密](#壓倒駱駝的最後一根草) 這種奇葩漏洞。

## 改變

2025/10/01 之後，我開始回頭繼續刷未完成的 PortSwigger Labs，因為我知道，繼續找那些我已經熟悉的 XSS, SQLi 只會讓我原地踏步。

- A: 花 15 分鐘找到一個中小企業的 XSS, SQLi => 回報 => 獲得短暫的多巴胺獎勵機制
- B: 花 1 小時解一題 Practitioner ~ Expert 等級的 PortSwigger Lab，並且學習到新的 Web Security 技巧

很明顯 A 就是在用裝忙的方式來逃避學習新知識，而我的大腦不由自主地選了 A

我覺得我在真實世界找到的 SQLi 已經夠多了，如果是以 "刷完 PortSwigger SQLi Lab 覺得不夠理解，所以才到真實世界補足 SQLi 經驗" 為出發點的話，那也差不多可以暫停了，該去學習下一個 Web Security Topic 了。

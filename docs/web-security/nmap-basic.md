---
title: nmap basic
description: nmap basic
last_update:
  date: "2025-06-18T08:00:00+08:00"
---

### nmap 環境設定

1. nmap 下載 https://nmap.org/download

### 基本名詞介紹

1. nmap: Network Mapper
2. NSE: Nmap Scripting Engine
3. false positive: 誤報

### 使用方法

```
nmap
# 列出 nmap 所有可用的方法

nmap localhost
# 掃描 localhost 最常見的 1000 個 port
```

### Target Specification

官方文件：https://nmap.org/book/man-target-specification.html

### Host Discovery

官方文件：https://nmap.org/book/man-host-discovery.html

### Port Scanning Basics

官方文件：https://nmap.org/book/man-port-scanning-basics.html

| port state       | 解釋                                        |
| ---------------- | ------------------------------------------- |
| open             | ✅                                          |
| closed           | ❎                                          |
| filtered         | 可能是防火牆，會讓整體 port scan 速度變超慢 |
| unfiltered       | 我沒遇過                                    |
| open\|filtered   | 我沒遇過                                    |
| closed\|filtered | 我沒遇過                                    |

### Port Scanning Techniques

官方文件：https://nmap.org/book/man-port-scanning-techniques.html

列出常用的：

- -sS(TCP SYN scan) 較隱密的掃描，不會完整建立 TCP 三方交握

### Port Specification and Scan Order

官方文件：https://nmap.org/book/man-port-specification.html

列出常用的：

- -F (只掃 100 個 ports)
- --top-ports 2000（掃最常見的 2000 個 ports）

### Service and Version Detection

官方文件：https://nmap.org/book/man-version-detection.html

### OS Detection

官方文件：https://nmap.org/book/man-os-detection.html

### Timing and Performance

官方文件：https://nmap.org/book/man-performance.html

### Output

官方文件：https://nmap.org/book/man-output.html

列出常用的：

- -v (Increase verbosity level) 可以 -vv 來增加 level
- -d (Increase debugging level) 可以 -dd 來增加 level
- --open (Show only open (or possibly open) ports)

### 參考資料

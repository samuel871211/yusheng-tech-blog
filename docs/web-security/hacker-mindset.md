<!-- https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-swa-range-bypass-2BsEHYSu -->

## 某些 WAF/ACL 只檢查「完整請求」

GET /admin/sensitive-video.mp4 HTTP/1.1
=> ❌ 403 Forbidden

GET /admin/sensitive-video.mp4 HTTP/1.1
Range: bytes=0-1023
=> ✅ 200 OK (逐段繞過下載限制)

<!-- https://docs.trafficserver.apache.org/admin-guide/plugins/cache_range_requests.en.html -->

## 某些 CDN 對 Range Request 的 Cache Key 處理有問題

GET /video.mp4 HTTP/1.1
Range: bytes=0-1048575

=> 可能污染 CDN cache

| 名詞    | RFC/文件                   | 滲透測試重點             |
| ------- | -------------------------- | ------------------------ |
| PKCS7   | RFC 2315                   | Padding error 洩露資訊   |
| AES-CBC | FIPS 197 + NIST SP 800-38A | 可被 padding oracle 攻擊 |
| AES-GCM | NIST SP 800-38D            | 防守用，不易被攻擊       |
| HMAC    | RFC 2104                   | 驗證資料完整性           |
| Base64  | RFC 4648                   | 編碼不等於加密           |

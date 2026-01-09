---
title: WordPress
description: WordPress
---

## 前言

很多網站使用 WordPress 架站，故研究 WordPress 相關的資安漏洞，我覺得是有投資報酬率的

## word press cheat sheet

### wp-admin

| Path                                     | Description |
| ---------------------------------------- | ----------- |
| /wp-admin/                               | -           |
| /wp-admin/admin-ajax.php                 | -           |
| /wp-admin/install.php                    | -           |
| /wp-admin/setup-config.php               | -           |
| /wp-admin/load-scripts.php               | -           |
| /wp-admin/load-styles.php                | -           |
| /wp-admin/maint/repair.php               | -           |
| /wp-admin/includes/                      | -           |
| /wp-admin/upgrade.php                    | -           |
| /wp-admin/error.php                      | -           |
| /wp-admin/options-general.php            | -           |
| /wp-admin/admin.php?page=wpseo_dashboard | -           |
| /wp-admin/network/                       | -           |
| /wp-admin/network.php                    | -           |
| /wp-admin/ms-admin.php                   | -           |

### wp-json

| Path                           | Description |
| ------------------------------ | ----------- |
| /wp-json/wp/v2/                | -           |
| /wp-json/wp/v2/users           | -           |
| /wp-json/wp/v2/posts           | -           |
| /wp-json/wp/v2/pages           | -           |
| /wp-json/wp/v2/media           | -           |
| /wp-json/                      | -           |
| /wp-json/oembed/1.0/embed?url= | -           |

## wp-content

| Path                                     | Description |
| ---------------------------------------- | ----------- |
| /wp-content/plugins/                     | -           |
| /wp-content/themes/                      | -           |
| /wp-content/debug.log                    | -           |
| /wp-content/uploads/                     | -           |
| /wp-content/cache/                       | -           |
| /wp-content/backup/                      | -           |
| /wp-content/backups/                     | -           |
| /wp-content/w3tc-config/                 | -           |
| /wp-content/advanced-cache.php           | -           |
| /wp-content/object-cache.php             | -           |
| /wp-content/db.php                       | -           |
| /wp-content/sunrise.php                  | -           |
| /wp-content/plugins/akismet/             | -           |
| /wp-content/plugins/hello.php            | -           |
| /wp-content/plugins/wordfence/           | -           |
| /wp-content/plugins/yoast/               | -           |
| /wp-content/plugins/jetpack/             | -           |
| /wp-content/plugins/woocommerce/         | -           |
| /wp-content/plugins/contact-form-7/      | -           |
| /wp-content/plugins/all-in-one-seo-pack/ | -           |
| /wp-content/mu-plugins/                  | -           |
| /wp-content/blogs.dir/                   | -           |
| /wp-content/themes/twentytwentyone/      | -           |
| /wp-content/themes/twentytwenty/         | -           |
| /wp-content/themes/twentynineteen/       | -           |
| /wp-content/wflogs/                      | -           |
| /wp-content/ai1wm-backups/               | -           |
| /wp-content/updraft/                     | -           |

## wp-confg

| Path                | Description |
| ------------------- | ----------- |
| /wp-config.php.bak  | -           |
| /wp-config.txt      | -           |
| /wp-config.php      | -           |
| /wp-config.php~     | -           |
| /wp-config.php.save | -           |
| /wp-config.php.swp  | -           |
| /wp-config.php.old  | -           |
| /wp-config.bak      | -           |

## others

| Path                     | Description |
| ------------------------ | ----------- |
| /.htaccess               | -           |
| /wp-login.php            | -           |
| /readme.html             | -           |
| /wp-includes/version.php | -           |
| /wp-settings.php         | -           |
| /wp-load.php             | -           |
| /wp-blog-header.php      | -           |
| /.wp-config.php.swp      | -           |
| /xmlrpc.php              | -           |
| /wp-activate.php         | -           |
| /wp-signup.php           | -           |
| /license.txt             | -           |
| /readme.html             | -           |
| /wp-trackback.php        | -           |
| /robots.txt              | -           |
| /sitemap.xml             | -           |
| /sitemap_index.xml       | -           |
| /.well-known/            | -           |

## wordpress.fuzz.txt

[SecLists-wordpress.fuzz.txt](https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/CMS/wordpress.fuzz.txt)

## wpscan

上面的 [WordPress Cheet Sheet](#word-press-cheat-sheet) 其實是 AI 給出來的，實際上肯定不只這些，讓我蠻意外的是，竟然還有專門的弱掃工具 [wpscan](https://github.com/wpscanteam/wpscan)

## 參考資料

- https://wpscan.com
- https://wpscan.com/docs/api/v3/

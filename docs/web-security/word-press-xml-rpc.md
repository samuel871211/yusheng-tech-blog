---
title: WordPress /xmlrpc.php
description: WordPress /xmlrpc.php
---

## 官方文件

- https://developer.wordpress.org/apis/xml-rpc/
- https://developer.wordpress.org/reference/classes/wp_xmlrpc_server/

## 測試過程

1. listMethods

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>system.listMethods</methodName>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <params>
        <param>
            <value>
                <array>
                    <data>
                        <value>
                            <string>system.multicall</string>
                        </value>
                        <value>
                            <string>system.listMethods</string>
                        </value>
                        <value>
                            <string>system.getCapabilities</string>
                        </value>
                        <value>
                            <string>demo.addTwoNumbers</string>
                        </value>
                        <value>
                            <string>demo.sayHello</string>
                        </value>
                        <value>
                            <string>pingback.extensions.getPingbacks</string>
                        </value>
                        <value>
                            <string>pingback.ping</string>
                        </value>
                        <value>
                            <string>mt.publishPost</string>
                        </value>
                        <value>
                            <string>mt.getTrackbackPings</string>
                        </value>
                        <value>
                            <string>mt.supportedTextFilters</string>
                        </value>
                        <value>
                            <string>mt.supportedMethods</string>
                        </value>
                        <value>
                            <string>mt.setPostCategories</string>
                        </value>
                        <value>
                            <string>mt.getPostCategories</string>
                        </value>
                        <value>
                            <string>mt.getRecentPostTitles</string>
                        </value>
                        <value>
                            <string>mt.getCategoryList</string>
                        </value>
                        <value>
                            <string>metaWeblog.getUsersBlogs</string>
                        </value>
                        <value>
                            <string>metaWeblog.deletePost</string>
                        </value>
                        <value>
                            <string>metaWeblog.newMediaObject</string>
                        </value>
                        <value>
                            <string>metaWeblog.getCategories</string>
                        </value>
                        <value>
                            <string>metaWeblog.getRecentPosts</string>
                        </value>
                        <value>
                            <string>metaWeblog.getPost</string>
                        </value>
                        <value>
                            <string>metaWeblog.editPost</string>
                        </value>
                        <value>
                            <string>metaWeblog.newPost</string>
                        </value>
                        <value>
                            <string>blogger.deletePost</string>
                        </value>
                        <value>
                            <string>blogger.editPost</string>
                        </value>
                        <value>
                            <string>blogger.newPost</string>
                        </value>
                        <value>
                            <string>blogger.getRecentPosts</string>
                        </value>
                        <value>
                            <string>blogger.getPost</string>
                        </value>
                        <value>
                            <string>blogger.getUserInfo</string>
                        </value>
                        <value>
                            <string>blogger.getUsersBlogs</string>
                        </value>
                        <value>
                            <string>wp.restoreRevision</string>
                        </value>
                        <value>
                            <string>wp.getRevisions</string>
                        </value>
                        <value>
                            <string>wp.getPostTypes</string>
                        </value>
                        <value>
                            <string>wp.getPostType</string>
                        </value>
                        <value>
                            <string>wp.getPostFormats</string>
                        </value>
                        <value>
                            <string>wp.getMediaLibrary</string>
                        </value>
                        <value>
                            <string>wp.getMediaItem</string>
                        </value>
                        <value>
                            <string>wp.getCommentStatusList</string>
                        </value>
                        <value>
                            <string>wp.newComment</string>
                        </value>
                        <value>
                            <string>wp.editComment</string>
                        </value>
                        <value>
                            <string>wp.deleteComment</string>
                        </value>
                        <value>
                            <string>wp.getComments</string>
                        </value>
                        <value>
                            <string>wp.getComment</string>
                        </value>
                        <value>
                            <string>wp.setOptions</string>
                        </value>
                        <value>
                            <string>wp.getOptions</string>
                        </value>
                        <value>
                            <string>wp.getPageTemplates</string>
                        </value>
                        <value>
                            <string>wp.getPageStatusList</string>
                        </value>
                        <value>
                            <string>wp.getPostStatusList</string>
                        </value>
                        <value>
                            <string>wp.getCommentCount</string>
                        </value>
                        <value>
                            <string>wp.deleteFile</string>
                        </value>
                        <value>
                            <string>wp.uploadFile</string>
                        </value>
                        <value>
                            <string>wp.suggestCategories</string>
                        </value>
                        <value>
                            <string>wp.deleteCategory</string>
                        </value>
                        <value>
                            <string>wp.newCategory</string>
                        </value>
                        <value>
                            <string>wp.getTags</string>
                        </value>
                        <value>
                            <string>wp.getCategories</string>
                        </value>
                        <value>
                            <string>wp.getAuthors</string>
                        </value>
                        <value>
                            <string>wp.getPageList</string>
                        </value>
                        <value>
                            <string>wp.editPage</string>
                        </value>
                        <value>
                            <string>wp.deletePage</string>
                        </value>
                        <value>
                            <string>wp.newPage</string>
                        </value>
                        <value>
                            <string>wp.getPages</string>
                        </value>
                        <value>
                            <string>wp.getPage</string>
                        </value>
                        <value>
                            <string>wp.editProfile</string>
                        </value>
                        <value>
                            <string>wp.getProfile</string>
                        </value>
                        <value>
                            <string>wp.getUsers</string>
                        </value>
                        <value>
                            <string>wp.getUser</string>
                        </value>
                        <value>
                            <string>wp.getTaxonomies</string>
                        </value>
                        <value>
                            <string>wp.getTaxonomy</string>
                        </value>
                        <value>
                            <string>wp.getTerms</string>
                        </value>
                        <value>
                            <string>wp.getTerm</string>
                        </value>
                        <value>
                            <string>wp.deleteTerm</string>
                        </value>
                        <value>
                            <string>wp.editTerm</string>
                        </value>
                        <value>
                            <string>wp.newTerm</string>
                        </value>
                        <value>
                            <string>wp.getPosts</string>
                        </value>
                        <value>
                            <string>wp.getPost</string>
                        </value>
                        <value>
                            <string>wp.deletePost</string>
                        </value>
                        <value>
                            <string>wp.editPost</string>
                        </value>
                        <value>
                            <string>wp.newPost</string>
                        </value>
                        <value>
                            <string>wp.getUsersBlogs</string>
                        </value>
                    </data>
                </array>
            </value>
        </param>
    </params>
</methodResponse>
```

2. getUsers

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>wp.getUsers</methodName>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <fault>
        <value>
            <struct>
                <member>
                    <name>faultCode</name>
                    <value>
                        <int>400</int>
                    </value>
                </member>
                <member>
                    <name>faultString</name>
                    <value>
                        <string>沒有足夠的引數傳遞至這個 XML-RPC 方法。</string>
                    </value>
                </member>
            </struct>
        </value>
    </fault>
</methodResponse>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>wp.getUsers</methodName>
    <params>
        <param>
            <value>1</value>
        </param>
        <param>
            <value>admin</value>
        </param>
        <param>
            <value>admin</value>
        </param>
    </params>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <fault>
        <value>
            <struct>
                <member>
                    <name>faultCode</name>
                    <value>
                        <int>403</int>
                    </value>
                </member>
                <member>
                    <name>faultString</name>
                    <value>
                        <string>錯誤: 過多的登入嘗試失敗次數。 請於 20 分鐘後再試。</string>
                    </value>
                </member>
            </struct>
        </value>
    </fault>
</methodResponse>
```

才戳個三次就頂到上限...

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>wp.getUsers</methodName>
    <params>
        <param>
            <value>1</value>
        </param>
        <param>
            <value>admin</value>
        </param>
        <param>
            <value>admin</value>
        </param>
    </params>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <fault>
        <value>
            <struct>
                <member>
                    <name>faultCode</name>
                    <value>
                        <int>403</int>
                    </value>
                </member>
                <member>
                    <name>faultString</name>
                    <value>
                        <string>不正確的使用者名稱或密碼。</string>
                    </value>
                </member>
            </struct>
        </value>
    </fault>
</methodResponse>
```

3. getCapabilities

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
<methodName>system.getCapabilities</methodName>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <params>
        <param>
            <value>
                <struct>
                    <member>
                        <name>xmlrpc</name>
                        <value>
                            <struct>
                                <member>
                                    <name>specUrl</name>
                                    <value>
                                        <string>http://www.xmlrpc.com/spec</string>
                                    </value>
                                </member>
                                <member>
                                    <name>specVersion</name>
                                    <value>
                                        <int>1</int>
                                    </value>
                                </member>
                            </struct>
                        </value>
                    </member>
                    <member>
                        <name>faults_interop</name>
                        <value>
                            <struct>
                                <member>
                                    <name>specUrl</name>
                                    <value>
                                        <string>http://xmlrpc-epi.sourceforge.net/specs/rfc.fault_codes.php</string>
                                    </value>
                                </member>
                                <member>
                                    <name>specVersion</name>
                                    <value>
                                        <int>20010516</int>
                                    </value>
                                </member>
                            </struct>
                        </value>
                    </member>
                    <member>
                        <name>system.multicall</name>
                        <value>
                            <struct>
                                <member>
                                    <name>specUrl</name>
                                    <value>
                                        <string>http://www.xmlrpc.com/discuss/msgReader$1208</string>
                                    </value>
                                </member>
                                <member>
                                    <name>specVersion</name>
                                    <value>
                                        <int>1</int>
                                    </value>
                                </member>
                            </struct>
                        </value>
                    </member>
                </struct>
            </value>
        </param>
    </params>
</methodResponse>
```

4. getAuthors

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>wp.getAuthors</methodName>
    <params>
        <param>
            <value>1</value>
        </param>
    </params>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <fault>
        <value>
            <struct>
                <member>
                    <name>faultCode</name>
                    <value>
                        <int>403</int>
                    </value>
                </member>
                <member>
                    <name>faultString</name>
                    <value>
                        <string>不正確的使用者名稱或密碼。</string>
                    </value>
                </member>
            </struct>
        </value>
    </fault>
</methodResponse>
```

5. [getPingbacks](https://developer.wordpress.org/reference/classes/wp_xmlrpc_server/pingback_extensions_getpingbacks/)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
    <methodName>pingback.extensions.getPingbacks</methodName>
    <params>
        <param>
            <value>https://example.com</value>
        </param>
    </params>
</methodCall>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
    <params>
        <param>
            <value>
                <array>
                    <data></data>
                </array>
            </value>
        </param>
    </params>
</methodResponse>
```

6. [ping](https://developer.wordpress.org/reference/classes/wp_xmlrpc_server/pingback_ping/)

## 參考資料

- https://github.com/sqlmapproject/sqlmap

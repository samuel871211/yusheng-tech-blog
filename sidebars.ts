import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "doc",
      label: "昱昇の技術部落格",
      id: "index",
    },
    {
      type: "category",
      label: "http",
      items: [
        "http/index",
        "http/anatomy-of-an-http-message",
        "http/keep-alive-and-connection",
        "http/http-1.1-HOL-blocking",
        "http/origin-and-referer",
        "http/referrer-policy",
        "http/content-type-and-mime-type",
        "http/server-sent-events",
        "http/transfer-encoding",
        "http/accept-encoding-and-content-encoding",
        "http/sec-fetch",
        "http/iframe-security",
        "http/http-range-requests",
        "http/retry-after-and-date",
        "http/nmap-http-scripts",
        "http/source-map",
        "http/refresh",
        "http/accept-patch-and-accept-post",
        "http/strict-transport-security",
        "http/upgrade",
        "http/http-redirections",
        "http/http-request-methods-1",
        "http/http-request-methods-2",
        "http/http-content-negotiation",
        "http/http-authentication",
        "http/cross-origin-resource-sharing-1",
        "http/cross-origin-resource-sharing-2",
        "http/beyond-cors-1",
        "http/http-caching-1",
        "http/http-caching-2",
        "http/http-caching-3",
        "http/articles-30-end",
        // "http/http-message-integrity", // 必讀
        // "http/timing-allow-origin", // 必讀
        // "http/link", // 概念不難，但又可以順便把 <link> 精熟
        // "http/clear-site-data", // 感覺可以水一篇
        // "http/content-security-policy-1", // 必讀，想放後面
        // "http/content-security-policy-2", // 必讀，想放後面
        // "http/http-2", // 必讀，想放後面
        // "http/http-version-negotiation", // 這個偏難
        // "http/http-3", // 這個偏難
        // "http/beyond-cors-2", // 超難，想放後面
        // "http/integrity-policy", // 很新的技術
        // "http/http-response-status-codes", // 感覺可拆，放最後，因為會跟很多主題重複
        // "http/end",
      ],
    },
    {
      type: "category",
      label: "web-security",
      items: [
        "web-security/nmap-basic",
        "web-security/nmap-ftp-scripts",
        // "web-security/dot-git",
        // "web-security/nmap-mysql-scripts",
        // "web-security/CVE-2024-4577",
      ],
    },
    {
      type: "category",
      label: "web-tech",
      items: [
        // "web-tech/xml",
        // "web-tech/web-rtc",
        // "wen-tech/subresource-integrity",
        "web-tech/binary-data-in-javascript",
      ],
    },
    // {
    //   type: "category",
    //   label: "tcp",
    //   items: [
    //     "tcp/nagle-algorithm",
    //     "tcp/tcp-finite-state-machine"
    //   ],
    // },
    {
      type: "category",
      label: "data-formats",
      items: [
        // "data-formats/rss",
        "data-formats/geojson",
      ],
    },
    {
      type: "category",
      label: "protocols",
      items: [
        "protocols/mqtt",
        "protocols/ftp",
        "protocols/smtp",
        "protocols/rfb",
        // "protocols/rdp",
        // "protocols/imap",
        // "protocols/sip",
        // "protocols/pop"
        // "protocols/websocket"
      ],
    },
  ],
};

export default sidebars;

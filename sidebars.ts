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
        "http/content-and-accept-encoding",
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
        "http/http-request-methods",
        // "http/http-content-negotiation", // 必讀
        // "http/http-authentication", // 必讀
        // "http/beyond-cors", // 必讀
        // "http/http-message-integrity", // 必讀
        // "http/cross-origin-resource-sharing", // 必讀
        // "http/http-caching-1", // 必讀，想放後面
        // "http/http-caching-2", // 必讀，想放後面
        // "http/content-security-policy-1", // 必讀，想放後面
        // "http/content-security-policy-2", // 必讀，想放後面
        // "http/http-response-status-codes", // 感覺可拆
        // "http/link", // 概念不難，但又可以順便把 <link> 精熟
        // "http/clear-site-data", // 感覺可以水一篇
        // "http/http-2", // 必讀，想放後面
        // "http/http-version-negotiation", // 不一定要納入30篇，這個偏難
        // "http/http-3", // 不一定要納入30篇，這個偏難
        // "http/integrity-policy", // 不一定要納入30篇，很新的技術
        // "http/end",
      ],
    },
    {
      type: "category",
      label: "web-security",
      items: [
        "web-security/nmap-basic",
        // "web-security/dot-git",
        // "web-security/nmap-mysql-scripts",
        // "web-security/CVE-2024-4577",
      ],
    },
    {
      type: "category",
      label: "web-tech",
      items: [
        // "web-tech/web-rtc",
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
        // "protocols/ftp",
        // "protocols/smtp"
      ],
    },
  ],
};

export default sidebars;

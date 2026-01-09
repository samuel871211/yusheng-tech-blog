---
title: Message Queuing Telemetry Transport (MQTT)
description: Message Queuing Telemetry Transport (MQTT)
last_update:
  date: "2025-04-20T08:00:00+08:00"
---

## MQTT 是什麼？

MQTT 是一個通訊協定，跟 HTTP 一樣，它定義的就是資料傳輸的格式。

這是一個 HTTP Request 傳輸的文本

```
POST /users HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 50

name=FirstName%20LastName&email=bsmth%40example.com
```

這是一個 MQTT 傳輸的文本

```
PUBLISH
Topic: sensors/temperature
PacketId: 1234
QoS: 1
Retain: false
DUP: false
Payload: {"location":"living_room","value":23.5,"unit":"celsius"}
```

MQTT 的應用場景通常是在 IoT 設備，在頻寬/資源有限的情況下，需要將訊息以最精簡的方式傳送出去，並且確保傳輸的穩定性

## Publish / Subscribe 模式

Publisher（發佈者） 會將 Topic（主題）傳給 Broker (中間人)，Broker 再將消息傳遞給各個 Subscriber (訂閱者)。這種概念讓我想到 Redis 的 PubSub，同時這種概念我覺得在很多領域也都有類似的應用場景。

## Quality Of Service

MQTT 的資料傳輸穩定性，可以用 QoS 這個指標

### QoS 0: 最多一次傳遞（At most once）

- 這是最基本的級別，也稱為「發送後遺忘」模式
- 發布者只發送一次訊息，不需要接收者確認收到
- 接收者可能收到訊息，也可能沒收到，發布者不會重試
- 優點：速度最快，網絡流量最小
- 缺點：不保證訊息傳遞成功
- 適用場景：可接受偶爾丟失訊息的應用，如傳感器定期上報不重要的數據

### QoS 1: 至少一次傳遞（At least once）

- 發布者發送訊息後，會等待接收者的確認回應（PUBACK）
- 如果發布者沒收到確認，會重複發送訊息，直到收到確認
- 由於重複發送機制，接收者可能收到同一訊息多次
- 優點：保證訊息至少被傳遞一次
- 缺點：可能導致訊息重複接收
- 適用場景：需要確保訊息不丟失，且能夠處理重複訊息的應用

### QoS 2: 剛好一次傳遞（Exactly once）

- 這是最高級別的服務質量，使用四步握手機制確保訊息只被接收一次
- 流程：發布者發送訊息 → 接收者回應PUBREC → 發布者回應PUBREL → 接收者回應PUBCOMP
- 這個完整的確認過程保證了訊息既不會丟失也不會重複
- 優點：最高的訊息可靠性，保證每條訊息只被處理一次
- 缺點：需要更多的通信往來，延遲最高，效率最低
- 適用場景：對訊息可靠性要求極高的應用，如金融交易、關鍵命令控制等

<!-- ## 使用 MQTT.js 實作 -->

### 參考資料

- https://www.npmjs.com/package/mqtt
- https://ithelp.ithome.com.tw/articles/10224407
- https://aws.amazon.com/tw/what-is/mqtt/
- https://resource.webduino.io/blog/mqtt-guide
- https://github.com/mqttjs/MQTT.js

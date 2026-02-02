markdown

# use-realtime 🚀

[![npm version](https://img.shields.io/npm/v/use-realtime.svg)](https://www.npmjs.com/package/use-realtime)
[![npm downloads](https://img.shields.io/npm/dm/use-realtime.svg)](https://www.npmjs.com/package/use-realtime)
[![license](https://img.shields.io/npm/l/use-realtime.svg)](https://github.com/yaredabebe/use-realtime/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**Stop rewriting WebSocket boilerplate in every React project.** A production-ready React hook for building real-time features with auto-reconnect, message queuing, and event subscriptions.

---

  

## ✨ Features

  

-  **🔌 Auto-reconnect** - Automatically reconnects with configurable retry limits

-  **📦 Message queue** - Never lose messages when offline (queues messages automatically)

-  **📡 Event-based API** - Simple subscribe/unsubscribe pattern for events

-  **💓 Heartbeat support** - Optional ping-pong to keep connections alive

-  **🧹 Automatic cleanup** - Proper cleanup on component unmount

-  **🧠 TypeScript first** - Full type safety and IntelliSense support

-  **⚡ Zero dependencies** - Lightweight and tree-shakable

  

---

  

## 📦 Installation

  ### npm
```bash
npm  install  use-realtime
```
### yarn
  ```bash
yarn  add  use-realtime
```
  ### pnpm 
```bash
pnpm  add  use-realtime
```
  

## 🚀  Quick  Start

```jsx
import  React,  {  useEffect  }  from  'react';

import  {  useRealtime  }  from  'use-realtime';

  

function  ChatComponent() {

const  {  emit,  subscribe,  isConnected  }  =  useRealtime({

url:  'wss://your-server.com/ws',

autoReconnect:  true,

});

  

useEffect(() => {

const  unsubscribe  =  subscribe('message', (data) => {

console.log('New message:',  data);

});

return  unsubscribe; //  Cleanup  on  unmount

}, [subscribe]);

  

const  sendMessage  = () => {

emit('chat',  {  text:  'Hello World!',  user:  'You'  });

};

  

return (

<div>

<p>Status:  {isConnected  ?  '✅ Connected'  :  '❌ Disconnected'}</p>

<button  onClick={sendMessage}  disabled={!isConnected}>

Send  Message

</button>

</div>

);

}

  ```

## 📖  Documentation

### Configuration  Options

typescript

  ```jsx

interface  RealtimeOptions  {

//  Required

url:  string;

//  Optional (with defaults)

autoConnect?:  boolean; //  Default:  true

autoReconnect?:  boolean; //  Default:  true

reconnectAttempts?:  number; //  Default:  10

reconnectInterval?:  number; //  Default:  3000 (ms)

//  Heartbeat  configuration

heartbeat?:  {

enabled?:  boolean; //  Default:  false

interval?:  number; //  Default:  30000 (ms)

message?:  any; //  Default:  'ping'

};

//  Message  queue  for  offline  mode

messageQueue?:  {

enabled?:  boolean; //  Default:  true

maxSize?:  number; //  Default:  100

};

debug?:  boolean; //  Default:  false

}

  ```

### Hook  Return  Values

### Method  Description

subscribe(event,  callback) Subscribe to events, returns unsubscribe function

unsubscribe(event,  callback) Unsubscribe from specific event

emit(event,  data) Send event with data

send(data) Send raw data (auto-wrapped  as  'message'  event)

connect() Manually connect

disconnect() Manually disconnect

reconnect() Force reconnection

getQueueSize() Get number of queued messages

flushQueue() Clear all queued messages

clearSubscriptions() Remove all event listeners

State  Property  Type  Description

isConnected  boolean  Connection  is  active

isConnecting  boolean  Connection  in  progress

isReconnecting  boolean  Reconnection  in  progress

connection  ConnectionState  Full  connection  details

### Connection  State  Object

typescript

  ```jsx

interface  ConnectionState  {

connected:  boolean;

connecting:  boolean;

reconnecting:  boolean;

error:  Error | null;

lastMessageAt:  Date | null;

connectionId:  string | null;

}

  ```

## 💡  Real-World  Examples

### 1.  Live  Chat  Application

```jsx

function  ChatRoom() {

const [messages, setMessages]  =  useState([]);

const  {  subscribe,  emit,  isConnected  }  =  useRealtime({

url:  'wss://chat-server.com/ws',

autoReconnect:  true,

reconnectAttempts:  5,

});

  

useEffect(() => {

const  unsubscribe  =  subscribe('chat-message', (msg) => {

setMessages(prev => [...prev, msg]);

});

return  unsubscribe;

}, [subscribe]);

  

const  sendMessage  = (text) => {

emit('chat-message',  {  text,  timestamp:  Date.now() });

};

  

//  ...  render  messages  and  input

}

  ```

### 2.  Live  Dashboard

jsx
```jsx
  

function  LiveDashboard() {

const [stats, setStats]  =  useState({});

const  {  subscribe  }  =  useRealtime({

url:  'wss://api.example.com/live',

heartbeat:  {  enabled:  true,  interval:  15000  },

});

  

useEffect(() => {

const  unsubscribe  =  subscribe('stats-update', (data) => {

setStats(data);

});

return  unsubscribe;

}, [subscribe]);

  

//  ...  render  dashboard  with  stats

}

 ``` 

### 🔧  Advanced  Usage

### Manual  Connection  Control

``` jsx
const  {  connect,  disconnect,  reconnect,  isConnected  }  =  useRealtime({

url:  'wss://example.com',

autoConnect:  false,  //  Disable  auto-connect

});

  

//  Connect  manually

useEffect(() => {

connect();

}, [connect]);

  

//  Disconnect  after  30  seconds

useEffect(() => {

const  timer  =  setTimeout(() => {

if (isConnected) disconnect();

},  30000);

return () => clearTimeout(timer);

}, [disconnect, isConnected]);

  ```

### Message  Queue (Offline Mode)

```jsx

  

const  {  emit,  getQueueSize,  flushQueue  }  =  useRealtime({

url:  'wss://example.com',

messageQueue:  {

enabled:  true,

maxSize:  50,  //  Queue  up  to  50  messages

},

});

  

//  Messages  are  automatically  queued  when  offline

//  and  sent  when  connection  is  restored

emit('important-event',  {  data:  'will not be lost'  });

  

//  Check  queue  size

console.log('Queued messages:',  getQueueSize());

  

//  Clear  queue  if  needed

flushQueue();
```
  

### 🐛  Troubleshooting

Common  Issues

  

CORS Errors with Local Development

javascript
```jsx 

//  Ensure  your  WebSocket  server  allows  connections  from  your  origin

//  For  testing,  use  a  public  echo  server:

url:  'wss://echo.websocket.org'

  

Connection  Drops  Frequently

javascript

  

//  Enable  heartbeat  to  keep  connection  alive

heartbeat:  {

enabled:  true,

interval: 15000, // Send ping every 15 seconds

}
```
  

### Too  Many  Reconnect  Attempts

javascript
```jsx 
//  Limit  reconnect  attempts

reconnectAttempts:  5,

reconnectInterval:  5000,  //  Wait  5  seconds  between  attempts
```
  


  



FrameSocket
===========

message bus library for between (cross origin) iframes.

### example

Show "example" directory.

at top window
```javascript
var socket = new FrameSocket(window);
socket.onconnection = function (connection) {
  console.log("connected");
  connection.ondata = function (data) {
    console.log("data comming.", data);
  }
}
```

at cross origin child iframe
```javascript
var socket = new FrameSocket(window);
socket.onconnection = function (connection) {
  console.log("connected 2");
  connection.send("this message from iframe: " + Date.now());
}
socket.connect(window.top);
```

const express = require("express");
const serverExpress = express();
const serverHTTP = require("http").Server(serverExpress);
const serverSocketIO = require("socket.io")(serverHTTP);

serverExpress.use(express.static("./www"));
serverExpress.use(express.urlencoded({extent:false}));
serverExpress.use(express.json());

serverHTTP.listen(8080);
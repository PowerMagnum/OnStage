const fs = require('fs');
const express = require("express");
const serverExpress = express();
const serverHTTP = require("http").Server(serverExpress);
const serverSocketIO = require("socket.io")(serverHTTP);
const multer = require('multer');
const path = require('path');

serverExpress.use(express.static("./www"));
serverExpress.use(express.urlencoded({extent:false}));
serverExpress.use(express.json());

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
});
  
const upload = multer({ storage: storage });
  
serverExpress.post('/upload', upload.single('file'), (req, res) => {
    try {
        res.send('File caricato con successo!');
    } catch (err) {
        res.status(400).send('Errore durante il caricamento del file.');
    }
});

serverExpress.post('/screen', upload.single('file'), (req, res) => {
  
});

serverHTTP.listen(8080);

// TODO: protocollo gestione notifica di aggiornamento
/* Creare dei file json in cui ci sono informazioni sulle slide.
Quindi con una richiesta devo comunicare:

a quale schermo mi riferisco (ogni schermo ha un suo file)
a quale slide dello schermo mi riferisco
l'operazione che devo fare (cambia sfondo, carica media, rimuovi media, riposiziona media)
*/
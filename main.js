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

const screensDir = 'screens/';
if (!fs.existsSync(screensDir)){
  fs.mkdirSync(screensDir);
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

let codes = ['00000000'];
let tokens = [];
serverExpress.post('/login', (req, res) => {
    let token;
    //console.log(req.body);
    if(codes.includes(req.body.code)){
        token = createToken(20);
        tokens.push(token);
        res.send(token);
    }else{
        res.send("NULL");
    }
});

serverExpress.get('/screens', (req, res) => {
    let screens = fs.readdirSync(screensDir);
    screens.sort((a, b) => {
        const numA = parseInt(a.replace('Schermo', ''));
        const numB = parseInt(b.replace('Schermo', ''));
        return numA - numB;
    });
    res.send(screens.toString());
});


function createToken(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_!?@$-";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}  

/******************************
***** Protocollo SCREEN *******
*******************************/
serverSocketIO.on('connection', (ws) => {
  ws.on('authentication', (token) => {
    if (!(tokens.includes(token))){
        ws.emit("error", "Autenticazione fallita");
        ws.emit("authACK", false);
        console.log(token + " fallito");
        return;
    }
    console.log(token + " autenticato");
    ws.emit("authACK", true);
    let data;
    ws.on('message', (auth_code, action, data_recv) => {
        try{
            console.log(action, data_recv);
            data = JSON.parse(data_recv);
            if (!(tokens.includes(auth_code))){
                ws.emit("error", "Autenticazione non valida");
                return;
            }

            switch (action) {

                //socket.emit("message", "createScreen", "{}")
                case 'createScreen':
                    let screensCount = fs.readdirSync(screensDir).length
                    while(fs.existsSync(screensDir + 'Schermo' + (screensCount+1))){
                        screensCount += 1;
                    }
                    console.log(screensCount);
                    fs.writeFileSync(screensDir + 'Schermo' + (screensCount+1), JSON.stringify({ slides: [] }, null, 2));
                    ws.emit("message", "Schermo creato");
                    serverSocketIO.sockets.emit("updateScreens", "{}");
                    break;
                
                //socket.emit("message", "deleteScreen", JSON.stringify({screenName:'Schermo4'}))
                case 'deleteScreen':
                    //console.log(screensDir + data['screenName']);
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    fs.unlinkSync(screensDir + data['screenName']);
                    ws.emit("message", "Schermo eliminato");
                    serverSocketIO.sockets.emit("updateScreens", "{}");
                    break;
                
                //socket.emit("message", "addSlide", JSON.stringify({screenName:'Schermo4'}))
                case 'addSlide':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    var newSlide = {
                        id: screenData.slides.length + 1,
                        duration: 0,
                        background: {
                            path: "",
                            type: "image"
                        },
                        multimedia: []
                    };
                    screenData.slides.push(newSlide);
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Slide aggiunta");
                    break;

                //socket.emit("message", "removeSlide", JSON.stringify({screenName:'Schermo4', slideIdToRemove:2}))
                case 'removeSlide':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    screenData.slides = screenData.slides.filter(slide => slide.id !== data['slideIdToRemove']);
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Slide rimossa");
                    break;
                
                /*
                case 'updateSlide':
                    if (!fs.existsSync(screenPath)) {
                        sendMessage(ws, 'error', 'Screen not found');
                    } else {
                        const screenData = JSON.parse(fs.readFileSync(screenPath));
                        const slideIndex = screenData.slides.findIndex(s => s.id === slideId);
                        if (slideIndex === -1) {
                            sendMessage(ws, 'error', 'Slide not found');
                        } else {
                            screenData.slides[slideIndex] = { ...screenData.slides[slideIndex], ...updatedSlide };
                            fs.writeFileSync(screenPath, JSON.stringify(screenData, null, 2));
                            sendMessage(ws, 'slideUpdated', { slide: screenData.slides[slideIndex] });
                        }
                    }
                    break;
                */
                default:
                    sendMessage(ws, 'error', 'Unknown action');
            }
        }catch{
            console.log("Errore gestione messaggio in entrata");
        }
    });
    ws.on('logoff', (code) => {
        console.log(code + " deautenticato");
        tokens = tokens.filter(item => item !== code);
        ws.emit("message", "Utente deautenticato");
    });
  });
  ws.on('close', () => {
      console.log('Client disconnected');
  });
});



serverHTTP.listen(8080);

// TODO: protocollo gestione notifica di aggiornamento
/* Creare dei file json in cui ci sono informazioni sulle slide.
Quindi con una richiesta devo comunicare:

a quale schermo mi riferisco (ogni schermo ha un suo file)
a quale slide dello schermo mi riferisco
l'operazione che devo fare (cambia sfondo, carica media, rimuovi media, riposiziona media)
*/
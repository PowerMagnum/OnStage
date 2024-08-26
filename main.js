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

const uploadDir = 'www/uploads/';
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
        res.send(req.file.path.replace(/^www\\/, ''));
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

serverExpress.get('/screens/:screenName', (req, res) => {
    const screenName = req.params.screenName;
    const filePath = screensDir + screenName;

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.send(fileContent);
    } else {
        res.status(404).send('Screen not found');
    }
});

function createToken(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_!?@$-";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
} 

function removeFile(path){
    try{
        if (! path.includes('assets')){
            fs.unlinkSync(path);
        }
    }catch(err){
        console.log("Eliminazione file fallita: '"+err+"'");
    }
}

const { screenDefaultData, slideDefaultData, mediaDefaultData } = require('./defaultDataTemplate.js');
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
                    fs.writeFileSync(screensDir + 'Schermo' + (screensCount+1), JSON.stringify(screenDefaultData, null, 2));
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
                    const screenDataToDelete = JSON.parse(fs.readFileSync(screensDir + data['screenName'], 'utf-8'));
                    screenDataToDelete.slides.forEach(slide => {
                        removeFile('./www/' + slide.background.path);
                    });
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
                    var newSlide = slideDefaultData;
                    if (screenData.slides.length <= 0){
                        newSlide['id'] = 0;
                    }else{
                        newSlide['id'] = screenData.slides.slice(-1).pop().id + 1;
                    }
                    screenData.slides.push(newSlide);
                    if (screenData.currentSlide == null){
                        screenData.currentSlide = 0;
                    }
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Slide aggiunta");
                    serverSocketIO.sockets.emit("updateSlides", JSON.stringify({screenName: data['screenName'], info: {type: 'addedSlide', params: {slideId: newSlide.id}}}));
                    break;

                //socket.emit("message", "removeSlide", JSON.stringify({screenName:'Schermo4', slideIdToRemove:2}))
                case 'removeSlide':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    const slideIndexToRemove = screenData.slides.findIndex(slide => slide.id == data['slideIdToRemove']);
                    if (slideIndexToRemove < screenData.currentSlide){
                        screenData.currentSlide -= 1;
                    }
                    //screenData.slides = screenData.slides.filter(slide => slide.id !== data['slideIdToRemove']);
                    removeFile('./www/'+screenData.slides[slideIndexToRemove].background.path);
                    screenData.slides.splice(slideIndexToRemove, 1);
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Slide rimossa");
                    serverSocketIO.sockets.emit("updateSlides", JSON.stringify({screenName: data['screenName']}));
                    break;
                
                //socket.emit("message", getCookie("code"), "updateSlideBackground", JSON.stringify({screenName:'Schermo' + thisScreen, slideId: selectedSlide, path: path}));
                case 'updateSlideBackground':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    const slideToUpdate = screenData.slides.find(slide => slide.id === data['slideId']);
                    removeFile('./www/'+slideToUpdate.background.path);
                    slideToUpdate.background.path = data['path'];
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Background aggiornato");
                    serverSocketIO.sockets.emit("updateSlides", JSON.stringify({screenName: data['screenName']}));
                    break;
                
                
                case 'updateScreenRatio':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    screenData.screenRatio = data['newRatio'];
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    screenData.slides = [];
                    ws.emit("message", "Aspect ratio aggiornato");
                    ws.broadcast.emit("updateScreenSetting", JSON.stringify({screenName: data['screenName'], screenData: screenData}));
                    break;

                case 'updateScreenOB':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    screenData.overflowBVR = data['mode'];
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    screenData.slides = [];
                    ws.emit("message", "Overflow behaviour aggiornato");
                    ws.broadcast.emit("updateScreenSetting", JSON.stringify({screenName: data['screenName'], mode: data['mode']}));
                    break;

                case 'updateLoopState':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    screenData.slideLoop = data['value'];
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    screenData.slides = [];
                    ws.emit("message", "Slide Loop aggiornato");
                    ws.broadcast.emit("updateScreenSetting", JSON.stringify({screenName: data['screenName'], screenData: screenData}));
                    break;

                case 'updateCurrentSlide':
                    if (!fs.existsSync(screensDir + data['screenName'])) {
                        ws.emit("error", "Schermo inesistente");
                        break;
                    }
                    var screenData = JSON.parse(fs.readFileSync(screensDir + data['screenName']));
                    let newCurrSlide;
                    switch (data['command']){
                        case 'foward':
                            newCurrSlide = screenData.currentSlide + 1;
                            if (newCurrSlide >= screenData.slides.length){
                                if (screenData.slideLoop){
                                    newCurrSlide = 0;
                                }else{
                                    newCurrSlide -= 1;
                                }
                            } 
                            break;
                        case 'backward':
                            newCurrSlide = screenData.currentSlide - 1;
                            if (newCurrSlide < 0){
                                if (screenData.slideLoop){
                                    newCurrSlide = screenData.slides.length - 1;
                                }else{
                                    newCurrSlide += 1;
                                }
                            } 
                            break;
                        case 'definite':
                            const definiteRefer = screenData.slides.findIndex(slide => slide.id == data['slideId']);
                            newCurrSlide = (definiteRefer >= 0)? definiteRefer : 0;
                            break;
                        default:
                            newCurrSlide = 0;
                            break;
                    }
                    screenData.currentSlide = newCurrSlide;
                    fs.writeFileSync(screensDir + data['screenName'], JSON.stringify(screenData, null, 2));
                    ws.emit("message", "Scorrimento slide " + data['screenName']);
                    serverSocketIO.sockets.emit("updateCurrentSlide", JSON.stringify({screenName: data['screenName'], slide: newCurrSlide}));
                    break;
                
                default:
                    sendMessage(ws, 'error', 'Unknown action');
            }
        }catch(err){
            console.log("Errore gestione messaggio in entrata: '"+err+"'");
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

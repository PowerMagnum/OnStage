let authFail = false;
function localHandler(action, data=null){
    switch (action) {
        case "initPage":
            getScreenData();
            break;
        case "authFail":
            if((!authFail) && confirm("La tua autenticazione non è più valida.\nPer continuare devi rifare il login, vuoi tornare alla pagina iniziale?")){
                window.location = '/';
                authFail = true;
            }
            break;
        case "updateSlides":
            data = JSON.parse(data);
            if(data['screenName'].replace("Schermo","") == thisScreen){
                getScreenData();
                console.log("Il server ha richiesto l'aggiornamento delle slide");
            }
            break;
        case "updateScreenSetting":
            data = JSON.parse(data);
            if(data['screenName'].replace("Schermo","") == thisScreen){
                for (let key in data['screenData']) {
                    if (key != 'slides') {
                        screenData[key] = data['screenData'][key];
                    }
                }
                loadSettings();
                console.log("Il server ha richiesto l'aggiornamento delle impostazioni schermo");
            }
            break;
        case "updateCurrentSlide":
            data = JSON.parse(data);
            if(data['screenName'].replace("Schermo","") == thisScreen){
                currentSlide = data['slide'];
                loadSlides();
                console.log("Scorrimento slide");
            }
            break;

        default:
            console.log("Ricevuta operazione non gestita localmente: " + action);
            break;
    }
}

const thisScreen = new URLSearchParams(window.location.search).get('s');
let screenData;
let currentSlide = null;
let selectedSlide = null;

function getScreenData(){
    fetch('/screens/Schermo'+thisScreen)
    .then(response=>response.json())
    .then(data=>{
        screenData = data;
        //console.log(screenData);
        currentSlide = screenData['currentSlide'];
        loadSettings();
        loadSlides()
    });
}

function loadSettings(){
    console.log(screenData);
    const slideLoopSelector = document.getElementById("slideLoop");
    slideLoopSelector.checked = screenData['slideLoop'];
    changeAspectRatio(screenData['screenRatio']);
}

function loadSlides(){
    const carousel = document.getElementById('slideCarousel');
    carousel.innerHTML = '';
    const addSlideDiv = document.createElement('div');
    addSlideDiv.className = 'carouselSlide'
    addSlideDiv.id = 'addSlide';
    addSlideDiv.onclick = createSlide;
    carousel.appendChild(addSlideDiv);
    screenData.slides.forEach((slide, index) => {
        //console.log(slide);
        const slideDiv = document.createElement('div');
        slideDiv.className = 'carouselSlide';
        slideDiv.style.backgroundImage = "url(" + slide.background.path + ")";
        slideDiv.onclick = () => {selectSlide(slide.id, slideDiv)};
        slideDiv.ondblclick = () => {slideSet(slide.id)};
        carousel.appendChild(slideDiv);
        if ((selectedSlide === null && index === 0) || selectedSlide == slide.id) {
            selectedSlide = slide.id;
            slideDiv.classList.add('selected');
            selectSlide(slide.id, slideDiv);
        }
        if (index == currentSlide){
            slideDiv.classList.add('active');
        }
    });
}

function selectSlide(slideId, self){
    const slideEditor = document.getElementById('slideEditor');
    const sSlide = screenData.slides.find(slide => slide.id === slideId);
    selectedSlide = slideId;
    document.getElementsByClassName('selected')[0].classList.remove('selected');
    self.classList.add('selected');
    slideEditor.style.background = "url(" + sSlide.background.path + ")"; 
}

function createSlide(){
    socket.emit("message", getCookie("code"), "addSlide", JSON.stringify({screenName:'Schermo' + thisScreen}));
    console.log("Invio richiesta creazione slide");
}

function slideFoward(){
    socket.emit("message", getCookie("code"), "updateCurrentSlide", JSON.stringify({screenName:'Schermo' + thisScreen, command: 'foward'}));
}

function slideBackward(){
    socket.emit("message", getCookie("code"), "updateCurrentSlide", JSON.stringify({screenName:'Schermo' + thisScreen, command: 'backward'}));
}

function slideSet(slide){
    socket.emit("message", getCookie("code"), "updateCurrentSlide", JSON.stringify({screenName:'Schermo' + thisScreen, command: 'definite', slideId: slide}));
}

document.getElementById('fowardControl').onclick = slideFoward;
document.getElementById('backwardControl').onclick = slideBackward;
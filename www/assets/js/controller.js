let authFail = false;
function localHandler(action, data=null){
    switch (action) {
        case "initPage":
            getScreenData();
            break;
        case "authFail":
            if((!authFail) && confirm("La tua autenticazione non è più valida.\nPer continuare devi rifare il login, vuoi tornare alla pagina iniziale?")){
                window.location = '/';
            }
            authFail = true;
            break;
        case "updateSlides":
            data = JSON.parse(data);
            if(data['screenName'].replace("Schermo","") == thisScreen){
                getScreenData(data['info']);
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
                currentSlideId = screenData.slides[currentSlide].id;
                loadSlides();
                console.log("Scorrimento slide");
            }
            break;

        case "setTimerState":
            data = JSON.parse(data);
            console.log(data);
            if(data['screenName'].replace("Schermo","") == thisScreen){
                toggleTime(data['value']);
                console.log("Impostazione stato timer");
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
let currentSlideId = null;
let selectedSlide = null;
let OldSelectedSlide = null;

document.querySelector("#content>#header>h4").innerHTML = 'Schermo: ' + thisScreen;

function getScreenData(info = null){
    if (info && info.type == 'changeSlideTime'){
        screenData.slides[info.params.slide].duration = info.params.duration;
        setTimeInput(info.params.duration, info.params.slideId);
        return;
    }
    fetch('/screens/Schermo'+thisScreen)
    .then(response=>response.json())
    .then(data=>{
        screenData = data;
        //console.log(screenData);
        currentSlide = screenData['currentSlide'];
        if(currentSlide != null){
            currentSlideId = screenData.slides[currentSlide].id;
        }
        loadSettings();
        if (info && info.type == 'addedSlide'){
            selectedSlide = info.params.slideId;
        } 
        loadSlides();
    });
}

function loadSettings(){
    console.log(screenData);
    const slideLoopSelector = document.getElementById("slideLoop");
    slideLoopSelector.checked = screenData['slideLoop'];
    changeAspectRatio(screenData['screenRatio']);
    changeOverflowBehaviour(screenData['overflowBVR']);
    setTimeInput(screenData['duration']);
    getTimerState();
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
        slideDiv.id = 'slide_' + slide.id;
        slideDiv.onclick = () => {selectSlide(slide.id)};
        slideDiv.ondblclick = () => {slideSet(slide.id)};
        carousel.appendChild(slideDiv);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'deleteButton';
        deleteButton.onclick = (event) => {removeSlide(event, slide.id)};
        slideDiv.appendChild(deleteButton);

        if ((selectedSlide === null && index === 0) || selectedSlide == slide.id){
            selectedSlide = slide.id;
            slideDiv.classList.add('selected');
            selectSlide(slide.id, slideDiv);
        }
        if (slide.id == currentSlideId){
            slideDiv.classList.add('active');
        }
    });
}

function selectSlide(slideId){
    const slideEditor = document.getElementById('slideEditor');
    const sSlide = screenData.slides.find(slide => slide.id === slideId);
    const phisSlide = document.getElementById('slide_'+slideId);
    selectedSlide = slideId;
    const oldSelected = document.getElementsByClassName('selected')[0];
    if(!!oldSelected){
        oldSelected.classList.remove('selected')
    }
    phisSlide.classList.add('selected');
    slideEditor.style.backgroundImage = "url(" + sSlide.background.path + ")"; 
    console.log("Selezionata slide: " + slideId);
}

function createSlide(){
    socket.emit("message", getCookie("code"), "addSlide", JSON.stringify({screenName:'Schermo' + thisScreen}));
    console.log("Invio richiesta creazione slide");
}

function removeSlide(event, slideId){
    event.stopPropagation();
    if(currentSlideId == slideId){
        alert("Non è possibile eliminare la slide attiva\nPassa ad un'altra slide e riprova");
        return;
    }
    const targetIndex = screenData.slides.findIndex(slide => slide.id == slideId);
    console.log(slideId);
    console.log(targetIndex);
    if(confirm("Sei sicuro di voler rimuovere la slide?\nQuesta azione sarà irreversibile")){
        let prevId;
        if(screenData.slides.length > 1){
            prevId = screenData.slides[(targetIndex - 1 < 0)? targetIndex + 1 : targetIndex - 1].id;
        }else{
            selectedSlide = null;
        }
        console.log(prevId);
        socket.emit("message", getCookie("code"), "removeSlide", JSON.stringify({screenName:'Schermo' + thisScreen, slideIdToRemove:slideId}));
        console.log("Invio richiesta creazione slide");
        if (selectedSlide == slideId){
            selectSlide(prevId);
        }
    }
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

document.getElementById('backwardControl').onclick = slideBackward;
document.getElementById('fowardControl').onclick = slideFoward;



let fetchingScreen = false;
function getScreens(){
    if (fetchingScreen) {
        return;
    }
    fetchingScreen = true;
    const content = document.getElementById('content');
    content.innerHTML = '';
    const addScreenDiv = document.createElement('div');
    addScreenDiv.id = 'addScreen';
    addScreenDiv.className = 'screen-icon loggedAction forceHidden';
    addScreenDiv.onclick = createScreen;
    content.appendChild(addScreenDiv);
    fetch('/screens')
    .then(response=>response.text())
    .then(data=>{
        if (data != ''){
            data = data.split(',');
            data.forEach(screenName => {
            const screenIcon = document.createElement('div');
            screenIcon.className = 'screen-icon';
            const screenCode = screenName.replace("Schermo","");
            screenIcon.id = 'scr_' + screenCode;
            const pElement = document.createElement('p');
            pElement.textContent = screenCode;
    
            const editButton = document.createElement('button');
            editButton.className = 'editButton loggedAction forceHidden';
            editButton.onclick = (event) => {
                event.stopPropagation();
                window.location="/editor.html?s=" + screenCode};
            screenIcon.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'deleteButton loggedAction forceHidden';
            deleteButton.onclick = (event) => {
                event.stopPropagation();
                deleteScreen(screenCode)};
            screenIcon.appendChild(deleteButton);
            
            screenIcon.onclick = () => {showViewer(screenName)}
            screenIcon.appendChild(pElement);
            content.appendChild(screenIcon);
            });
        }      
        setLoggedView(isUserLogged);
        fetchingScreen = false;
    });
}


const loginButton = document.getElementById('loginButton');
const logoffButton = document.getElementById('logoffButton');
const loginBackground = document.querySelector('.loginBackground');
const loginContainer = document.querySelector('.loginFormContainer');
const loginCodeInput = document.querySelector('.loginFormContainer input');
const loginCodeSubmit = document.querySelector('.loginFormContainer button');
const body = document.querySelector('body');
let isUserLogged = false;

loginButton.onclick = () => {
    loginBackground.style.display = 'flex';
    loginContainer.style.display = 'flex';
    body.style.overflow = 'hidden';
    loginCodeInput.focus();
};
loginBackground.onclick = () => {
    loginBackground.style.display = 'none';
    loginContainer.style.display = 'none';
    body.style.overflow = 'auto';
    loginCodeInput.value = '';
};
loginCodeSubmit.onclick = () => {
    if (loginCodeInput.value == ''){
        return;
    }
    fetch('/login', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ code: loginCodeInput.value }),
    })
    .then(response=>response.text())
    .then(data=>{
        if(data != 'NULL'){
            setCookie("code", data);
            console.log(data);
            loginBackground.click();
            socket.emit("authentication", getCookie("code"));
            isUserLogged = true;
        }else{
            isUserLogged = false;
            alert("Codice errato");
        }
        setLoggedView(isUserLogged);
        loginCodeInput.value = '';
    });
};
loginCodeInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      loginCodeSubmit.click();
    }
  });

logoffButton.onclick = () => {
    if(confirm("Sei sicuro di volerti disconnettere?")){
        socket.emit("logoff", getCookie("code"));
        setCookie("code", null);
        isUserLogged = false;
        getScreens();
    }
};

function setLoggedView(state){
    const elements = Array.prototype.slice.call(document.getElementsByClassName('loggedAction'));
    //console.log(elements);
    elements.forEach(element => {
        if(state){
            element.classList.remove("forceHidden");
            loginButton.style.display = 'none';
            logoffButton.style.display = 'block';
        }else{
            element.classList.add("forceHidden");
            loginButton.style.display = 'block';
            logoffButton.style.display = 'none';
        }
    });
};

function createScreen(){
    socket.emit("message", getCookie("code"), "createScreen", "{}");
    console.log("Invio richiesta creazione schermo");
};
function deleteScreen(screen){
    if (confirm("Vuoi eliminare lo schermo " + screen + "?\nQuesta azione è irreversibile!")){
        socket.emit("message", getCookie("code"), "deleteScreen", JSON.stringify({screenName: "Schermo" + screen}));
        console.log("Invio richiesta eliminazione schermo " + screen);
    }
};

if (getCookie("code") == null){
    localHandler("initPage");
}

function localHandler(action, data=null){
    switch (action) {
        case "initPage":
            getScreens();
            break;
        case "updateScreens":
            getScreens();
            break;
        case "updateSlides":
            data = JSON.parse(data);
            if(data['screenName'] == thisScreen){
                getScreenData();
                console.log("Il server ha richiesto l'aggiornamento delle slide");
            }
            break;
        case "updateScreenSetting":
            data = JSON.parse(data);
            if(data['screenName'] == thisScreen){
                changeOverflowBehaviour(data['mode']);
                console.log("Il server ha richiesto l'aggiornamento delle impostazioni schermo");
            }
            break;
        case "updateCurrentSlide":
            data = JSON.parse(data);
            if(data['screenName'] == thisScreen){
                currentSlide = data['slide'];
                setViewingSlide(currentSlide);
                console.log("Scorrimento slide");
            }
            break;
        default:
            console.log("Ricevuta operazione non gestita localmente: " + action);
            break;
    }
}
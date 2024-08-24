function resizeEditor() {
    const style = getComputedStyle(document.body);

    const slideEditorArea = document.getElementById('slideEditorArea');
    const slideEditor = document.getElementById('slideEditor');
    
    let width = style.getPropertyValue('--AR_width');
    let height = style.getPropertyValue('--AR_height');

    const areaWidth = slideEditorArea.offsetWidth;
    const areaHeight = slideEditorArea.offsetHeight;

    
    if((areaWidth * height / width) > areaHeight){  //Sforamento verticale
        slideEditor.style.height = areaHeight-10 + "px";
        slideEditor.style.width = "auto";
        slideEditor.style.margin = "0 auto";
    }else if((areaHeight * width / height) > areaWidth){ //Sforamento orizzontale
        slideEditor.style.width = areaWidth-10 + "px";
        slideEditor.style.height = "auto";
        slideEditor.style.margin = "auto 0";
    }
    //console.log("ok");
}

function changeAspectRatio(ratio = null){
    let value;
    if (ratio != null){
        aspectRatioChanger.value = ratio;
    }else{
        socket.emit("message", getCookie("code"), "updateScreenRatio", JSON.stringify({screenName:'Schermo' + thisScreen, newRatio: aspectRatioChanger.value}));
        console.log("Invio richiesta aggiornamento aspect ratio");
    }
    value = aspectRatioChanger.value.split("/");
    let v_width = value[0];
    let v_heigh = value[1];
    const root = document.querySelector(':root')
    root.style.setProperty('--AR_width', v_width);
    root.style.setProperty('--AR_height', v_heigh);
    resizeEditor();
    //console.log("suca");
}

function setLoopState(){
    socket.emit("message", getCookie("code"), "updateLoopState", JSON.stringify({screenName:'Schermo' + thisScreen, value: slideLoopSelector.checked}));
    console.log("Invio richiesta aggiornamento aspect ratio");
}

const aspectRatioChanger = document.getElementById('aspectRatioChanger');
const slideLoopSelector = document.getElementById('slideLoop');
window.addEventListener('load', resizeEditor);
window.addEventListener('resize', resizeEditor);
aspectRatioChanger.addEventListener('change', () => {changeAspectRatio()});
slideLoopSelector.addEventListener('change', setLoopState);
const returnButton = document.getElementById("returnButton");
returnButton.onclick = () => {window.location = "/"};
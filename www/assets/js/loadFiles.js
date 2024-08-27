const fileSelector = document.getElementById('fileSelector');
const fileSelectorButton = document.getElementById('fileSelectorButton');

fileSelectorButton.onclick = () => fileSelector.click();
fileSelector.onchange = () => {
    uploadFile('Scegli un file');
}

function uploadFile(callerButton) {
    if(selectedSlide == null){
        alert("Nessuna slide selezionata!");
        return;
    }
    if(fileSelector.files.length <= 0){
        callerButton.style.animation = 'blink 0.75s linear 2';
        setTimeout(() => callerButton.style.animation = '', 1500);
        return;
    }

    const file = fileSelector.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fileSelector.value = '';
    fileSelectorButton.innerText = "Scegli un file";

    const xhr = new XMLHttpRequest();
    const button = fileSelectorButton;

    function resetButton(){
        button.style.transition = 'background 0.5s linear';
        button.style.background = '';
        setTimeout(() => {
            button.style.transition = 'unset';
            button.innerText = callerButton.replace('_', ' ');
        }, 600);
        
    }
    
    xhr.open('POST', '/upload', true);

    xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            button.style.background = `linear-gradient(to right, var(--loadColor) ${percentComplete}%, var(--color6) ${percentComplete}%)`;
            button.innerText = Math.round(percentComplete) + '% caricato';
        }
    };   

    xhr.onload = function () {
        if (xhr.status === 200) {
            const fileName = xhr.responseText;
            //TODO caricamento miniatura
            renewBackground(fileName);
            button.innerText = 'Upload completato!';
            button.disabled = false;
            button.style.background = 'var(--loadColor)';
        } else {
            button.innerText = 'Errore durante il caricamento!';
        }
        setTimeout(resetButton, 1000);
    };

    xhr.onerror = function () {
        button.innerText = 'Errore di rete durante il caricamento!';
    };

    xhr.send(formData);
}

function renewBackground(path){
    path = path.replace(/\\/g, '/');
    socket.emit("message", getCookie("code"), "updateSlideBackground", JSON.stringify({screenName:'Schermo' + thisScreen, slideId: selectedSlide, path: path}));
    console.log("Invio richiesta rinnovo sfondo slide");
}
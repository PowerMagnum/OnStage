const fileSelector = document.getElementById('fileSelector');
const fileSelectorButton = document.getElementById('fileSelectorButton');

fileSelectorButton.onclick = () => fileSelector.click();
fileSelector.onchange = () => {
    let name;
    name = fileSelector.files[0].name;
    name = (name.length < 20)? name : (name.substring(0, 17) + '...');
    fileSelectorButton.innerText = '"' + name + '"';
}

function uploadFile(callerButton) {
    if(fileSelector.files.length <= 0){
        fileSelectorButton.style.animation = 'blink 0.75s linear 2';
        setTimeout(() => fileSelectorButton.style.animation = '', 1500);
        return;
    }

    const file = fileSelector.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fileSelector.value = '';
    fileSelectorButton.innerText = "Scegli un file";

    const xhr = new XMLHttpRequest();
    const button = document.getElementById(callerButton);

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

    button.disabled = true;
    xhr.send(formData);
}

function uploadAsBackground(){
    uploadFile('Carica_Sfondo');
}

function uploadAsMiniature(){
    uploadFile('Carica_Miniatura');
}

document.getElementById('Carica_Sfondo').onclick = uploadAsBackground;
document.getElementById('Carica_Miniatura').onclick = uploadAsMiniature;
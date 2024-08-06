function resizeEditor() {
    const slideEditorArea = document.getElementById('slideEditorArea');
    const slideEditor = document.getElementById('slideEditor');
    
    let width = 16;
    let height = 9

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

    console.log("test")
}

// Chiama la funzione per impostare i margini all'inizio e al ridimensionamento
window.addEventListener('load', resizeEditor);
window.addEventListener('resize', resizeEditor);
const viewerContainer = document.getElementById('viewerContainer');

function initViewer(){
    viewerContainer.addEventListener('fullscreenchange', () => {hideViewer()}, false);
    viewerContainer.addEventListener('mozfullscreenchange', () => {hideViewer()}, false);
    viewerContainer.addEventListener('MSFullscreenChange', () => {hideViewer()}, false);
    viewerContainer.addEventListener('webkitfullscreenchange', () => {hideViewer()}, false);
    viewerContainer.addEventListener('click', () => {hideViewer(true)});
}
initViewer()

let screenData = null;
let currentSlide = null;
let thisScreen = null;

function getScreenData(){
    fetch('/screens/'+thisScreen)
    .then(response=>response.json())
    .then(data=>{
        screenData = data;
        currentSlide = screenData['currentSlide'];
        changeOverflowBehaviour(screenData['overflowBVR']);
        if(screenData.slides.length > 0){
            setViewingSlide(currentSlide);
        }else{
            setViewingSlide(-1);
        }
        openFullscreen(viewerContainer);
        viewerContainer.classList.remove('forceHidden');
    });
}

function setViewingSlide(index){
    //console.log("#"+index);
    if (index >= 0){
        viewerContainer.style.backgroundImage = "url(" + screenData.slides[index].background.path + ")";
    }else{
        viewerContainer.style.backgroundImage = "url(/assets/img/default.jpg)";
    }
    
}

function changeOverflowBehaviour(value){
    console.log("# "+ value);
    switch (value){
        case 'ritaglia':
            root.style.setProperty('--overflowState', 'cover');
            break;
        case 'riduci':
            root.style.setProperty('--overflowState', 'contain');
            break;
        case 'adatta':
            root.style.setProperty('--overflowState', '100% 100%');
            break;
        default:
            break;
    }
}

function showViewer(screen){
    thisScreen = screen;
    getScreenData();
}
function hideViewer(force = false){
    if ((! isFullscreenEnabled()) || force){
        closeFullscreen();
        viewerContainer.classList.add('forceHidden');
    }
}

function isFullscreenEnabled(){
    return document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement;
}

function openFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
}
  
function closeFullscreen() {
    if (! isFullscreenEnabled()){
        return;
    }
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}
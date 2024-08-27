let screenWithTimerOn = {};
//Schermo4: token

function screenClock(schermo, timeout, token, callback, params){
    setTimeout(() => {
        if(screenWithTimerOn[schermo] && screenWithTimerOn[schermo] == token){
            callback(...params);
            screenClock(schermo, timeout, token, callback, params);
            console.log('[CLOCK]: ' + schermo + " (" + token + ")");
        }else{
            console.log('[CLOCK]: ' + schermo + " (" + token + ") è terminato");
        }
    }, timeout);
}

module.exports = {screenWithTimerOn, screenClock};
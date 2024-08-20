function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

let socket = io();

socket.on("connect", () => {
    console.log("Connesso al server");

    if (getCookie("code") != null){
        console.log("Tentativo di auto login");
        socket.emit("authentication", getCookie("code"));
    }else{
        console.log("Auto login non disponibile");
    }

    socket.on("message", (message) => {
        console.log("[Server]: " + message);
    });

    socket.on("error", (message) => {
        console.log("[Server]: " + message);
    });

    socket.on("authACK", (result) => {
        if (result) {
            console.log("Autenticazione riuscita");
        }else{
            console.log("Autenticazione fallita");
        }
        isUserLogged = result;
        localHandler("initPage");
    });

    socket.on("disconnect", () => {
        console.log("Connessione chiusa");
    });
    
    socket.on("updateScreens", () => {
        console.log("Il server emana ordine di refresh schermi");
        localHandler("updateScreens");
    });
});
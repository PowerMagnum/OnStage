const screenDefaultData = { 
    screenRatio: "16/9", 
    slides: [], 
    slidesLoop: false,
    currentSlide: null
};
const slideDefaultData = {
        id: 0,
        duration: 0,
        background: {
            path: "/assets/img/default.jpg",
            type: "image"
        },
        media: []
    }
const mediaDefaultData = {
    path: "/assets/img/default.jpg",
    type: "image",
    position: {
        x: 50,
        y: 100
    },
    size: {
        width: 200,
        height: 100
    } 
}

module.exports = { screenDefaultData, slideDefaultData, mediaDefaultData };
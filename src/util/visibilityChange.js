/**
 * 浏览器标签页被隐藏或显示的时候会触发visibilitychange事件
 */
var visibilitychangeMap = function(){
    if (document.hidden !== undefined) {
        return {
            hidden: "hidden",
            visibilityChange: "visibilitychange"
        }
    } else if (document.webkitHidden !== undefined) {
        return {
            hidden: "webkitHidden",
            visibilityChange: "webkitvisibilitychange"
        }
    } else if (document.msHidden !== undefined) {
        return {
            hidden: "msHidden",
            visibilityChange: "msvisibilitychange"
        }
    }
}();

var supportVisiblityChange = !!visibilitychangeMap;

var watchPageVisiblityChange = function(callback, once){
    if(supportVisiblityChange){
        var visibilityChangeCallback; 
        document.addEventListener(visibilitychangeMap.visibilityChange, visibilityChangeCallback = function(e){
            if(once){
                document.removeEventListener(visibilitychangeMap.visibilityChange, visibilityChangeCallback);
            }
            callback(!document[visibilitychangeMap.hidden]);
        });
    }
};


export {
    supportVisiblityChange,
    watchPageVisiblityChange
}
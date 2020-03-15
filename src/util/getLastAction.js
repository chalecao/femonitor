let lastActionEvent;
['pointerdown', 'touchstart', 'mousedown', 'keydown', 'mouseover'].forEach(event=>{
    document.addEventListener(event, (e)=>{
        lastActionEvent = e;
    }, {
        capture: true,
        passive: true
    });
});
export default function(){
    return lastActionEvent;
};
/**
 * onload 事件回掉
 * @param {*} callback function
 */
export default function(callback){
    if(document.readyState === 'complete'){
        callback();
    }else{
        window.addEventListener('load', callback);
    }
};
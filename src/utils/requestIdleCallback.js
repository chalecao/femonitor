/**
 * 宏任务或者空闲时掉用，低优先级
 * @param {*} callback 
 * @param {*} timeout 
 */
export default function(callback, timeout){
    if(window.requestIdleCallback){
        requestIdleCallback(callback, {
            timeout: timeout || 1000
        })   
    }else{
        setTimeout(callback, 0);
    }
}
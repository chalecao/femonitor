/**
 * DOMContentLoaded 事件回掉
 * @param {*} callback function
 */
export default function (callback) {
    if (document.readyState === 'interactive') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};
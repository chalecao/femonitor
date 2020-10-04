import domload from '../utils/domload';

/**
 * 通过检查dom元素变化比例来确认是不是内容渲染出来
 * DOM变化率 > 4
 */
const MutationRadio = 4
FEDLOG.FMP = function () {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (!MutationObserver) {
        return;
    }

    let changeBaseNum = 0;
    let begin = Date.now();
    var observer = new MutationObserver(function (mutationsList) {
        let mulength = mutationsList.length;
        if (changeBaseNum > 0 && (mulength / changeBaseNum > MutationRadio)) {
            window.FEDLOG_FMP = Date.now() - begin;
            observer.disconnect();
        }
        changeBaseNum = mulength;
    });
    domload(() => {
        let container = document.querySelector("#ice-container") || document.body;
        observer.observe(container, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    })
    setTimeout(() => {
        observer.disconnect()
    }, 8e3)
};
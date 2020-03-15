/**
 * 自定义埋点
 * extData:{t3,d1 ... d5}
 */
FEDLOG.custom = function (extData, isIme) {
    if (Object.keys(extData).length) {
        this.send({
            t1: 'bu',
            t2: 'custom',
            ...extData
        }, !!isIme);
    }
}

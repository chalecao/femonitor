import sendTracker from './util/tracker'
import onload from './util/onload'

// 定义全局对象
window.FEDLOG = {};
FEDLOG.logger = FEDLOG.logger || new sendTracker();
// 发送队列
FEDLOG.queue = [];

FEDLOG.send = function (data) {
    // 超过80条数据等待, 统计正常业务日志 2.66条/s，5s有15条数据，5倍就是75条，5倍算作数据暴增
    if (this.queue.length >= 80) {
        return;
    }
    this.queue.push(data);
};

//扩展参数
let extraData = {
    ua: navigator.userAgent.replace(/ /g, ''),
    ti: document.title.replace(/(^\s+)|(\s+$)/g, ""),
    url: location.href,
    ts: Date.now()
};

FEDLOG._sendAll = function () {
    if (!this.queue.length) {
        return;
    }
    let temp = {}
    let data = this.queue.map(item => {
        temp = {
            ...extraData,
            ts: Date.now(),
            ti: document.title.replace(/(^\s+)|(\s+$)/g, ""),
            ...item
        }
        Object.keys(temp).forEach(k => {
            temp[k] = String(temp[k])
        })
        return temp
    })
    FEDLOG.logger.loggerp(data, () => {
        this.queue = []
    })
};

//5s检查一下队列
onload(() => {
    setInterval(() => {
        FEDLOG.blank && FEDLOG.blank();
        if (FEDLOG.queue.length > 0) {
            window.requestIdleCallback(() => {
                FEDLOG._sendAll();
            });
        }
    }, 5e3)
});
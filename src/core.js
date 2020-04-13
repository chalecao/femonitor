import sendTracker from './util/tracker'
import onload from './util/onload'
import { watchPageVisiblityChange } from './utils/visibilityChange';
import { isCumtomData } from './utils/util';

// 定义全局对象
window.FEDLOG = {};
FEDLOG.logger = FEDLOG.logger || new sendTracker();
// 发送队列
FEDLOG.queue = [];

//扩展参数
let getExtraData = () => ({
    ti: document.title.replace(/(^\s+)|(\s+$)/g, ""),
    url: location.href,
    ts: Date.now(),
    user: userId + '@' + userName,
    env
});

const MAX_Queue_Size = 100;
FEDLOG.send = function (data) {
    // 超过100条数据等待, 统计正常业务日志 2.66条/s，5s有15条数据，5倍就是75条，5倍算作数据暴增
    if (this.queue.length >= MAX_Queue_Size && !isCumtomData(data && data.t2)) {
        return;
    }
    let extraData = {
        ...getExtraData(),
        ...data
    }

    this.queue.push(extraData);
};

FEDLOG._sendAll = function () {
    if (!this.queue.length) {
        return;
    }
    let temp = {}
    let data = this.queue.map(item => {
        temp = {
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

    watchPageVisiblityChange(function (isVisible) {
        if (!isVisible) {
            console.log('leave page send FEDLOG')
            FEDLOG._sendAll();
        }
    });
});
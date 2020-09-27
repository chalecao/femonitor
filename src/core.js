import sendTracker from './utils/tracker'
import onload from './utils/onload'
import { watchPageVisiblityChange } from './utils/visibilityChange';

// 定义全局对象
window.FEDLOG = {};
FEDLOG.logger = FEDLOG.logger || new sendTracker();
// 发送队列
FEDLOG.queue = [];

if (window.performance && performance.timing && performance.timing.navigationStart) {
    FEDLOG.navigationStart = performance.timing.navigationStart
}

//扩展参数
let getExtraData = () => ({
    ti: document.title.replace(/(^\s+)|(\s+$)/g, ""),
    url: location.href,
    ts: Date.now()
});

const MAX_Queue_Size = 200;
FEDLOG._waitSend = function (data) {
    // 超过100条数据等待, 统计正常业务日志 2.66条/s，5s有15条数据，5倍就是75条，5倍算作数据暴增
    // if (this.queue.length >= MAX_Queue_Size && !isCumtomData(data && data.t2)) {
    if (this.queue.length >= MAX_Queue_Size) {
        return;
    }

    let extraData = {
        ...getExtraData(),
        ...data
    }
    this.queue.push(extraData);
};

FEDLOG._send = function (data) {
    if (!data) return;

    let extraData = {
        ...getExtraData(),
        ...data
    }
    Object.keys(extraData).forEach(key => {
        FEDLOG.logger.push(key, extraData[key])
    })
    // console.log(`FEDLOG ${extraData.t1}-${extraData.t2}:`, `${extraData.d1}`)
    FEDLOG.logger.logger(() => {
        this._waitSend(data);
    })
}

FEDLOG._sendAll = function (cb, errCb) {
    if (!this.queue.length) {
        return;
    }
    let temp = {};
    let data = this.queue.map(item => {
        // console.log(`FEDLOG ${item.t1}-${item.t2}:`, `${item.d1}`)
        temp = {
            ...item
        }
        Object.keys(temp).forEach(k => {
            temp[k] = String(temp[k])
        })
        return temp
    })
    if (window.FEDLOG_DISABLE_UPLOAD_LOG) {
        console.log("FEDLOG_DISABLE_UPLOAD_LOG", data)
        this.queue = [];
        cb && cb();
    } else {
        FEDLOG.logger.loggerp(data, () => {
            this.queue = [];
            cb && cb();
        }, errCb)
    }
};

let UploadLogTime = 5e3;
FEDLOG.uploadLog = function () {
    let timer = setTimeout(() => {
        FEDLOG.blank && FEDLOG.blank(); //检查白屏
        if (FEDLOG.queue.length > 0) {
            requestIdleCallback(() => {
                FEDLOG._sendAll(() => {
                    UploadLogTime = 5e3;
                }, () => {
                    // 异常
                    UploadLogTime += 3e3;
                    // 5次失败异常，清空
                    if (UploadLogTime > 15e3) {
                        FEDLOG.queue = [];
                    }
                });
            });
        }
        clearTimeout(timer);
        FEDLOG.uploadLog();
    }, UploadLogTime)
}

//5s检查一下队列
onload(() => {
    FEDLOG.uploadLog();
    watchPageVisiblityChange(function (isVisible) {
        if (!isVisible) {
            console.log('leave page send FEDLOG')
            FEDLOG._sendAll();
        }
    });
});

FEDLOG.send = function (data, isIme) {
    //埋点发送
    if (isIme) {
        this._send(data);
    } else {
        this._waitSend(data);
    }
};
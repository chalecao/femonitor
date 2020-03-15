/**
 * 采集js错误，需要注意跨域问题
 * 外联脚本需要开启crossorigin
 * 数据模型：
 * {
        t1: 'monitor',          // 监控类型
        t2: 'jserror',          // 监控纬度
        t3: 'promise',          // 扩展类型
        d1: message || '',      // 报错信息
        d2: getShortUrl(file),  //报错链接
        d3: line + '-' + column, // 行列号
        d4: stack               // 错误堆栈
    }
 */
import genSelector from '../utils/genSelector'
import { formatTime } from '../utils/util';
import getLastAction from '../utils/getLastAction'

const MaxStackError = Number.MAX_VALUE  //改用post发送，不限制
const MaxUrlLength = Number.MAX_VALUE  //改用post发送，不限制

/**
 * 处理Script error问题
 * 改写了 EventTarget 的 addEventListener 方法；
对传入的 listener 进行包装，返回包装过的 listener，对其执行进行 try-catch；
浏览器不会对 try-catch 起来的异常进行跨域拦截，所以 catch 到的时候，是有堆栈信息的
 */
const originAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
    try {
        return originAddEventListener.call(this, type, listener, options)
    } catch (error) {
        throw error
    }
}
FEDLOG.injectJsError = function () {
    function getLines(stack) {
        if (!stack) {
            return '';
        }
        stack = stack.split('\n').slice(1);
        if (stack.length > MaxStackError) { //目前用get接口上传，只用前MaxStackError级和最后堆栈
            stack = stack.slice(0, 2).concat(['...', stack[stack.length - 1]]);
        }
        return stack.map(item => {
            return item.replace(/^\s+at\s+/g, '');
        }).join('^');
    }

    function getShortUrl(url) {
        if (!url) {
            return '';
        }
        if (url.length < MaxUrlLength) {
            return url;
        }
        return url.substr(0, 997) + '...';
    }

    window.addEventListener('error', function (e, url, lineNo, columnNo, error) {
        let lastEl = getLastAction();
        try {
            if (typeof e === 'string') {
                FEDLOG.send({
                    t1: 'monitor',
                    t2: 'jserror',
                    d1: e || '',
                    d2: getShortUrl(url),
                    d3: (lineNo || 0) + "-" + (columnNo || 0),
                    d4: getLines(error && error.stack),
                    d5: lastEl ? genSelector(lastEl.path || lastEl.target) : '',// 最后操作的节点的CSS选择器
                })
            } else {
                // 资源异常
                if (e.target && (e.target.src || e.target.href)) {
                    FEDLOG.send({
                        t1: 'monitor',
                        t2: 'res',
                        t3: e.target.src || e.target.href,
                        d1: e.target.tagName,
                        d2: formatTime(e.timeStamp),
                        d3: genSelector(e.path || e.target)
                    })
                } else {
                    FEDLOG.send({
                        t1: 'monitor',
                        t2: 'jserror',
                        d1: e.message || '',
                        d2: getShortUrl(e.filename),
                        d3: (e.lineno || 0) + "-" + (e.colno || 0),
                        d4: getLines(e.error && e.error.stack),
                        d5: lastEl ? genSelector(lastEl.path || lastEl.target) : '',// 最后操作的节点的CSS选择器
                    });
                }
            }
        } catch (e) { }
    }, true); //捕获阶段可以拿到资源问题数据，暂不需要通过sw采集
    window.addEventListener("unhandledrejection", function (e) {
        if (!e) return;
        let lastEl = getLastAction();
        try {
            var message = '';
            var line = 0;
            var column = 0;
            var file = '';
            var stack = '';

            if (typeof e === 'string') {
                message = e;
            } else if (typeof e.reason === 'object') {
                message = e.reason.message;
            } else if (typeof e.message === 'string') {
                message = e.message;
            }

            var reason = e.reason;
            if (typeof reason === 'object') {
                if (typeof reason.column === 'number') {
                    column = reason.column;
                    line = reason.line;
                } else if (reason.stack) {
                    var matchR = reason.stack.match(/at\s+.+:(\d+):(\d+)/);
                    if (matchR) {
                        line = matchR[1];
                        column = matchR[2];
                    }
                }
                if (reason.sourceURL) {
                    file = reason.sourceURL;
                } else if (reason.stack) {
                    var matchR = reason.stack.match(/at\s+(.+):\d+:\d+/);
                    if (matchR) {
                        file = matchR[1];
                    }
                }
                if (reason.stack) {
                    stack = getLines(reason.stack);
                }
            }
            FEDLOG.send({
                t1: 'monitor',
                t2: 'jserror',
                t3: 'promise',
                d1: message || '',
                d2: getShortUrl(file),
                d3: line + '-' + column,
                d4: stack,
                d5: lastEl ? genSelector(lastEl.path || lastEl.target) : '',// 最后操作的节点的CSS选择器
            })
        } catch (e) { }
    });
}
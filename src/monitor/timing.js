import onload from '../utils/onload';
import { formatTime } from '../utils/util';
import { watchPageVisiblityChange } from '../utils/visibilityChange'

/**
 * performance.timing 
d5 - DNS查询耗时: domainLookupEnd - domainLookupStart
t3 - TCP建连耗时: connectEnd - connectStart
d1 - Request请求耗时: responseStart - requestStart
d2 - Response响应耗时: responseEnd - responseStart
d3 - DOM解析渲染耗时:（双击可下钻查看细分阶段耗时）domContentLoadedEventEnd - domLoading
d4 - DOM解析耗时: loadEventStart（domComplete） - domContentLoadedEventEnd
// domready事件回调耗时: domContentLoadedEventEnd-domContentLoadedEventStart
// onload时间: loadEventStart-fetchStart

element timing: https://chromestatus.com/features/6230814637424640, env: chrome>= 77
first-input: https://www.chromestatus.com/features/5149663191629824, env: chrome>= 77
first-paint, env: chrome>= 60
 */
FEDLOG.timing = function () {
    if (this.navigationStart) {
        const timingTimer = function () {
            const timer = setTimeout(function () {
                const { fetchStart, connectStart, requestStart, responseEnd, responseStart,
                    loadEventStart, domLoading, domContentLoadedEventStart } = performance.timing
                if (domContentLoadedEventStart) {
                    FEDLOG.send({
                        t1: 'exp',
                        t2: 'timing',
                        t3: requestStart - connectStart,  // tcp时间
                        d1: responseStart - requestStart,//请求时间
                        d2: responseEnd - responseStart, //响应时间
                        d3: domContentLoadedEventStart - domLoading,//DOM加载
                        d4: loadEventStart - domContentLoadedEventStart,//DOM渲染
                        d5: connectStart - fetchStart // Appcache + DNS时间
                    });
                    clearTimeout(timer)
                } else {
                    clearTimeout(timer)
                    timingTimer()
                }
            }, 3e3);
        }
        onload(timingTimer)
    }
}
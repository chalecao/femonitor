import onload from '../utils/onload';
import { formatTime } from '../utils/util';
import { watchPageVisiblityChange } from '../utils/visibilityChange'

/**
 * performance.timing 
DNS查询耗时: domainLookupEnd - domainLookupStart
t3 - TCP建连耗时: connectEnd - connectStart
d1 - Request请求耗时: responseStart - requestStart
d2 - Response响应耗时: responseEnd - responseStart
d3 - DOM解析渲染耗时:（双击可下钻查看细分阶段耗时）domComplete(loadEventStart) - domLoading
DOM解析耗时: domComplete(loadEventStart) - domContentLoaded
d4: domready事件回调耗时: domContentLoadedEventEnd-domContentLoadedEventStart
d5: onload时间: loadEventStart-fetchStart

element timing: https://chromestatus.com/features/6230814637424640, env: chrome>= 77
first-input: https://www.chromestatus.com/features/5149663191629824, env: chrome>= 77
first-paint, env: chrome>= 60
 */
FEDLOG.timing = function () {
    let FMP = 0 //<div elementtiming="hero" class="..." >
    if (!!window.PerformanceElementTiming) {
        const observer = new PerformanceObserver((list) => {
            let perfEntries = list.getEntries();
            FMP = perfEntries[0]
            observer.disconnect();
        });
        observer.observe({ entryTypes: ['element'] });
        watchPageVisiblityChange(function (isVisible) {
            if (!isVisible) {
                observer.disconnect();
            } else {
                setTimeout(function () {
                    observer.observe({ entryTypes: ["element"] });
                }, 100);
            }
        })
    }

    // https://wicg.github.io/event-timing/
    try {
        new PerformanceObserver(function (list, obs) {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
                // Measure the delay to begin processing the first input event.
                let FID = firstInput.processingStart - firstInput.startTime;
                // Measure the duration of processing the first input event.
                // Only use when the important event handling work is done synchronously in the handlers.
                let FIDU = firstInput.duration;
                // console.log(FID, FIDU)
                if (FID > 50 || FIDU > 50) {
                    FEDLOG.send({
                        t1: 'bu',
                        t2: 'custom',
                        t3: 'fid',
                        d1: FID ? formatTime(FID) : 0,
                        d2: FIDU ? formatTime(FIDU) : 0,
                        d3: firstInput.startTime
                    });
                }
            }
            // Disconnect this observer since callback is only triggered once.
            obs.disconnect();
            // }).observe({ type: 'first-input', buffered: true }); // chrome 79支持type，chrome 70不支持会报错，要用entryTypes
        }).observe({ entryTypes: ['first-input'] });
    } catch (e) { }
    if (this.navigationStart) {
        onload(function () {
            let fcpTimer = setTimeout(function () {
                const { fetchStart, connectEnd, connectStart, requestStart, responseEnd, responseStart,
                    loadEventStart, domLoading, domContentLoadedEventEnd,
                    domContentLoadedEventStart } = performance.timing
                FEDLOG.send({
                    t1: 'exp',
                    t2: 'timing',
                    t3: connectEnd - connectStart,
                    d1: responseStart - requestStart,
                    d2: responseEnd - responseStart,
                    d3: loadEventStart - domLoading,
                    d4: domContentLoadedEventEnd - domContentLoadedEventStart,
                    d5: loadEventStart - fetchStart
                });

                const FP = performance.getEntriesByName('first-paint')[0]
                const FCP = performance.getEntriesByName('first-contentful-paint')[0]

                FEDLOG.send({
                    t1: 'exp',
                    t2: 'fp',
                    d1: FP ? formatTime(FP.startTime) : 0,
                    d2: FCP ? formatTime(FCP.startTime) : 0,
                    d3: FMP ? formatTime(FMP.startTime) : 0
                });

                clearTimeout(fcpTimer)
            }, 3e3);
        })
    }
}
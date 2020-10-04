/**
 * 卡顿，监控浏览器主进程持续执行时间大于50ms的情况 
 * https://www.w3.org/TR/longtasks/
 * https://www.chromestatus.com/features/5738471184400384
 * tti 参考：https://web.dev/tti/
 * env: chrome>=58
 */
import getLastAction from '../utils/getLastAction'
import genSelector from '../utils/genSelector'
import requestIdleCallback from '../utils/requestIdleCallback'
import { watchPageVisiblityChange } from '../utils/visibilityChange'
import { formatTime } from '../utils/util';

const MAX_LONG_TASK_PER_PAGE = 100;
const MIN_LONG_TASK_DURATION = 500;
const TTI_QUITE_WINDOW = 3000;
const TBT_BASE = 50;
FEDLOG.longTask = function () {
    if (!window.PerformanceLongTaskTiming) {
        return;
    }
    FEDLOG._lastLongtaskSelList = []
    window.FEDLOG_TBT = 0

    var timmer, mileage = performance.now();
    var observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {

            // 最后一次出现longtask时间记做tti
            mileage = performance.now()
            clearTimeout(timmer);
            timmer = setTimeout(() => {
                window.FEDLOG_TTI = mileage;
                if (entry.duration > TBT_BASE) {
                    window.FEDLOG_TBT += entry.duration - TBT_BASE
                }
            }, TTI_QUITE_WINDOW);

            if (entry.duration > MIN_LONG_TASK_DURATION
                && FEDLOG._lastLongtaskSelList.length < MAX_LONG_TASK_PER_PAGE) {
                let e = getLastAction();
                requestIdleCallback(() => {
                    // 最后操作的节点的CSS选择器
                    let sel = e ? genSelector(e.path || e.target) : ''
                    // 页面同一个sel 只发送一次
                    if (FEDLOG._lastLongtaskSelList.indexOf(sel) < 0) {
                        FEDLOG.send({
                            t1: 'exp',
                            t2: 'longtask',
                            d1: formatTime(entry.startTime),// 开始时间
                            d2: formatTime(entry.duration),// 持续时间
                            d3: sel
                        });
                        FEDLOG._lastLongtaskSelList.push(sel)
                    }
                });
            }
        });
        if (FEDLOG._lastLongtaskSelList.length >= MAX_LONG_TASK_PER_PAGE) {
            observer.disconnect();
        }
    });

    setTimeout(() => {
        window.FEDLOG_TTI = mileage;
    }, TTI_QUITE_WINDOW * 7)

    observer.observe({ entryTypes: ["longtask"] });

    watchPageVisiblityChange(function (isVisible) {
        if (!isVisible) {
            observer.disconnect();
        } else {
            setTimeout(function () {
                observer.observe({ entryTypes: ["longtask"] });
            }, 100);
        }
    })
};
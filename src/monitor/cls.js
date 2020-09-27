
import genSelector from '../utils/genSelector';
import { watchPageVisiblityChange } from '../utils/visibilityChange'
import requestIdleCallback from '../utils/requestIdleCallback'

/**
cls: https://web.dev/cls/
good | need improvement | poor
----0.1---------------0.25----
 */
FEDLOG.cls = function () {
    const entryType = 'layout-shift'
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(item => {
            if (item.sources) {
                let d3 = item.sources[0] && genSelector(item.sources[0].node)
                let d4 = item.sources[1] && genSelector(item.sources[1].node)
                let d5 = item.sources[2] && genSelector(item.sources[2].node)
                FEDLOG.send({
                    t1: 'exp',
                    t2: 'fe',
                    t3: 'cls',
                    d1: item.startTime,
                    d2: item.value,
                    d3, d4, d5
                });
            }
        })
    });
    observer.observe({ entryTypes: [entryType] });

    watchPageVisiblityChange(function (isVisible) {
        if (!isVisible && observer) {
            observer.disconnect();
        } else {
            requestIdleCallback(function () {
                observer.observe({ entryTypes: [entryType] });
            }, 50);
        }
    })
}
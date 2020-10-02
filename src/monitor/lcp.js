
import genSelector from '../utils/genSelector';
import { watchPageVisiblityChange } from '../utils/visibilityChange'
import onload from '../utils/onload';

/**
lcp: https://web.dev/lcp/
good | need improvement | poor
----2.5s---------------4.0s----
 */
FEDLOG.lcp = function () {
    const entryType = 'largest-contentful-paint'
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(item => {
            FEDLOG.send({
                t1: 'exp',
                t2: 'fe',
                t3: 'lcp',
                d1: item.startTime,
                d2: item.size,
                d3: item.element?genSelector(item.element):''
            });
        })
    });
    observer.observe({ entryTypes: [entryType] });
    // 这个是加载体验指标，onload后不会再触发，可以释放
    onload(function () {
        if (observer) {
            observer.disconnect();
        }
    });
    watchPageVisiblityChange(function (isVisible) {
        if (!isVisible && observer) {
            observer.disconnect();
        }
    })
}
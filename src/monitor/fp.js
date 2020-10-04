import onload from '../utils/onload';
import { formatTime } from '../utils/util';
import { watchPageVisiblityChange } from '../utils/visibilityChange'
import requestIdleCallback from '../utils/requestIdleCallback'

/**
element timing: https://chromestatus.com/features/6230814637424640, env: chrome>= 77
first-input: https://www.chromestatus.com/features/5149663191629824, env: chrome>= 77
first-paint, env: chrome>= 60
 */
FEDLOG.fp = function () {
    let FMP = 0 //<div elementtiming="hero" class="..." >
    if (!!window.PerformanceElementTiming) {
        const entryType = 'element'
        const observer = new PerformanceObserver((list) => {
            let perfEntries = list.getEntries();
            FMP = perfEntries[0]
            observer.disconnect();
        });
        observer.observe({ entryTypes: [entryType] });
        watchPageVisiblityChange(function (isVisible) {
            if (!isVisible) {
                observer.disconnect();
            } else {
                requestIdleCallback(function () {
                    observer.observe({ entryTypes: [entryType] });
                }, 50);
            }
        })
    }
    if (this.navigationStart) {
        const handleFp = function () {
            let fcpTimer = setTimeout(function () {
                const FP = performance.getEntriesByName('first-paint')[0]
                const FCP = performance.getEntriesByName('first-contentful-paint')[0]
                if (window.FEDLOG_TTI) {
                    const FCPTime = FCP ? formatTime(FCP.startTime) : 0;
                    const FMPTime = FMP ? formatTime(FMP.startTime) : (window.FEDLOG_FMP || 0);
                    const TTITime = formatTime(window.FEDLOG_TTI > FCPTime ? window.FEDLOG_TTI : FCPTime) || FCPTime
                    const TBT = window.FEDLOG_TBT ? formatTime(window.FEDLOG_TBT) : 0

                    FEDLOG.send({
                        t1: 'exp',
                        t2: 'fp',
                        t3: location.pathname.split("/")[1],
                        d1: FP ? formatTime(FP.startTime) : 0,
                        d2: FCPTime,
                        d3: FMPTime,
                        d4: TTITime,
                        d5: TBT
                    });
                    clearTimeout(fcpTimer)
                } else {
                    handleFp()
                }

            }, 3e3);
        }
        onload(handleFp)
    }
}
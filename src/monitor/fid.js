import { formatTime } from '../utils/util';
import { watchPageVisiblityChange } from '../utils/visibilityChange'
/**
https://wicg.github.io/event-timing/
 */
FEDLOG.fid = function () {
    try {
        const entryType = 'first-input'
        const observer = new PerformanceObserver(function (list, obs) {
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
                    });
                }
            }
            // Disconnect this observer since callback is only triggered once.
            observer.disconnect();
            // }).observe({ type: 'first-input', buffered: true }); // chrome 79支持type，chrome 70不支持会报错，要用entryTypes
        });
        observer.observe({ entryTypes: [entryType] });
        watchPageVisiblityChange(function (isVisible) {
            if (!isVisible && observer) {
                observer.disconnect();
            }
        })
    } catch (e) { }
}
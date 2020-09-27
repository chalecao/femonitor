import './core'
import './monitor/jserror'
import './monitor/xhr'
import './monitor/fetch'
import './monitor/pv'
import './monitor/screenBlank'
import './monitor/timing'
import './monitor/longTask'
import './monitor/fid'
import './monitor/lcp'
import './monitor/cls'

FEDLOG.injectJsError();

FEDLOG.injectXhrHook();

FEDLOG.PV();

FEDLOG.timing();

FEDLOG.longTask();

/**
 * 采样率，默认1
 * FEDLOG_SAMPLING 全局采样率
 */
window.FEDLOG_SAMPLING_cls = 0.5
window.FEDLOG_SAMPLING_lcp = 0.5
if ("PerformanceObserver" in window) {
    ['lcp', 'cls'].forEach((item) => {
        let sampling = 1;
        if (window[`FEDLOG_SAMPLING_${item}`] !== undefined) {
            sampling = window[`FEDLOG_SAMPLING_${item}`];
        } else if (window.FEDLOG_SAMPLING !== undefined) {
            sampling = FEDLOG_SAMPLING;
        }
        if (Math.random() < sampling) {
            FEDLOG[item]();
        }
    })
}
/**
 * 发送pv埋点
 * {
        t1: 'bu',
        t2: 'pv'
    }
 */

FEDLOG.PV = function (type, msg) {
    // 文档：http://wicg.github.io/netinfo
    let nrtt = 0, net = 0;
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        nrtt = connection.rtt || 0; // 估算的往返时间
        net = connection.effectiveType || ''; // effectiveType 可取值有 'slow-2g'、'2g'、'3g' 或者 '4g'
    }

    this.send({
        t1: 'bu',
        t2: 'pv',
        d1: net,
        d2: nrtt,
        d3: `${window.screen.width}x${window.screen.height}`,
        d4: `${window.innerWidth}x${window.innerHeight}`
    });
}

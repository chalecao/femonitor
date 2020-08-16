import parseResponse from '../utils/parseResponse';

/**
 * 接口埋点包装
 */
FEDLOG.requestLog = function (url, type, extData = {}, isIme) {
    const { status = '', code = '', traceId = '', duration = '', msg = '', params = '' } = extData
    this.send({
        t1: 'monitor',
        t2: 'api',
        t3: type,
        d1: url.replace(/^(https?:)?/, '').replace(/\?.*$/, ''),  //接口url
        d2: `${status}-${code}`,   // http状态码
        d3: `${duration}-${traceId}`,  //接口耗时
        d4: msg,  //错误信息
        d5: params  //请求参数
    })
}

function responseData(res, url, duration, status, traceId) {
    if (!res.success || window.FEDLOG_ENABLE_API_SUCCESS) {
        FEDLOG.requestLog(url, res.success ? 'requestSuccess' : 'requestError', {
            status,
            duration,
            traceId,
            code: res.code,
            msg: res.msg,
            type: 'xhr'
        });

    }
}


FEDLOG.injectXhrHook = function () {
    if (typeof window.XMLHttpRequest !== 'function' || !window.addEventListener) return;
    var oldXMLHttpRequest = window.XMLHttpRequest;

    window.XMLHttpRequest = function XMLHttpRequest(props) {
        var xhr = new oldXMLHttpRequest(props)
        var send = xhr.send,
            open = xhr.open,
            begin,
            url;
        var isFEDLOG;

        xhr.open = function (method0, url0) {
            var args = (arguments.length === 1) ? [arguments[0]] : Array.apply(null, arguments);
            open.apply(xhr, args);
            url = url0 || '';

            if (url.match('logstores')) {
                isFEDLOG = true;
            }
        };

        xhr.send = function (data) {
            begin = Date.now();
            send.apply(xhr, arguments);
        };

        xhr.addEventListener('readystatechange', function (e) {
            // FEDLOG请求排除
            if (isFEDLOG) {
                return;
            }
            if (!url || xhr.readyState !== 4) return;
            var time = Date.now() - begin;
            var status = xhr.status;
            var res = {};
            // getResponseHeader只能拿到部分w3c认为安全的响应头(Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma)，或者由业务在响应头里增加“Access-Control-Expose-Headers: x-eagleeye-id”
            var traceId;
            try {
                // 不判断浏览器会报Refused to get unsafe header "eagleeye-traceid"
                var resHeaders = xhr.getAllResponseHeaders();
                if (resHeaders.indexOf('traceId') !== -1) {
                    traceId = xhr.getResponseHeader('traceId');
                }
            } catch (ex) { }
            if (!xhr.responseType || xhr.responseType === 'text') {
                res = parseResponse.parseResponse(xhr.responseText, status);
                responseData(res, url, time, status, traceId);
            } else if (xhr.responseType === 'blob') {
                var reader = new FileReader()
                reader.readAsText.apply(reader, [xhr.response]);
                reader.onloadend = function () {
                    res = parseResponse.parseResponse(reader.result, status);
                    responseData(res, url, time, status, traceId);
                }
            }
        });

        return xhr;
    };
};

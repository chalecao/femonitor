import parseResponse from '../util/parseResponse';

/**
 * hack Fetch
 * 搜集错误接口，响应时间超过500ms的正确接口，或者根据开关开启所有正确接口
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

window.FEDLOG_MAX_API_LATENCY = 500;
window.FEDLOG_SAMPLING_API = 0.2;
FEDLOG.injectFetchHook = function () {
    if (typeof window.fetch !== 'function') return;
    var oldFetch = window.fetch;
    const makeLog = (reqClone, url, info, args, type) => {
        var rbody = args;
        if (reqClone) {
            reqClone.text().then(function (res) {
                if (res) {
                    try {
                        rbody = JSON.parse(res)
                    } catch (e) {
                        rbody = res
                    }
                }
                FEDLOG.requestLog(url, type, {
                    ...info,
                    params: JSON.stringify(rbody)
                });
            }).catch(() => { })
        } else {
            FEDLOG.requestLog(url, type, {
                ...info,
                params: JSON.stringify(rbody)
            });
        }
    }
    window.fetch = function fetch(arg0, setting) {
        var args = (arguments.length === 1) ? [arguments[0]] : Array.apply(null, arguments);
        // method: 'HEAD' 或 mode: 'no-cors' 的请求不监听
        if (setting && (setting.method === 'HEAD' || setting.mode === 'no-cors')) {
            return oldFetch.apply(window, args);
        }

        // 请求的 url
        var url = ((arg0 && (typeof arg0 !== 'string')) ? arg0.url : arg0) || '';

        // 跳过非接口
        if (url.match(/\.(js|css|png|jpg|gif|jpeg|webp)(\?.*)?$/)) {
            return oldFetch.apply(window, args);
        }
        var begin = Date.now();
        // 获取请求参数
        var reqClone = ""
        if (args[0] instanceof Request) {
            reqClone = args[0].clone()
        }
        return oldFetch.apply(window, args).then(function (origin) {
            //polyfill未必有clone方法
            var response = origin.clone ? origin.clone() : origin;

            parseResponse.getResponseBody(response, setting || {}).then(function (resInfo) {
                var time = Date.now() - begin;
                var res = {}
                if (resInfo && typeof resInfo == 'object') res = resInfo;
                var status = response.status;
                res = parseResponse.parseResponse(res, status);
                var traceId = '';
                try {
                    traceId = response.headers.get('eagleeye-traceid') || response.headers.get('x-eagleeye-id');
                } catch (ex) { }
                var shouldUpload = (FEDLOG.env != 'dev') && (time > window.FEDLOG_MAX_API_LATENCY) && (Math.random() < window.FEDLOG_SAMPLING_API);
                if (!res.success || shouldUpload || window.FEDLOG_ENABLE_API_SUCCESS) {
                    var type = res.success ? 'requestSuccess' : 'requestError';
                    var info = {
                        status,
                        duration: time,
                        traceId,
                        code: res.code,
                        msg: res.msg,
                        body: res.body,
                        type: 'fetch'
                    }
                    makeLog(reqClone, url, info, args, type)

                }
            }).catch(() => { })

            return origin;
        }, function (err) {
            //https://github.com/github/fetch/issues/201
            // 大部分原因是请求的返回header没有Access-Control-Allow-Origin: *
            var info = {
                status: 401,
                duration: Date.now() - begin,
                msg: err.stack || err.message,
                type: 'fetch'
            }
            makeLog(reqClone, url, info, args, 'requestError')
            console.error(err)
            return err;
        });
    };
};

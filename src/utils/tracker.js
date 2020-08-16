/**
 * web tracker接口，支持get和post
 * get: https://help.aliyun.com/document_detail/31752.html
 * post: https://help.aliyun.com/document_detail/120218.html
 */
function createHttpRequest() {
    if (window.ActiveXObject) {
        return new ActiveXObject("Microsoft.XMLHTTP");
    }
    else if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    }
}

// const host = 'cn-hangzhou-intranet.log.aliyuncs.com' //阿里云内网地址不消耗外网流量
const host = 'cn-hangzhou.log.aliyuncs.com'
const project = 'fed123-test-project' // sls上保持唯一
const logstore = 'fed123-test-logstore'

/**
 * 连不上外网时需要服务端做转发， FEDLOGs是sls 日志 project name
 * location /logstores {
    proxy_pass http://FEDLOGs.cn-hangzhou-intranet.log.aliyuncs.com
  }
  */
function sendTracker() {
    this.path_ = '/logstores/' + logstore + '/track?APIVersion=0.6.0';
    this.uri_ = 'http://' + project + '.' + host + this.path_;
    this.params_ = new Array();
    this.httpRequest_ = createHttpRequest();
    this.httpRequest_.timeout = 3000;
    this.httpRequest_.ontimeout = (event) => {
        this.uri_ = this.path_;
    }

}
sendTracker.prototype = {
    push: function (key, value) {
        if (!key || !value) {
            return;
        }
        this.params_.push(key);
        this.params_.push(value);
    },
    checkNetWork: function () {
        this.httpRequest_.onerror = (event) => {
            this.uri_ = this.path_;
        }
        this.httpRequest_.open("OPTIONS", this.uri_, true);
        this.httpRequest_.send(null);
    },
    logger: function (errorcb) {
        if (window.FEDLOG_DISABLE_TRACK) return;

        var url = this.uri_;
        var k = 0;
        while (this.params_.length > 0) {
            if (k % 2 == 0) {
                url += '&' + encodeURIComponent(this.params_.shift());
            }
            else {
                url += '=' + encodeURIComponent(this.params_.shift());
            }
            ++k;
        }
        try {
            this.httpRequest_.open("GET", url, true);
            this.httpRequest_.onerror = (event) => {
                this.uri_ = this.path_;
            }
            this.httpRequest_.onload = function () {
                if ((this.status >= 200 && this.status <= 300) || this.status == 304) {
                    //成功了，可以得到数据了
                } else {
                    //失败了
                    errorcb && errorcb()
                }
            }
            this.httpRequest_.send(null);
        }
        catch (ex) {
            console.log(ex)
        }

    },
    loggerp: function (data, cb) {
        if (window.FEDLOG_DISABLE_TRACK) return;

        var url = this.uri_;
        try {
            let body = JSON.stringify({
                '__logs__': data
            })
            this.httpRequest_.open("POST", url.split("?")[0], true);
            this.httpRequest_.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            this.httpRequest_.setRequestHeader('x-log-apiversion', '0.6.0');
            this.httpRequest_.setRequestHeader('x-log-bodyrawsize', body.length);
            this.httpRequest_.onerror = (event) => {
                this.uri_ = this.path_;
            }
            this.httpRequest_.onload = function () {              //监听数据状态并接收后台响应
                if ((this.status >= 200 && this.status <= 300) || this.status == 304) {
                    //成功了，可以得到数据了
                    cb && cb()
                } else {
                    //失败了
                }
            }
            this.httpRequest_.send(body);
        }
        catch (ex) {
            console.log(ex)
        }

    }
};

export default sendTracker
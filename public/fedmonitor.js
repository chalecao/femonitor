(function () {
  'use strict';

  /**
   * web tracker接口，支持get和post
   * get: https://help.aliyun.com/document_detail/31752.html
   * post: https://help.aliyun.com/document_detail/120218.html
   */
  function createHttpRequest() {
      if (window.ActiveXObject) {
          return new ActiveXObject("Microsoft.XMLHTTP");
      } else if (window.XMLHttpRequest) {
          return new XMLHttpRequest();
      }
  }

  // const host = 'cn-hangzhou-intranet.log.aliyuncs.com' //阿里云内网地址不消耗外网流量
  var host = 'cn-hangzhou.log.aliyuncs.com';
  var project = 'fed123-test-project'; // sls上保持唯一
  var logstore = 'fed123-test-logstore';

  /**
   * 连不上外网时需要服务端做转发， FEDLOGs是sls 日志 project name
   * location /logstores {
      proxy_pass http://FEDLOGs.cn-hangzhou-intranet.log.aliyuncs.com
    }
    */
  function sendTracker() {
      var _this = this;

      this.path_ = '/logstores/' + logstore + '/track?APIVersion=0.6.0';
      this.slsUrl = 'http://' + project + '.' + host + this.path_;
      this.uri_ = this.slsUrl;
      this.params_ = new Array();
      this.httpRequest_ = createHttpRequest();
      this.httpRequest_.timeout = 3000;
      this.httpRequest_.ontimeout = function (event) {
          _this.uri_ = _this.path_;
      };
  }
  sendTracker.prototype = {
      push: function push(key, value) {
          if (!key || !value) {
              return;
          }
          this.params_.push(key);
          this.params_.push(value);
      },
      switchUrl: function switchUrl() {
          if (this.uri_ == this.slsUrl) {
              this.uri_ = this.path_;
          } else {
              this.uri_ = this.slsUrl;
          }
      },
      checkNetWork: function checkNetWork() {
          var _this2 = this;

          this.httpRequest_.onerror = function (event) {
              _this2.switchUrl();
          };
          this.httpRequest_.open("OPTIONS", this.uri_, true);
          this.httpRequest_.send(null);
      },
      logger: function logger(errorcb) {
          var this$1 = this;

          var _this3 = this;

          if (window.FEDLOG_DISABLE_TRACK) { return; }

          var url = this.uri_;
          var k = 0;
          while (this.params_.length > 0) {
              if (k % 2 == 0) {
                  url += '&' + encodeURIComponent(this$1.params_.shift());
              } else {
                  url += '=' + encodeURIComponent(this$1.params_.shift());
              }
              ++k;
          }
          try {
              this.httpRequest_.open("GET", url, true);
              this.httpRequest_.onerror = function (event) {
                  _this3.switchUrl();
                  errCb && errCb();
              };
              this.httpRequest_.ontimeout = function (event) {
                  _this3.switchUrl();
                  errCb && errCb();
              };
              this.httpRequest_.onload = function () {
                  if (this.status >= 200 && this.status <= 300 || this.status == 304) {
                      //成功了，可以得到数据了
                  } else {
                      //失败了
                      errorcb && errorcb();
                  }
              };
              this.httpRequest_.send(null);
          } catch (ex) {
              console.log(ex);
          }
      },
      loggerp: function loggerp(data, cb, errorcb) {
          var _this4 = this;

          if (window.FEDLOG_DISABLE_TRACK) { return; }

          var url = this.uri_;
          try {
              var body = JSON.stringify({
                  '__logs__': data
              });
              this.httpRequest_.open("POST", url.split("?")[0], true);
              this.httpRequest_.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
              this.httpRequest_.setRequestHeader('x-log-apiversion', '0.6.0');
              this.httpRequest_.setRequestHeader('x-log-bodyrawsize', body.length);
              this.httpRequest_.onerror = function (event) {
                  _this4.switchUrl();
                  errCb && errCb();
              };
              this.httpRequest_.ontimeout = function (event) {
                  _this4.switchUrl();
                  errCb && errCb();
              };
              var _self = this;
              this.httpRequest_.onload = function () {
                  //监听数据状态并接收后台响应
                  if (this.status >= 200 && this.status <= 300 || this.status == 304) {
                      //成功了，可以得到数据了
                      cb && cb();
                  } else {
                      //失败了
                      _self.switchUrl();
                      errorcb && errorcb();
                  }
              };
              this.httpRequest_.send(body);
          } catch (ex) {
              console.log(ex);
          }
      }
  };

  /**
   * onload 事件回掉
   * @param {*} callback function
   */
  function onload (callback) {
      if (document.readyState === 'complete') {
          callback();
      } else {
          window.addEventListener('load', callback);
      }
  }

  /**
   * 浏览器标签页被隐藏或显示的时候会触发visibilitychange事件
   */
  var visibilitychangeMap = function () {
      if (document.hidden !== undefined) {
          return {
              hidden: "hidden",
              visibilityChange: "visibilitychange"
          };
      } else if (document.webkitHidden !== undefined) {
          return {
              hidden: "webkitHidden",
              visibilityChange: "webkitvisibilitychange"
          };
      } else if (document.msHidden !== undefined) {
          return {
              hidden: "msHidden",
              visibilityChange: "msvisibilitychange"
          };
      }
  }();

  var supportVisiblityChange = !!visibilitychangeMap;

  var watchPageVisiblityChange = function watchPageVisiblityChange(callback, once) {
      if (supportVisiblityChange) {
          var _visibilityChangeCallback;
          document.addEventListener(visibilitychangeMap.visibilityChange, _visibilityChangeCallback = function visibilityChangeCallback(e) {
              if (once) {
                  document.removeEventListener(visibilitychangeMap.visibilityChange, _visibilityChangeCallback);
              }
              callback(!document[visibilitychangeMap.hidden]);
          });
      }
  };

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  // 定义全局对象
  window.FEDLOG = {};
  FEDLOG.logger = FEDLOG.logger || new sendTracker();
  // 发送队列
  FEDLOG.queue = [];

  if (window.performance && performance.timing && performance.timing.navigationStart) {
      FEDLOG.navigationStart = performance.timing.navigationStart;
  }

  //扩展参数
  var getExtraData = function getExtraData() {
      return {
          ti: document.title.replace(/(^\s+)|(\s+$)/g, ""),
          url: location.href,
          ts: Date.now()
      };
  };

  var MAX_Queue_Size = 200;
  FEDLOG._waitSend = function (data) {
      // 超过100条数据等待, 统计正常业务日志 2.66条/s，5s有15条数据，5倍就是75条，5倍算作数据暴增
      // if (this.queue.length >= MAX_Queue_Size && !isCumtomData(data && data.t2)) {
      if (this.queue.length >= MAX_Queue_Size) {
          return;
      }

      var extraData = _extends({}, getExtraData(), data);
      this.queue.push(extraData);
  };

  FEDLOG._send = function (data) {
      var _this = this;

      if (!data) { return; }

      var extraData = _extends({}, getExtraData(), data);
      Object.keys(extraData).forEach(function (key) {
          FEDLOG.logger.push(key, extraData[key]);
      });
      // console.log(`FEDLOG ${extraData.t1}-${extraData.t2}:`, `${extraData.d1}`)
      FEDLOG.logger.logger(function () {
          _this._waitSend(data);
      });
  };

  FEDLOG._sendAll = function (cb, errCb) {
      var _this2 = this;

      if (!this.queue.length) {
          return;
      }
      var temp = {};
      var data = this.queue.map(function (item) {
          // console.log(`FEDLOG ${item.t1}-${item.t2}:`, `${item.d1}`)
          temp = _extends({}, item);
          Object.keys(temp).forEach(function (k) {
              temp[k] = String(temp[k]);
          });
          return temp;
      });
      if (window.FEDLOG_DISABLE_UPLOAD_LOG) {
          console.log("FEDLOG_DISABLE_UPLOAD_LOG", data);
          this.queue = [];
          cb && cb();
      } else {
          FEDLOG.logger.loggerp(data, function () {
              _this2.queue = [];
              cb && cb();
          }, errCb);
      }
  };

  var UploadLogTime = 5e3;
  FEDLOG.uploadLog = function () {
      var timer = setTimeout(function () {
          FEDLOG.blank && FEDLOG.blank(); //检查白屏
          if (FEDLOG.queue.length > 0) {
              requestIdleCallback(function () {
                  FEDLOG._sendAll(function () {
                      UploadLogTime = 5e3;
                  }, function () {
                      // 异常
                      UploadLogTime += 3e3;
                      // 5次失败异常，清空
                      if (UploadLogTime > 15e3) {
                          FEDLOG.queue = [];
                      }
                  });
              });
          }
          clearTimeout(timer);
          FEDLOG.uploadLog();
      }, UploadLogTime);
  };

  //5s检查一下队列
  onload(function () {
      FEDLOG.uploadLog();
      watchPageVisiblityChange(function (isVisible) {
          if (!isVisible) {
              console.log('leave page send FEDLOG');
              FEDLOG._sendAll();
          }
      });
  });

  FEDLOG.send = function (data, isIme) {
      //埋点发送
      if (isIme) {
          this._send(data);
      } else {
          this._waitSend(data);
      }
  };

  var genSelector = function genSelector(path) {
      return path.reverse().filter(function (el) {
          return el !== window && el !== document;
      }).map(function (el) {
          var selector;
          if (el.id) {
              selector = '#' + el.id;
          } else if (el.className && typeof el.className === 'string') {
              selector = '.' + el.className.split(' ').filter(function (item) {
                  return !!item;
              }).join('.');
          } else {
              selector = el.nodeName;
          }
          return selector;
      }).join(' ');
  };

  function genSelector$1 (pathOrTargetEl) {
      if (Object.prototype.toString.apply(pathOrTargetEl) === '[object Array]') {
          return genSelector(pathOrTargetEl);
      } else {
          var path = [];
          var el = pathOrTargetEl;
          while (el) {
              path.push(el);
              el = el.parentNode;
          }
          return genSelector(path);
      }
  }

  /**
   * performance  的时间3350.304999999935，需要格式化下
   * @param {*} time 
   */
  var formatTime = function formatTime(time) {
      return ('' + time).split(".")[0];
  };

  var lastActionEvent = void 0;
  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'mouseover'].forEach(function (event) {
      document.addEventListener(event, function (e) {
          lastActionEvent = e;
      }, {
          capture: true,
          passive: true
      });
  });
  function getLastAction () {
      return lastActionEvent;
  }

  /**
   * 采集js错误，需要注意跨域问题
   * 外联脚本需要开启crossorigin
   * 数据模型：
   * {
          t1: 'monitor',          // 监控类型
          t2: 'jserror',          // 监控纬度
          t3: 'promise',          // 扩展类型
          d1: message || '',      // 报错信息
          d2: getShortUrl(file),  //报错链接
          d3: line + '-' + column, // 行列号
          d4: stack               // 错误堆栈
      }
   */

  var MaxStackError = Number.MAX_VALUE; //改用post发送，不限制
  var MaxUrlLength = Number.MAX_VALUE; //改用post发送，不限制

  /**
   * 处理Script error问题
   * 改写了 EventTarget 的 addEventListener 方法；
  对传入的 listener 进行包装，返回包装过的 listener，对其执行进行 try-catch；
  浏览器不会对 try-catch 起来的异常进行跨域拦截，所以 catch 到的时候，是有堆栈信息的
   */
  var originAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
          return originAddEventListener.call(this, type, listener, options);
      } catch (error) {
          throw error;
      }
  };
  FEDLOG.injectJsError = function () {
      function getLines(stack) {
          if (!stack) {
              return '';
          }
          stack = stack.split('\n').slice(1);
          if (stack.length > MaxStackError) {
              //目前用get接口上传，只用前MaxStackError级和最后堆栈
              stack = stack.slice(0, 2).concat(['...', stack[stack.length - 1]]);
          }
          return stack.map(function (item) {
              return item.replace(/^\s+at\s+/g, '');
          }).join('^');
      }

      function getShortUrl(url) {
          if (!url) {
              return '';
          }
          if (url.length < MaxUrlLength) {
              return url;
          }
          return url.substr(0, 997) + '...';
      }

      window.addEventListener('error', function (e, url, lineNo, columnNo, error) {
          var lastEl = getLastAction();
          try {
              if (typeof e === 'string') {
                  FEDLOG.send({
                      t1: 'monitor',
                      t2: 'jserror',
                      d1: e || '',
                      d2: getShortUrl(url),
                      d3: (lineNo || 0) + "-" + (columnNo || 0),
                      d4: getLines(error && error.stack),
                      d5: lastEl ? genSelector$1(lastEl.path || lastEl.target) : '' // 最后操作的节点的CSS选择器
                  });
              } else {
                  // 资源异常
                  if (e.target && (e.target.src || e.target.href)) {
                      FEDLOG.send({
                          t1: 'monitor',
                          t2: 'res',
                          t3: e.target.src || e.target.href,
                          d1: e.target.tagName,
                          d2: formatTime(e.timeStamp),
                          d3: genSelector$1(e.path || e.target)
                      });
                  } else {
                      FEDLOG.send({
                          t1: 'monitor',
                          t2: 'jserror',
                          d1: e.message || '',
                          d2: getShortUrl(e.filename),
                          d3: (e.lineno || 0) + "-" + (e.colno || 0),
                          d4: getLines(e.error && e.error.stack),
                          d5: lastEl ? genSelector$1(lastEl.path || lastEl.target) : '' // 最后操作的节点的CSS选择器
                      });
                  }
              }
          } catch (e) {}
      }, true); //捕获阶段可以拿到资源问题数据，暂不需要通过sw采集
      window.addEventListener("unhandledrejection", function (e) {
          if (!e) { return; }
          var lastEl = getLastAction();
          try {
              var message = '';
              var line = 0;
              var column = 0;
              var file = '';
              var stack = '';

              if (typeof e === 'string') {
                  message = e;
              } else if (typeof e.reason === 'object') {
                  message = e.reason.message;
              } else if (typeof e.message === 'string') {
                  message = e.message;
              }

              var reason = e.reason;
              if (typeof reason === 'object') {
                  if (typeof reason.column === 'number') {
                      column = reason.column;
                      line = reason.line;
                  } else if (reason.stack) {
                      var matchR = reason.stack.match(/at\s+.+:(\d+):(\d+)/);
                      if (matchR) {
                          line = matchR[1];
                          column = matchR[2];
                      }
                  }
                  if (reason.sourceURL) {
                      file = reason.sourceURL;
                  } else if (reason.stack) {
                      var matchR = reason.stack.match(/at\s+(.+):\d+:\d+/);
                      if (matchR) {
                          file = matchR[1];
                      }
                  }
                  if (reason.stack) {
                      stack = getLines(reason.stack);
                  }
              }
              FEDLOG.send({
                  t1: 'monitor',
                  t2: 'jserror',
                  t3: 'promise',
                  d1: message || '',
                  d2: getShortUrl(file),
                  d3: line + '-' + column,
                  d4: stack,
                  d5: lastEl ? genSelector$1(lastEl.path || lastEl.target) : '' // 最后操作的节点的CSS选择器
              });
          } catch (e) {}
      });
  };

  function isSuccess(res, httpStatus) {
      if (httpStatus !== undefined && httpStatus !== 200) {
          return false;
      }

      if (res.code !== undefined) {
          return res.code == 200;
      } else if (res.status !== undefined) {
          return res.status == 200;
      } else if (res.message !== undefined) {
          return res.message == "success";
      }

      return true;
  }

  function getResponseBody(response, request) {
      if (request.originResponse) { return response; }
      if (request.method === 'jsonp') { return response.json(); }
      var accept = request.headers && request.headers['accept'] || 'text';
      var responseType = response.headers && response.headers.get ? response.headers.get('content-type') : null;

      if (!responseType) {
          responseType = accept;
      }

      if (responseType.toLowerCase().indexOf('application/json') !== -1) {
          return response.json();
      } else if (responseType.toLowerCase().indexOf('text') !== -1) {
          return response.text();
      } else {
          return response.blob();
      }
  }

  function getMessage(res) {
      var resmsg = res.msg || res.message;
      if (typeof resmsg === 'object') {
          // code = code || resmsg.code;
          resmsg = resmsg.msg || resmsg.message || resmsg.code || JSON.stringify(resmsg);
      }
      return resmsg;
  }
  function getCode(res) {
      return res.code;
  }

  function parseResponse(str, httpStatus) {
      var res = str;
      if (typeof res === 'string') {
          try {
              res = JSON.parse(str);
          } catch (e) {}
      }
      if (typeof res !== 'object') { return {}; }
      return {
          msg: getMessage(res),
          code: getCode(res),
          success: isSuccess(res, httpStatus)
      };
  }

  var parseResponse$1 = {
      parseResponse: parseResponse,
      isSuccess: isSuccess,
      getResponseBody: getResponseBody,
      getMessage: getMessage
  };

  /**
   * 接口埋点包装
   */
  FEDLOG.requestLog = function (url, type) {
      var extData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var _extData$status = extData.status,
          status = _extData$status === undefined ? '' : _extData$status,
          _extData$code = extData.code,
          code = _extData$code === undefined ? '' : _extData$code,
          _extData$traceId = extData.traceId,
          traceId = _extData$traceId === undefined ? '' : _extData$traceId,
          _extData$duration = extData.duration,
          duration = _extData$duration === undefined ? '' : _extData$duration,
          _extData$msg = extData.msg,
          msg = _extData$msg === undefined ? '' : _extData$msg,
          _extData$params = extData.params,
          params = _extData$params === undefined ? '' : _extData$params;

      this.send({
          t1: 'monitor',
          t2: 'api',
          t3: type,
          d1: url.replace(/^(https?:)?/, '').replace(/\?.*$/, ''), //接口url
          d2: status + '-' + code, // http状态码
          d3: duration + '-' + traceId, //接口耗时
          d4: msg, //错误信息
          d5: params //请求参数
      });
  };

  function responseData(res, url, duration, status, traceId) {
      if (!res.success || window.FEDLOG_ENABLE_API_SUCCESS) {
          FEDLOG.requestLog(url, res.success ? 'requestSuccess' : 'requestError', {
              status: status,
              duration: duration,
              traceId: traceId,
              code: res.code,
              msg: res.msg,
              type: 'xhr'
          });
      }
  }

  FEDLOG.injectXhrHook = function () {
      if (typeof window.XMLHttpRequest !== 'function' || !window.addEventListener) { return; }
      var oldXMLHttpRequest = window.XMLHttpRequest;

      window.XMLHttpRequest = function XMLHttpRequest(props) {
          var xhr = new oldXMLHttpRequest(props);
          var send = xhr.send,
              open = xhr.open,
              begin,
              url;
          var isFEDLOG;

          xhr.open = function (method0, url0) {
              var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
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
              if (!url || xhr.readyState !== 4) { return; }
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
              } catch (ex) {}
              if (!xhr.responseType || xhr.responseType === 'text') {
                  res = parseResponse$1.parseResponse(xhr.responseText, status);
                  responseData(res, url, time, status, traceId);
              } else if (xhr.responseType === 'blob') {
                  var reader = new FileReader();
                  reader.readAsText.apply(reader, [xhr.response]);
                  reader.onloadend = function () {
                      res = parseResponse$1.parseResponse(reader.result, status);
                      responseData(res, url, time, status, traceId);
                  };
              }
          });

          return xhr;
      };
  };

  /**
   * hack Fetch
   * 搜集错误接口，响应时间超过500ms的正确接口，或者根据开关开启所有正确接口
   */

  FEDLOG.requestLog = function (url, type) {
      var extData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var _extData$status = extData.status,
          status = _extData$status === undefined ? '' : _extData$status,
          _extData$code = extData.code,
          code = _extData$code === undefined ? '' : _extData$code,
          _extData$traceId = extData.traceId,
          traceId = _extData$traceId === undefined ? '' : _extData$traceId,
          _extData$duration = extData.duration,
          duration = _extData$duration === undefined ? '' : _extData$duration,
          _extData$msg = extData.msg,
          msg = _extData$msg === undefined ? '' : _extData$msg,
          _extData$params = extData.params,
          params = _extData$params === undefined ? '' : _extData$params;

      this.send({
          t1: 'monitor',
          t2: 'api',
          t3: type,
          d1: url.replace(/^(https?:)?/, '').replace(/\?.*$/, ''), //接口url
          d2: status + '-' + code, // http状态码
          d3: duration + '-' + traceId, //接口耗时
          d4: msg, //错误信息
          d5: params //请求参数
      });
  };

  window.FEDLOG_MAX_API_LATENCY = 500;
  window.FEDLOG_SAMPLING_API = 0.2;
  FEDLOG.injectFetchHook = function () {
      if (typeof window.fetch !== 'function') { return; }
      var oldFetch = window.fetch;
      var makeLog = function makeLog(reqClone, url, info, args, type) {
          var rbody = args;
          if (reqClone) {
              reqClone.text().then(function (res) {
                  if (res) {
                      try {
                          rbody = JSON.parse(res);
                      } catch (e) {
                          rbody = res;
                      }
                  }
                  FEDLOG.requestLog(url, type, _extends({}, info, {
                      params: JSON.stringify(rbody)
                  }));
              }).catch(function () {});
          } else {
              FEDLOG.requestLog(url, type, _extends({}, info, {
                  params: JSON.stringify(rbody)
              }));
          }
      };
      window.fetch = function fetch(arg0, setting) {
          var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          // method: 'HEAD' 或 mode: 'no-cors' 的请求不监听
          if (setting && (setting.method === 'HEAD' || setting.mode === 'no-cors')) {
              return oldFetch.apply(window, args);
          }

          // 请求的 url
          var url = (arg0 && typeof arg0 !== 'string' ? arg0.url : arg0) || '';

          // 跳过非接口
          if (url.match(/\.(js|css|png|jpg|gif|jpeg|webp)(\?.*)?$/)) {
              return oldFetch.apply(window, args);
          }
          var begin = Date.now();
          // 获取请求参数
          var reqClone = "";
          if (args[0] instanceof Request) {
              reqClone = args[0].clone();
          }
          return oldFetch.apply(window, args).then(function (origin) {
              //polyfill未必有clone方法
              var response = origin.clone ? origin.clone() : origin;

              parseResponse$1.getResponseBody(response, setting || {}).then(function (resInfo) {
                  var time = Date.now() - begin;
                  var res = {};
                  if (resInfo && typeof resInfo == 'object') { res = resInfo; }
                  var status = response.status;
                  res = parseResponse$1.parseResponse(res, status);
                  var traceId = '';
                  try {
                      traceId = response.headers.get('eagleeye-traceid') || response.headers.get('x-eagleeye-id');
                  } catch (ex) {}
                  var shouldUpload = FEDLOG.env != 'dev' && time > window.FEDLOG_MAX_API_LATENCY && Math.random() < window.FEDLOG_SAMPLING_API;
                  if (!res.success || shouldUpload || window.FEDLOG_ENABLE_API_SUCCESS) {
                      var type = res.success ? 'requestSuccess' : 'requestError';
                      var info = {
                          status: status,
                          duration: time,
                          traceId: traceId,
                          code: res.code,
                          msg: res.msg,
                          body: res.body,
                          type: 'fetch'
                      };
                      makeLog(reqClone, url, info, args, type);
                  }
              }).catch(function () {});

              return origin;
          }, function (err) {
              //https://github.com/github/fetch/issues/201
              // 大部分原因是请求的返回header没有Access-Control-Allow-Origin: *
              var info = {
                  status: 401,
                  duration: Date.now() - begin,
                  msg: err.stack || err.message,
                  type: 'fetch'
              };
              makeLog(reqClone, url, info, args, 'requestError');
              console.error(err);
              return err;
          });
      };
  };

  /**
   * 发送pv埋点
   * {
          t1: 'bu',
          t2: 'pv'
      }
   */

  FEDLOG.PV = function (type, msg) {
      // 文档：http://wicg.github.io/netinfo
      var nrtt = 0,
          net = 0;
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
          d3: window.screen.width + 'x' + window.screen.height,
          d4: window.innerWidth + 'x' + window.innerHeight
      });
  };

  /**
   * 检查页面白屏，横向，纵向18个点， > 17/18就认为白屏上报
   */

  FEDLOG.blank = function () {
      if (!document.elementsFromPoint) {
          return;
      }
      var wrapperCls = ['body', 'html'];
      var nothingCnt = 0;
      var totalCnt = 0;
      var getSel = function getSel(el) {
          if (!el) { return ''; }
          return el.classList && el.classList[0] || el.id || el.localName;
      };
      var isWrap = function isWrap(el) {
          if (!el) { return; }
          totalCnt++;
          if (wrapperCls.indexOf(getSel(el)) >= 0) {
              nothingCnt++;
          }
      };
      var elementsX = void 0,
          elementsY = void 0;
      for (var i = 1; i < 10; i++) {
          elementsX = document.elementsFromPoint(window.innerWidth * i / 10, window.innerHeight / 2);
          elementsY = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight * i / 10);
          isWrap(elementsX[0]);
          isWrap(elementsY[0]);
      }
      if (totalCnt - nothingCnt < 2 && !this._sendBlank) {
          var centerEl = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
          this.send({
              t1: 'monitor',
              t2: 'blank',
              d1: getSel(centerEl[0]),
              d2: totalCnt + '-' + nothingCnt,
              d3: window.screen.width + 'x' + window.screen.height,
              d4: window.innerWidth + 'x' + window.innerHeight
          });
          this._sendBlank = true;
      }
  };

  /**
   * performance.timing 
  d5 - DNS查询耗时: domainLookupEnd - domainLookupStart
  t3 - TCP建连耗时: connectEnd - connectStart
  d1 - Request请求耗时: responseStart - requestStart
  d2 - Response响应耗时: responseEnd - responseStart
  d3 - DOM解析渲染耗时:（双击可下钻查看细分阶段耗时）domContentLoadedEventEnd - domLoading
  d4 - DOM解析耗时: loadEventStart（domComplete） - domContentLoadedEventEnd
  // domready事件回调耗时: domContentLoadedEventEnd-domContentLoadedEventStart
  // onload时间: loadEventStart-fetchStart

  element timing: https://chromestatus.com/features/6230814637424640, env: chrome>= 77
  first-input: https://www.chromestatus.com/features/5149663191629824, env: chrome>= 77
  first-paint, env: chrome>= 60
   */
  FEDLOG.timing = function () {
      if (this.navigationStart) {
          var timingTimer = function timingTimer() {
              var timer = setTimeout(function () {
                  var _performance$timing = performance.timing,
                      fetchStart = _performance$timing.fetchStart,
                      connectStart = _performance$timing.connectStart,
                      requestStart = _performance$timing.requestStart,
                      responseEnd = _performance$timing.responseEnd,
                      responseStart = _performance$timing.responseStart,
                      loadEventStart = _performance$timing.loadEventStart,
                      domLoading = _performance$timing.domLoading,
                      domContentLoadedEventStart = _performance$timing.domContentLoadedEventStart;

                  if (domContentLoadedEventStart) {
                      FEDLOG.send({
                          t1: 'exp',
                          t2: 'timing',
                          t3: requestStart - connectStart, // tcp时间
                          d1: responseStart - requestStart, //请求时间
                          d2: responseEnd - responseStart, //响应时间
                          d3: domContentLoadedEventStart - domLoading, //DOM加载
                          d4: loadEventStart - domContentLoadedEventStart, //DOM渲染
                          d5: connectStart - fetchStart // Appcache + DNS时间
                      });
                      clearTimeout(timer);
                  } else {
                      clearTimeout(timer);
                      timingTimer();
                  }
              }, 3e3);
          };
          onload(timingTimer);
      }
  };

  /**
   * DOMContentLoaded 事件回掉
   * @param {*} callback function
   */
  function domload (callback) {
      if (document.readyState === 'interactive') {
          callback();
      } else {
          document.addEventListener('DOMContentLoaded', callback);
      }
  }

  /**
   * 通过检查dom元素变化比例来确认是不是内容渲染出来
   * DOM变化率 > 4
   */
  var MutationRadio = 4;
  FEDLOG.FMP = function () {
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      if (!MutationObserver) {
          return;
      }

      var changeBaseNum = 0;
      var begin = Date.now();
      var observer = new MutationObserver(function (mutationsList) {
          var mulength = mutationsList.length;
          if (changeBaseNum > 0 && mulength / changeBaseNum > MutationRadio) {
              window.FEDLOG_FMP = Date.now() - begin;
              observer.disconnect();
          }
          changeBaseNum = mulength;
      });
      domload(function () {
          var container = document.querySelector("#ice-container") || document.body;
          observer.observe(container, {
              attributes: true,
              childList: true,
              characterData: true,
              subtree: true
          });
      });
      setTimeout(function () {
          observer.disconnect();
      }, 8e3);
  };

  /**
   * 宏任务或者空闲时掉用，低优先级
   * @param {*} callback 
   * @param {*} timeout 
   */
  function requestIdleCallback$1 (callback, timeout) {
      if (window.requestIdleCallback) {
          requestIdleCallback(callback, {
              timeout: timeout || 1000
          });
      } else {
          setTimeout(callback, 0);
      }
  }

  /**
  element timing: https://chromestatus.com/features/6230814637424640, env: chrome>= 77
  first-input: https://www.chromestatus.com/features/5149663191629824, env: chrome>= 77
  first-paint, env: chrome>= 60
   */
  FEDLOG.fp = function () {
      var FMP = 0; //<div elementtiming="hero" class="..." >
      if (!!window.PerformanceElementTiming) {
          var entryType = 'element';
          var observer = new PerformanceObserver(function (list) {
              var perfEntries = list.getEntries();
              FMP = perfEntries[0];
              observer.disconnect();
          });
          observer.observe({ entryTypes: [entryType] });
          watchPageVisiblityChange(function (isVisible) {
              if (!isVisible) {
                  observer.disconnect();
              } else {
                  requestIdleCallback$1(function () {
                      observer.observe({ entryTypes: [entryType] });
                  }, 50);
              }
          });
      }
      if (this.navigationStart) {
          var handleFp = function handleFp() {
              var fcpTimer = setTimeout(function () {
                  var FP = performance.getEntriesByName('first-paint')[0];
                  var FCP = performance.getEntriesByName('first-contentful-paint')[0];
                  if (window.FEDLOG_TTI) {
                      var FCPTime = FCP ? formatTime(FCP.startTime) : 0;
                      var FMPTime = FMP ? formatTime(FMP.startTime) : window.FEDLOG_FMP || 0;
                      var TTITime = formatTime(window.FEDLOG_TTI > FCPTime ? window.FEDLOG_TTI : FCPTime) || FCPTime;
                      var TBT = window.FEDLOG_TBT ? formatTime(window.FEDLOG_TBT) : 0;

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
                      clearTimeout(fcpTimer);
                  } else {
                      handleFp();
                  }
              }, 3e3);
          };
          onload(handleFp);
      }
  };

  /**
   * 卡顿，监控浏览器主进程持续执行时间大于50ms的情况 
   * https://www.w3.org/TR/longtasks/
   * https://www.chromestatus.com/features/5738471184400384
   * tti 参考：https://web.dev/tti/
   * env: chrome>=58
   */

  var MAX_LONG_TASK_PER_PAGE = 100;
  var MIN_LONG_TASK_DURATION = 500;
  var TTI_QUITE_WINDOW = 3000;
  var TBT_BASE = 50;
  FEDLOG.longTask = function () {
      if (!window.PerformanceLongTaskTiming) {
          return;
      }
      FEDLOG._lastLongtaskSelList = [];
      window.FEDLOG_TBT = 0;

      var timmer,
          mileage = performance.now();
      var observer = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {

              // 最后一次出现longtask时间记做tti
              mileage = performance.now();
              clearTimeout(timmer);
              timmer = setTimeout(function () {
                  window.FEDLOG_TTI = mileage;
                  if (entry.duration > TBT_BASE) {
                      window.FEDLOG_TBT += entry.duration - TBT_BASE;
                  }
              }, TTI_QUITE_WINDOW);

              if (entry.duration > MIN_LONG_TASK_DURATION && FEDLOG._lastLongtaskSelList.length < MAX_LONG_TASK_PER_PAGE) {
                  var e = getLastAction();
                  requestIdleCallback$1(function () {
                      // 最后操作的节点的CSS选择器
                      var sel = e ? genSelector$1(e.path || e.target) : '';
                      // 页面同一个sel 只发送一次
                      if (FEDLOG._lastLongtaskSelList.indexOf(sel) < 0) {
                          FEDLOG.send({
                              t1: 'exp',
                              t2: 'longtask',
                              d1: formatTime(entry.startTime), // 开始时间
                              d2: formatTime(entry.duration), // 持续时间
                              d3: sel
                          });
                          FEDLOG._lastLongtaskSelList.push(sel);
                      }
                  });
              }
          });
          if (FEDLOG._lastLongtaskSelList.length >= MAX_LONG_TASK_PER_PAGE) {
              observer.disconnect();
          }
      });

      setTimeout(function () {
          window.FEDLOG_TTI = mileage;
      }, TTI_QUITE_WINDOW * 7);

      observer.observe({ entryTypes: ["longtask"] });

      watchPageVisiblityChange(function (isVisible) {
          if (!isVisible) {
              observer.disconnect();
          } else {
              setTimeout(function () {
                  observer.observe({ entryTypes: ["longtask"] });
              }, 100);
          }
      });
  };

  /**
  https://wicg.github.io/event-timing/
   */
  FEDLOG.fid = function () {
      try {
          var entryType = 'first-input';
          var observer = new PerformanceObserver(function (list, obs) {
              var firstInput = list.getEntries()[0];
              if (firstInput) {
                  // Measure the delay to begin processing the first input event.
                  var FID = firstInput.processingStart - firstInput.startTime;
                  // Measure the duration of processing the first input event.
                  // Only use when the important event handling work is done synchronously in the handlers.
                  var FIDU = firstInput.duration;
                  // console.log(FID, FIDU)
                  if (FID > 50 || FIDU > 50) {
                      FEDLOG.send({
                          t1: 'bu',
                          t2: 'custom',
                          t3: 'fid',
                          d1: FID ? formatTime(FID) : 0,
                          d2: FIDU ? formatTime(FIDU) : 0
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
          });
      } catch (e) {}
  };

  /**
  lcp: https://web.dev/lcp/
  good | need improvement | poor
  ----2.5s---------------4.0s----
   */
  FEDLOG.lcp = function () {
      var entryType = 'largest-contentful-paint';
      var observer = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (item) {
              FEDLOG.send({
                  t1: 'exp',
                  t2: 'fe',
                  t3: 'lcp',
                  d1: item.startTime,
                  d2: item.size,
                  d3: item.element ? genSelector$1(item.element) : ''
              });
          });
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
      });
  };

  /**
  cls: https://web.dev/cls/
  good | need improvement | poor
  ----0.1---------------0.25----
   */
  FEDLOG.cls = function () {
      var entryType = 'layout-shift';
      var observer = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (item) {
              if (item.sources) {
                  var d3 = item.sources[0] && genSelector$1(item.sources[0].node);
                  var d4 = item.sources[1] && genSelector$1(item.sources[1].node);
                  var d5 = item.sources[2] && genSelector$1(item.sources[2].node);
                  FEDLOG.send({
                      t1: 'exp',
                      t2: 'fe',
                      t3: 'cls',
                      d1: item.startTime,
                      d2: item.value,
                      d3: d3, d4: d4, d5: d5
                  });
              }
          });
      });
      observer.observe({ entryTypes: [entryType] });

      watchPageVisiblityChange(function (isVisible) {
          if (!isVisible && observer) {
              observer.disconnect();
          } else {
              requestIdleCallback$1(function () {
                  observer.observe({ entryTypes: [entryType] });
              }, 50);
          }
      });
  };

  FEDLOG.injectJsError();

  FEDLOG.injectXhrHook();

  FEDLOG.PV();

  FEDLOG.timing();

  FEDLOG.fmp();
  FEDLOG.fp();

  FEDLOG.longTask();

  /**
   * 采样率，默认1
   * FEDLOG_SAMPLING 全局采样率
   */
  window.FEDLOG_SAMPLING_cls = 0.5;
  window.FEDLOG_SAMPLING_lcp = 0.5;
  if ("PerformanceObserver" in window) {
      ['lcp', 'cls'].forEach(function (item) {
          var sampling = 1;
          if (window['FEDLOG_SAMPLING_' + item] !== undefined) {
              sampling = window['FEDLOG_SAMPLING_' + item];
          } else if (window.FEDLOG_SAMPLING !== undefined) {
              sampling = FEDLOG_SAMPLING;
          }
          if (Math.random() < sampling) {
              FEDLOG[item]();
          }
      });
  }

}());

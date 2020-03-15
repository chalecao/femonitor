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
    if (request.originResponse) return response;
    if (request.method === 'jsonp') return response.json();
    const accept = request.headers && request.headers['accept'] || 'text';
    let responseType = response.headers && response.headers.get ?
        response.headers.get('content-type') : null;

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
        } catch (e) { }
    }
    if (typeof res !== 'object') return {};
    return {
        msg: getMessage(res),
        code: getCode(res),
        success: isSuccess(res, httpStatus)
    }
}

export default {
    parseResponse,
    isSuccess,
    getResponseBody,
    getMessage
}

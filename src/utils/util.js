/**
 * performance  的时间3350.304999999935，需要格式化下
 * @param {*} time 
 */
export const formatTime = (time) => {
    return `${time}`.split(".")[0]
}

export function getShortUrl(url, MaxUrlLength = 2000) {
    if (!url) {
        return '';
    }
    if (url.length < MaxUrlLength) {
        return url;
    }
    return url.substr(0, 2000) + '...';
}

export function isCumtomData(t2) {
    return t2 == 'custom';
}
const genSelector = function(path){
    return path.reverse().filter(function(el){
        return el !== window && el !== document;
    }).map(function(el){
        var selector;
        if(el.id){
            selector = `#${el.id}`;
        }else if(el.className && typeof el.className === 'string'){
            selector = '.' + el.className.split(' ').filter(function(item){return !!item}).join('.');
        }else{
            selector = el.nodeName;
        }
        return selector;
    }).join(' ');
}

export default function(pathOrTargetEl){
    if(Object.prototype.toString.apply(pathOrTargetEl) === '[object Array]'){
        return genSelector(pathOrTargetEl);
    }else{
        var path = [];
        var el = pathOrTargetEl;
        while(el){
            path.push(el);
            el = el.parentNode;
        }
        return genSelector(path);
    }
}
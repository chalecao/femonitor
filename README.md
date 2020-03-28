## 说明
四天打造企业私有化前端监控系统课程代码，内容齐全作为参考。
在线课程：
- [云课堂-四天打造企业私有化前端监控系统](https://study.163.com/course/courseMain.htm?courseId=1209759805&share=2&shareId=400000000351011)
- [思否课堂-四天打造企业私有化前端监控系统](https://segmentfault.com/ls/1650000022010770?r=bPrrH2)

### FMP采集
```
<div elementtiming="hero" class="..." >
```
通过elementtiming属性定义页面的核心元素（Hero Element），会计算该元素出现的时间作为FMP
ps：chrome 77及以上支持

### 兼容性
查询：https://chromestatus.com/features/6230814637424640

## FAQ
1. 接口请求实现？
拦截XMLHTTPRequest，解析响应结果。


import './core'
import './monitor/jserror'
import './monitor/xhr'
import './monitor/fetch'
import './monitor/pv'
import './monitor/screenBlank'
import './monitor/timing'
import './monitor/longTask'

FEDLOG.injectJsError();

FEDLOG.injectXhrHook();

FEDLOG.PV();

FEDLOG.timing();

FEDLOG.longTask();
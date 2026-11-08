# Included in the immutable matrix by probe.py. Failures are never retried.
import threading

def process_sample():
    try:
        import psutil
        children=psutil.Process().children(recursive=True)
        rows=[]
        for process in children:
            try:
                m=process.memory_info()
                rows.append({'pid':process.pid,'ppid':process.ppid(),'name':process.name(),'rss':m.rss,'threads':process.num_threads(),'fds':process.num_fds(),'status':process.status(),'cpu':process.cpu_times()._asdict()})
            except (psutil.NoSuchProcess,psutil.AccessDenied): pass
        cgroup={}
        for name in ['memory.current','memory.max','memory.events','pids.current','memory/memory.usage_in_bytes','memory/memory.limit_in_bytes','memory/memory.failcnt','memory/memory.oom_control']:
            path=Path('/sys/fs/cgroup')/name
            if path.exists(): cgroup[name]=path.read_text().strip()
        diagnostic('process-sample',json.dumps({'processes':rows,'cgroup':cgroup}))
    except Exception as error: diagnostic('process-sample-unavailable',str(error))

def periodic_samples():
    while True:
        process_sample();time.sleep(1)
if OPTIONS['telemetry']=='on': threading.Thread(target=periodic_samples,daemon=True).start()

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const signs = [
  ['K//THE EMRLD','SIGNAL / MEMORY / MUSIC'],
  ['TECHOPS//L3','INCIDENT COMMAND // QUEUE:015'],
  ['DHCP//TRACE','LOCATE → ISOLATE → RECOVER'],
  ['RESIDUAL//RT','EVIDENCE BEFORE CONFIDENCE'],
  ['P2 RECOVERY','PRODUCTION NEVER SLEEPS'],
  ['NIGHT SHIFT','FACTORY NET // APSE NODE'],
];

export default function GalleryExperience() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const returned = params.get('spawn') === 'console';
  const [boot, setBoot] = useState(!returned);
  const [notice, setNotice] = useState(returned ? 'SESSION CLOSED // RETURNED TO APSE CONSOLE' : '');
  useEffect(() => { const t = window.setTimeout(() => setNotice(''), 3600); return () => clearTimeout(t); }, []);
  return <div className="kg-world">
    {boot && <div className="kg-boot"><div className="kg-logo">K//THE EMRLD</div><pre>{'☿  SOLVE / COAGULA  ☉\\n> mounting gallery ........ ok\\n> TECHOPS telemetry ....... ok\\n> apse K Terminal link .... armed\\n> RESIDUAL//RT ............ online'}</pre><button onClick={() => setBoot(false)}>ENTER THE EMRLD</button></div>}
    <div className="kg-sky">☽ · ✦　01001011　☿　THE EMRLD // NIGHT SIGNAL　♄　✧</div>
    <div className="kg-city">
      <aside>TECHOPS<br/><small>INCIDENT//RESPONSE</small></aside>
      <main className="kg-cathedral">
        <header>K//THE EMRLD GALLERY</header>
        <div className="kg-rose">◇<span>☿</span>◇</div>
        <div className="kg-nave">
          {signs.map((s,i)=><div className={'kg-sign s'+i} key={s[0]}><b>{s[0]}</b><small>{s[1]}</small></div>)}
          <div className="kg-pillar p1">▓▒░<br/>☿<br/>▓▒░<br/>♄<br/>▓▒░</div>
          <div className="kg-pillar p2">░▒▓<br/>☉<br/>░▒▓<br/>☽<br/>░▒▓</div>
          <div className="kg-floor">RESIDUAL　◆　RAC　◆　TECHOPS　◆　CTF</div>
          <div className="kg-console">
            <div className="kg-monitor"><b>K TERMINAL // APSE NODE 01</b><pre>{'k@theemrld:~$ _\\n[NET] FACTORY-LAN\\n[OPS] QUEUE:015\\n[AI ] RESIDUAL//RT\\n[MUS] SIGNAL READY'}</pre></div>
            <div className="kg-keys">▁▁▁▁▁▁▁▁▁▁▁▁▁</div>
            <button onClick={() => nav('/terminal?from=gallery')}>[ E ] ACCESS K TERMINAL</button>
          </div>
        </div>
      </main>
      <aside>K//OPS<br/><small>DHCP TRACE // P2</small></aside>
    </div>
    {notice && <div className="kg-notice">{notice}</div>}
    <footer><span>K//GALLERY RT-16</span><span>APSE NODE: ONLINE</span><span>☿ SOLVE / COAGULA</span></footer>
    <style>{'.kg-world{position:fixed;inset:0;background:#050308;color:#00ff66;font-family:monospace;overflow:hidden}.kg-world:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 3px);z-index:20}.kg-boot{position:absolute;inset:0;z-index:50;background:#050308ee;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}.kg-logo{font-size:clamp(32px,8vw,88px);color:#b000ff;text-shadow:0 0 25px #b000ff;letter-spacing:.12em}.kg-boot pre{line-height:1.8;color:#00ff66}.kg-boot button,.kg-console button{background:#07030b;color:#00ff66;border:1px solid #00ff66;padding:10px 18px;font:inherit;cursor:pointer;box-shadow:0 0 18px #00ff6633}.kg-sky{height:10%;padding:18px;text-align:center;color:#77389b;letter-spacing:.2em;font-size:10px}.kg-city{height:85%;display:grid;grid-template-columns:1fr minmax(330px,60vw) 1fr;align-items:end;perspective:900px}.kg-city>aside{height:72%;padding:18px;background:repeating-linear-gradient(90deg,#090610 0 18px,#13091d 18px 20px);border:1px solid #35104d;color:#b000ff;font-size:18px}.kg-city>aside small{color:#00ffff;font-size:8px}.kg-cathedral{height:100%;position:relative;background:linear-gradient(#12071a,#08050b 65%,#030304);border:2px solid #6b2b91;box-shadow:0 0 45px #b000ff22,inset 0 0 70px #000}.kg-cathedral header{text-align:center;padding:10px;color:#d6b2ff;letter-spacing:.25em;border-bottom:1px solid #54206f;font-size:11px}.kg-rose{position:absolute;top:48px;left:50%;transform:translateX(-50%);font-size:42px;color:#b000ff;text-shadow:0 0 18px #b000ff;z-index:2}.kg-rose span{color:#00ff66;font-size:18px}.kg-nave{position:absolute;inset:90px 5% 4%;clip-path:polygon(18% 0,82% 0,100% 100%,0 100%);background:linear-gradient(90deg,#0a0610,#120b17 20%,#060508 50%,#120b17 80%,#0a0610)}.kg-sign{position:absolute;width:25%;padding:7px;border:1px solid #00ffff;background:#05030a;color:#00ffff;box-shadow:0 0 12px #00ffff22;font-size:9px;z-index:3}.kg-sign small{display:block;color:#00ff66;font-size:6px;margin-top:4px}.s0{left:4%;top:12%}.s1{right:4%;top:12%}.s2{left:1%;top:38%}.s3{right:1%;top:38%}.s4{left:0;top:66%}.s5{right:0;top:66%}.kg-pillar{position:absolute;top:4%;bottom:8%;width:8%;border:1px solid #7a3b91;background:linear-gradient(90deg,#12091a,#2b1236,#0b0710);color:#b56ed8;text-align:center;padding-top:8%;line-height:2.1;z-index:2}.p1{left:31%}.p2{right:31%}.kg-floor{position:absolute;left:18%;right:18%;bottom:0;height:38%;transform:rotateX(65deg);transform-origin:bottom;background:repeating-linear-gradient(90deg,#09070b 0 28px,#151018 28px 29px);color:#3f7056;text-align:center;padding-top:18px;font-size:7px}.kg-console{position:absolute;left:50%;top:19%;transform:translateX(-50%);z-index:8;text-align:center;filter:drop-shadow(0 0 12px #00ff6633)}.kg-monitor{width:240px;min-height:145px;border:8px ridge #2c2630;background:#020403;padding:10px;color:#00ff66;text-align:left;font-size:9px}.kg-monitor b{color:#b000ff}.kg-monitor pre{line-height:1.55}.kg-keys{color:#777;margin:3px}.kg-console button{font-size:9px}.kg-notice{position:absolute;top:15%;left:50%;transform:translateX(-50%);z-index:30;border:1px solid #00ff66;background:#030604dd;padding:10px 18px;font-size:10px}.kg-world footer{position:absolute;bottom:0;left:0;right:0;height:5%;display:flex;justify-content:space-between;align-items:center;padding:0 14px;border-top:1px solid #3b1750;background:#030205;color:#6f9c83;font-size:8px;z-index:15}@media(max-width:700px){.kg-city{grid-template-columns:6vw 1fr 6vw}.kg-city>aside{font-size:0;padding:2px}.kg-city>aside small{display:none}.kg-sign{width:31%;font-size:7px}.kg-monitor{width:185px;min-height:120px}.kg-pillar{display:none}}'}</style>
  </div>;
}

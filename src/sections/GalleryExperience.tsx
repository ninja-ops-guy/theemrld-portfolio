import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KBandSprite from './KBandSprite';

const SIGNS = [
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
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState(returned ? 'SESSION CLOSED // RETURNED TO APSE CONSOLE' : '');

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => (n + 1) % 256), 220);
    const t = window.setTimeout(() => setNotice(''), 3200);
    return () => { window.clearInterval(id); window.clearTimeout(t); };
  }, []);

  const performerFrames = [[0,1,9,21],[2,8,18,20],[3,14,22,3],[10,16,19,23]];

  return <div className="kg-world">
    {boot && <div className="kg-boot">
      <div className="kg-logo">K//THE EMRLD</div>
      <pre>{'☿  SOLVE / COAGULA  ☉\n> mounting gallery ........ ok\n> TECHOPS telemetry ....... ok\n> clone ensemble .......... synced\n> apse K Terminal link .... armed'}</pre>
      <button onClick={() => setBoot(false)}>ENTER THE EMRLD</button>
    </div>}

    <div className="kg-sky">☽ · ✦　01001011　☿　THE EMRLD // NIGHT SIGNAL　♄　✧</div>
    <div className="kg-city">
      <aside>TECHOPS<br/><small>INCIDENT//RESPONSE</small></aside>
      <main className="kg-cathedral">
        <header>K//THE EMRLD GALLERY</header>
        <div className="kg-rose">◇<span>☿</span>◇</div>
        <div className="kg-nave">
          {SIGNS.map((s,i)=><div className={'kg-sign s'+i} key={s[0]}><b>{s[0]}</b><small>{s[1]}</small></div>)}

          <figure className="kg-relic relic-left">
            <img src={import.meta.env.BASE_URL+'assets/k-glimoire-1.webp'} alt="K signal scripture I" />
            <figcaption>SIGNAL SCRIPTURE // 01</figcaption>
          </figure>
          <figure className="kg-relic relic-right">
            <img src={import.meta.env.BASE_URL+'assets/k-glimoire-2.webp'} alt="K signal scripture II" />
            <figcaption>SIGNAL SCRIPTURE // 02</figcaption>
          </figure>

          <div className="kg-console">
            <div className="kg-monitor"><b>K TERMINAL // APSE NODE 01</b><pre>{'k@theemrld:~$ _\n[NET] FACTORY-LAN\n[OPS] QUEUE:015\n[AI ] RESIDUAL//RT\n[MUS] SIGNAL READY'}</pre></div>
            <div className="kg-keys">▁▁▁▁▁▁▁▁▁▁▁▁▁</div>
            <button onClick={() => nav('/terminal?from=gallery')}>[ E ] ACCESS K TERMINAL</button>
          </div>

          <div className="kg-band">
            <div className="kg-band-title">K//CLONE ENSEMBLE · LIVE IN THE NAVE</div>
            <div className="kg-band-row">
              {performerFrames.map((frames,i)=><div className="kg-band-member" key={i}>
                <KBandSprite cell={frames[tick % frames.length]} size={72} glow />
                <small>{['VOCALS','CTRL','KEYS','HYPE'][i]}//K-0{i+1}</small>
              </div>)}
            </div>
          </div>
        </div>
      </main>
      <aside>K//OPS<br/><small>DHCP TRACE // P2</small></aside>
    </div>

    {notice && <div className="kg-notice">{notice}</div>}
    <footer><span>K//GALLERY RT-16</span><span>APSE NODE: ONLINE</span><span>☿ SOLVE / COAGULA</span></footer>

    <style>{`
      .kg-world{position:fixed;inset:0;background:#050308;color:#00ff66;font-family:'Share Tech Mono',ui-monospace,monospace;overflow:hidden}.kg-world:after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 3px);z-index:20}
      .kg-boot{position:absolute;inset:0;z-index:50;background:#050308f2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}.kg-logo{font-size:clamp(32px,8vw,88px);color:#b000ff;text-shadow:0 0 25px #b000ff;letter-spacing:.12em}.kg-boot pre{line-height:1.8}.kg-boot button,.kg-console button{background:#07030b;color:#00ff66;border:1px solid #00ff66;padding:10px 18px;font:inherit;cursor:pointer;box-shadow:0 0 18px #00ff6633}
      .kg-sky{height:10%;padding:18px;text-align:center;color:#77389b;letter-spacing:.2em;font-size:10px}.kg-city{height:85%;display:grid;grid-template-columns:1fr minmax(360px,62vw) 1fr;align-items:end;perspective:900px}.kg-city>aside{height:72%;padding:18px;background:repeating-linear-gradient(90deg,#090610 0 18px,#13091d 18px 20px);border:1px solid #35104d;color:#b000ff;font-size:18px}.kg-city>aside small{color:#00ffff;font-size:8px}
      .kg-cathedral{height:100%;position:relative;background:linear-gradient(#12071a,#08050b 65%,#030304);border:2px solid #6b2b91;box-shadow:0 0 45px #b000ff22,inset 0 0 70px #000}.kg-cathedral header{text-align:center;padding:10px;color:#d6b2ff;letter-spacing:.25em;border-bottom:1px solid #54206f;font-size:11px}.kg-rose{position:absolute;top:48px;left:50%;transform:translateX(-50%);font-size:42px;color:#b000ff;text-shadow:0 0 18px #b000ff;z-index:2}.kg-rose span{color:#00ff66;font-size:18px}.kg-nave{position:absolute;inset:90px 4% 4%;clip-path:polygon(14% 0,86% 0,100% 100%,0 100%);background:linear-gradient(90deg,#0a0610,#120b17 20%,#060508 50%,#120b17 80%,#0a0610)}
      .kg-sign{position:absolute;width:23%;padding:6px;border:1px solid #00ffff;background:#05030add;color:#00ffff;box-shadow:0 0 12px #00ffff22;font-size:8px;z-index:5}.kg-sign small{display:block;color:#00ff66;font-size:6px;margin-top:3px}.s0{left:3%;top:8%}.s1{right:3%;top:8%}.s2{left:1%;top:31%}.s3{right:1%;top:31%}.s4{left:1%;top:55%}.s5{right:1%;top:55%}
      .kg-relic{position:absolute;top:18%;width:18%;margin:0;border:1px solid #6b2b91;background:#06030a;padding:4px;z-index:4;box-shadow:0 0 18px #b000ff33}.kg-relic img{display:block;width:100%;height:120px;object-fit:cover;filter:contrast(1.16) saturate(.72) brightness(.8);image-rendering:auto}.kg-relic figcaption{padding-top:4px;color:#b77ad6;font-size:6px;letter-spacing:.08em}.relic-left{left:12%;transform:rotate(-3deg)}.relic-right{right:12%;transform:rotate(3deg)}
      .kg-console{position:absolute;left:50%;top:13%;transform:translateX(-50%);z-index:8;text-align:center;filter:drop-shadow(0 0 12px #00ff6633)}.kg-monitor{width:230px;min-height:136px;border:8px ridge #2c2630;background:#020403;padding:9px;color:#00ff66;text-align:left;font-size:8px}.kg-monitor b{color:#b000ff}.kg-monitor pre{line-height:1.5}.kg-keys{color:#777;margin:3px}.kg-console button{font-size:8px}
      .kg-band{position:absolute;left:10%;right:10%;bottom:5%;border:1px solid #00ff66;background:rgba(0,8,4,.82);z-index:9;box-shadow:0 0 20px #00ff6622}.kg-band-title{text-align:center;padding:5px;border-bottom:1px solid #00ff6633;color:#00ffff;font-size:7px;letter-spacing:.12em}.kg-band-row{display:grid;grid-template-columns:repeat(4,1fr);align-items:end;justify-items:center;padding:4px}.kg-band-member{display:flex;flex-direction:column;align-items:center;animation:kg-dance .55s steps(2) infinite}.kg-band-member:nth-child(2){animation-delay:.08s}.kg-band-member:nth-child(3){animation-delay:.14s}.kg-band-member:nth-child(4){animation-delay:.2s}.kg-band-member small{color:#00ff66;font-size:6px}@keyframes kg-dance{50%{transform:translateY(-3px)}}
      .kg-notice{position:absolute;top:14%;left:50%;transform:translateX(-50%);z-index:30;border:1px solid #00ff66;background:#030604dd;padding:10px 18px;font-size:10px}.kg-world footer{position:absolute;bottom:0;left:0;right:0;height:5%;display:flex;justify-content:space-between;align-items:center;padding:0 14px;border-top:1px solid #3b1750;background:#030205;color:#6f9c83;font-size:8px;z-index:15}
      @media(max-width:720px){.kg-city{grid-template-columns:4vw 1fr 4vw}.kg-city>aside{font-size:0;padding:1px}.kg-city>aside small{display:none}.kg-relic{width:20%}.kg-relic img{height:78px}.kg-monitor{width:184px;min-height:112px}.kg-band{left:4%;right:4%}.kg-band-member>div{width:54px!important;height:54px!important}.kg-band-member small{font-size:5px}.kg-sign{font-size:6px}.kg-sign small{display:none}}
    `}</style>
  </div>;
}

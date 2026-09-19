import { useEffect, useState } from 'react';

export type EvidenceItem = {
  label: string;
  state: 'IMPLEMENTED' | 'OBSERVED' | 'TESTED' | 'PENDING' | 'OPEN';
  summary: string;
  href?: string;
  action?: string;
};

const stateColor: Record<EvidenceItem['state'], string> = {
  IMPLEMENTED:'#9AAEFF', OBSERVED:'#7DE2A8', TESTED:'#7DE2A8', PENDING:'#D8B26E', OPEN:'#8899AA'
};

export default function EvidenceExplorer({title='EVIDENCE EXPLORER',items}:{title?:string;items:EvidenceItem[]}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!open) return;
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setOpen(false); };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[open]);
  return <>
    <button type="button" onClick={()=>setOpen(true)} className="font-label px-5 py-2 border border-[#5A78FF] text-[#5A78FF]" aria-haspopup="dialog">EVIDENCE EXPLORER →</button>
    {open&&<div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e)=>{if(e.target===e.currentTarget)setOpen(false)}} className="fixed inset-0 z-[250] flex items-end md:items-center justify-center" style={{background:'rgba(2,5,12,.84)',padding:'20px'}}>
      <div style={{width:'min(920px,100%)',maxHeight:'86vh',overflowY:'auto',background:'#07101E',border:'1px solid #263750',boxShadow:'0 30px 100px rgba(0,0,0,.5)'}}>
        <div className="flex items-center justify-between gap-4" style={{padding:'22px 24px',borderBottom:'1px solid #162235',position:'sticky',top:0,background:'#07101E',zIndex:1}}>
          <div><p className="font-label" style={{color:'#5A78FF'}}>AUDIT THE CLAIMS</p><h2 className="font-headline" style={{color:'#E8EDF3',fontSize:24,marginTop:5}}>{title}</h2></div>
          <button type="button" onClick={()=>setOpen(false)} aria-label="Close evidence explorer" className="font-label" style={{color:'#A9B6C5',padding:10}}>CLOSE ×</button>
        </div>
        <div style={{padding:'8px 24px 24px'}}>
          {items.map((item,i)=><article key={item.label} style={{padding:'22px 0',borderBottom:i<items.length-1?'1px solid #162235':undefined}}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-headline" style={{color:'#E8EDF3',fontSize:18}}>{item.label}</h3>
              <span className="font-label" style={{color:stateColor[item.state],border:'1px solid #263750',padding:'6px 8px'}}>{item.state}</span>
            </div>
            <p className="font-body" style={{color:'#8FA0B2',fontSize:13,lineHeight:1.7,marginTop:10}}>{item.summary}</p>
            {item.href&&<a href={item.href} target="_blank" rel="noreferrer" className="font-label" style={{display:'inline-block',color:'#5A78FF',marginTop:13}}>{item.action||'INSPECT SOURCE'} ↗</a>}
          </article>)}
        </div>
      </div>
    </div>}
  </>;
}

import {useEffect,useState} from 'react';
import {fetchBacktesting, type BacktestData} from '../api';
import type {Trade} from '../types';
export default function BacktestFields({value,onChange}:{value:Partial<Trade>;onChange:(v:Partial<Trade>)=>void}) {
  const [data,setData]=useState<BacktestData>({strategies:[],batches:[],sessions:[]});
  const [error,setError]=useState('');
  useEffect(()=>{fetchBacktesting().then(setData).catch(e=>setError(e.message));},[]);
  const session=data.sessions.find(s=>s.id===value.sessionId);
  const batch=data.batches.find(b=>b.id===session?.batchId);
  const strategy=data.strategies.find(s=>s.id===batch?.strategyId);
  const set=(key:keyof Trade,v:unknown)=>onChange({...value,[key]:v});
  return <section><h4>Historical test context</h4>{error&&<p role="alert">{error}</p>}<div className="form-grid">
    <label className="form-field">Historical session *<select className="select" value={value.sessionId||''} onChange={e=>{const id=Number(e.target.value)||null;set('sessionId',id);if(id)sessionStorage.setItem('bt-session',String(id));}}><option value="">Choose batch / day</option>{data.sessions.map(s=><option key={s.id} value={s.id}>{data.batches.find(b=>b.id===s.batchId)?.name} · {s.date}</option>)}</select></label>
    <label className="form-field">Rule adherence<select className="select" value={value.adherence||'Unreviewed'} onChange={e=>set('adherence',e.target.value)}>{['Unreviewed','Followed','Deviation'].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="form-field">Setup<input className="input" value={value.setup||''} onChange={e=>set('setup',e.target.value)}/></label>
    <label className="form-field">Market condition<input className="input" placeholder="Trending / range / volatile…" value={value.marketCondition||''} onChange={e=>set('marketCondition',e.target.value)}/></label>
  </div>{batch&&<p className="sub">{batch.strategyName} v{batch.version} · {batch.phase} · {batch.status} · Entry must be on {session?.date} in IST.</p>}{strategy&&<details><summary>Strategy rules and batch assumptions</summary><pre style={{whiteSpace:'pre-wrap'}}>{strategy.rules}</pre><p>{batch?.assumptions}</p></details>}<p className="sub">Use Configuration to add instruments first. Actual costs entered on the trade affect net P&amp;L; batch assumptions document your convention.</p></section>;
}

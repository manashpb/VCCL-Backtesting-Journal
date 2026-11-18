import {useState} from 'react';
import {Link} from 'react-router-dom';
import toast from 'react-hot-toast';
import {saveBacktest,type BacktestData,type Session} from '../api';

export default function DayWorkspace({data,onSaved}:{data:BacktestData;onSaved:()=>Promise<void>}) {
  const [batchId,setBatchId]=useState(()=>sessionStorage.getItem('bt-batch')||String(data.batches.find(b=>b.status==='Active')?.id||''));
  const [editing,setEditing]=useState<Session|null>(null),[saving,setSaving]=useState(false);
  const batch=data.batches.find(b=>b.id===Number(batchId));
  const days=data.sessions.filter(s=>s.batchId===Number(batchId));
  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget,values=Object.fromEntries(new FormData(form));
    setSaving(true);try{
      if(editing)await saveBacktest(`sessions/${editing.id}`,{batchId:editing.batchId,date:editing.date,context:values.context,setups:values.setups===''?editing.setups:Number(values.setups),skipReason:values.skipReason,reviewed:values.reviewed==='on'},'PUT');
      else await saveBacktest('days/no-trade',{batchId:Number(batchId),date:values.date,context:values.context,skipReason:values.skipReason});
      form.reset();setEditing(null);await onSaved();toast.success(editing?'Daily review saved':'Marked reviewed — no trade');
    }catch(e){toast.error((e as Error).message);}finally{setSaving(false);}
  }
  return <>
    <div className="filters-bar"><label className="form-field">Test batch<select className="select" value={batchId} onChange={e=>{setBatchId(e.target.value);sessionStorage.setItem('bt-batch',e.target.value);setEditing(null);}}><option value="">Choose a batch</option>{data.batches.map(b=><option key={b.id} value={b.id}>{b.name} · {b.phase} · {b.status}</option>)}</select></label></div>
    <article className="bt-hero"><h3>Enter trades directly under your batch.</h3><p>The entry date in IST groups each trade into its historical day automatically. You can add daily notes or mark a reviewed no-trade day whenever useful.</p>{batch&&<div className="bt-actions"><Link className="btn btn-primary" to={`/trades?batch=${batch.id}&new=1`}>Record trade</Link><Link className="btn" to={`/trades?batch=${batch.id}`}>View batch trades</Link></div>}{batch?.status!=='Active'&&batch&&<p>Reopen this batch in Test Batches before adding trades.</p>}</article>
    <div className="bt-columns"><div>
      <details className="bt-panel" open={editing?true:undefined} key={editing?.id||'no-trade'}><summary>{editing?`Optional daily review · ${editing.date}`:'Optional: mark reviewed — no trade'}</summary>
        <form onSubmit={save} style={{marginTop:16}}>
          {!editing&&<label className="form-field">Historical date *<input className="input" type="date" name="date" min={batch?.startDate} max={batch?.endDate} required/></label>}
          <label className="form-field">Daily context / notes (optional)<textarea className="input" rows={3} name="context" defaultValue={editing?.context}/></label>
          {editing&&<label className="form-field">Qualifying setups observed (optional)<input className="input" name="setups" type="number" min="0" step="1" defaultValue={editing.setups}/></label>}
          <label className="form-field">Skipped setup / no-trade reason (optional)<textarea className="input" rows={2} name="skipReason" defaultValue={editing?.skipReason}/></label>
          {editing&&<label className="bt-check"><input type="checkbox" name="reviewed" defaultChecked={!!editing.reviewed}/>Historical day fully reviewed</label>}
          <button className="btn btn-primary" disabled={saving||!batch||batch.status!=='Active'}>{editing?'Save daily review':'Mark reviewed — no trade'}</button>{editing&&<button className="btn" type="button" onClick={()=>setEditing(null)}>Cancel</button>}
        </form>
      </details>
    </div><div><h3>Historical days</h3>{!days.length&&<p className="bt-empty">Days appear automatically when you save trades. No daily setup is required.</p>}{days.map(day=><article className="bt-panel" key={day.id}><span className="chip">{day.reviewed?(day.tradeCount?'Reviewed':'Reviewed — no trade'):'Review optional'}</span><h3>{day.date}</h3><p>{day.tradeCount} trades{day.setups?` · ${day.setups} setups observed`:''}</p>{day.context&&<p className="bt-rules">{day.context}</p>}{day.skipReason&&<p>{day.skipReason}</p>}<div className="bt-actions"><button className="btn" onClick={()=>setEditing(day)}>Daily notes / review</button><Link className="btn" to={`/trades?session=${day.id}&batch=${day.batchId}`}>View trades</Link></div></article>)}</div></div>
  </>;
}

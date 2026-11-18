import express from 'express';
import { Database } from '../db/database.js';
const fail = (message:string) => { throw Object.assign(new Error(message), {status:400}); };
const text = (v:any, label:string, required=false) => {
  if (v == null && !required) return '';
  if (typeof v !== 'string' || v.length > 12000 || (required && !v.trim())) fail(`Invalid ${label}`);
  return v.trim();
};
const day = (v:any) => { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10)!==v) fail('Invalid historical date'); return v; };
export function backtestingRoutes(db:Database) {
  const router=express.Router();
  router.get('/', async (_req,res,next) => { try {
    res.json({strategies:await db.all('SELECT * FROM bt_strategies ORDER BY name,version DESC'), batches:await db.all('SELECT b.*,s.name AS strategyName,s.version FROM bt_batches b JOIN bt_strategies s ON s.id=b.strategyId ORDER BY b.id DESC'), sessions:await db.all('SELECT s.*, (SELECT COUNT(*) FROM trades t WHERE t.sessionId=s.id) AS tradeCount FROM bt_sessions s ORDER BY s.date,s.id')});
  } catch(e){next(e);} });
  // Rules are append-only: a changed rule set always creates a new version.
  router.post('/strategies', async(req,res,next)=>{try{
    const name=text(req.body.name,'strategy name',true), rules=text(req.body.rules,'rules',true);
    const result=await db.transaction(async run=>{
      const row=await db.get('SELECT MAX(version) AS version FROM bt_strategies WHERE name=?',[name]);
      return run('INSERT INTO bt_strategies(name,version,rules) VALUES(?,?,?)',[name,(row.version||0)+1,rules]);
    }); res.json({id:result.lastID});
  }catch(e){next(e);} });
  router.post('/batches', async(req,res,next)=>{try{
    const b=req.body, strategy=await db.get('SELECT id FROM bt_strategies WHERE id=?',[b.strategyId]);
    if(!strategy) fail('Choose a strategy version');
    const start=day(b.startDate), end=day(b.endDate); if(start>end) fail('End date precedes start date');
    if(!['Development','Validation'].includes(b.phase)) fail('Invalid phase');
    const result=await db.run('INSERT INTO bt_batches(strategyId,name,startDate,endDate,instruments,timeframe,source,assumptions,objective,phase) VALUES(?,?,?,?,?,?,?,?,?,?)', [strategy.id,text(b.name,'batch name',true),start,end,text(b.instruments,'instruments',true),text(b.timeframe,'timeframe',true),text(b.source,'data source',true),text(b.assumptions,'cost/slippage assumptions',true),text(b.objective,'objective'),b.phase]);
    res.json({id:result.lastID});
  }catch(e){next(e);} });
  router.put('/batches/:id/status',async(req,res,next)=>{try{
    if(!['Active','Completed','Archived'].includes(req.body.status)) fail('Invalid batch status');
    const result=await db.run('UPDATE bt_batches SET status=? WHERE id=?',[req.body.status,req.params.id]);
    if(!result.changes) return res.status(404).json({error:'Batch not found'});
    res.json({ok:true});
  }catch(e){next(e);} });
  async function saveSession(b:any,id?:string){
    const batch=await db.get('SELECT * FROM bt_batches WHERE id=?',[b.batchId]); if(!batch) fail('Choose a batch');
    const date=day(b.date); if(date<batch.startDate || date>batch.endDate) fail('Session date is outside the batch period');
    if(!Number.isInteger(b.setups)||b.setups<0||b.setups>10000) fail('Setups must be a non-negative integer');
    if(typeof b.reviewed!=='boolean') fail('Reviewed must be true or false');
    const skip=text(b.skipReason,'skip reason');
    if(b.reviewed && b.setups===0 && !skip) fail('Record a reason for a reviewed no-setup day');
    const args=[batch.id,date,text(b.context,'context'),b.setups,skip,b.reviewed?1:0];
    if(id){
      const old=await db.get('SELECT * FROM bt_sessions WHERE id=?',[id]); if(!old) fail('Session not found');
      if(old.batchId!==batch.id||old.date!==date) fail('Session batch and date cannot change');
      return db.run('UPDATE bt_sessions SET batchId=?,date=?,context=?,setups=?,skipReason=?,reviewed=? WHERE id=?',[...args,id]);
    }
    if(await db.get('SELECT id FROM bt_sessions WHERE batchId=? AND date=?',[batch.id,date])) fail('This historical day already has a session in this batch');
    return db.run('INSERT INTO bt_sessions(batchId,date,context,setups,skipReason,reviewed) VALUES(?,?,?,?,?,?)',args);
  }
  router.post('/sessions',async(req,res,next)=>{try{res.json({id:(await saveSession(req.body)).lastID});}catch(e){next(e);}});
  router.put('/sessions/:id',async(req,res,next)=>{try{await saveSession(req.body,req.params.id);res.json({ok:true});}catch(e){next(e);}});
  return router;
}
export async function validateBacktest(db:Database,body:any,existing?:any) {
  const sessionId=body.sessionId===undefined?existing?.sessionId:body.sessionId;
  if (sessionId == null && process.env.ALLOW_UNASSIGNED_TEST_TRADES !== 'true') fail('Choose a historical session before saving a trade');
  if(sessionId!=null) {
    if(!Number.isInteger(sessionId)||sessionId<=0) fail('Invalid session');
    const session=await db.get('SELECT s.*,b.status FROM bt_sessions s JOIN bt_batches b ON b.id=s.batchId WHERE s.id=?',[sessionId]);
    if(!session) fail('Session not found');
    if(session.status!=='Active') fail('Reopen the batch before recording or changing trades');
    const entry=body.entryDateTime;
    if(!entry || !Number.isFinite(Date.parse(entry)) || new Date(Date.parse(entry)+330*60000).toISOString().slice(0,10)!==session.date) fail('Entry date in IST must match the selected historical session');
  }
  const adherence=body.adherence??existing?.adherence??'Unreviewed';
  if(!['Unreviewed','Followed','Deviation'].includes(adherence)) fail('Invalid rule adherence');
  return {sessionId:sessionId??null,adherence,setup:text(body.setup??existing?.setup,'setup'),marketCondition:text(body.marketCondition??existing?.marketCondition,'market condition')};
}

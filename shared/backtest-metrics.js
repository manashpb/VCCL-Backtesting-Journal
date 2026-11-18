// Closed-trade results; R is defined only where planned risk is positive.
export function backtestMetrics(trades) {
  const closed=trades.filter(t=>t.status==='Closed' && Number.isFinite(t.pnl)).sort((a,b)=>Date.parse(a.exitDateTime||a.entryDateTime)-Date.parse(b.exitDateTime||b.entryDateTime)||a.id-b.id);
  const rs=closed.filter(t=>Number.isFinite(t.plannedRisk)&&t.plannedRisk>0).map(t=>({...t,r:t.pnl/t.plannedRisk}));
  const sum=xs=>xs.reduce((a,b)=>a+b,0), wins=closed.filter(t=>t.pnl>0), losses=closed.filter(t=>t.pnl<0);
  let equity=0,peak=0,drawdown=0,streak=0,maxStreak=0;
  const curve=rs.map(t=>{equity+=t.r;peak=Math.max(peak,equity);drawdown=Math.max(drawdown,peak-equity);return {id:t.id,date:new Date(Date.parse(t.exitDateTime||t.entryDateTime)+330*60000).toISOString().slice(0,10),r:equity};});
  for(const t of closed){streak=t.pnl<0?streak+1:0;maxStreak=Math.max(maxStreak,streak);}
  const avg=xs=>xs.length?sum(xs)/xs.length:null;
  return {count:closed.length,open:trades.length-closed.length,rCount:rs.length,winRate:closed.length?wins.length/closed.length*100:null,net:sum(closed.map(t=>t.pnl)),totalR:sum(rs.map(t=>t.r)),expectancy:avg(rs.map(t=>t.r)),avgWin:avg(rs.filter(t=>t.r>0).map(t=>t.r)),avgLoss:avg(rs.filter(t=>t.r<0).map(t=>t.r)),drawdown,maxStreak,profitFactor:losses.length?sum(wins.map(t=>t.pnl))/-sum(losses.map(t=>t.pnl)):null,curve};
}

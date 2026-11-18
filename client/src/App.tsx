import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
const Backtesting = lazy(() => import('./pages/Backtesting'));
import TradeLog from './pages/TradeLog';
import Configuration from './pages/Configuration';

export default function App() {
  return (
    <Suspense fallback={<div className="loading">Loading journal…</div>}><Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Backtesting />} />
        <Route path="/strategies" element={<Backtesting section="strategies" />} />
        <Route path="/batches" element={<Backtesting section="batches" />} />
        <Route path="/sessions" element={<Backtesting section="sessions" />} />
        <Route path="/results" element={<Backtesting section="results" />} />
        <Route path="/trades" element={<TradeLog />} />
        <Route path="/configuration" element={<Configuration />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes></Suspense>
  );
}

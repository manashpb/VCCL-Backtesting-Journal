# Backtesting Journal

A self-hosted manual backtesting journal built from the Trading Journal interface. React, Express and SQLite; single owner, INR accounting and IST trade times. This app records historical research; it does not run a replay engine or place orders.

## Workflow

1. In Configuration, add instruments and their point-value convention. Prices per unit use multiplier 1; quantities in lots require the captured lot size. Do not apply both.
2. Save a strategy with explicit setup, entry, stop, exit, sizing and exclusion rules. Saving the same name creates the next immutable version.
3. Create a test batch: strategy version, historical period, instruments, timeframe, source, cost/slippage convention, objective and Development or Validation phase. Batch definitions remain fixed; create a new batch to change assumptions.
4. Open Record trade from a batch, or New Trade in the Trade Log. Select the batch and enter the historical entry time. The journal creates or reuses that batch's historical day automatically from the entry date in IST. No separate daily session is required. Dates must fall within the batch period.
5. Form and YAML text entry share the selected batch. Record planned risk, actual costs, setup, market condition and rule adherence. Changing a trade's date or batch moves it to the corresponding historical day automatically.
6. Daily context and reviews are optional in Test Workspace. Use “Mark reviewed — no trade” for a historical day with no trades; notes and reasons are optional. Before-entry thesis, exit reason and after-exit review remain separate. Save and reopen a trade to attach labelled screenshots. These are editable personal records, not an immutable audit log.
7. Compare batches in Results. Complete or archive finished batches; reopen a batch before changing its trades. Use a separate historical validation period rather than repeatedly tuning against it.

Four recording profiles support options scalping, positional option hedges, prop trades and cash stocks. Multi-leg fills, scaling, partial exits, custom versioned analysis fields, tags, screenshots and CSV exports follow the original journal accounting. New data is stored separately in `server/backtesting.db` and `server/snapshots/`; no live journal data is imported.

## Run

Node.js 22.23.4+ (or a current Node 24 release).

```sh
npm ci
npm run setup
npm run build
npm test
npm start
```

Development: `npm run dev` (Vite port 5173, API port 5000). Built app: loopback port 5000. Production requires `JOURNAL_USER` and `JOURNAL_PASSWORD`. Copy `.env.example` to `.env`, fill privately, and start with `node --env-file=.env server/dist/index.js`.

For a reverse proxy route, set `JOURNAL_BASE_PATH=/backtesting/` during the build; the proxy must strip that prefix. Runtime `PORTAL_ORIGIN` must match the browser's external origin for mutation checks. Authentication covers frontend, API and images; only `/api/health` is public. Keep the application on loopback behind the authenticated workspace and its existing HTTPS endpoint.

## Reports and exports

Closed net P&L includes entered trade and execution costs. Slippage assumptions are documentation: incorporate simulated slippage in recorded fills. R = closed net P&L / positive planned risk. Missing risk excludes a trade from R metrics but retains it in monetary totals and win rate. Breakevens count as closed trades, not wins. Profit factor is undefined without losing trades. Closed-trade drawdown uses cumulative R ordered by exit time, not intratrade or open-position equity. Longest losing streak uses all closed trades. Development/validation, strategy version and batch remain visible in comparisons.

CSV exports include session ID, adherence, setup, market condition and full framework data. Results also exports all strategies, batches, sessions and trades as JSON. Uploaded image bytes are not included; retain a server backup.

## Operations

`ecosystem.config.cjs` starts a separate `backtesting-journal` PM2 process. Keep `.env`, database and snapshots out of Git. Stop only this process before archiving the database and snapshots together; restart afterward, and keep a private off-machine backup. Restoring requires stopping the process and restoring those files together. Never use the real trading journal database as `DB_PATH`. For the default data paths, run `bash scripts/backup.sh /absolute/private/backup/directory` on the server. It briefly stops only this application and restarts it on exit; review the script if you override storage paths. Copy the resulting private archive off the machine.

Tests cover inherited accounting, YAML parsing and template updates, plus strategy versions, historical date validation, sessions, trade linkage, batch state, image upload, authentication, cross-origin writes and R metrics.

The dependency audit currently reports an upstream picomatch ReDoS advisory in build/install tooling (Vite and sqlite3's node-gyp dependency chain). The app does not accept user-supplied glob patterns. Review upstream patches when upgrading; do not downgrade runtime libraries solely to satisfy the audit.

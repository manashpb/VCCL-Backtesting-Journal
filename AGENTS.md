# Backtesting Journal

Independent React/Vite + Express/SQLite application. Preserve the source Trading Journal application and database. All historical research belongs in this application's own database and snapshots directory.

Never commit .env files, credentials, databases, personal research exports or screenshots. Public repository content must remain generic. Strategy versions and batch assumptions are immutable; new rules require a new version. Trades select a batch; historical days are created/reused transactionally from the entry date in IST. Existing sessions and notes remain intact; daily review is optional. Keep accounting tests and run `npm run build` then `npm test` after changes.

Workspace integration belongs in the sibling workspace repository. The backend runs on loopback behind the shared authenticated proxy, which strips /backtesting/ and supplies the owner's Basic authorization. Deployment changes require explicit user authorization.

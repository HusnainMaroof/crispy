# Smurf

AI agent work in this repo goes through the Smurf hub at `C:/Users/husna/Desktop/smurf`; there is no agent folder here.

- Use it when the owner says "smurf" / "let the agents do it", or for a feature, fix or
  investigation bigger than a few edits. Skills: `smurf-go` (one request end to end),
  `smurf-ship` (task batch), `smurf-agents` (supervise), `smurf-fix` (engine bug).
- `smurf run "<request>"` works on this repo; `smurf summary <run>` shows the table;
  `smurf merge <run>` only after the owner OKs the diff. Free models only (`ORCH_CONFIG`).
- Runs take minutes: run in the background, do not poll; pass on the 15-minute progress table.
- Repo rules every agent reads: `C:/Users/husna/Desktop/smurf/agents/vault/Projects/<name>.md`. Never edit the hub from
  here unless asked to change Smurf. Never push.
- Report: what was done, then a table task | model | result | checks, then follow-ups.

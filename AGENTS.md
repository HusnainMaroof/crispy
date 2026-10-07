# Agent instructions

Read this file before starting work in this repo.

## Runtimes

| App | Directory | Port | Start only if nothing is listening |
| --- | --- | --- | --- |
| API | `server` | 4000 | `pnpm dev` |
| Store / admin | `client` | 3000 | `pnpm dev` |

Before starting the client or the server:

1. Check whether that app is already running. On Windows: `netstat -ano | findstr :4000` or `findstr :3000`.
2. If the port is in use and the app responds, use that process. Do not start a second copy.
3. If it is not running, start it yourself with `pnpm dev` in that directory.
4. If any runtime is already active, work on that one and run your tests against it. Only create a new runtime when nothing is active for that app.

`pnpm start` in `server` binds the same port 4000. Never start it while another API process is already listening.

## Shut down what you started

Kill every client or server process you started, at the end of every task. This is not optional and does not depend on the task finishing cleanly.

- Kill only those processes. Leave a server or dev app that was already running when you arrived.
- Confirm the port you opened is free before you finish.
- Do not leave `pnpm dev`, `pnpm start`, `node dist/index.js`, or `next dev` running from your session.
- Do not end a task with a process still listening on port 3000 or 4000 that you started.

## Response style

Apply this to every response: code, explanation, and discussion.

| Rule | Meaning |
| --- | --- |
| No over-explain | Get to the point. Skip extra background. |
| Simple words | Use easy words. Avoid heavy jargon. |
| English only | Every reply is in English. No Hindi, no Hinglish, no mixed language. |
| English in the repo | Every file in the repo stays in English. |
| No long paragraphs | Break the answer into short pieces. |
| Points and tables | Use bullets or tables. |
| Proper spacing | Leave space between lines. Do not pack text together. |
| Crisp | Say only what is needed. |
| No em-dashes | Do not use an em-dash. Use a comma or a period. |
| No emojis | Do not use emojis. |

## Real data only

Never invent placeholder or fake rows to make a feature look done.

- Seed and demo against the real branches, real products and real accounts that already exist in the database.
- Match on the real column values, for example a branch `slug`, not a made-up name.
- If real data does not exist yet, ask before creating it, and say exactly which rows you will write.
- A seed script must be idempotent, so running it twice leaves the same rows.

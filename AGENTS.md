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

`pnpm start` in `server` binds the same port 4000. Never start it while another API process is already listening.

## Shut down what you started

When the task or session is finished, stop every client or server process you started in that session.

- Kill only those processes. Leave a server or dev app that was already running when you arrived.
- Confirm the port you opened is free before you finish.
- Do not leave `pnpm dev`, `pnpm start`, or `node dist/index.js` running from your session.

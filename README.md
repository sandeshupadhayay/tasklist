# TaskList

Monorepo: `apps/api` (Django Ninja) and `apps/web` (React + TS).

## Run
1. `cp .env.example .env` and fill in the Gmail app password and DB password
2. `docker compose up --build`
3. Open http://localhost (UI) or http://localhost:8000/api/docs (API docs)

## Services
db (Postgres), redis, api, rqworker, rqscheduler, web (nginx)

## Notes
- Deadline check runs every `DEADLINE_CHECK_INTERVAL` seconds (default 60)
- Emails go through Gmail SMTP using an app password
# MockDesk

A mock-test website for government exam practice. It starts with five full SSC CGL Tier-II mocks. Students sign in with a one-time code or a password, take timed tests that behave like the real exam, and get a question-by-question analysis. Admins and teachers run everything from the browser.

It is one Node.js program with a built-in SQLite database. No separate database server is needed.

## What it does

- **Students:** timed mocks with sectional timers and +3 / −1 marking, live-window mocks, practice sets, mistake notebook, bookmarks, PDF reports, share card, reminders, weekly summary, and a read-only progress link for a parent or mentor.
- **Admins** (`/admin`): users, attempts, mocks, question editor and bank, bulk import from Word or CSV, duplicate finder, AI solution drafts, announcements, messages (in-app, push, email, WhatsApp), copy check, bulk student import, CSV exports, backups, staff permissions, and Settings for the site name, contact, home page text, limits and time zone.
- **Teachers** (`/teacher`): see their batches and add notes to students.

## Run it on your computer

Needs Node.js 22.13 or newer.

```
npm install
npm run build
npm start
```

Open http://localhost:3000. Sign-in codes are printed in the terminal while no email or SMS provider is set, and password sign-in always works.

To become the first admin, put your email in `admins.txt` before you sign up with it. After that, manage roles in Admin > Users.

For front-end work run `npm run dev:server` and `npm run dev:client` in two terminals.

## Put it on AWS

Use the **mockdesk-oneclick** kit. Copy this project's files into its `app/` folder, push to GitHub, and run the Jenkins job with `ACTION = deploy` the first time and `ACTION = update` afterwards. The kit also has the cost guide.

## Where settings live

| What | Where |
|---|---|
| Site name, tagline, contact, home page text and questions, limits, time zone | Admin > Settings > Site and limits |
| Exams, mocks, questions | Admin > Exams, Mocks, Question editor, Content tools |
| Who is admin, staff or teacher | Admin > Users |
| Messages, reminders, WhatsApp rules, quiet hours | Admin > Notifications and Messages |
| Backups and CSV exports | Admin > Data and backup |
| Secrets and provider keys (email, SMS, WhatsApp, AI) | Environment variables, see `.env.example` |

Secrets stay in environment variables on purpose, so they are never stored in the database or shown in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm start` | start the server |
| `npm run build` | build the website files (run once, and after changing `src/`) |
| `npm test` | run all tests (use `MOCKDESK_ALLOW_INCOMPLETE=1` on a fresh copy) |
| `npm run validate` | check the JSON question files in `content/` |

## Folders

| Folder | Contents |
|---|---|
| `server/` | the API: sign-in, tests and scoring, admin, notifications, backups |
| `src/` | the React website (student, admin and teacher screens) |
| `config/` | the default exam pattern and the five starter mocks |
| `content/` | the five starter mocks as JSON, copied into the database on the first start |
| `data/` | created at run time: database, uploads, backups. Never commit it |
| `docs/` | `ADMIN.md` (admin guide), `API.md` (routes), `CONTENT_GUIDE.md` (question file format) |

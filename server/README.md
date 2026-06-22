# Private Recommendation API

This backend keeps case statistics and future private rules off GitHub Pages.

## Local Run

```bash
cd server
API_KEY=dev-key ALLOWED_ORIGIN=http://127.0.0.1:4173 CASE_STATS_PATH=../private-case-stats.json node server.js
```

Health check:

```bash
curl http://127.0.0.1:8787/api/health
```

Recommendation request:

```bash
curl -X POST http://127.0.0.1:8787/api/recommend \
  -H 'content-type: application/json' \
  -H 'x-api-key: dev-key' \
  -d '{"country":"uk","schoolType":"public_non211","major":"金融学","score":88}'
```

## Render Deployment

1. Push this repository to GitHub.
2. Create a Render Web Service from the repository.
3. Set Root Directory to `server`.
4. Build Command can be empty or `npm install`.
5. Start Command: `npm start`.
6. Add environment variables:
   - `API_KEY`: a long random secret.
   - `ALLOWED_ORIGIN`: `https://lijiajun168.github.io`
   - `DATABASE_URL`: the Render Postgres Internal Database URL.
7. Do not upload raw Excel files to the public repository.

## Import Aggregated Case Stats

After deployment with `DATABASE_URL`, import the local aggregated stats file:

```bash
curl -X POST https://YOUR-RENDER-URL/api/admin/import-case-stats \
  -H 'content-type: application/json' \
  -H 'x-api-key: YOUR_API_KEY' \
  --data-binary @private-case-stats.json
```

Then verify:

```bash
curl https://YOUR-RENDER-URL/api/health
```

The health response should show non-zero `offers`, `rejects`, and `groups`.

Do not upload raw Excel files to the public repository. Only import aggregated statistics.

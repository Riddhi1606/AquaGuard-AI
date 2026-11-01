# AquaGuard AI — Technical Audit & Fix Log

## Fixes applied in this archive

- Added PostgreSQL support through psycopg v3 and normalized common PostgreSQL connection URLs.
- Removed wildcard CORS defaults; production CORS origins must be explicitly configured.
- Protected admin report-status changes and admin incident listing with a server-side `ADMIN_API_KEY`.
- Configured frontend API base URL through `VITE_API_URL` (accepts backend origin or `/api` URL).
- Corrected Open-Meteo hourly alignment and accumulation calculations; cached weather is labelled as cached after a failed refresh.
- Removed fabricated straight-line links between disconnected road graph components.
- Added a 1.5 km snap-distance guard so route requests far outside the bundled demo graph return no route instead of silently snapping to a distant road.
- Regenerated bundled ML estimators for the pinned scikit-learn version.
- Corrected model benchmark values and synthetic-data disclosures in the README.
- Removed unsupported claims of verified DEM / OSM / municipal drainage data from key UI screens and API documentation.
- Removed hard-coded weather fallbacks from the UI; unavailable values now display as unavailable.
- Replaced unsafe route / flood claims with prototype-score wording. The UI now states that model scores and routes are not verified warnings or safe navigation instructions.
- Removed the arbitrary numeric confidence estimate from the prediction API; confidence is returned as `null` because it is not calibrated against observed flood events.
- Health endpoint now reports `degraded` if the database query fails.
- Seeded reports and alerts remain explicitly labelled as fictional demonstration records; emergency service contacts remain unverified.

## Verification performed in this environment

- `python -m compileall -q backend gis ml_engine scripts` — passed.
- `pytest -q` — **18 passed**.
- Docker Compose YAML parsed successfully with PyYAML.
- TypeScript syntax transpilation passed for all 18 `.ts` / `.tsx` source files.
- Frontend dependency installation (`npm ci`) timed out in this environment. Full TypeScript type-check and production frontend build therefore remain **unverified**.
- Docker was not available for a container startup test; PostgreSQL integration remains **unverified**.
- No public cloud deployment was performed; no live website URL is included.

## Remaining requirements before operational use

1. Run `npm ci` and `npm run build` on a machine with working npm registry access; resolve any build errors.
2. Configure strong `SECRET_KEY`, `ADMIN_API_KEY`, database credentials, and exact `CORS_ORIGINS` in the deployment environment.
3. Deploy frontend and backend, configure `VITE_API_URL`, and verify the deployed `/api/health` and `/docs` endpoints.
4. Replace illustrative road/elevation/drainage attributes with licensed, timestamped, authoritative data and validate road connectivity.
5. Replace synthetic training labels with verified historical incidents / field sensor data; retrain and evaluate using time- and location-aware splits.
6. Verify emergency contacts and locations against official agency sources.

**Safety note:** This build is a hackathon / academic prototype. It must not be used as an emergency alert, road-closure, dispatch, or navigation authority.

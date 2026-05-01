# Build Connect Azure Deployment Write-Up

This document defines the Azure-first setup for Build Connect, including GitHub Actions, environment variables, App Service configuration, and the resource list to create in each Azure resource group.

## 1) Hosting Decision (Now)

- **Hosting target:** Azure App Service (Linux, Node 20).
- **Deployment model:** Zip deploy of Next.js standalone output (`.next/standalone`).
- **Docker usage now:** **No** for app hosting.
- **Docker usage local/dev:** Yes, only for local PostgreSQL (`npm run db:up` via `docker compose`).

## 2) Current Repo Status

- Workflow exists at `.github/workflows/azure-webapps-deploy.yml`.
- Next.js is already configured for Azure packaging (`next.config.mjs` uses `output: "standalone"`).
- Prisma is configured for PostgreSQL.

## 3) Resource Groups to Create

Recommended one resource group per environment:

- `rg-build-connect-dev`
- `rg-build-connect-prod`

Optional early pilot shortcut:

- `rg-build-connect-sandbox`

## 4) Azure Resources to Add (In Order)

Create these resources in each environment resource group:

1. **App Service Plan (Linux)**
   - SKU for start: `B1` or `P1v3` depending on expected load.

2. **Web App (App Service)**
   - Runtime stack: Node 20 LTS.
   - Startup command: `node server.js`.
   - Deploy from GitHub Actions workflow.

3. **Azure Database for PostgreSQL - Flexible Server**
   - PostgreSQL 15+.
   - Production: private networking + firewall/VNet policy aligned with security requirements.

4. **Azure Key Vault** (recommended baseline)
   - Store app secrets and database credentials.
   - Use Key Vault references in App Service configuration.

5. **Application Insights**
   - Runtime telemetry, errors, and performance traces.

6. **Storage Account (Blob)** (enable when uploads are active)
   - Store certification docs, profile photos, and future media assets.

7. **(Optional now) Azure Communication Services**
   - Use when moving app notifications/email flows to Azure-native communication services.

## 5) GitHub Actions Setup

Workflow file: `.github/workflows/azure-webapps-deploy.yml`

Required GitHub repository settings:

- **Secrets**
  - `AZURE_WEBAPP_PUBLISH_PROFILE`
  - `PROD_DATABASE_URL` (used by CI for `prisma migrate deploy`)

- **Variables**
  - `AZURE_WEBAPP_NAME`

Notes:

- Current workflow builds with Node 20, runs `prisma migrate deploy` against `PROD_DATABASE_URL`, runs `prisma generate`, builds Next.js, and deploys `.next/standalone`.
- If you switch to OIDC later, replace publish-profile auth with `azure/login` + federated credentials.

## 6) App Service Configuration (Environment Variables)

Set these in **Azure Portal -> Web App -> Configuration -> Application settings**:

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER`
- `EMAIL_FROM`
- `DEV_AUTH_BYPASS=false`

Runtime/platform:

- `WEBSITE_NODE_DEFAULT_VERSION=~20`

Optional now / required when feature enabled:

- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY` (or `AZURE_STORAGE_CONNECTION_STRING`)
- `AZURE_STORAGE_CONTAINER_CERTS`
- `AZURE_STORAGE_CONTAINER_PROFILES`
- `AZURE_COMMUNICATION_CONNECTION_STRING`

## 7) Database and Migration Policy

- Use Prisma migrations for schema evolution (`npm run db:migrate`) in controlled deployment windows.
- Production deploy automation runs `npm run db:deploy` (`prisma migrate deploy`) before app deployment.
- Do **not** use `prisma db push` in production.
- Keep production credentials only in Key Vault (not in repository secrets/files).
- Validate schema compatibility in dev/staging before prod promotion.

## 8) Mobile Path (PhoneGap / React Native Readiness)

To support local/offline company use now and scale to a dedicated mobile app:

1. Keep this Next.js app as the **core backend + web client** on Azure.
2. Stabilize API contracts in Next.js route handlers (or dedicated API layer under `src`).
3. Add token/session strategy compatible with mobile clients.
4. Build mobile clients (React Native first; PhoneGap only if a wrapper approach is required).
5. Add sync/offline patterns for apprentices/company field usage (queued writes + conflict handling).
6. Scale app tier and database tier independently as mobile usage increases.

## 9) Immediate Checklist

- [ ] Create `dev` and `prod` resource groups.
- [ ] Provision App Service Plan + Web App in each environment.
- [ ] Provision PostgreSQL Flexible Server and create app database/user.
- [ ] Create Key Vault and move secrets there.
- [ ] Configure App Service application settings.
- [ ] Add GitHub repo secret `AZURE_WEBAPP_PUBLISH_PROFILE`.
- [ ] Add GitHub repo variable `AZURE_WEBAPP_NAME`.
- [ ] Run workflow on `main` and verify deployment.
- [ ] Enable Application Insights dashboard and alerts.

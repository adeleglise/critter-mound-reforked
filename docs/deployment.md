# Deployment

## GitHub Pages (Primary)

Automatically deploys on push to `main` or `master` via GitHub Actions (`.github/workflows/deploy-pages.yml`).

**Setup:**

1. Go to repo Settings > Pages
2. Set Source to **GitHub Actions**
3. Push to `main`/`master` to trigger deployment

The workflow:

1. Checks out code
2. Installs dependencies (`npm ci`)
3. Builds with Vite (`npm run build`)
4. Deploys the `dist/` folder to GitHub Pages

**Live URL:** `https://adeleglise.github.io/critter-mound-reforked/`

## Docker

A Dockerfile is provided for containerized deployment using Nginx.

```bash
# Build
docker build -t critter-mound .

# Run
docker run -d -p 8080:80 critter-mound
```

Auto-builds via `.github/workflows/docker-build-push.yml` on push to `main`/`master`.

```bash
# Pull published image
docker pull ghcr.io/adeleglise/critter-mound-reforked:main
docker run -d -p 8080:80 ghcr.io/adeleglise/critter-mound-reforked:main
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `GITHUB_PAGES` | Vite build | Sets base path for GitHub Pages |

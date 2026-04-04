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

## Podman / Docker

A multi-stage `Containerfile` is provided for containerized deployment using nginx.

```bash
# Build production image
podman build -t critter-mound -f Containerfile .

# Run production container
podman run -d -p 8080:80 critter-mound
```

### Using Compose

```bash
# Development with hot-reload (port 6007)
podman compose up dev

# Production preview (port 8080)
podman compose up prod

# Stop all services
podman compose down
```

See [Local Development](LOCAL_DEVELOPMENT.md) for full setup instructions.

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `GITHUB_PAGES` | Vite build | Sets base path for GitHub Pages |
| `CHOKIDAR_USEPOLLING` | Dev container | Enables file watching in containers |

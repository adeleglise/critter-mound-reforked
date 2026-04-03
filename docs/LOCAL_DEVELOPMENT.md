# Local Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org/) |
| npm | >= 9 | Bundled with Node.js |
| Podman | >= 4.0 | [podman.io](https://podman.io/docs/installation) |
| podman compose | >= 1.0 | `pip install podman compose` or `brew install podman compose` |

> Podman is a drop-in Docker replacement. All `podman` commands also work with `docker`, and `podman compose` with `docker-compose`.

---

## Quick Start (Native)

```bash
# Install dependencies
npm install

# Start dev server with hot module replacement
npm run dev
```

Opens at [http://localhost:6007](http://localhost:6007) with HMR enabled.

---

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (port 6007) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint JavaScript with ESLint |
| `npm test` | Run Playwright end-to-end tests |
| `npm run test:ui` | Playwright test runner UI |
| `npm run test:headed` | Run tests in headed browser mode |
| `npm run test:debug` | Debug Playwright tests |
| `npm run test:report` | Show Playwright HTML report |

---

## Podman Setup

### Development (with Hot Reload)

```bash
podman compose up dev
```

This starts a Node.js container with your project root mounted as a volume. Vite's HMR works through the volume mount -- edit files locally, see changes instantly at [http://localhost:6007](http://localhost:6007).

### Production Preview

```bash
podman compose up prod
```

This builds the project inside a container and serves it with nginx at [http://localhost:8080](http://localhost:8080).

### Standalone Commands

```bash
# Build production image
podman build -t critter-mound -f Containerfile .

# Run production container
podman run -d -p 8080:80 critter-mound

# Stop all services
podman compose down

# Rebuild after dependency changes
podman compose up --build dev
podman compose up --build prod
```

---

## Troubleshooting

### Podman Rootless Networking

If `localhost` doesn't work on macOS, try:
```bash
# Check the Podman machine IP
podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}'

# Or use 0.0.0.0 binding (already configured in podman compose.yml)
```

### Vite HMR Not Working in Container

If hot-reload doesn't pick up changes, Vite may need filesystem polling. Add to `vite.config.js`:
```js
server: {
  watch: {
    usePolling: true,
    interval: 1000
  }
}
```

This is already handled in the dev container via the `CHOKIDAR_USEPOLLING=true` environment variable.

### Node Modules Issues

The dev container installs `node_modules` inside the container. If you see version mismatches:
```bash
# Rebuild the dev container from scratch
podman compose down
podman compose up --build dev
```

### Port Conflicts

If port 6007 or 8080 is already in use:
```bash
# Check what's using the port
lsof -i :6007

# Or override the port
podman compose run -p 3001:6007 dev
```

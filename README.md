# Crittermound-Fork

Fork of Crittermound
Originally developed by www.reddit.com/user/brave_powerful_ruler. Code moved to github for collaboration after his passing.
For the incremental game Crittermound. Looking for someone to take over as I have no experience with github and very little
with JS/CSS/HTML.

## About

Critter Mound is a casual incremental browser game where you breed critters to advance. The game features:
- Breeding system with trait inheritance and mutations
- Worker management for resource production
- Army and combat system
- Prestige mechanics
- Auto-worker functionality

## Play Online

The game is automatically deployed to GitHub Pages and can be played at:
`https://<username>.github.io/<repository-name>/`

## Local Development

### Modern Development (Recommended - Phase 1+)

The project now uses Vite for modern development with hot module replacement:

```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server will automatically open at `http://localhost:3000`

### Legacy Development

Alternatively, you can still open `index.html` directly or run a simple server:

```bash
python3 -m http.server 3000
```

Then visit `http://localhost:3000` in your browser.

**Note:** For the best development experience with live reload and modern tooling, use the Vite development server.

## Deployment

### GitHub Pages

The game automatically deploys to GitHub Pages when changes are pushed to the main/master branch.

**Setup Instructions:**
1. Go to your repository Settings → Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. Push to main/master branch - the workflow will automatically deploy

### Docker

#### Building the Docker Image

```bash
docker build -t critter-mound .
```

#### Running with Docker

```bash
docker run -d -p 8080:80 critter-mound
```

Then visit `http://localhost:8080` in your browser.

#### Using the Published Image

Docker images are automatically built and published to GitHub Container Registry on every push to main/master.

Pull and run the latest image:

```bash
docker pull ghcr.io/<username>/<repository-name>:main
docker run -d -p 8080:80 ghcr.io/<username>/<repository-name>:main
```

**Note:** You may need to authenticate with GitHub Container Registry:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

## Workflows

This repository includes two GitHub Actions workflows:

1. **Deploy to GitHub Pages** (`.github/workflows/deploy-pages.yml`)
   - Triggers on push to main/master
   - Deploys static files to GitHub Pages

2. **Build and Push Docker Image** (`.github/workflows/docker-build-push.yml`)
   - Triggers on push to main/master and on tags
   - Builds and pushes Docker images to GitHub Container Registry (ghcr.io)
   - Tags images with branch name, SHA, and semantic versions (for tags)

## Modernization

This project is undergoing a phased modernization effort to bring it up to modern web standards.

**Status:** Phase 1 Complete ✅

See [MODERNIZATION_PLAN.md](./MODERNIZATION_PLAN.md) for details.

### Phase 1: Foundation & Tooling (Completed)

- ✅ Modern build system with Vite
- ✅ Organized CSS architecture with design tokens
- ✅ CSS custom properties for theming
- ✅ Dark mode support (ready to implement)
- ✅ Responsive layout foundation
- ✅ Modern development workflow
- ✅ Code quality tools (Prettier, ESLint)

### Project Structure

```
critter-mound/
├── src/
│   ├── styles/          # Modern CSS architecture
│   │   ├── variables.css    # Design tokens
│   │   ├── base.css         # Reset & globals
│   │   ├── layout.css       # Page structure
│   │   └── components/      # Component styles
│   ├── scripts/         # JavaScript files
│   └── assets/          # Images & icons
├── index.html           # Main game file
├── package.json         # Dependencies
├── vite.config.js       # Build configuration
└── MODERNIZATION_PLAN.md
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Use the Vite dev server for development (`npm run dev`)
2. Follow the existing CSS architecture in `src/styles/`
3. Use CSS custom properties from `variables.css`
4. Run `npm run format` before committing
5. Test on multiple screen sizes

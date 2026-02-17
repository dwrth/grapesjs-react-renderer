# Development Guide

## Local Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## Using Locally in Another Project

### Option 1: npm link

```bash
# In this package directory
npm link

# In your project
npm link grapesjs-react-renderer
```

### Option 2: Workspace (Monorepo)

If using npm/yarn/pnpm workspaces:

```json
{
  "workspaces": [
    "path/to/grapesjs-react-components"
  ]
}
```

Then install:
```bash
npm install grapesjs-react-renderer@workspace:*
```

### Option 3: File Path

```json
{
  "dependencies": {
    "grapesjs-react-renderer": "file:../path/to/grapesjs-react-renderer"
  }
}
```

## Publishing

1. Update version in `package.json` and `CHANGELOG.md`
2. Build the package: `npm run build`
3. Publish: `npm publish` (or `npm publish --access public` for scoped packages)

## Testing Locally

1. Build the package: `npm run build`
2. Link it: `npm link`
3. In your test project: `npm link grapesjs-react-renderer`
4. Import and use as documented

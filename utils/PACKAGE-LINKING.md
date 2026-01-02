# Package Linking/Unlinking Scripts

This directory contains scripts to manage local package dependencies using Yarn's `portal:` protocol.

## Overview

The project uses three local packages during development:
- `@optimarvin/opti-cms-client`
- `@optimarvin/opti-graphql-client`
- `@remkoj/optimizely-cms-api`

These can be linked locally for development or unlinked to use npm versions.

## Scripts

### Unlink Packages

Replaces `portal:` dependencies with npm package versions.

```bash
yarn unlink
```

**What it does:**
1. Reads version numbers from local packages (if available)
2. Updates package.json to use npm versions (e.g., `^1.0.0` or `latest`)
3. Displays changes made

**After running:**
```bash
yarn install  # Fetch packages from npm
```

### Relink Packages

Restores `portal:` dependencies for local development.

```bash
yarn relink
```

**What it does:**
1. Updates package.json to use local `portal:` paths
2. Displays changes made

**After running:**
```bash
yarn install  # Link local packages
```

## Use Cases

### When to Unlink
- Deploying to production/staging
- Testing with published npm versions
- Sharing code with team members who don't have local packages
- Building for CI/CD pipelines

### When to Relink
- Local development with changes in dependent packages
- Debugging issues in the local packages
- Testing unpublished features

## Portal Paths

Current portal paths configured:
- `@optimarvin/opti-cms-client` → `portal:../opti-cms-client`
- `@optimarvin/opti-graphql-client` → `portal:../opti-graphql-client`
- `@remkoj/optimizely-cms-api` → `portal:/home/marvin/Projects/optimizely-dxp-clients/packages/optimizely-cms-api`

## Troubleshooting

**Error: "Could not read version"**
- The script will use `latest` as the version
- You can manually specify versions in package.json after unlinking

**Error: "Package not found"**
- Ensure the local package directories exist
- Check that portal paths in `relink-packages.mjs` are correct

**After unlinking, package not found in npm**
- Make sure the packages are published to npm
- Check your npm registry configuration
- Use manual version numbers if needed

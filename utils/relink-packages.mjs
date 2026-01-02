#!/usr/bin/env node
/**
 * Relink Script - Restores portal: protocol dependencies for local development
 *
 * This script replaces npm dependencies with local portal: references.
 * Useful when you want to develop against local versions of these packages.
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKAGE_JSON_PATH = resolve(PROJECT_ROOT, 'package.json');

// Packages to relink with their portal paths
const PACKAGES_TO_RELINK = {
  '@optimarvin/opti-cms-client': {
    section: 'dependencies',
    portalPath: 'portal:../opti-cms-client'
  },
  '@optimarvin/opti-graphql-client': {
    section: 'dependencies',
    portalPath: 'portal:../opti-graphql-client'
  },
  '@remkoj/optimizely-cms-api': {
    section: 'devDependencies',
    portalPath: 'portal:/home/marvin/Projects/optimizely-dxp-clients/packages/optimizely-cms-api'
  }
};

/**
 * Main relink function
 */
async function relinkPackages() {
  console.log('🔗 Relinking packages to portal: dependencies...\n');

  // Read package.json
  const packageJsonContent = await readFile(PACKAGE_JSON_PATH, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  const changes = [];

  // Process each package
  for (const [packageName, config] of Object.entries(PACKAGES_TO_RELINK)) {
    const section = config.section;

    if (packageJson[section] && packageJson[section][packageName]) {
      const currentValue = packageJson[section][packageName];

      // Only relink if not already using portal:
      if (!currentValue.startsWith('portal:')) {
        packageJson[section][packageName] = config.portalPath;

        changes.push({
          package: packageName,
          section,
          from: currentValue,
          to: config.portalPath
        });
      } else {
        console.log(`⏭️  ${packageName} already linked with portal:`);
      }
    } else {
      console.warn(`⚠️  ${packageName} not found in ${section}`);
    }
  }

  if (changes.length === 0) {
    console.log('✓ All packages are already using portal: protocol.');
    return;
  }

  // Write updated package.json
  const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
  await writeFile(PACKAGE_JSON_PATH, updatedContent, 'utf-8');

  // Display changes
  console.log('📝 Changes made:\n');
  for (const change of changes) {
    console.log(`  ${change.package} (${change.section})`);
    console.log(`    ${change.from} → ${change.to}`);
    console.log('');
  }

  console.log('✅ Successfully relinked packages to portal: protocol');
  console.log('\n💡 Next steps:');
  console.log('   1. Run "yarn install" to link local packages');
  console.log('   2. Make sure the local package directories exist');
}

// Run the script
relinkPackages().catch((error) => {
  console.error('❌ Error relinking packages:', error.message);
  process.exit(1);
});

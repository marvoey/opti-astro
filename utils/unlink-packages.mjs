#!/usr/bin/env node
/**
 * Unlink Script - Replaces portal: protocol dependencies with npm versions
 *
 * This script replaces local portal: dependencies with their npm equivalents.
 * It reads the version from the local packages if available, or uses a default version.
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKAGE_JSON_PATH = resolve(PROJECT_ROOT, 'package.json');

// Packages to unlink
const PACKAGES_TO_UNLINK = [
  '@optimarvin/opti-cms-client',
  '@optimarvin/opti-graphql-client',
  '@remkoj/optimizely-cms-api'
];

/**
 * Read version from a local package.json
 */
async function getLocalPackageVersion(portalPath) {
  try {
    // Handle both relative (portal:../) and absolute (portal:/path) formats
    const cleanPath = portalPath.replace(/^portal:/, '');
    const absolutePath = cleanPath.startsWith('/')
      ? cleanPath
      : resolve(PROJECT_ROOT, cleanPath);

    const localPackageJson = resolve(absolutePath, 'package.json');
    const content = await readFile(localPackageJson, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed.version || 'latest';
  } catch (error) {
    console.warn(`⚠️  Could not read version from ${portalPath}, using 'latest'`);
    return 'latest';
  }
}

/**
 * Main unlink function
 */
async function unlinkPackages() {
  console.log('🔓 Unlinking portal: dependencies...\n');

  // Read package.json
  const packageJsonContent = await readFile(PACKAGE_JSON_PATH, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  const changes = [];

  // Process dependencies
  for (const section of ['dependencies', 'devDependencies']) {
    if (!packageJson[section]) continue;

    for (const packageName of PACKAGES_TO_UNLINK) {
      const currentValue = packageJson[section][packageName];

      if (currentValue && currentValue.startsWith('portal:')) {
        // Get version from local package
        const version = await getLocalPackageVersion(currentValue);
        const newVersion = version === 'latest' ? 'latest' : `^${version}`;

        // Update the package.json object
        packageJson[section][packageName] = newVersion;

        changes.push({
          package: packageName,
          section,
          from: currentValue,
          to: newVersion
        });
      }
    }
  }

  if (changes.length === 0) {
    console.log('✓ No portal: dependencies found. Nothing to unlink.');
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

  console.log('✅ Successfully unlinked packages from portal: protocol');
  console.log('\n💡 Next steps:');
  console.log('   1. Run "yarn install" to fetch packages from npm');
  console.log('   2. Verify your application still works correctly');
}

// Run the script
unlinkPackages().catch((error) => {
  console.error('❌ Error unlinking packages:', error.message);
  process.exit(1);
});

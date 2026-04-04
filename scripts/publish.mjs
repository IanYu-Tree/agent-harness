#!/usr/bin/env node

/**
 * Publish script for Agent Orch packages
 * Usage: node scripts/publish.mjs [options]
 *
 * Options:
 *   -p, --package <name>    Package to publish (e.g., core, llm, cli, all)
 *   -b, --beta              Publish as beta version
 *   --bump <type>           Version bump type: patch|minor|major
 *   -t, --tag <tag>         Custom npm tag (default: latest, beta: beta)
 *   --dry-run               Dry run (no actual publish)
 *   -h, --help              Show help
 *
 * Examples:
 *   node scripts/publish.mjs -p core                    # Publish @agent-orch/core
 *   node scripts/publish.mjs -p llm -b                  # Publish @agent-orch/llm as beta
 *   node scripts/publish.mjs -p core --bump patch       # Bump patch version and publish
 *   node scripts/publish.mjs -p cli -t next             # Publish @agent-orch/cli with 'next' tag
 *   node scripts/publish.mjs -p all -b                  # Publish all packages as beta
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Colors for output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m'; // No Color

// Package definitions
const PACKAGES = {
  core: 'packages/core',
  llm: 'packages/llm',
  appkit: 'packages/appkit',
  orch: 'packages/orch',
  tool: 'packages/tool',
  'react-agent': 'packages/react-agent',
  cli: 'apps/cli',
};

// Parse arguments
const args = process.argv.slice(2);
let PACKAGE = '';
let BETA = false;
let BUMP = '';
let TAG = 'latest';
let DRY_RUN = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '-p':
    case '--package':
      PACKAGE = args[++i];
      break;
    case '-b':
    case '--beta':
      BETA = true;
      TAG = 'beta';
      break;
    case '--bump':
      BUMP = args[++i];
      if (!['patch', 'minor', 'major'].includes(BUMP)) {
        console.error(`${RED}Error: Invalid bump type '${BUMP}'. Use patch, minor, or major.${NC}`);
        process.exit(1);
      }
      break;
    case '-t':
    case '--tag':
      TAG = args[++i];
      break;
    case '--dry-run':
      DRY_RUN = true;
      break;
    case '-h':
    case '--help':
      console.log('Publish script for Agent Orch packages\n');
      console.log('Usage: node scripts/publish.mjs [options]\n');
      console.log('Options:');
      console.log('  -p, --package <name>    Package to publish (e.g., core, llm, cli, all)');
      console.log('  -b, --beta              Publish as beta version (sets tag to "beta")');
      console.log('  --bump <type>           Version bump type: patch|minor|major');
      console.log('  -t, --tag <tag>         Custom npm tag (default: latest)');
      console.log('  --dry-run               Dry run (no actual publish)');
      console.log('  -h, --help              Show this help\n');
      console.log('Examples:');
      console.log('  node scripts/publish.mjs -p core                    # Publish @agent-orch/core');
      console.log('  node scripts/publish.mjs -p llm -b                  # Publish @agent-orch/llm as beta');
      console.log('  node scripts/publish.mjs -p core --bump patch       # Bump patch and publish');
      console.log('  node scripts/publish.mjs -p cli -t next             # Publish @agent-orch/cli with "next" tag');
      console.log('  node scripts/publish.mjs -p all -b                  # Publish all packages as beta');
      process.exit(0);
      break;
    default:
      if (arg.startsWith('-')) {
        console.error(`${RED}Unknown option: ${arg}${NC}`);
        process.exit(1);
      }
      break;
  }
}

// Validate package
if (!PACKAGE) {
  console.error(`${RED}Error: Package name is required${NC}`);
  console.log('Use -h or --help for usage information');
  process.exit(1);
}

// Validate package name
if (PACKAGE !== 'all' && !PACKAGES[PACKAGE]) {
  console.error(`${RED}Error: Unknown package '${PACKAGE}'${NC}`);
  console.log('Available packages:');
  for (const pkg of Object.keys(PACKAGES)) {
    console.log(`  - ${pkg}`);
  }
  process.exit(1);
}

// Utility functions
function exec(command, options = {}) {
  const defaultOptions = { cwd: ROOT_DIR, stdio: 'pipe', encoding: 'utf-8' };
  return execSync(command, { ...defaultOptions, ...options });
}

function getPackageName(dir) {
  const pkgPath = path.join(ROOT_DIR, dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.name;
}

function getVersion(dir) {
  const pkgPath = path.join(ROOT_DIR, dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

function readPackageJson(dir) {
  const pkgPath = path.join(ROOT_DIR, dir, 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function writePackageJson(dir, pkg) {
  const pkgPath = path.join(ROOT_DIR, dir, 'package.json');
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function bumpVersion(version, bumpType) {
  const parts = version.split('.');
  if (parts.length !== 3) {
    // Handle versions with pre-release suffix
    const baseVersion = version.replace(/-.*$/, '');
    const baseParts = baseVersion.split('.');
    if (baseParts.length !== 3) {
      throw new Error(`Invalid version format: ${version}`);
    }
    // Return bumped base version without suffix
    version = baseVersion;
  }

  const [major, minor, patch] = version.split('.').map(Number);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

function updateBetaVersion(currentVersion) {
  // Check if already a beta version
  if (currentVersion.includes('-beta')) {
    const match = currentVersion.match(/-beta\.(\d+)$/);
    if (match) {
      const baseVersion = currentVersion.replace(/-beta\.\d+$/, '');
      const betaNum = parseInt(match[1], 10) + 1;
      return `${baseVersion}-beta.${betaNum}`;
    }
  }

  // Add beta.0 suffix
  return `${currentVersion}-beta.0`;
}

function resolveWorkspaceDependency(depName) {
  // Try packages directory
  let depPkgPath = path.join(ROOT_DIR, 'packages', depName, 'package.json');
  if (fs.existsSync(depPkgPath)) {
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
    return `^${depPkg.version}`;
  }

  // Try apps directory
  depPkgPath = path.join(ROOT_DIR, 'apps', depName, 'package.json');
  if (fs.existsSync(depPkgPath)) {
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
    return `^${depPkg.version}`;
  }

  return null;
}

function updateWorkspaceDeps(pkg) {
  console.log(`${BLUE}Updating workspace dependencies...${NC}`);

  const updatedDeps = [];

  // Update dependencies
  if (pkg.dependencies) {
    for (const [dep, version] of Object.entries(pkg.dependencies)) {
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        const depName = dep.replace('@agent-orch/', '');
        const resolvedVersion = resolveWorkspaceDependency(depName);
        if (resolvedVersion) {
          pkg.dependencies[dep] = resolvedVersion;
          updatedDeps.push(`${dep}: ${resolvedVersion}`);
          console.log(`  ${dep}: ${version} -> ${resolvedVersion}`);
        } else {
          console.log(`  Warning: Could not resolve ${dep}`);
        }
      }
    }
  }

  // Update devDependencies
  if (pkg.devDependencies) {
    for (const [dep, version] of Object.entries(pkg.devDependencies)) {
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        const depName = dep.replace('@agent-orch/', '');
        const resolvedVersion = resolveWorkspaceDependency(depName);
        if (resolvedVersion) {
          pkg.devDependencies[dep] = resolvedVersion;
          updatedDeps.push(`${dep}: ${resolvedVersion}`);
          console.log(`  ${dep} (dev): ${version} -> ${resolvedVersion}`);
        } else {
          console.log(`  Warning: Could not resolve ${dep}`);
        }
      }
    }
  }

  return updatedDeps;
}

async function checkNpmVersion(pkgName, version) {
  try {
    const result = exec(`npm view ${pkgName}@${version} version`, { stdio: 'pipe' });
    return result.trim() === version;
  } catch {
    return false;
  }
}

async function publishPackage(pkgKey) {
  const dir = PACKAGES[pkgKey];
  const pkgName = getPackageName(dir);
  const originalPkg = readPackageJson(dir);
  const originalVersion = originalPkg.version;
  const pkgPath = path.join(ROOT_DIR, dir, 'package.json');

  // Track if we need to restore
  let needsRestore = false;

  try {
    console.log('');
    console.log(`${BLUE}----------------------------------------${NC}`);
    console.log(`${BLUE}Publishing: ${pkgName}${NC}`);
    console.log(`${BLUE}Directory: ${dir}${NC}`);
    console.log(`${BLUE}Current version: ${originalVersion}${NC}`);
    console.log(`${BLUE}----------------------------------------${NC}`);

    // Calculate new version
    let newVersion = originalVersion;

    // Handle bump
    if (BUMP) {
      newVersion = bumpVersion(originalVersion, BUMP);
      console.log(`${YELLOW}Bumping ${BUMP}: ${originalVersion} -> ${newVersion}${NC}`);
    }

    // Handle beta (beta takes precedence over bump for display, but they can be combined)
    if (BETA) {
      // If we bumped, use the bumped version as base for beta
      const baseVersion = BUMP ? newVersion : originalVersion;
      newVersion = updateBetaVersion(baseVersion);
      console.log(`${YELLOW}Beta version: ${newVersion}${NC}`);
    }

    // Check if already published (auto-skip without error)
    console.log(`${YELLOW}Checking npm registry...${NC}`);
    const isPublished = await checkNpmVersion(pkgName, newVersion);

    if (isPublished) {
      console.log(`${YELLOW}⚠ ${pkgName}@${newVersion} is already published, skipping${NC}`);
      return;
    }

    console.log(`${GREEN}✓ Version ${newVersion} is available${NC}`);

    // Prepare package for publishing
    const publishPkg = JSON.parse(JSON.stringify(originalPkg));
    needsRestore = true;

    // Update version
    if (newVersion !== originalVersion) {
      publishPkg.version = newVersion;
    }

    // Update workspace dependencies
    updateWorkspaceDeps(publishPkg);

    // Write modified package.json
    writePackageJson(dir, publishPkg);

    // Build the package
    console.log(`${YELLOW}Building ${pkgName}...${NC}`);
    exec('pnpm build', { cwd: path.join(ROOT_DIR, dir) });

    // Publish
    console.log(`${YELLOW}Publishing ${pkgName}@${newVersion} with tag '${TAG}'...${NC}`);

    if (DRY_RUN) {
      console.log(`${GREEN}[DRY RUN] Would publish ${pkgName}@${newVersion} with tag '${TAG}'${NC}`);
    } else {
      try {
        exec(`npm publish --tag ${TAG} --access public`, {
          cwd: path.join(ROOT_DIR, dir),
          stdio: 'inherit',
        });
        console.log(`${GREEN}✓ Published ${pkgName}@${newVersion}${NC}`);
      } catch (error) {
        // Check if the error is because version already exists
        if (error.stderr && error.stderr.includes('403') && error.stderr.includes('cannot publish over')) {
          console.log(`${YELLOW}⚠ ${pkgName}@${newVersion} already exists, skipping${NC}`);
        } else {
          throw error;
        }
      }
    }

    // Restore original package.json
    writePackageJson(dir, originalPkg);
    needsRestore = false;
    console.log(`${BLUE}Restored original package.json${NC}`);

  } catch (error) {
    // Restore original package.json on error
    if (needsRestore) {
      writePackageJson(dir, originalPkg);
      console.log(`${YELLOW}Restored original package.json after error${NC}`);
    }
    throw error;
  }
}

// Main
console.log(`${BLUE}========================================${NC}`);
console.log(`${BLUE}  Agent Orch Publish Script${NC}`);
console.log(`${BLUE}========================================${NC}`);
console.log('');

// Get current git branch and commit
try {
  const branch = exec('git rev-parse --abbrev-ref HEAD').trim();
  const commit = exec('git rev-parse --short HEAD').trim();
  console.log(`Branch: ${YELLOW}${branch}${NC}`);
  console.log(`Commit: ${YELLOW}${commit}${NC}`);
} catch {
  console.log(`Branch: ${YELLOW}unknown${NC}`);
  console.log(`Commit: ${YELLOW}unknown${NC}`);
}
console.log(`Beta: ${YELLOW}${BETA}${NC}`);
console.log(`Bump: ${YELLOW}${BUMP || 'none'}${NC}`);
console.log(`Tag: ${YELLOW}${TAG}${NC}`);
console.log('');

if (PACKAGE === 'all') {
  console.log(`${BLUE}Publishing all packages...${NC}`);

  // Determine publish order based on dependencies
  // core -> tool, llm -> orch, appkit -> cli, react-agent
  const PUBLISH_ORDER = ['core', 'tool', 'llm', 'orch', 'appkit', 'react-agent', 'cli'];

  for (const pkg of PUBLISH_ORDER) {
    if (PACKAGES[pkg]) {
      try {
        await publishPackage(pkg);
      } catch (error) {
        console.error(`${RED}Error publishing ${pkg}: ${error.message}${NC}`);
        process.exit(1);
      }
    }
  }
} else {
  try {
    await publishPackage(PACKAGE);
  } catch (error) {
    console.error(`${RED}Error publishing ${PACKAGE}: ${error.message}${NC}`);
    process.exit(1);
  }
}

console.log('');
console.log(`${GREEN}========================================${NC}`);
console.log(`${GREEN}  Publish Complete!${NC}`);
console.log(`${GREEN}========================================${NC}`);

process.exit(0);

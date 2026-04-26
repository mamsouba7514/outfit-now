const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so Metro sees shared packages
config.watchFolders = [monorepoRoot];

// 2. Resolve packages from project first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. CRITICAL for monorepos: stop Metro from crawling up the directory tree
//    to find node_modules — it must only use nodeModulesPaths above.
config.resolver.disableHierarchicalLookup = true;

// 4. Fix HMR crash: Metro's HmrServer resolves the entry point as a
//    RELATIVE path (./node_modules/expo-router/entry) from projectRoot.
//    With disableHierarchicalLookup, it only checks projectRoot/node_modules
//    which is empty in a monorepo. We ensure the symlink exists at startup.
const localModules = path.resolve(projectRoot, 'node_modules');
const rootModules = path.resolve(monorepoRoot, 'node_modules');
const CRITICAL_PKGS = ['expo-router', 'expo', 'react', 'react-native'];
if (!fs.existsSync(localModules)) fs.mkdirSync(localModules, { recursive: true });
for (const pkg of CRITICAL_PKGS) {
  const link = path.join(localModules, pkg);
  const target = path.join(rootModules, pkg);
  if (!fs.existsSync(link) && fs.existsSync(target)) {
    fs.symlinkSync(target, link);
  }
}

module.exports = config;

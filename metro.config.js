const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const appNodeModules = path.resolve(__dirname, 'node_modules');
const nobleHashesRoot = path.join(appNodeModules, '@noble', 'hashes');

const { resolver } = config;

config.resolver = {
  ...resolver,
  unstable_conditionsByPlatform: {
    ...resolver.unstable_conditionsByPlatform,
    ios: ['react-native', 'browser'],
    android: ['react-native', 'browser'],
  },
  resolveRequest(context, moduleName, platform) {
    if (moduleName === '@noble/hashes/crypto' || moduleName === '@noble/hashes/crypto.js') {
      return {
        type: 'sourceFile',
        filePath: path.join(nobleHashesRoot, 'crypto.js'),
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

config.watchFolders = Array.from(new Set([...(config.watchFolders || []), appNodeModules]));

module.exports = config;

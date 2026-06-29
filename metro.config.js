const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const nobleHashesRoot = path.resolve(__dirname, '..', '..', 'node_modules', '@noble', 'hashes');

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

module.exports = config;

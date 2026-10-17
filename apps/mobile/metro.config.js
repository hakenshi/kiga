const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.sourceExts.push('sql');
config.resolver.assetExts.push('wasm');
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const nativewindConfig = withNativewind(config, { inlineRem: 16 });
const defaultResolveRequest = nativewindConfig.resolver.resolveRequest;

nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    context.originModulePath.includes(`${path.sep}react-native-web${path.sep}`)
  ) {
    return context.resolveRequest(context, moduleName, platform);
  }

  return defaultResolveRequest(context, moduleName, platform);
};

module.exports = nativewindConfig;

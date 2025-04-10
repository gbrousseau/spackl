const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration
const customConfig = {
  resolver: {
    // Ensure proper resolution of circular dependencies
    enableGlobalPackages: true,
    // Add file extensions that need to be processed
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs'],
  },
  transformer: {
    // Enable hermes engine
    enableBabelRuntimeConfig: true,
    // Enable global babel config
    enableBabelRuntime: true,
  },
};

// Merge default config with custom config
module.exports = mergeConfig(config, customConfig);
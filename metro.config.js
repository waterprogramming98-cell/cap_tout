const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    nodeModulesPaths: [
      '/tmp/ToutApp_work/node_modules',
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

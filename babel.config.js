module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin MUST be listed last in the plugins array.
    plugins: ['react-native-reanimated/plugin'],
  };
};

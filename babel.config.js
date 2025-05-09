module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env.local',
      blocklist: null,
      allowlist: null,
      safe: false,
      allowUndefined: true,
      verbose: false
    }]
  ],
};

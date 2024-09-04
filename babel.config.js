module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ["module:react-native-dotenv", {
      "envName": "APP_ENV",
      "moduleName": "@env",
      "path": ".env",
      "safe": false,
      "allowUndefined": false,
      "verbose": false
    }],
    ["@babel/plugin-transform-export-namespace-from"],
  ]
};

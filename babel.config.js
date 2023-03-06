module.exports = function (api) {
  api.cache(true);

  const presets = [
    "@babel/preset-env",
    "@babel/preset-typescript",
  ];
  const plugins = [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/proposal-class-properties", { "loose": true }],
    "@babel/proposal-object-rest-spread",
  ];

  return {
    presets,
    plugins
  };
};

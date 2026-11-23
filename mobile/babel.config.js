module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@shared": "../shared",
            "@mobile": "./",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};

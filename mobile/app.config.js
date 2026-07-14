const fs = require("fs");

const APP_ENV = process.env.APP_ENV ?? "development";
require("dotenv").config({ path: `../.env.${APP_ENV}` });
require("dotenv").config({ path: "../.env.local" });

const configs = {
  development: {
    name: "Template Dev",
    bundleIdentifier: "com.yourcompany.template.dev",
    androidPackage: "com.yourcompany.template.dev",
    version: "1.0.0",
    androidVersionCode: 1,
  },
  production: {
    name: "Template",
    bundleIdentifier: "com.yourcompany.template",
    androidPackage: "com.yourcompany.template",
    version: process.env.EXPO_PUBLIC_VERSION ?? "1.0.0",
    androidVersionCode: 1,
  },
};

const { name, bundleIdentifier, androidPackage, version, androidVersionCode } =
  configs[APP_ENV] ?? configs.development;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name,
    slug: "template-mobile",
    version,
    orientation: "portrait",
    scheme: "template",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F0F1A",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#0F0F1A",
      },
      package: androidPackage,
      versionCode: androidVersionCode,
    },
    plugins: [
      ["expo-build-properties", { android: { compileSdkVersion: 35, targetSdkVersion: 35 } }],
    ],
    extra: {
      eas: { projectId: process.env.EAS_PROJECT_ID ?? "YOUR_EAS_PROJECT_ID" },
    },
  },
};

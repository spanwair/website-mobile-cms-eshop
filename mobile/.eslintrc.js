module.exports = {
  extends: ["universe/native"],
  rules: {
    "import/order": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};

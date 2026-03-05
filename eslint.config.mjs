import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-constant-condition": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["warn", "always"],
      "no-irregular-whitespace": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "contracts/**",
      "artifacts/**",
      "cache/**",
      ".npm-cache/**",
      "deployments/**",
      "*.config.js",
    ],
  },
];

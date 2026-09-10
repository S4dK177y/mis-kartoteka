import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } }
  },
  pluginJs.configs.recommended,
  {
    ignores: ["node_modules/", "data/", "backups/"]
  },
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-empty": "warn",
      "preserve-caught-error": "off"
    }
  }
];

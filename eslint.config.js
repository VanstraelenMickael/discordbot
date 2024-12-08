import js from "@eslint/js";
import globals from "globals";
export default [
    {
        ignores: ["**/node_modules/**/*"]
    },
    js.configs.recommended,
    {
        linterOptions: {
            reportUnusedDisableDirectives: "error"
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 2022, // cf. https://node.green/ for mapping with Node version
            sourceType: "module",
        },

        rules: {
            "no-alert": "error",
            "no-eval": "error",
            "no-var": "error",
            eqeqeq: "error",
            "prefer-const": "error",
            quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: false }],
            "padded-blocks": ["error", "never"],
            "dot-notation": "error",
            "no-undef-init": "error",
            "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
            "require-atomic-updates": "error",
            "no-duplicate-imports": "warn",
            "no-tabs": "error",
            "no-trailing-spaces": "error",
            "no-multiple-empty-lines": "error",
            "spaced-comment": ["error", "always", { markers: ["/"], exceptions: ["*"] }],
        }
    }
];

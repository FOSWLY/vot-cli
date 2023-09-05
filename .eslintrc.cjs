module.exports = {
    env: {
        "es2021": true,
        "node": true
    },
    extends: "eslint:recommended",
    overrides: [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    parserOptions: {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    rules: {
        "no-control-regex": 0,
        "no-async-promise-executor": 0
    },
    ignorePatterns: [
        "scripts/*",
    ]
}

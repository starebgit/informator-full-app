module.exports = {
    extends: ["react-app", "prettier"],
    rules: {
        eqeqeq: "off",
        "no-unused-vars": "off",
    },
    overrides: [
        {
            files: ["**/*.js?(x)"],
            rules: {
                // ******** add ignore rules here *********
                "import/no-webpack-loader-syntax": "off",
            },
        },
    ],
};

const CracoEsbuildPlugin = require("craco-esbuild");
const webpack = require("webpack");

module.exports = {
    plugins: [
        {
            plugin: CracoEsbuildPlugin,
            options: {
                esbuildLoaderOptions: {
                    // Optional. Defaults to auto-detect loader.
                    loader: "jsx", // Set the value to 'tsx' if you use typescript
                    target: "es2015",
                    jsx: "automatic",
                },
                esbuildMinimizerOptions: {
                    target: "es2015",
                    css: true, //  OptimizeCssAssetsWebpackPlugin being replaced by esbuild.
                },
            },
        },
    ],
    webpack: {
        plugins: {
            add: [
                new webpack.DefinePlugin({
                    process: {
                        "env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
                        browser: {},
                    },
                }),
            ],
        },
        configure: {
            resolve: {
                fallback: {
                    fs: false,
                    tls: false,
                    net: false,
                    path: false,
                    zlib: false,
                    http: false,
                    https: false,
                    stream: false,
                    crypto: false,
                    buffer: false,
                },
            },
        },
    },
};

const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BabiliPlugin = require("babili-webpack-plugin");
const path = require('path');

module.exports = {
    entry: {
        settings: path.join(__dirname, 'src/settings.ts'),
        twitch: path.join(__dirname, 'src/twitch.ts'),
        background: path.join(__dirname, 'src/background.ts'),
        vendor: ['jquery', 'jquery-sortable']
    },
    output: {
        path: path.join(__dirname, 'dist/js'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
            {
                test: require.resolve("jquery"),
                loader: "expose-loader?$!expose-loader?jQuery"
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        // pack common vendor files
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity
        }),

        // exclude locale files in moment
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

        new CopyWebpackPlugin([
            {from: 'static/**/*', to: '../'},
            {from: 'manifest.json', to: '../manifest.json'}
        ]),

        new BabiliPlugin({
            "keepClassName": true
        }, {})
    ]
};
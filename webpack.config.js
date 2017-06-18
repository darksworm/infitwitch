const webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        settings: path.join(__dirname, 'src/settings.ts'),
        twitch: path.join(__dirname, 'src/twitch.ts'),
        background: path.join(__dirname, 'src/background.ts'),
        vendor: ['jquery']
    },
    output: {
        path: path.join(__dirname, 'dist/js'),
        filename: '[name].js'
    },
    module: {
        loaders: [{
            exclude: /node_modules/,
            test: /\.tsx?$/,
            loader: 'ts-loader'
        }]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        // pack common vender files
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity
        }),

        // exclude locale files in moment
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

        // minify
        // new webpack.optimize.UglifyJsPlugin()

        new CopyWebpackPlugin([
            {from: 'static/**/*', to: '../'},
            {from: 'manifest.json', to: '../manifest.json'}
        ])
    ]
};
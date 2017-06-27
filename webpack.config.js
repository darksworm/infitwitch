const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BabiliPlugin = require("babili-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require('path');
const WebpackStrip = require('strip-loader');

const extractSass = new ExtractTextPlugin({
    filename: "../css/[name].css"
});

module.exports = {
    entry: {
        settings: path.join(__dirname, 'src/ts/settings.ts'),
        twitch: path.join(__dirname, 'src/ts/cs/twitch.ts'),
        login: path.join(__dirname, 'src/ts/cs/login.ts'),
        background: path.join(__dirname, 'src/ts/background.ts'),
        popup: path.join(__dirname, 'src/ts/popup.ts'),
        vendor: [
            'jquery',
            'jquery-sortable'
        ],
        styles: [
            path.join(__dirname, 'src/scss/popup.scss'),
            path.join(__dirname, 'src/scss/settings.scss')
        ],
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
                use: [{
                    loader: 'ts-loader'
                }, {
                    // removes debug logging
                    loader: WebpackStrip.loader('console.log')
                }]
            },
            {
                test: require.resolve("jquery"),
                loader: "expose-loader?$!expose-loader?jQuery"
            },
            {
                test: /\.svg$/,
                loader: 'svg-url-loader'
            },
            {
                test: /\.scss$/,
                loader: extractSass.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "sass-loader"
                    }]
                })
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        extractSass,
        // pack common vendor files
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity
        }),

        // exclude locale files in moment
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

        new CopyWebpackPlugin([
            {from: 'static/template/*', to: '../'},
            {from: 'static/img/*.png', to: '../'},
            {from: 'manifest.json', to: '../manifest.json'}
        ]),

        new BabiliPlugin({}, {})
    ]
};
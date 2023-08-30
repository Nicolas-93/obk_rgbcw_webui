const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const LinkTypePlugin = require('html-webpack-link-type-plugin').HtmlWebpackLinkTypePlugin

module.exports = {
  //path to entry paint
  entry: './src/js/main.js',

  externals: {
    '@jaames/iro': 'iro'
  },

  //path and filename of the final output
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  mode: 'production',
  //devtool: "inline-source-map",

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        // OBK send header with Content-Type: application/octet-stream, and prevent CSS to load
        removeStyleLinkTypeAttributes: false,
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new MiniCssExtractPlugin(),
    new LinkTypePlugin()
  ],
  module: {
    rules: [
      /*{
          test: /.css$/,
          use: [
              'style-loader',
              'css-loader'
          ],
      }*/
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(?:js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "> 0.5%, last 2 versions, Firefox ESR, not dead" }]
            ],
            plugins: [
              ["@babel/plugin-proposal-decorators", {legacy: true}],
              ["@babel/plugin-transform-class-properties", {"version": "2023-05"}]
            ]
          }
        }
      }
    ]
  }
}

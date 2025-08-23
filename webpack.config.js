// Webpack configuration used to build the browser ready bundle.  The
// configuration is intentionally minimal as the project only exposes a single
// entry point and produces a self contained UMD build.
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Main library entry file to bundle
  entry: './stegcloak.js',
  // Output configuration for the generated bundle
  output: {
    // Name of the compiled asset
    filename: 'stegcloak.min.js',
    // Emit files into the `dist` directory relative to this config
    path: path.resolve(__dirname, 'dist'),
    // Expose the library globally when used directly in the browser
    library:'StegCloak'
  },
  // Additional plugins applied during the build
  plugins: [
    // Automatically inject the bundle into a generated HTML shell for testing
    new HtmlWebpackPlugin(),
]
}

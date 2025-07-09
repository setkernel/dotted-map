const path = require('path');
const fs = require('fs');

class CleanOutput {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CleanOutput', () => {
      if (fs.existsSync('./index.js')) {
        fs.rmSync('./index.js');
      }
      if (fs.existsSync('./without-countries.js')) {
        fs.rmSync('./without-countries.js');
      }
    });
  }
}

module.exports = {
  entry: {
    index: './src/with-countries.js',
    'without-countries': './src/without-countries.js',
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname),
    filename: '[name].js',
    library: {
      name: '@setkernel/dotted-map-next',
      type: 'umd',
    },
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'json',
      },
    ],
  },
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
    ],
  },
  externals: {
    '@turf/boolean-point-in-polygon': '@turf/boolean-point-in-polygon',
    proj4: 'proj4',
  },
  plugins: [new CleanOutput()],
  performance: {
    maxEntrypointSize: 100000, // 100KB
    maxAssetSize: 100000, // 100KB
  },
};

/**
 * Home MFE Webpack Configuration
 *
 * Role: Remote microfrontend (loaded by shell)
 *
 * Key Differences from Shell:
 * - filename: 'remoteEntry.js' (so shell can discover this MFE)
 * - exposes: What this MFE exports
 * - port: 3001 (different from shell's 3000)
 * - react: eager: false (shell provides React)
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const deps = require('./package.json').dependencies;

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    // ENTRY POINT
    // Same as shell: async bootstrap to initialize MF runtime
    entry: './src/bootstrap.jsx',

    // OUTPUT
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev
        ? '[name].js'
        : '[name].[contenthash:8].js',
      publicPath: 'auto', // Auto-detect CDN or self-hosted path
    },

    // DEV SERVER
    devServer: {
      port: 3001, // Different port from shell (3000)
      hot: true,
      headers: {
        // Critical: Allow shell (localhost:3000) to load from here
        'Access-Control-Allow-Origin': '*',
      },
    },

    // MODULE RULES (same as shell)
    module: {
      rules: [
        {
          test: /\.(jsx|js)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-react',
                '@babel/preset-env',
              ],
              plugins: isDev ? ['react-refresh/babel'] : [],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        },
      ],
    },

    // PLUGINS
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: !isDev,
      }),

      ...(isDev ? [new ReactRefreshWebpackPlugin()] : []),

      // MODULE FEDERATION PLUGIN
      new container.ModuleFederationPlugin({
        // ==========================================
        // REMOTE (MFE) CONFIGURATION
        // ==========================================

        // Container name (appears as window.home)
        // Must match key in shell's remotes config
        name: 'home',

        // CRITICAL: filename tells webpack to generate remoteEntry.js
        // This is the "manifest" file that shell fetches to discover this MFE
        // Without this, shell can't find what this MFE exports
        filename: 'remoteEntry.js',

        // What this MFE exports (the contract with shell)
        exposes: {
          // Format: './exportName': './file/path.jsx'
          // Shell imports as: import('home/App')

          './App': './src/App.jsx',
          // This is the main Home page component
          // Shell's lazy() will load this when user navigates to home

          // Optional: Can expose more things if needed
          // './utils': './src/utils.js',
          // './components/Card': './src/components/Card.jsx',
        },

        // Shared dependencies
        shared: {
          // ==========================================
          // REACT (Singleton, but lazy loaded)
          // ==========================================
          react: {
            singleton: true,
            requiredVersion: deps.react,

            // DIFFERENT from shell: eager: false
            // Why? Shell loads React eagerly
            // This MFE lazy-loads, reuses shell's React when needed
            eager: false,

            strictVersion: false,
          },

          // REACT-DOM (paired with React)
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
            eager: false, // DIFFERENT: lazy load
            strictVersion: false,
          },

          // SHARED LIBRARY (@lifeexp/shared)
          '@lifeexp/shared': {
            // eager: true = This MFE needs components immediately
            // Shared components used in render, not optional
            eager: true,

            requiredVersion: '1.0.0',
            strictVersion: false,
          },
        },
      }),
    ],

    // RESOLVE
    resolve: {
      extensions: ['.jsx', '.js', '.json'],
    },

    // OPTIMIZATION
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },

    // DEVELOPMENT TOOLS
    devtool: isDev ? 'cheap-module-source-map' : 'source-map',

    // PERFORMANCE HINTS
    performance: {
      hints: isDev ? false : 'warning',
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },

    // STATS
    stats: {
      preset: isDev ? 'summary' : 'verbose',
      colors: true,
    },

    mode: argv.mode || 'development',
  };
};

/**
 * KEY DIFFERENCES FROM SHELL:
 *
 * 1. filename: 'remoteEntry.js'
 *    - Shell DOES NOT have this
 *    - MFEs MUST have this so shell can discover them
 *
 * 2. exposes: { './App': './src/App.jsx' }
 *    - Shell DOES NOT have this (shell doesn't export anything)
 *    - MFEs MUST have this to declare what they offer
 *
 * 3. port: 3001 (not 3000)
 *    - Shell on 3000
 *    - Each MFE on different port
 *
 * 4. react: eager: false
 *    - Shell: eager: true (load immediately)
 *    - MFE: eager: false (lazy load, shell provides)
 *
 * USAGE:
 *
 * Development:
 *   $ npm run dev --workspace=home-mfe
 *   Runs on http://localhost:3001
 *   Generates dist/remoteEntry.js
 *
 * Production:
 *   $ npm run build --workspace=home-mfe
 *   Outputs to dist/
 *   remoteEntry.js included in output
 *   Deploy to CDN or self-hosted server
 */

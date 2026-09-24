/**
 * Shell (Host) Webpack Configuration
 *
 * Role: Orchestrates all MFEs, handles routing, provides shared dependencies
 *
 * Key Concepts:
 * - entry: bootstrap.jsx (async, gives MF runtime time to init)
 * - remotes: List of MFEs this shell can load
 * - shared: React (singleton, eager) + custom shared lib
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

// Read from this package's package.json to get version constraints
const deps = require('./package.json').dependencies;

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    // ENTRY POINT
    // Use bootstrap.jsx (not App.jsx) so Webpack MF runtime can initialize
    entry: './src/bootstrap.jsx',

    // OUTPUT
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev
        ? '[name].js'
        : '[name].[contenthash:8].js',
      publicPath: 'auto', // Auto-detect URL (works with CDN or self-hosted)
      // publicPath: 'auto' means:
      // - Dev: http://localhost:3000/
      // - Prod CDN: https://cdn.example.com/shell/
      // - Prod self-hosted: https://example.com/shell/
    },

    // DEV SERVER
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true, // Support SPA routing
      headers: {
        // Allow cross-origin requests from other MFEs
        // Critical for loading remoteEntry.js from different ports
        'Access-Control-Allow-Origin': '*',
      },
      proxy: {
        // Optional: proxy requests to other MFEs during dev
        // Useful if running all on same origin locally
        // '/mfes': {
        //   target: 'http://localhost:3001',
        //   pathRewrite: { '^/mfes': '' },
        // },
      },
    },

    // MODULE RULES
    module: {
      rules: [
        // JSX/JS files: Babel compilation
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
        // CSS files: Style injection
        {
          test: /\.css$/,
          use: isDev
            ? ['style-loader', 'css-loader']
            : ['style-loader', 'css-loader'],
          // In production, could use MiniCssExtractPlugin for separate CSS file
        },
        // Images, fonts, etc
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        },
      ],
    },

    // PLUGINS
    plugins: [
      // Generate index.html with injected script tags
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
        minify: !isDev,
      }),

      // Hot reload in development
      ...(isDev ? [new ReactRefreshWebpackPlugin()] : []),

      // MODULE FEDERATION PLUGIN
      new container.ModuleFederationPlugin({
        // ==========================================
        // SHELL CONFIGURATION
        // ==========================================

        // Container name (appears as window.shell)
        name: 'shell',

        // MFEs this shell can load
        remotes: {
          // Format: name@url/remoteEntry.js
          // URL comes from environment variable (for flexibility)
          // Fallback to localhost for development
          home: `home@${
            process.env.HOME_MFE_URL || 'http://localhost:3001'
          }/remoteEntry.js?v=${Date.now()}`,
          // Adding ?v=timestamp forces fresh download (bypasses browser cache)
          // In production with CDN, use immutable file paths instead

          littleHuman: `littleHuman@${
            process.env.LITTLE_HUMAN_MFE_URL || 'http://localhost:3002'
          }/remoteEntry.js?v=${Date.now()}`,

          resume: `resume@${
            process.env.RESUME_MFE_URL || 'http://localhost:3003'
          }/remoteEntry.js?v=${Date.now()}`,

          reactLab: `reactLab@${
            process.env.REACT_LAB_MFE_URL || 'http://localhost:3004'
          }/remoteEntry.js?v=${Date.now()}`,

          aiLearning: `aiLearning@${
            process.env.AI_LEARNING_MFE_URL || 'http://localhost:3005'
          }/remoteEntry.js?v=${Date.now()}`,
        },

        // Shared dependencies
        shared: {
          // ==========================================
          // REACT (Singleton - Only One Instance)
          // ==========================================
          react: {
            // singleton: true = Only one instance across entire app
            // Why? Prevents duplicate React, saves 150KB per MFE
            singleton: true,

            // requiredVersion: Version constraint from this package.json
            // Example: "^19.0.0" means >=19.0.0 and <20.0.0
            // Each MFE must declare compatible version or build fails
            requiredVersion: deps.react,

            // eager: true = Load React immediately in shell
            // Why? Shell is entry point, React needed right away
            // MFEs will use eager: false (lazy load, reuse shell's React)
            eager: true,

            // strictVersion: false = Allow semver-compatible versions
            // 19.2.0 ok with ^19.0.0
            // If true: requires exact match (19.2.0 !== 19.2.1 fails)
            strictVersion: false,

            // shareKey: optional, defaults to dep name
            // shareScope: optional, defaults to 'default'
          },

          // REACT-DOM (also singleton, paired with React)
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
            eager: true,
            strictVersion: false,
          },

          // ==========================================
          // SHARED LIBRARY (@lifeexp/shared)
          // ==========================================
          // Shared: SectionHeading, ScrollButton, PageHero, useRenderTracker
          '@lifeexp/shared': {
            // eager: true = MFEs need this immediately
            // They depend on shared components to render
            eager: true,

            // requiredVersion: Minimum version
            // Will be defined when shared lib created
            requiredVersion: '1.0.0',

            strictVersion: false,
          },

          // OPTIONAL: Other shared libraries
          // If you add lodash, axios, etc., add here:
          // lodash: {
          //   singleton: true,
          //   requiredVersion: deps.lodash,
          //   strictVersion: false,
          // },
        },
      }),
    ],

    // RESOLVE
    resolve: {
      extensions: ['.jsx', '.js', '.json'],
      alias: {
        // Optional: Create aliases for common imports
        // '@components': path.resolve(__dirname, 'src/components'),
        // '@pages': path.resolve(__dirname, 'src/pages'),
      },
    },

    // OPTIMIZATION
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor code (node_modules) in separate bundle for caching
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common code used by multiple chunks
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      minimizer: [],
      // Note: Terser (JS minifier) auto-added in production mode
    },

    // DEVELOPMENT TOOLS
    devtool: isDev ? 'cheap-module-source-map' : 'source-map',
    // cheap-module-source-map: Fast rebuild in dev, good for debugging
    // source-map: Slower but complete in prod (disable if size is issue)

    // PERFORMANCE HINTS
    performance: {
      hints: isDev ? false : 'warning',
      maxAssetSize: 512000, // 512KB
      maxEntrypointSize: 512000,
    },

    // STATS
    stats: {
      preset: isDev ? 'summary' : 'verbose',
      colors: true,
    },

    // MODE (can also pass via --mode flag)
    mode: argv.mode || 'development',
  };
};

/**
 * USAGE:
 *
 * Development (local):
 *   $ npm run dev
 *   Shell runs on http://localhost:3000
 *   Loads MFEs from http://localhost:3001-3005
 *
 * Production (self-hosted):
 *   $ npm run build
 *   Output to dist/
 *   Deploy to: https://example.com/shell/
 *
 * Production (CDN):
 *   $ HOME_MFE_URL=https://cdn.example.com/mfes/home npm run build
 *   $ LITTLE_HUMAN_MFE_URL=https://cdn.example.com/mfes/little-human npm run build
 *   (Repeat for all MFEs)
 *   Deploy dist/ to: https://cdn.example.com/shell/
 *
 * Environment Variables:
 *   HOME_MFE_URL               (default: http://localhost:3001)
 *   LITTLE_HUMAN_MFE_URL       (default: http://localhost:3002)
 *   RESUME_MFE_URL             (default: http://localhost:3003)
 *   REACT_LAB_MFE_URL          (default: http://localhost:3004)
 *   AI_LEARNING_MFE_URL        (default: http://localhost:3005)
 */

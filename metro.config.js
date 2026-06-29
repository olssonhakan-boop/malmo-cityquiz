const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    unstable_allowRequireContext: true,
  },
  server: {
    // Force plain JS bundle — OkHttp on Windows fails on Metro's multipart chunked response
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (req.headers) {
          // Strip multipart accept so Metro sends plain application/javascript
          req.headers['accept'] = 'application/javascript';
        }
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

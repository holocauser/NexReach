const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for import.meta
config.transformer.unstable_allowRequireContext = true;

// Ensure proper module resolution for web
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;
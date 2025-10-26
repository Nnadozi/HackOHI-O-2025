const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add exclusions for Python backend files and virtual environments
config.resolver.blockList = [
  // Exclude Python virtual environment
  /app\/backend\/\.venv\/.*/,
  /\.venv\/.*/,
  
  // Exclude Python cache files
  /__pycache__\/.*/,
  /\.pyc$/,
  
  // Exclude Python package JavaScript files that cause errors
  /.*\/site-packages\/.*\.js$/,
  
  // Exclude specific problematic files
  /.*\/matplotlib\/.*\.js$/,
  /.*\/sklearn\/.*\.js$/,
  /.*\/urllib3\/.*\.js$/,
  
  // Exclude Jupyter/IPython related files
  /.*\/IPython\/.*/,
  /.*\/jupyter\/.*/,
  /.*\/notebook\/.*/,
];

// Also update watchFolders to exclude the backend directory from watching
config.watchFolders = config.watchFolders?.filter(
  folder => !folder.includes('backend/.venv')
);

// Ignore Python files in the resolver
config.resolver.assetExts = config.resolver.assetExts.filter(
  ext => ext !== 'py' && ext !== 'pyc'
);

module.exports = config;

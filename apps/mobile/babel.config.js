module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo']],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.js',
            '.android.js',
            '.ios.tsx',
            '.android.tsx',
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '.json',
            '.png',
            '.jpg',
            '.jpeg',
            '.svg',
          ],
          alias: {
            '@': './src',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};

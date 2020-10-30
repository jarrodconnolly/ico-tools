'use strict';

module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script',
  },
  rules: {
    'max-len': ['error', { code: 120, ignoreComments: true }],
    strict: ['error', 'global'],
  },
};

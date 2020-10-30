'use strict';

module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testEnvironment: 'node',
};

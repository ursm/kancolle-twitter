const {defaults} = require('jest-config')

module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],

  testMatch:            [...defaults.testMatch, '**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).mjs'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mjs'],

  transform: {
    '^.+\\.m?js$': 'babel-jest'
  }
}

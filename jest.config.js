const {defaults} = require('jest-config')

module.exports = {
  testMatch:            [...defaults.testMatch, '**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).mjs'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mjs'],

  transform: {
    '^.+\\.m?js$': 'babel-jest'
  }
}

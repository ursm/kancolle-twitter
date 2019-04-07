const EventEmitter = require('events')

module.exports = class {
  stream() {
    return new EventEmitter()
  }
}

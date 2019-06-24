const makePlugin = require('ilp-plugin')

export class Plugins {
  create () {
    return makePlugin()
  }
}

'use strict';
if (typeof window !== 'undefined') {
  module.exports = require('./browser');
} else {
  module.exports = require('./lib/file');
}

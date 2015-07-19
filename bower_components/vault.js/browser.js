'use strict';
var version = require('./package.json').version;
var Cookie = require('./lib/browser').Cookie;
var Local = require('./lib/browser').Local;
var Session = require('./lib/browser').Session;

module.exports = {
  version: version,
  Cookie: Cookie,
  Local: Local,
  Session: Session,
  set: function(key, value, config) {
    if (config && config.expires) {
      return Local.set(key, value, config);
    } else {
      return Session.set(key, value, config);
    }
    return Cookie.set(key, value, config);
  },
  get: function(key) {
    var sess = Session.get(key);
    if (sess !== undefined) {
      return sess;
    } else {
      var local = Local.get(key);
      if (local !== undefined) {
        return local;
      } else {
        return Cookie.get(key);
      }
    }
  },
  list: function(raw) {
    console.log('--== Local ==--');
    Local.list(raw);
    console.log('--== Session ==--');
    Session.list(raw);
    console.log('--== Cookie ==--');
    Cookie.list(raw);
  },
  getLists: function() {
    return {
      Local: Local.getList(),
      Session: Session.getList(),
      Cookie: Cookie.getList()
    };
  },
  remove: function(key) {
    Local.remove(key);
    Session.remove(key);
    Cookie.remove(key);
  },
  clear: function() {
    Local.clear();
    Session.clear();
    Cookie.clear();
  }
};

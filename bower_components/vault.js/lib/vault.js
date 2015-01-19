'use strict';
// wrapper for localStorage, sessionStorage and document.cookie
window.Vault = (function() {
  var parse = function(value) {
    // everything in local storage is a string
    // so let's convert booleans and numbers
    // to be true booleans and numbers
    // and return those
    if (value === null || value === undefined || value === 'undefined') {
      // localStorage["foo"] returns null
      // in some browsers even if
      // foo isn't there at all.
      // since foo is really undefined,
      // we are returning accordingly
      return undefined;
    }
    if (value === 'null') {
      return null;
    }
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    // the checks for true booleans above are because
    // Chrome 34 (and perhaps other versions) return the following
    // isNaN as false even if the value being checked it true or false.
    // e.g. isNaN(true) and isNaN(false) both return false
    if (value !== '' && ! isNaN(value)) {
      return parseFloat(value);
    }
    if (value.indexOf && (value.indexOf('{') === 0 || value.indexOf('[') === 0) && window.JSON !== undefined) {
      return JSON.parse(value);
    }
    return value;
  };
  var prepare = function(value) {
    if (typeof value === 'object' && window.JSON !== undefined) {
      return JSON.stringify(value);
    }
    return value;
  };
  var vaultData = '__vaultData';
  var getExpires = function(config) {
    // looking for something like: "+5 days"
    if (config.expires.match(/^(\+|\-)\d+\s\w+/)) {
      var expires = new Date();
      var operator = config.expires.substring(0, 1);
      var parts = config.expires.substring(1).split(' ');
      var num = parseInt(parts[0], 10);
      var time = parts[1];
      switch(time) {
        case 'millisecond':
        case 'milliseconds':
          time = 'Milliseconds';
        break;
        case 'second':
        case 'seconds':
          time = 'Seconds';
        break;
        case 'minute':
        case 'minutes':
          time = 'Minutes';
        break;
        case 'hour':
        case 'hours':
          time = 'Hours';
        break;
        case 'day':
        case 'days':
          time = 'Date';
        break;
        case 'month':
        case 'months':
          time = 'Month';
        break;
        case 'year':
        case 'years':
          time = 'FullYear';
        break;
      }
      if (operator === '-') {
        expires['set' + time](expires['get' + time]() - num);
      } else {
        expires['set' + time](expires['get' + time]() + num);
      }
      return expires;
    }
    return new Date(config.expires);
  };
  var setup = function(type) {
    var storage;
    try {
      storage = window[type];
      try {
        /*eslint-disable*/
        var test = storage['foo'];
        /*eslint-enable*/
      } catch(e) {
        storage = undefined;
      }
    } catch(e) {
      storage = undefined;
    }
    if ( ! storage) {
      console.warn('Vault: ' + type + ' is not suppored. I will attempt to use Cookies instead.');
      return Cookie;
    }
    return {
      getData: function() {
        var vaultDataDictionary = storage.getItem(vaultData);
        if (vaultDataDictionary) {
          vaultDataDictionary = JSON.parse(vaultDataDictionary);
        } else {
          vaultDataDictionary = {};
        }
        return vaultDataDictionary;
      },
      setKeyMeta: function(key, config) {
        config = config || {};
        var vaultDataDictionary = this.getData();
        if (!vaultDataDictionary[key]) {
          vaultDataDictionary[key] = {};
        }
        if (config.expires) {
          var expires = getExpires(config);
          vaultDataDictionary[key].expires = expires && expires.valueOf();
        } else {
          delete vaultDataDictionary[key].expires;
        }
        if (config.path) {
          vaultDataDictionary[key].path = config.path;
        } else {
          delete vaultDataDictionary[key].path;
        }
        storage.setItem(vaultData, prepare(vaultDataDictionary));
      },
      getKeyMeta: function(key) {
        try {
          var vaultDataDictionary = this.getData();
          return vaultDataDictionary[key];
        } catch(e) {
          return undefined;
        }
      },
      clearKeyMeta: function(key) {
        try {
          var vaultDataDictionary = this.getData();
          delete vaultDataDictionary[key];
          storage.setItem(vaultData, prepare(vaultDataDictionary));
        } catch(e) {}
      },
      get: function(key, default_value) {
        var obj;
        if (storage[key]) {
          try {
            obj = parse(storage[key]);

            var keyMeta = this.getKeyMeta(key);
            // console.warn('keyMeta:', keyMeta);
            if (keyMeta) {
              if (keyMeta.path) {
                var path = window.location.pathname || window.location.path;
                if (!path.match(keyMeta.path)) {
                  // console.warn('Data found for ' + key + ' but paths do not match. The browser is at ' + path + ' and the key is for ' + keyMeta.path);
                  return default_value;
                }
              }

              // TODO: deprecate obj.expires
              if (!keyMeta.expires && obj.expires) {
                keyMeta.expires = obj.expires;
              }

              if (keyMeta.expires && keyMeta.expires <= new Date()) {
                var expired = new Date(keyMeta.expires).toString();
                console.log('Removing expired item: ' + key + '. It expired on: ' + expired);
                this.remove(key);
                return default_value;
              }
            }
          } catch(e) {
            console.warn('Vault Error:', e);
          }
          // TODO: deprecated this with obj.expires
          if (obj && obj.value !== undefined) {
            return parse(obj.value);
          }
          return parse(storage[key]);
        }
        return default_value;
      },
      getAndRemove: function(key) {
        var value = this.get(key);
        this.remove(key);
        return value;
      },
      getList: function() {
        var list = [];
        for (var i in storage) {
          var item = {};
          item[i] = this.get(i);
          list.push(item);
        }
        return list;
      },
      set: function(key, value, config) {
        try {
          this.setKeyMeta(key, config);
          return storage.setItem(key, prepare(value));
        } catch(e) {
          console.warn('Vault: I cannot write to localStoarge even though localStorage is supported. Perhaps you are using your browser in private mode? Here is the error: ', e);
        }
      },
      remove: function(key) {
        this.clearKeyMeta(key);
        return storage.removeItem(key);
      },
      clear: function() {
        return storage.clear();
      },
      list: function(raw) {
        var i, il = storage.length;
        if (il === 0) {
          console.log('0 items in ' + type);
          return undefined;
        }
        for (i in storage) {
          var value = raw ? parse(storage[i]) : this.get(i);
          console.log(i, '=', value);
        }
      }
    };
  };
  var Cookie = {
    get: function(cookie, default_value) {
      var cookies = document.cookie.split(';');
      var cl = cookies.length;
      for (var c = 0; c < cl; c++) {
        var pair = cookies[c].split('=');
        pair[0] = pair[0].replace(/^[ ]/, '');
        if (pair[0] === cookie) {
          return parse(pair[1]);
        }
      }
      return default_value;
    },
    getAndRemove: function(key) {
      var value = this.get(key);
      this.remove(key);
      return value;
    },
    getList: function() {
      var list = [];
      if (document.cookie !== '') {
        var cookies = document.cookie.split(';');
        var cl = cookies.length;
        for (var c = 0; c < cl; c++) {
          var pair = cookies[c].split('=');
          pair[0] = pair[0].replace(/^[ ]/, '');
          var item = {};
          item[pair[0]] = parse(pair[1]);
          list.push(item);
        }
      }
      return list;
    },
    set: function(key, value, config) {
      var expires = '';
      if (config && config.expires) {
        var exp = getExpires(config);
        expires = '; expires=' + exp.toUTCString();
      }
      var max_age = '';
      if (config && config.max_age) {
        max_age = '; max-age=' + config.max_age;
      }
      var domain = '';
      if (config && config.domain) {
        domain = '; domain=' + config.domain;
      }
      var path = '';
      if (config && config.path) {
        path = '; path=' + config.path;
      }
      var secure = (config && config.secure) ? '; secure' : '';
      value = prepare(value) + path + domain + max_age + expires + secure;
      console.log('Vault: set cookie "' + key + '": ' + value);
      document.cookie = key + '=' + value;
    },
    remove: function(key) {
      document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
    clear: function() {
      var cookies = document.cookie.split(';');
      var cl = cookies.length;
      for (var c = 0; c < cl; c++) {
        var pair = cookies[c].split('=');
        pair[0] = pair[0].replace(/^[ ]/, '');
        this.remove(pair[0]);
      }
    },
    list: function() {
      var cookies = document.cookie.split(';');
      var cl = cookies.length;
      if (document.cookie === '' || cl === 0) {
        console.log('0 cookies');
        return undefined;
      }
      for (var c = 0; c < cl; c++) {
        var pair = cookies[c].split('=');
        pair[0] = pair[0].replace(/^[ ]/, '');
        console.log(pair[0], '=', parse(pair[1]));
      }
    }
  };
  var Local = setup('localStorage');
  var Session = setup('sessionStorage');
  return {
    Local: Local,
    Session: Session,
    Cookie: Cookie,
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
}());

vault.js
===============

Vault is an API to store Key-Value pairs as true data types. It can utilize localStorage, sessionStorage, and cookies in the Browser. In node, it uses a file at the root of the project (redis support coming soon).

It will handle toString and fromString conversion, so store those JSON objects, arrays, booleans, and numbers wherever you like and you'll get true data types back.

```
npm install vault.js
```
```
bower install vault.js
```

### What's new!
 * [0.1.4] Support for use server-side added- writes data to .vault.json at the root level
 * [0.1.0] localStorage and sessionStorage support the path param

### What's next?
- add redis as a storage option
- ~~add server-side storage for node- save data to a json file~~
- handle storage limit errors
- add support to request more storage
- handle storage events

### Run/Develop locally
```
git clone git@github.com:jimmybyrum/vault.js.git
cd vault.js
npm install
npm run build
```

### Usage

#### Local, Session, Cookie, File

##### Vault.set(String key, Mixed value, Object optional_config)
```
Vault.set(String key, Mixed value, Object optional_config);
```

##### rules for which storage to use
```
if node
  use File
else if config.expires exists and localStorage is supported, then
  use localStorage
else if sessionStorage is supported, then
  use sessionStorage
else
  use cookies
```
or, if you want to specify which storage to use:
```
Vault.Cookie.set(...);
Vault.Session.set(...);
Vault.Local.set(...);
```

##### optional_config
```
{
  // Cookie options.
  domain: ".jimmybyrum.com",
  secure: true,

  // Cookie and Local options
  path: "/",
  expires: "2014-09-25 8:24:32 pm", // or anything that can be parsed by new Date(...)
  expires: "+3 days", // works for all time increments from milliseconds to years.

  // File options
  expires

  // domain and local/session storage
  local/session is natively tied to the domain. Subdomain keys can only be set from that subdomain.
}
```

#### examples

```
Vault.set("year", 1999); // saves in sessionStorage (browser) or to a file (server)

Vault.set("year", 1999, { expires: '1999-12-31 11:59:59 pm' }); // saves in localStorage until 11:59:59 on December 31, 1999

Vault.Session.set("foo", "bar");
Vault.Session.set("foo", "bar", {
  expires: "+6 months",
  path: "/examples"
});
Vault.Local.set("my_array", [1,2,3,4]);
Vault.Cookie.set("my_object", {
  foo: "bar",
  an_array: [1,2,3],
  year: 2012
});
Vault.Local.set("age", 33);
```

##### Vault.get(String key)
Will check storage in this order: File (if node), Session, Local, Cookie

To specify which storage to get from, use:
```
Vault.Cookie.get(String key);
Vault.Local.get(String key);
Vault.Session.get(String key);
```

#### examples
```
Vault.get("foo"); returns from File if node, else Session, else Local, else Cookie, else undefined

Vault.Session.get("foo");
// returns "bar"
Vault.Local.get("my_array");
// [1,2,3,4]
Vault.Cookie.get("my_object");
// {
//   foo: "bar",
//   an_array: [1,2,3],
//   year: 2012
// }
Vault.Local.get("age");
// returns the number 33
```

##### remove
removes an item
```
Vault.remove("my_object"); // removes from all storage types
Vault.Session.remove("my_object");
Vault.Local.remove("my_array");
Vault.Cookie.remove("my_array");
```

##### clear
clears all items
```
Vault.clear(); // clears all storage types
Vault.Session.clear();
Vault.Local.clear();
Vault.Cookie.clear();
```

##### list
lists all items in Vault in the console
```
Vault.list(); // lists all storage types
Vault.Session.list();
Vault.Local.list();
Vault.Cookie.list();
```
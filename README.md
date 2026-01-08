[![NPM version][npm-version-image]][npm-url] [![MIT License][license-image]][license-url]

moment-ethiopia
==============

An Ethiopian calendar system plugin for moment.js.

About
-----

The Ethiopian calendar (also called the Ge'ez calendar) is the principal calendar used in Ethiopia and Eritrea. It is based on the older Alexandrian or Coptic calendar, which in turn derives from the Egyptian calendar. More information about the Ethiopian calendar can be found at [wikipedia](https://en.wikipedia.org/wiki/Ethiopian_calendar).

This plugin adds Ethiopian calendar support to [momentjs](http://momentjs.com) library.

Where to use it?
---------------

Like `momentjs`, `moment-ethiopia` works in browser and in Node.js.

### Node.js

```shell
npm install moment-ethiopia
```


```js
var moment = require('moment-ethiopia');
moment().format('eYYYY/eM/eD');
```

### Browser
```html
<script src="moment.js"></script>
<script src="moment-ethiopia.js"></script>
<script>
	moment().format('eYYYY/eM/eD');
</script>
```

### Require.js

```js
require.config({
  paths: {
    "moment": "path/to/moment",
    "moment-ethiopia": "path/to/moment-ethiopia"
  }
});
define(["moment-ethiopia"], function (moment) {
  moment().format('eYYYY/eM/eD');
});
```

API
---

This plugin tries to mimic `momentjs` api. Basically, when formatting or parsing a string, add an `e` to the format token such as 'eYYYY' or 'eM'. For example:

```js
// TODO: Add example usage once implementation is complete
m = moment('2007/3/19', 'eYYYY/eM/eD'); // Parse an Ethiopian date.
m.format('eYYYY/eM/eD [is] YYYY/M/D'); // 2007/3/19 is 2014/11/28

m.eYear(); // 2007
m.eMonth(); // 2 (0-indexed, so 3rd month)
m.eDate(); // 19
m.eDayOfYear(); // 79
m.eWeek(); // 12
m.eWeekYear(); // 2007

m.add(1, 'eYear');
m.add(2, 'eMonth');
m.add(1, 'edate');
m.format('eYYYY/eM/eD'); // 2008/5/20

m.eMonth(11);
m.startOf('eMonth');
m.format('eYYYY/eM/eD'); // 2008/12/1

m.eYear(2014);
m.startOf('eYear');
m.format('eYYYY/eM/eD'); // 2014/1/1
```

To use the Amharic locale:
- Load [moment-with-locales](http://momentjs.com/downloads/moment-with-locales.js).
- Set the global or local locale to `am` see [here](http://momentjs.com/docs/#/i18n/changing-locale/).
- use it normally :+1: 

Here is example:
```html
    <!-- 1- Load the moment-with-locales -->
    <script src="http://momentjs.com/downloads/moment-with-locales.min.js"></script>
    <script src="https://raw.githubusercontent.com/supershutong/moment-ethiopia/master/moment-ethiopia.js"></script>
    
    <script>
      moment.locale('am');// 2- Set the global locale to `am`
      m = moment();
      m.format('eYYYY/eM/eD'); //3- use it normally 
    </script>
```

Acknowledgements
-------
This project was built from the great work done by [@xsoh](https://github.com/xsoh) whose behind [moment-hijri](https://github.com/xsoh/moment-hijri) project, which in turn was inspired by [moment-jalaali](https://github.com/jalaali/moment-jalaali) by [@behrang](https://github.com/behrang).

License
-------

MIT

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://npmjs.org/package/moment-ethiopia
[npm-version-image]: http://img.shields.io/npm/v/moment-ethiopia.svg?style=flat

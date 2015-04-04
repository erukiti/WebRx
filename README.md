[![Build Status](https://travis-ci.org/oliverw/WebRx.png)](https://travis-ci.org/oliverw/WebRx)
[![NuGet version](https://img.shields.io/nuget/v/WebRx.svg)](https://www.nuget.org/packages/WebRx/)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
<!-- [![Bower version](https://img.shields.io/bower/v/WebRx.svg)](https://github.com/oliverw/WebRx) -->


# WebRx

WebRx is a Javascript MVC-Framework built on [ReactiveX for Javascript (RxJs)](http://reactivex.io) that combines functional-reactive programming with Observable-driven declarative Data-Binding, Templating and Client-Side Routing.

#### Features

- Compatible with IE9+, Firefox 5+, Chrome 5+, Safari 5+
- Comprehensive [online documentation](http://webrxjs.org/docs)
- Extensible data-binding with many built-in operators
- Supports modules for partitioning larger projects into managable units
- Supports components for organizing UI code into self-contained, reusable chunks
- Integrated state-based routing engine inspired by Angular's [UI-Router](https://github.com/angular-ui/ui-router)
- No dependencies besides RxJS-Lite
- Compact (~20Kb minified & compressed)
- First class [TypeScript](http://www.typescriptlang.org/) support

#### Installation

- Installation via NuGet
```bash
PM> Install-Package WebRx
```

- Installation via Bower
```bash
bower install WebRx
```

- or download the [latest release as zip](http://webrxjs.org/downloads/web.rx.zip)

Make sure to include script-references to rx.lite.js and rx.lite.extras.js **before** web.rx.js when integrating WebRx into your projects.

#### Documentation

WebRx's documentation can be found on [here](http://webrxjs.org/docs).

#### Contributing

- Fork the repository
- Make one or more well commented and clean commits to the repository. You can make a new branch here if you are modifying more than one part or feature.
- Submit a [pull request](https://help.github.com/articles/using-pull-requests/)

### License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

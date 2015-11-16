[![Build Status](https://ci.appveyor.com/api/projects/status/hm6sojygo41lbiln?svg=true)](https://ci.appveyor.com/project/webrxjs/webrx)
[![Bower version](https://img.shields.io/bower/v/WebRx.svg)](https://github.com/WebRxJS/WebRx)
[![NPM version](https://img.shields.io/npm/v/webrx.svg)](https://www.npmjs.com/package/webrx)
[![NuGet version](https://img.shields.io/nuget/v/WebRx.svg)](https://www.nuget.org/packages/WebRx/)
[![Downloads](https://img.shields.io/npm/dm/webrx.svg)](https://www.npmjs.com/package/webrx)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/WebRxJS/WebRxJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# <img src="http://webrxjs.org/images/Logo.png" height="32" /> WebRx

WebRx is a browser-based MVVM-Framework that combines Functional-Reactive-Programming with declarative Data-Binding, Templating and Client-Side Routing.

The framework is built on top of [ReactiveX for Javascript (RxJs)](http://reactivex.io) which is a powerful set of libraries for processing and querying asynchronous data-streams that can originate from diverse sources such as Http-Requests, Input-Events, Timers and much more.

#### Features

- [Documentation](http://webrxjs.org/docs)
- Declarative Two-way [Data-Binding](http://webrxjs.org/docs/binding-syntax.html)
- Powerful [Collection-Processing](http://webrxjs.org/docs/observable-lists.html) including Filtering- and Re-ordering Projections and Paging
- Supports self-contained and reusable [*Components*](http://webrxjs.org/docs/component-overview.html)
- State-based [Router](http://webrxjs.org/docs/routing-overview.html)
- Lightweight [Message-Bus](http://webrxjs.org/docs/message-bus.html) for loosely coupled inter-component communication
- No dependencies other than [RxJS](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/rx.complete.md)
- Compact (~30Kb minified & compressed)
- Tested with IE9+, Firefox 5+, Chrome 5+, Safari 5+, Android Browser 4.0+, iOS Safari 5.0+

#### How to install

##### NuGet
```bash
PM> Install-Package WebRx
```
##### Bower
```bash
bower install WebRx
```
##### NPM
```bash
npm install rx@">=4.0.0 <5.0.0" --save-dev
npm install webrx --save-dev
```
or download the [latest release as zip](https://github.com/WebRxJS/WebRx/raw/master/dist/web.rx.zip)

Make sure to include script-references to rx.all.js **before** web.rx.js when integrating WebRx into your projects.

#### Documentation

WebRx's documentation can be found on [here](http://webrxjs.org/docs).

#### Support

Post your questions to [Stackoverflow](https://stackoverflow.com/questions/tagged/webrx) tagged with <code>webrx</code>.

#### Contributing

There are many ways to [contribute](https://github.com/oliverw/WebRx/blob/master/CONTRIBUTING.md) to WebRx.

* [Submit bugs](https://github.com/oliverw/WebRx/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/oliverw/WebRx/pulls).
* Engage with other WebRx users and developers on [StackOverflow](http://stackoverflow.com/questions/tagged/webrx).
* Join the [#webrx](http://twitter.com/#!/search/realtime/%23webrx) discussion on Twitter.
* [Contribute bug fixes](https://github.com/oliverw/WebRx/blob/master/CONTRIBUTING.md).
* Cast your vote at [AlternativeTo](http://alternativeto.net/software/webrx/)


### License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

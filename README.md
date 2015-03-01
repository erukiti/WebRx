[![Build Status](https://travis-ci.org/oliverw/WebRx.png)](https://travis-ci.org/oliverw/WebRx)
[![Inline docs](http://inch-ci.org/github/oliverw/WebRx.svg?branch=master)](http://inch-ci.org/github/oliverw/WebRx)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)


# WebRx

**Note**: This project is currently in proof-of-concept state. If you need something usable check back later.

WebRx integrates concepts of [KnockoutJS](http://knockoutjs.com/), and [ReactiveUI for .Net](http://reactiveui.net/) with the [Reactive Extensions for Javascript (RxJs)](https://github.com/Reactive-Extensions/RxJS) into a MVC framework that aims to enable to developers to create well-structured, elegant and testable Web-Applications that run in any modern browser.

Even though WebRx has quite a lot in common with KnockoutJS, the project is not meant to be a drop-in replacement.

##### Key differences

- The most prominent difference is WebRx using [Rx Observables](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/creating.md) for change tracking, whereas Knockout uses uses it's own [custom observables](http://knockoutjs.com/documentation/observables.html). 
- Whan evaluating binding-expressions WebRx utilizes [Angular expressions](https://docs.angularjs.org/guide/expression), Knockout in contrast uses Javascript's [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval). As an additional detail, Knockout supports function invocations in [binding expressions](http://knockoutjs.com/documentation/binding-syntax.html), WebRx does not.
- WebRx has *directives*, Knockout has *binding handlers*. Though both are roughly equivalent.   

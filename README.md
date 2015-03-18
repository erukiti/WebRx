[![Build Status](https://travis-ci.org/oliverw/WebRx.png)](https://travis-ci.org/oliverw/WebRx)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)


# WebRx

WebRx integrates concepts of [KnockoutJS](http://knockoutjs.com/) and [AngularJS](https://angularjs.org/) with [ReactiveX for Javascript (rxjs)](http://reactivex.io) (rxjs) into a MVC framework that enables developers to create responsive, structured and testable Web-Applications that run in any **modern** browser.

##### Features

- Extensible data-binding
- Built using- and around [Rx Observables](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/creating.md) 
- Supports partitioning larger projects into 'modules' which are very similar to AngularJS's module concept. Please note that, using modules is completely optional.
- Integrated support for "Components". A component allows you to asynchronously combine a template and a view model for rendering on the page.   
- Includes state-based routing engine inspired by Angular's [ui-router](https://github.com/angular-ui/ui-router) project
- Light-weight dependency injection 
- Developed in Typescript but can just as easily consumed in plain Javascript

##### Todo

- Replace RTTI implementation with Typescript 1.5's meta-data once it is released

##### WebRx vs KnockoutJS

Even though WebRx shares many similarities with KnockoutJS, the project is not meant to be a drop-in replacement.

- The most prominent difference is WebRx using [Rx Observables](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/creating.md) for change tracking, whereas Knockout uses uses it's own [custom observables](http://knockoutjs.com/documentation/observables.html). 
- Whan evaluating binding-expressions WebRx utilizes [Angular expressions](https://docs.angularjs.org/guide/expression), Knockout in contrast uses Javascript's [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval). As an additional detail, Knockout supports function invocations in [binding expressions](http://knockoutjs.com/documentation/binding-syntax.html), WebRx does not.

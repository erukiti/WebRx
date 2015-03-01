# WebRx

**Note**: This project is currently in proof-of-concept state. If you need something usable check back later.

WebRx integrates many concepts of KnockoutJS with the Reactive Extensions for Javascript (RxJs) into a MVC framework that aims to enable to developers to create well-structured, elegant and testable Web-Applications that run in any modern browser.

Even though WebRx has quite a lot in common with KnockoutJS, the project is not meant to be a drop-in replacement.

## Key differences

- The most prominent difference is WebRx using [Rx Observables](https://github.com/Reactive-Extensions/RxJS/tree/master/doc) for change tracking, whereas Knockout uses uses it's own custom observables. 
- Whan evaluating binding-expressions WebRx utilizes [Angular expressions](https://docs.angularjs.org/guide/expression), Knockout in contrast uses Javascript's [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval). As an additional detail, Knockout supports function invocations in binding expressions, WebRx does not.
- WebRx has directives, Knockout has binding handlers. Though both are roughly equivalent.   
 
 *Note*: This project is currently in proof-of-concept state. If you need something usable check back later.

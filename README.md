# xircular

**Note**: This project is currently in proof-of-concept state. If you need something usable check back later.

Xircular integrates many concepts of AngularJS with the Reactive Extensions for Javascript (RxJs) into a MVC framework that aims to enable to developers to create well-structured, elegant and testable Web-Applications that run in any modern browser.

Even though has quite a lot of concepts in common with AngularJS, the project is not meant to be a drop-in replacement for AngularJS.

## Key differences

- Xircular uses [Rx Observables](https://github.com/Reactive-Extensions/RxJS/tree/master/doc) for change tracking, Angular uses dirty-checking
- When evaluating expressions, AngularJS implicitely walks walks the scope hierarchy to find an identifier, Xircular does not and instead requires you to explicitely qualify the identifier with $root., $parent. or $parents[x]. prefixes. This is done on purpose to avoid air-space issues.
 
 ### Note: This project is currently in proof-of-concept state. If you need something usable check back later.

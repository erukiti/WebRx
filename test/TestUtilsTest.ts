/// <reference path="typings/jasmine.d.ts" />
/// <reference path="../src/web.rx.d.ts" />
/// <reference path="TestUtils.ts" />

describe("TestUtils",() => {
    it("trackSubscriptions smoke-test",() => {
        var sub = new Rx.Subject<number>();
        var track = testutils.trackSubscriptions(sub);

        expect(track.count).toEqual(0);

        var disp = new Rx.CompositeDisposable();
        sub.onNext(1);
        expect(track.count).toEqual(0);
 
        disp.add(track.observable.subscribe(x => { }));
        expect(track.count).toEqual(1);
        disp.add(track.observable.subscribe(x => { }));
        expect(track.count).toEqual(2);

        disp.dispose();
        expect(track.count).toEqual(0);

        // make sure the wrapped observable forwards correctly
        var nextFired = false, errorFired = false, completedFired = false;
        track.observable.subscribe(x => nextFired = true, x=> errorFired = true, ()=> completedFired = true);
        sub.onNext(4100);
        sub.onError(new Error("foo"));
        sub.onCompleted();
        expect(nextFired).toBeTruthy();
        expect(errorFired).toBeTruthy();
        expect(track.count).toEqual(0); // Subject's onCompleted should release subscriptions
    });
});

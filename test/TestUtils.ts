///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

module testutils {
    export function distinctUntilChanged<T>(arr: Array<T>): Array<T> {
        var isFirst = true;
        var lastValue;
        var result = new Array<T>();

        arr.forEach(v => {
            if (isFirst) {
                lastValue = v;
                isFirst = false;
                result.push(v);
            }

            if (v !== lastValue) {
                result.push(v);
            }
            lastValue = v;
        });

        return result;
    }

    export function run<T>(arr: Array<T>, block: (T) => void) {
        arr.forEach(x => block(x));
    }

    /// <summary>
    /// WithScheduler overrides the default Deferred and Taskpool schedulers
    /// with the given scheduler until the return value is disposed. This
    /// is useful in a unit test runner to force RxXaml objects to schedule
    /// via a TestScheduler object.
    /// </summary>
    /// <param name="sched">The scheduler to use.</param>
    /// <returns>An object that when disposed, restores the previous default
    /// schedulers.</returns>
    function _withScheduler<T extends Rx.IScheduler>(sched: T): Rx.IDisposable {
        //schedGate.WaitOne();
        var prevDef = wx.app.mainThreadScheduler;
        //var prevTask = wx.wx.App.taskpoolScheduler;

        wx.app.mainThreadScheduler = sched;
        //wx.wx.App.TaskpoolScheduler = sched;

        return Rx.Disposable.create(() => {
            wx.app.mainThreadScheduler = prevDef;
            //wx.App.TaskpoolScheduler = prevTask;
            //schedGate.Set();
        });
    }

    export function withScheduler<T extends Rx.IScheduler, TRet>(sched: T, block: (sched: T) => TRet) {
        var ret: TRet;
        var disp: Rx.IDisposable;

        try {
            disp = _withScheduler(sched);
            ret = block(sched);
        } finally {
            disp.dispose();
        }
        return ret;
    }

    export function recordNext<T>(sched: Rx.TestScheduler, milliseconds: number, value: T) : Rx.Recorded {
        return new Rx.Recorded(milliseconds, Rx.Notification.createOnNext<T>(value));
    }

    export interface IObservableSubscriptionCount {
        count: number;
        observable: Rx.Observable<any>;
    }

    export function trackSubscriptions(parent: Rx.Observable<any>): IObservableSubscriptionCount {
        var result: IObservableSubscriptionCount = { count: 0, observable: null };

        result.observable = Rx.Observable.create<any>(obs => {
            result.count++;

            var sub = parent.subscribe(x => obs.onNext(x), x => obs.onError(x),() => obs.onCompleted());

            return new Rx.CompositeDisposable(sub,
                Rx.Disposable.create(() => result.count--));
        });

        return result;
    }

    export function createModelContext(...models: any[]) {
        var ctx: wx.IDataContext = {
            $data: models[0],
            $root: models[models.length - 1],
            $parent: models.length > 1 ? models[1] : null,
            $parents: models.slice(1),
            $index: undefined
        };

        return ctx;
    }
}
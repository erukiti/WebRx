///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    export class App {
        /// <summary>
        /// This Observer is signalled whenever an object that has a
        /// ThrownExceptions property doesn't Subscribe to that Observable. Use
        /// Observer.Create to set up what will happen - the default is to crash
        /// the application with an error message.
        /// </summary>
        public static defaultExceptionHandler: Rx.Observer<Error> = Rx.Observer.create<Error>(ex => {
            if (!utils.isInUnitTest()) {
                console.log(utils.formatString("An onError occurred on an object (usually a computedProperty) that would break a binding or command. To prevent this, subscribe to the thrownExceptions property of your objects: {0}", ex));
            }
        });

        private static _mainThreadScheduler: Rx.IScheduler;
        private static _unitTestMainThreadScheduler: Rx.IScheduler;

        /// <summary>
        /// MainThreadScheduler is the scheduler used to schedule work items that
        /// should be run "on the UI thread". In normal mode, this will be
        /// DispatcherScheduler, and in Unit Test mode this will be Immediate,
        /// to simplify writing common unit tests.
        /// </summary>
        public static get mainThreadScheduler(): Rx.IScheduler {
            return App._unitTestMainThreadScheduler || App._mainThreadScheduler
                || Rx.Scheduler.currentThread;  // OW: return a default if schedulers haven't been setup by in
        }

        public static set mainThreadScheduler(value: Rx.IScheduler) {
            if (utils.isInUnitTest()) {
                App._unitTestMainThreadScheduler = value;
                App._mainThreadScheduler = App._mainThreadScheduler || value;
            } else {
                App._mainThreadScheduler = value;
            }
        }
    }
}
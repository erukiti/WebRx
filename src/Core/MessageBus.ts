/// <reference path="../Interfaces.ts" />
/// <reference path="Injector.ts" />
/// <reference path="ScheduledSubject.ts" />

// ReactiveUI's MessageBus

module wx {
    class MessageBus implements IMessageBus {
        //////////////////////////////////
        // IMessageBus

        public listen<T>(contract: string): Rx.IObservable<T> {
            return this.setupSubjectIfNecessary<T>(contract).skip(1);
        }

        public isRegistered(contract: string): boolean {
            return this.messageBus.hasOwnProperty(contract);
        }

        public registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable {
            return source.subscribe(this.setupSubjectIfNecessary<T>(contract));
        }

        public sendMessage<T>(message: T, contract: string): void {
            this.setupSubjectIfNecessary(contract).onNext(message);
        }

        //////////////////////////////////
        // Implementation

        private messageBus: { [topic: string]: any } = {};
        private schedulerMappings: { [topic: string]: Rx.IScheduler } = {};

        private setupSubjectIfNecessary<T>(contract: string): Rx.Subject<T> {
            var ret: Rx.Subject<T> = this.messageBus[contract];

            if(ret == null) {
                ret = internal.createScheduledSubject<T>(this.getScheduler(contract), null, new Rx.BehaviorSubject<T>(undefined));
                //ret = new Rx.BehaviorSubject<T>(undefined);
                this.messageBus[contract] = ret;
            }

            return ret;
        }

        private getScheduler(contract: string): Rx.IScheduler {
            var scheduler = this.schedulerMappings[contract];
            return scheduler || Rx.Scheduler.currentThread;
       }
    }

    export var messageBus: IMessageBus;
    Object.defineProperty(wx, "messageBus", {
        get() { return injector.resolve<IMessageBus>(res.messageBus); }
    });

    export module internal {
        export var messageBusConstructor = <any> MessageBus;
    }
}
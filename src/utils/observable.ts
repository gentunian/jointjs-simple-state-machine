/**
 * We don't need complex observable pattern and we want this library
 * as lightweight as possible.
 */
export class Observable<T> {
    private observers: ((data: T) => void)[] = []

    protected notify(data: T) {
        this.observers.forEach(o => {
            o(data)
        });
    }

    subscribe(callback: (data: T) => void) {
        this.observers.push(callback)
    }
}

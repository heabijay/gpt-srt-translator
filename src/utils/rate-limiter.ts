export class ClassicRateLimiter {
    private readonly _rpm: number;
    private readonly _requestTimeQueue: Date[] = [];

    constructor(rpm: number) {
        this._rpm = rpm;
    }

    wait_next(): Promise<void> {
        if (this._rpm > this._requestTimeQueue.length) {
            this._requestTimeQueue.push(new Date());
            return Promise.resolve();
        }

        const diffMs = new Date().getTime() - this._requestTimeQueue[0].getTime();

        if (diffMs >= 60_000) {
            this._requestTimeQueue.shift();
            this._requestTimeQueue.push(new Date());
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                this._requestTimeQueue.shift();
                this._requestTimeQueue.push(new Date());
                resolve();
            }, 60_000 - diffMs);
        });
    }
}

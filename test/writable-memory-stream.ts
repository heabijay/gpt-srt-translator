import { Writable } from "node:stream";

export class WritableMemoryStream extends Writable {
    public readonly promise: Promise<string | undefined>;

    private _promiseResolve: ((result: string | undefined) => void) | undefined;
    private _promiseReject: ((error: unknown) => void) | undefined;
    private _currentString?: string = undefined;

    constructor() {
        super();

        this.promise = new Promise<string | undefined>((resolve, reject) => {
            this._promiseResolve = resolve;
            this._promiseReject = reject;
        });

        this.once("error", (e) => this._promiseReject?.call(this, e));
        this.once(
            "finish",
            () => this._promiseResolve?.call(this, this._currentString),
        );
    }

    override _write(
        chunk: string,
        _: NodeJS.BufferEncoding,
        callback: (error?: Error | null) => void,
    ): void {
        if (this._currentString == null) {
            this._currentString = chunk;
        } else {
            this._currentString += chunk;
        }

        callback();
    }
}

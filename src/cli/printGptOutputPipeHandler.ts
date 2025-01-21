import { Transform, TransformCallback } from "node:stream";
import { WriteStream } from "node:tty";

export class PrintGptOutputPipeHandler extends Transform {
    private readonly _outputStream: WriteStream;
    private readonly _enabled: boolean;

    constructor(outputStream: WriteStream, enabled: boolean) {
        super();
        this._outputStream = outputStream;
        this._enabled = enabled;
    }

    override _transform(chunk: string, _: NodeJS.BufferEncoding, callback: TransformCallback) {
        if (this._enabled) {
            this._outputStream.write(chunk);
        }

        callback(null, chunk);
    }
}

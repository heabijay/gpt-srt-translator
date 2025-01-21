import ProgressBar from "@deno-library/progress";
import { Transform, TransformCallback } from "node:stream";
import { Node } from "npm:subtitle";

export class UpdateProgressBarCounterPipeHandler extends Transform {
    private readonly _progress: ProgressBar;
    private readonly _enabled: boolean;
    private _progressValue: number;

    constructor(progress: ProgressBar, enabled: boolean) {
        super({
            objectMode: true,
        });

        this._progress = progress;
        this._enabled = enabled;
        this._progressValue = 0;

        if (this._enabled) {
            this._progress.render(0);
        }
    }

    override _transform(node: Node, _: NodeJS.BufferEncoding, callback: TransformCallback) {
        this._progressValue++;

        if (this._enabled && this._progressValue != this._progress.total) {
            // Render progress bar only if it is not completed.
            // Completed message renders in ./src/cli/main.ts
            this._progress.render(this._progressValue);
        }

        callback(null, node);
    }

    public getProgressValue(): number {
        return this._progressValue;
    }
}

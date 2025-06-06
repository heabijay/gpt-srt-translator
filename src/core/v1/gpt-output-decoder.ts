import { Transform, TransformCallback, TransformOptions } from "node:stream";
import { Node } from "subtitle";

interface GptOutputDecoderOptions {
    currentIndex?: number;
}

export class GptOutputDecoder extends Transform {
    private readonly _subtitles: Node[];

    private _currentIndex: number = -1;
    private _currentString: string = "";

    constructor(subtitles: Node[], decoderOptions?: GptOutputDecoderOptions, opts?: TransformOptions) {
        super({
            objectMode: true,
            ...opts,
        });
        this._subtitles = subtitles;
        this._currentIndex = decoderOptions?.currentIndex || -1;
    }

    override _transform(
        stringPart: string,
        _: NodeJS.BufferEncoding,
        callback: TransformCallback,
    ) {
        this._currentString += stringPart;
        this._processCurrentString();
        callback();
    }

    override _flush(callback: TransformCallback): void {
        this._pushCurrentStringIndexUntilPosition(this._currentString.length);
        callback();
    }

    private _processCurrentString() {
        for (let i = 0; i < this._currentString.length; i++) {
            if (this._isStopwordOnPosition(this._currentString, i)) {
                this._pushCurrentStringIndexUntilPosition(i);
                this._currentIndex = -1;
                this._currentString = "";
                this.end();

                return;
            }

            const positionMatch = this._parseValidSrtIndexFromString(
                this._currentString,
                i,
            );

            if (positionMatch) {
                if (positionMatch.value != this._currentIndex + 1) {
                    this._pushCurrentStringIndexUntilPosition(i);
                }

                this._currentIndex = positionMatch.value - 1;
                this._currentString = this._currentString.substring(
                    positionMatch.nextPosition,
                );

                i = -1; // Process current string again after change
            }
        }
    }

    private _pushCurrentStringIndexUntilPosition(position: number) {
        const text = this._currentString.substring(0, position);

        if (this._currentIndex > -1 && text) {
            this._pushNodeWithText(this._currentIndex, text);
        }
    }

    private _parseValidSrtIndexFromString(str: string, position: number) {
        const validSrtIndexNextOffset = 5;
        const parseResult = parseSrtIndexFromString(str, position);

        if (!parseResult) {
            return parseResult;
        }

        if (parseResult.value <= this._currentIndex) {
            return; // Ignore this push cause it seems to be invalid
        }

        if (parseResult.value > this._currentIndex + validSrtIndexNextOffset) {
            return; // This push index is also invalid
        }

        return parseResult;

        function parseSrtIndexFromString(str: string, position: number) {
            if (str[position] !== "#") {
                return null;
            }

            let valueStr = "";

            while (true) {
                if (++position >= str.length) {
                    return null;
                }

                if (str[position] >= "0" && str[position] <= "9") {
                    valueStr += str[position];
                } else if (valueStr && str[position] === "#") {
                    if (++position >= str.length) {
                        return null;
                    }

                    if (str[position] === " ") {
                        if (++position >= str.length) {
                            return null;
                        }
                    }

                    return {
                        nextPosition: position,
                        value: +valueStr,
                    };
                } else {
                    return null;
                }
            }
        }
    }

    private _isStopwordOnPosition(str: string, position: number) {
        return str.startsWith("#####END-OF-TRANSLATION#####", position);
    }

    private _pushNode(index: number) {
        this.push(this._subtitles[index]);
    }

    private _pushNodeWithText(index: number, text: string) {
        const node = this._subtitles[index];

        switch (node.type) {
            case "cue":
                node.data.text = this._postprocessTranslatedNodeText(
                    node.data.text,
                    text,
                );

                if (node.data.text) {
                    this.push(node);
                }

                break;
            default:
                node.data = this._postprocessTranslatedNodeText(node.data, text);

                if (node.data) {
                    this.push(node);
                }

                break;
        }
    }

    private _postprocessTranslatedNodeText(_original: string, translated: string): string {
        // GPT could place underscore '_' in case of need to place space in the beginning
        // Check out the system instructions prompt in ./gpt-setting.ts
        translated = translated.replaceAll("_", " ");

        translated = trimIndexSharpCharacters(translated);

        return translated;

        function trimIndexSharpCharacters(translated: string): string {
            let indexFrom = -1;
            let indexTo = translated.length;

            for (let i = 0; i < translated.length; i++) {
                if (translated[i] >= "0" && translated[i] <= "9") {
                    continue;
                } else if (translated[i] === "\n" || translated[i] === " ") {
                    continue;
                } else if (translated[i] === "#") {
                    indexFrom = i;
                    continue;
                }

                break;
            }

            for (let i = translated.length - 1; i >= 0; i--) {
                if (translated[i] >= "0" && translated[i] <= "9") {
                    continue;
                } else if (translated[i] === "\n" || translated[i] === " ") {
                    continue;
                } else if (translated[i] === "#") {
                    indexTo = i;
                    continue;
                }

                break;
            }

            while (indexTo >= 0 && translated[indexTo - 1] === "\n") {
                indexTo--;
            }

            return translated.substring(indexFrom + 1, indexTo);
        }
    }
}

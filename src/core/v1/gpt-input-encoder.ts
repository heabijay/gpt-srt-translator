import { Transform, TransformCallback, TransformOptions } from "node:stream";
import { Node, NodeList } from "subtitle";

export class GptInputEncoder extends Transform {
    private _index: number = -1;

    constructor(opts?: TransformOptions) {
        super({
            ...opts,
            objectMode: true,
        });
    }

    override _transform(
        node: Node,
        _: NodeJS.BufferEncoding,
        callback: TransformCallback,
    ) {
        callback(null, encodeNodeToGptInputPart(node, ++this._index));
    }
}

export function encodeNodeListToGptMessage(nodes: NodeList): string {
    return nodes.map(encodeNodeToGptInputPart).join("\n");
}

function encodeNodeToGptInputPart(node: Node, index: number): string {
    return `#${index + 1}#${preprocessText(getNodeText(node))}`;
}

function getNodeText(node: Node): string {
    switch (node.type) {
        case "cue":
            return node.data.text;
        default:
            return node.data as string;
    }
}

function preprocessText(text: string): string {
    return text.replaceAll(" ", "_");
}

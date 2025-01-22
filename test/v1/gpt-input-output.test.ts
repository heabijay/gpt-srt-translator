import * as fs from "node:fs";
import { PassThrough } from "node:stream";
import { Node, NodeList, parse, parseSync, stringify } from "subtitle";
import { WritableMemoryStream } from "../writable-memory-stream.ts";
import * as assert from "@std/assert";
import { encodeNodeListToGptInput, GptInputEncoder } from "../../src/core/v1/gpt-input-encoder.ts";
import { GptOutputDecoder } from "../../src/core/v1/gpt-output-decoder.ts";

const sampleSrtFile: fs.PathLike = "./test/sample.srt";

Deno.test("gpt-input-output-integrity", async () => {
    const subtitleNodeList: NodeList = [];
    const writableStream = new WritableMemoryStream();

    fs.createReadStream(sampleSrtFile, "utf-8")
        .pipe(parse())
        .pipe(
            new PassThrough({
                objectMode: true,
                transform(node: Node, _, callback) {
                    subtitleNodeList.push(node);
                    callback(null, node);
                },
            }),
        )
        .pipe(new GptInputEncoder())
        .pipe(new GptOutputDecoder(subtitleNodeList))
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    const result = await writableStream.promise;

    assert.assertEquals(result, fs.readFileSync(sampleSrtFile, "utf-8"));
});

Deno.test("gpt-list-input-output-integrity", async () => {
    const originalContent = fs.readFileSync(sampleSrtFile, "utf-8");
    const subtitleNodeList = parseSync(originalContent);
    const subtitleNodeListString = encodeNodeListToGptInput(subtitleNodeList);

    const writableStream = new WritableMemoryStream();
    const subtitleNodeStringStream = new PassThrough();

    subtitleNodeStringStream
        .pipe(new GptOutputDecoder(subtitleNodeList))
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    subtitleNodeStringStream.push(subtitleNodeListString);

    subtitleNodeStringStream.end();

    const result = await writableStream.promise;

    assert.assertEquals(result, originalContent);
});

Deno.test("gpt-list-chunked-input-output-integrity", async () => {
    const originalContent = fs.readFileSync(sampleSrtFile, "utf-8");
    const subtitleNodeList = parseSync(originalContent);
    const subtitleNodeListString = encodeNodeListToGptInput(subtitleNodeList);

    const writableStream = new WritableMemoryStream();
    const subtitleNodeStringStream = new PassThrough();

    subtitleNodeStringStream
        .pipe(new GptOutputDecoder(subtitleNodeList))
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    for (let i = 0; i < subtitleNodeListString.length;) {
        const chunkLength = Math.floor(Math.random() * 50);

        subtitleNodeStringStream.push(
            subtitleNodeListString.slice(i, i + chunkLength),
        );

        i += chunkLength;
    }

    subtitleNodeStringStream.end();

    const result = await writableStream.promise;

    assert.assertEquals(result, originalContent);
});

Deno.test("gpt-list-repeatable-input-output-integrity", async () => {
    const content = `1
00:00:29,770 --> 00:00:32,650
I've experienced death so many times.

2
00:00:37,530 --> 00:00:39,530
<i>But never my own.</i>

3
00:00:54,220 --> 00:00:55,236
<i>Talk to me.</i>

4
00:00:55,260 --> 00:00:56,067
We have penetrating thoracic trauma

5
00:00:56,091 --> 00:00:58,220
by gunshot, catastrophic blood loss.
`;

    const input = `#1#I've experienced death so many times.
#2#<i>But never#2#<i>But never my own.</i>
##3#<i>Talk to me.</i>
#9#4#We have penetrating thoracic trauma
#5##5#by gunshot, catastrophic blood loss.
#####END-OF-TRANSLATION#####
`;

    const subtitleNodeList = parseSync(content);

    const writableStream = new WritableMemoryStream();
    const subtitleNodeStringStream = new PassThrough();

    subtitleNodeStringStream
        .pipe(new GptOutputDecoder(subtitleNodeList))
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    subtitleNodeStringStream.push(input);

    subtitleNodeStringStream.end();

    const result = await writableStream.promise;

    assert.assertEquals(result, content);
});

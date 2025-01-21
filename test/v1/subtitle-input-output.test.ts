import * as fs from "node:fs";
import { PassThrough } from "node:stream";
import { parse, parseSync, stringify } from "subtitle";
import { WritableMemoryStream } from "../writable-memory-stream.ts";
import * as assert from "@std/assert";

const sampleSrtFile: fs.PathLike = "./test/sample.srt";

Deno.test("subtitle-input-output-integrity", async () => {
    const writableStream = new WritableMemoryStream();

    fs.createReadStream(sampleSrtFile, "utf-8")
        .pipe(parse())
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    const result = await writableStream.promise;

    assert.assertEquals(result, fs.readFileSync(sampleSrtFile, "utf-8"));
});

Deno.test("subtitle-list-input-output-integrity", async () => {
    const originalContent = fs.readFileSync(sampleSrtFile, "utf-8");
    const subtitleNodeList = parseSync(originalContent);

    const writableStream = new WritableMemoryStream();
    const subtitleNodeStream = new PassThrough({ objectMode: true });

    subtitleNodeStream
        .pipe(stringify({ format: "SRT" }))
        .pipe(writableStream);

    subtitleNodeList.forEach((n) => subtitleNodeStream.push(n));

    subtitleNodeStream.end();

    const result = await writableStream.promise;

    assert.assertEquals(result, originalContent);
});

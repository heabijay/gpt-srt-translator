import "@std/dotenv/load";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import ProgressBar from "@deno-library/progress";
import { ActionHandler, Command } from "@cliffy/command";
import { GeminiGptClient } from "../core/gemini-gpt-client.ts";
import { GptClient } from "../core/v1/gpt-client.ts";
import { GptOutputDecoder } from "../core/v1/gpt-output-decoder.ts";
import { PassThrough, Transform } from "node:stream";
import { PrintGptOutputPipeHandler } from "./printGptOutputPipeHandler.ts";
import { UpdateProgressBarCounterPipeHandler } from "./updateProgressBarCounterPipeHandler.ts";
import { colors } from "@cliffy/ansi/colors";
import { encodeNodeListToGptMessage } from "../core/v1/gpt-input-encoder.ts";
import { getSystemInstructions } from "../core/v1/gpt-system-instructions.ts";
import { load as load_env } from "@std/dotenv";
import { NodeList, parseSync, stringify } from "npm:subtitle@4.2.1";

if (import.meta.dirname) {
    await load_env({
        // The current module path is 'src/cli/main.ts'
        // To get .env from root folder we use two parent folder behind
        envPath: path.join(import.meta.dirname, "../../.env"),
        export: true,
    });
}

type AppOptions = {
    geminiApiKey: string;
    language: string;
    continue: boolean;
    model: string;
    rpm?: number;
    debug: boolean;
};

await new Command()
    .name("gpt-srt-translator")
    .version("0.1.1")
    .description("🌐 Translate subtitle (SRT) files using the power of Gemini and other LLMs. (Experiment)")
    .action(rootCommandAction as ActionHandler)
    .env("GEMINI_API_KEY=<YOUR_API_KEY>", "Your Gemini API key", { required: true })
    .arguments("<input_srt_file:string> <output_srt_file:string>")
    .option(
        "-l, --language <language>",
        "Target language for translation to (e.g., English, Ukrainian)",
        { required: true },
    )
    .option("--continue", "Continue translation from position in destination file", { default: false })
    .option("--model <model_name>", "Which generative AI model to use", { default: "gemini-2.5-flash-preview-05-20" })
    .option("--rpm <requests_per_minute>", "Maximum requests per minute to the AI model", { default: 10 })
    .option("--debug", "Show raw AI output for debugging (instead of the progress bar)", { default: false })
    .parse(Deno.args);

async function rootCommandAction(options: AppOptions, inputSrtFile: string, outputSrtFile: string): Promise<void> {
    const subtitles = parseSync(await Deno.readTextFile(inputSrtFile));
    const subtitlesAsMessage = encodeNodeListToGptMessage(subtitles);
    const existingSubtitlesToContinue = await readExistingSubtitlesToContinue(options, inputSrtFile, outputSrtFile);
    const gptClient: GptClient = createGptClient(options);

    const progress = new ProgressBar({
        title: `🪄 Translating ${colors.bold(path.basename(inputSrtFile))} to ${colors.bold(options.language)}`,
        total: subtitles.length,
        display: `:title, :completed/:total (:percent), :time ${existingSubtitlesToContinue ? "" : "(ETA: :eta)"}`,
        output: Deno.stderr,
    });

    const output = new PassThrough();
    const progressBarCounterHandler = new UpdateProgressBarCounterPipeHandler(
        progress,
        !options.debug,
        existingSubtitlesToContinue?.length,
    );
    const progressBarCounterHandlerFinishPromise = new Promise<void>((resolve) =>
        progressBarCounterHandler.on("finish", resolve)
    );

    output
        .pipe(new PrintGptOutputPipeHandler(process.stdout, options.debug))
        .pipe(new GptOutputDecoder(subtitles))
        .pipe(progressBarCounterHandler)
        .pipe(stringify({ format: "SRT" }))
        .pipe(fs.createWriteStream(outputSrtFile));

    pushNodeListThroughStream(progressBarCounterHandler, existingSubtitlesToContinue);

    await gptClient.run(subtitlesAsMessage, output, {
        modelState: existingSubtitlesToContinue && encodeNodeListToGptMessage(existingSubtitlesToContinue),
    });
    await progressBarCounterHandlerFinishPromise;

    progress.title = `🎉 ${colors.bold(path.basename(inputSrtFile))} has been translated to ${
        colors.bold(options.language)
    }!`;
    progress.render(progressBarCounterHandler.getProgressValue());
    progress.end();
}

function createGptClient(options: AppOptions): GptClient {
    return new GeminiGptClient({
        apiKey: options.geminiApiKey,
        gptSettings: {
            model: options.model,
            temperature: 0,
            systemInstructions: getSystemInstructions({ translateToLanguage: options.language }),
            limitRequestsPerMinute: options.rpm,
        },
    });
}

async function readExistingSubtitlesToContinue(
    options: AppOptions,
    _inputSrtFile: string,
    outputSrtFile: string,
): Promise<NodeList | undefined> {
    return options.continue &&
            fs.existsSync(outputSrtFile) &&
            parseSync(await Deno.readTextFile(outputSrtFile)) ||
        undefined;
}

function pushNodeListThroughStream(stream: Transform, nodeList?: NodeList) {
    if (nodeList) {
        for (const node of nodeList) {
            stream.push(node);
        }
    }
}

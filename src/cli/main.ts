import "@std/dotenv/load";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import ProgressBar from "@deno-library/progress";
import { ActionHandler, Command } from "@cliffy/command";
import { GeminiGptClient } from "../core/gemini-gpt-client.ts";
import { GptClient } from "../core/v1/gpt-client.ts";
import { GptOutputDecoder } from "../core/v1/gpt-output-decoder.ts";
import { PassThrough } from "node:stream";
import { PrintGptOutputPipeHandler } from "./printGptOutputPipeHandler.ts";
import { UpdateProgressBarCounterPipeHandler } from "./updateProgressBarCounterPipeHandler.ts";
import { colors } from "@cliffy/ansi/colors";
import { encodeNodeListToGptInput } from "../core/v1/gpt-input-encoder.ts";
import { getSystemInstructions } from "../core/v1/gpt-system-instructions.ts";
import { parseSync, stringify } from "npm:subtitle@4.2.1";

type AppOptions = {
    geminiApiKey: string;
    language: string;
    model: string;
    rpm?: number;
    debug: boolean;
};

await new Command()
    .name("gpt-srt-translator")
    .version("0.1.0")
    .description("🌐 Translate subtitle (SRT) files using the power of Gemini and other LLMs. (Experiment)")
    .action(rootCommandAction as ActionHandler)
    .env("GEMINI_API_KEY=<YOUR_API_KEY>", "Your Gemini API key", { required: true })
    .arguments("<input_srt_file:string> <output_srt_file:string>")
    .option(
        "-l, --language <language>",
        "Target language for translation to (e.g., English, Ukrainian)",
        { required: true },
    )
    .option("--model <model_name>", "Which generative AI model to use", { default: "gemini-2.0-flash-exp" })
    .option("--rpm <requests_per_minute>", "Maximum requests per minute to the AI model", { default: 10 })
    .option("--debug", "Show raw AI output for debugging (instead of the progress bar)", { default: false })
    .parse(Deno.args);

async function rootCommandAction(options: AppOptions, inputSrtFile: string, outputSrtFile: string): Promise<void> {
    const isProgressBarEnabled = !options.debug && outputSrtFile != "stdout";
    const gptClient: GptClient = createGptClient(options);
    const subtitles = parseSync(await Deno.readTextFile(inputSrtFile));
    const promptString = encodeNodeListToGptInput(subtitles);

    const progress = new ProgressBar({
        title: `🪄 Translating ${colors.bold(path.basename(inputSrtFile))} to ${colors.bold(options.language)}`,
        total: subtitles.length,
        display: `:title, :completed/:total (:percent), :time (ETA: :eta)`,
        output: Deno.stderr,
    });

    const output = new PassThrough();
    const progressBarCounterHandler = new UpdateProgressBarCounterPipeHandler(progress, isProgressBarEnabled);
    const progressBarCounterHandlerFinishPromise = new Promise<void>((resolve) =>
        progressBarCounterHandler.on("finish", resolve)
    );

    output
        .pipe(new PrintGptOutputPipeHandler(process.stdout, options.debug))
        .pipe(new GptOutputDecoder(subtitles))
        .pipe(progressBarCounterHandler)
        .pipe(stringify({ format: "SRT" }))
        .pipe(outputSrtFile == "stdout" ? process.stdout : fs.createWriteStream(outputSrtFile));

    await gptClient.run(promptString, output);
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

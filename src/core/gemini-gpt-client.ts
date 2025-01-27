import {
    Content,
    FinishReason,
    GenerativeModel,
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
} from "npm:@google/generative-ai@0.21.0";
import { GptClient, GptClientRunOptions } from "./v1/gpt-client.ts";
import { GptSettings } from "./gpt-settings.ts";
import { ClassicRateLimiter } from "../utils/rate-limiter.ts";

type GeminiGptClientOptions = {
    apiKey: string;
    gptSettings: GptSettings;
};

export class GeminiGptClient implements GptClient {
    private readonly _generativeModel: GenerativeModel;
    private readonly _rateLimiter?: ClassicRateLimiter;

    constructor(options: GeminiGptClientOptions) {
        this._generativeModel = new GoogleGenerativeAI(options.apiKey).getGenerativeModel({
            model: options.gptSettings.model,
            systemInstruction: options.gptSettings.systemInstructions,
            generationConfig: {
                temperature: options.gptSettings.temperature,
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        if (options.gptSettings.limitRequestsPerMinute) {
            this._rateLimiter = new ClassicRateLimiter(options.gptSettings.limitRequestsPerMinute);
        }
    }

    async run(input: string, outputStream: NodeJS.WritableStream, options?: GptClientRunOptions): Promise<void> {
        const history: Content[] = [
            { role: "user", parts: [{ text: input }] },
            { role: "model", parts: [{ text: "Translated:\n\n" + (options?.modelState ?? "") }] },
        ];

        const chat = this._generativeModel.startChat({
            history: history,
        });

        while (true) {
            await this._rateLimiter?.wait_next();

            let responseString = "";
            let finishReasonStop = false;

            const { stream } = await chat.sendMessageStream("continue");

            for await (const chunk of stream) {
                if (chunk.candidates?.[0].finishReason === FinishReason.SAFETY) {
                    break;
                }

                responseString += chunk.text();
                outputStream.write(chunk.text());

                if (chunk.candidates?.[0].finishReason === FinishReason.STOP) {
                    finishReasonStop = true;
                }
            }

            if (finishReasonStop) {
                outputStream.end();
                break;
            }

            if (responseString) {
                if (history[1]?.role == "model") {
                    history[1].parts.push({ text: responseString });
                } else {
                    history.push({ role: "model", parts: [{ text: responseString }] });
                }
            }
        }
    }
}

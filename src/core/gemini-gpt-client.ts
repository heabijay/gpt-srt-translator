import { Content, FinishReason, GoogleGenAI, HarmBlockThreshold, HarmCategory } from "npm:@google/genai";
import { GptClient, GptClientRunOptions } from "./v1/gpt-client.ts";
import { GptSettings } from "./gpt-settings.ts";
import { ClassicRateLimiter } from "../utils/rate-limiter.ts";

type GeminiGptClientOptions = {
    apiKey: string;
    gptSettings: GptSettings;
};

export class GeminiGptClient implements GptClient {
    private readonly _generativeModel: GoogleGenAI;
    private readonly _gptClientOptions: GeminiGptClientOptions;
    private readonly _rateLimiter?: ClassicRateLimiter;

    constructor(options: GeminiGptClientOptions) {
        this._gptClientOptions = options;
        this._generativeModel = new GoogleGenAI({ apiKey: options.apiKey });

        if (options.gptSettings.limitRequestsPerMinute) {
            this._rateLimiter = new ClassicRateLimiter(options.gptSettings.limitRequestsPerMinute);
        }
    }

    async run(input: string, outputStream: NodeJS.WritableStream, options?: GptClientRunOptions): Promise<void> {
        const history: Content[] = [
            { role: "user", parts: [{ text: input }] },
        ];

        if (options?.modelState) {
            history.push({
                role: "model",
                parts: [{ text: options.modelState }],
            });
        }

        while (true) {
            await this._rateLimiter?.wait_next();

            let responseString = "";
            let finishReasonStop = false;

            const stream = await this._generativeModel.models.generateContentStream({
                model: this._gptClientOptions.gptSettings.model,
                config: {
                    systemInstruction: this._gptClientOptions.gptSettings.systemInstructions,
                    temperature: this._gptClientOptions.gptSettings.temperature,
                    thinkingConfig: {
                        thinkingBudget: 128, // exp
                    },
                    maxOutputTokens: 8192, // exp
                    safetySettings: [
                        {
                            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                            threshold: HarmBlockThreshold.BLOCK_NONE,
                        },
                    ],
                },
                contents: history,
            });

            for await (const chunk of stream) {
                if (chunk.candidates?.[0].finishReason === FinishReason.SAFETY) {
                    break;
                }

                responseString += chunk.text;
                outputStream.write(chunk.text || "");

                if (chunk.candidates?.[0].finishReason === FinishReason.STOP) {
                    finishReasonStop = true;
                }
            }

            if (finishReasonStop) {
                outputStream.end();
                break;
            }

            if (responseString) {
                // Old solution, temporary replaced:
                // if (history[1]?.role == "model") {
                //     history[1].parts?.push({ text: responseString });
                // } else {
                //     history.push({ role: "model", parts: [{ text: responseString }] });
                // }

                history.push({ role: "model", parts: [{ text: responseString }] });
                history.push({ role: "user", parts: [{ text: "Continue from the same position and INDEX" }] });
            }
        }
    }
}

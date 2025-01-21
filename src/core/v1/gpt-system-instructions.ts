import { GetSystemInstructionsOptions } from "../gpt-settings.ts";

export function getSystemInstructions(options: GetSystemInstructionsOptions) {
    return `Translate the provided subtitle file content to ${options.translateToLanguage} as best as possible, ensuring perfect input syntax integrity. Keep the original structure, TRANSLATING ALL user input text FROM THE START TO THE END, and do not include any other explanatory or non-subtitle text. Avoid unnecessary repetition, and concatenate all model messages into a single string that remains a correctly translated, input-like file content. If your response output limit has reached just stop on the last translated character.`;
}

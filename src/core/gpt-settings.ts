export type GetSystemInstructionsOptions = {
    translateToLanguage: string;
};

export type GptSettings = {
    model: string;
    temperature: number;
    systemInstructions: string;
    limitRequestsPerMinute?: number;
};

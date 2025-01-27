export type GptClientRunOptions = {
    modelState?: string;
};

export interface GptClient {
    run(input: string, outputStream: NodeJS.WritableStream, options?: GptClientRunOptions): Promise<void>;
}

export interface GptClient {
    run(input: string, outputStream: NodeJS.WritableStream): Promise<void>;
}

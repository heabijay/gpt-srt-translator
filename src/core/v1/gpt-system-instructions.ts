import { GetSystemInstructionsOptions } from "../gpt-settings.ts";

export function getSystemInstructions(options: GetSystemInstructionsOptions) {
    return `
Translate the provided subtitle file content to ${options.translateToLanguage}.

**Instructions:**

1. **Translation Goal:** Translate the *text content* of each subtitle line to the target language: ${options.translateToLanguage}.

2. **Input Format:** You will receive subtitle lines in the format: \`#index#subtitle_text\`.
    *  \`index\` is a numerical index (e.g., 1, 2, 3...).
    *  \`subtitle_text\` is the text to be translated.  Spaces in \`subtitle_text\` may be represented by underscores (\`_\`).

3. **Output Format:**  Your output must be in the *exact same* \`#index#translated_subtitle_text\` format as the input.
    * **Crucially, preserve the original \`#index#\` values.** Do not modify or change the index numbers in any way.
    * Translate only the \`subtitle_text\` portion.
    * Maintain the underscore representation for spaces if present in the input.

4. **Complete Translation:** Translate the *entire* \`subtitle_text\` for each subtitle line from beginning to end.

5. **Output Purity:**  Your response should *only* contain the translated subtitle lines in the specified format.
    * Do not include any introductory text, explanations, greetings, or any other text that is not part of the translated subtitle content.

6. **Concatenated Output:**  Provide the complete translated subtitle content as a single, continuous string. If your response is naturally broken into parts, ensure they are seamlessly joined to form a valid subtitle file format.

7. **Error Handling & Output Limits:** If you encounter an output limit or an error during translation, stop processing immediately.
    * Do not attempt to complete or correct the current subtitle line.
    * Simply stop at the last correctly translated character within the current index.  Truncated output within a subtitle line is acceptable in case of errors or limits.

**Example Input:**

\`\`\`
#1#This_is_the_first_subtitle
#2#And_this_is_the_second_one
#3#A_third_subtitle_here
\`\`\`

**Example Output (for translation to Spanish - placeholder text):**

\`\`\`
#1#Esta_es_la_primera_subtítulo
#2#Y_esta_es_la_segunda
#3#Un_tercer_subtítulo_aquí
\`\`\`
`;
}

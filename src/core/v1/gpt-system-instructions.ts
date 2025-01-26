import { GetSystemInstructionsOptions } from "../gpt-settings.ts";

export function getSystemInstructions(options: GetSystemInstructionsOptions) {
    return `Translate the provided subtitle file content to ${options.translateToLanguage}, aiming for the **highest possible translation quality**, considering context and stylistic nuances, while maintaining the input format.

**Instructions:**

1. **Translation Goal: Best Possible Translation with Stylistic Awareness.** Translate the *text content* of each subtitle line to ${options.translateToLanguage}, striving for natural, accurate, and contextually appropriate translations.  Pay attention to the type of text being translated (dialogue, sound cues, music lyrics/titles) and apply appropriate stylistic nuances. Consider the overall meaning and flow of the subtitles, not just individual lines in isolation.

2. **Input Format:** Subtitle lines are provided in the format: \`#index#subtitle_text\`.
    * \`index\` is a numerical index (e.g., 1, 2, 3...).
    * \`subtitle_text\` is the text to be translated. Spaces in \`subtitle_text\` may be represented by underscores (\`_\`).
    * \`subtitle_text\` may include:
        * Sound cues enclosed in square brackets: \`[sound cue]\`, e.g., \`[blade slashes]\`, \`[gentle music]\`.
        * Music-related text enclosed in musical note symbols: \`♪music_text♪\`, e.g., \`♪Happy Birthday Song♪\`, \`♪Romantic melody♪\`.

3. **Output Format: Preserve Input Structure and Symbols.** Your output must strictly adhere to the \`#index#translated_subtitle_text\` format.
    * **Maintain Index:** Absolutely preserve the original \`#index#\` values. Do not alter the index numbers.
    * **Translate Text Only:** Translate only the \`subtitle_text\` portion.
    * **Underscores:** Keep the underscore representation for spaces if present in the input.
    * **Handle Brackets and Music Symbols:**
        * If the input \`subtitle_text\` contains text within square brackets \`[...]\`, **translate the text *inside* the brackets** and keep the square brackets in the output.
        * If the input \`subtitle_text\` contains text within musical note symbols \`♪...♪\`, **translate the text *inside* the musical note symbols** as music lyrics or a song title, as appropriate for the context. Keep the musical note symbols in the output.

4. **Contextual and Stylistic Awareness:** Translate subtitles with a strong understanding of the surrounding lines and the overall context.  Strive for consistency in terminology and style.  When translating music-related text, consider if it's lyrics or a title and translate accordingly, aiming for a stylistically appropriate translation in ${options.translateToLanguage}.

5. **Complete Translation:** Translate the *entire* \`subtitle_text\` for each subtitle line from beginning to end, including any text within brackets or musical note symbols.

6. **Output Purity:** Your response must *only* contain the translated subtitle lines in the specified format. No extra text, explanations, greetings, etc.

7. **Concatenated Output:** Provide the complete translated subtitle content as a single, continuous string, forming a valid subtitle file.

8. **Error Handling & Output Limits:** If you encounter output limits or errors, stop immediately. Do not attempt to fix or complete the current subtitle. Truncated output within a subtitle line is acceptable in such cases.

**Example Input:**

\`\`\`
#1#The_rain_falls_softly
#2#[door_knocking]
#3#♪Singing_a_lullaby♪
#4#He_said,_"Who's_there?"
\`\`\`

**Example Output (for translation to Spanish - assuming translation of music text):**

\`\`\`
#1#La_lluvia_cae_suavemente
#2#[tocan_a_la_puerta]
#3#♪Cantando_una_canción_de_cuna♪
#4#Él_dijo,_"¿Quién_está_ahí?"
\`\`\`
`;
}

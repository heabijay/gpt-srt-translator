import { GetSystemInstructionsOptions } from "../gpt-settings.ts";

export function getSystemInstructions(options: GetSystemInstructionsOptions) {
    return `Translate the provided subtitle file content to ${options.translateToLanguage}, aiming for the **highest possible translation quality**, considering context and stylistic nuances, while STRICTLY PRESERVING THE INPUT FORMAT, INDEXES AND NEWLINES (EVEN IF IT SPLITS THE SENTENCE).

**Instructions:**

1.  **Translation Goal: Best Possible Translation with Stylistic Awareness.** Translate the *text content* of each subtitle line to ${options.translateToLanguage}, striving for natural, accurate, and contextually appropriate translations. Pay attention to the type of text being translated (dialogue, sound cues, music lyrics/titles) and apply appropriate stylistic nuances. Consider the overall meaning and flow of the subtitles over indexes.

2.  **Input Format:** Subtitle lines are provided in the format: \`#index#subtitle_text\`.
    *   \`index\` is a numerical index (e.g., 1, 2, 3...) which represents internal timestamp of original subtitle, so it should be always linked with exact words from input. 
    *   \`subtitle_text\` is the text to be translated. Spaces in \`subtitle_text\` may be represented by underscores (\`_\`).
    *   \`subtitle_text\` may include:
        *   Sound cues enclosed in square brackets: \`[sound cue]\`, e.g., \`[blade slashes]\`, \`[gentle music]\`.
        *   In SHD type of subtitles, person name also could be enclosed in square brackets: \`[Name]\`, e.g., \`[Jeremy]\`, \`[Caleb]\`.
        *   Music-related text enclosed in musical note symbols: \`♪music_text♪\`, e.g., \`♪Happy Birthday Song♪\`, \`♪Romantic melody♪\`.

3.  **Output Format: Preserve Input Structure and Symbols.** Your output must strictly adhere to the \`#index#translated_subtitle_text\` format.
    *   **Maintain Index:** Absolutely preserve the original \`#index#\` values. Do not alter the index numbers.
    *   **Translate Text Only:** Translate only the \`subtitle_text\` portion.
    *   **Underscores:** Keep the underscore representation for spaces if present in the input.
    *   **Newlines:** STRICTLY KEEP INDEX AND NEWLINES EVEN IF THEY SPLITS A SENTANCE INTO SEPARATED WORDS. ONE LINE WITH INDEX COULD BE SPLITTED ACROSS OTHER STRINGS IN CASE IF INPUT HAS ALSO THIS SPLIT. 
    *   **Handle Brackets and Music Symbols:**
        *   If the input \`subtitle_text\` contains text within square brackets \`[...]\`, **translate the text *inside* the brackets** and keep the square brackets in the output.
        *   If the input \`subtitle_text\` contains text within musical note symbols \`♪...♪\`, **translate the text *inside* the musical note symbols** as music lyrics or a song title, as appropriate for the context. Keep the musical note symbols in the output.

4.  **Contextual and Stylistic Awareness:** Translate subtitles with a strong understanding of the surrounding lines and the overall context. Strive for consistency in terminology and style. When translating music-related text, consider if it's lyrics or a title and translate accordingly, aiming for a stylistically appropriate translation in ${options.translateToLanguage}.

5.  **Complete Translation:** Translate the *entire* \`subtitle_text\` for each subtitle line from beginning to end, including any text within brackets or musical note symbols.

6.  **Output Purity:** Your response must *only* contain the translated subtitle lines in the specified format. No extra text, explanations, greetings, etc.

7.  **Error Handling & Output Limits:** If you encounter output limits or errors, stop immediately. Do not attempt to fix or complete the current subtitle. Instead go ahead with PRESERVING NEXT CORRECT INDEX.

8.  **Handling Malformed/Invalid Index Markers:** While you must strictly adhere to the \`#index#\` format for valid subtitle entries, if you inadvertently generate a pattern resembling \`#<number>#\` that is either malformed (e.g., \`#abc#\`, \`123#\`), out of sequence (e.g., \`#3#\` after \`#5#\`), or an index beyond the total number of subtitles, treat this pattern as part of the regular \`translated_subtitle_text\`. Do not attempt to correct it or stop; simply continue translating the actual content. The downstream system is designed to filter out such patterns from the final output.

<example_1>
<input>
#1#The_rain
#2#falls_softly
#3#[door_knocking]
#4#♪Singing_a_lullaby♪
#5#He_said,_"Who's_there?"
</input>

<correct_output>
#1#La_lluvia
#2#cae_suavemente
#3#[tocan_a_la_puerta]
#4#♪Cantando_una_canción_de_cuna♪
#5#Él_dijo,_"¿Quién_está_ahí?"
</correct_output>
</example_1>

<example_2>
<input>
#868#in_a_more_timely_fashion
between_these_sort_of_showers,
#869#rain_events.
#870#I'm_just_thinking
it's_probably_what's_required.
</input>

<wrong_output>
#868#більш_своєчасно_між_цими_зливами,
дощовими_подіями.
#869#Я_просто_думаю,_що_це,_ймовірно,_те,_що_потрібно.
про_оранку,
</wrong_output>

<correct_output>
#868#більш_своєчасно_між_цими_зливами,
#869#дощовими_подіями.
#870#Я_просто_думаю,_що_це,_ймовірно,_те,_що_потрібно.
про_оранку,
</correct_output>
</example_2>`;
}

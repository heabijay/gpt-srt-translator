# gpt-srt-translator: AI-Powered Subtitle Translation

**gpt-srt-translator** is an experiment of tool that leverages the power of Large Language Models (LLMs), such as
Google's Gemini, to automate translation of subtitle (.srt) files.

### Supported LLMs

Currently, the tool primarily supports:

<details>
  <summary><b>Google Gemini</b> — has free tier, fast, works well, rich context (Recommended)</summary>

**Getting Started with Gemini:**

1. Obtain a Google Gemini API key from [https://ai.google.dev](https://ai.google.dev) or a project created on
   [https://console.cloud.google.com](https://console.cloud.google.com).
2. Ensure that Generative AI is enabled for your API key and project.

**Important:** The Google Gemini API is only accessible from specific geographic regions. Check the list of available
regions here: [https://ai.google.dev/available_regions](https://ai.google.dev/available_regions).

</details>

## Web

< Coming soon />

## CLI

Demo:

[![asciicast](https://asciinema.org/a/sxNHXykHARN6xShecyOasYusC.svg)](https://asciinema.org/a/sxNHXykHARN6xShecyOasYusC)

### Installation

1. Ensure you have the [Deno runtime](https://github.com/denoland/deno?tab=readme-ov-file#installation) installed on
   your system.
2. Clone or download this repository to your local machine.
3. Installation options:
   - Run `deno task install` to install `gpt-srt-translator` as a global CLI tool using Deno.
   - Use `deno task run` to run the tool directly without installation.

### Usage

```
Usage:   gpt-srt-translator <input_srt_file> <output_srt_file> --language <language>
Version: 0.1.0                                                                      

Description:

  🌐 Translate subtitle (SRT) files using the power of Gemini and other LLMs. (Experiment)

Options:

  -h, --help                             - Show this help.                                                                                  
  -V, --version                          - Show the version number for this program.                                                        
  -l, --language  <language>             - Target language for translation to (e.g., English, Ukrainian)   (required)                       
  --model         <model_name>           - Which generative AI model to use                                (Default: "gemini-2.0-flash-exp")
  --rpm           <requests_per_minute>  - Maximum requests per minute to the AI model                     (Default: 10)                    
  --debug                                - Show raw AI output for debugging (instead of the progress bar)  (Default: false)                 

Environment variables:

  GEMINI_API_KEY  <YOUR_API_KEY>  - Your Gemini API key  (required)
```

\* gpt-srt-translator supports .env files for managing environment variables.

## How It Works

The translation process involves the following steps:

First, the input SRT file is read and parsed into a structured format, where each subtitle is represented as a node
containing its timestamp and text.

Next, these subtitle nodes are encoded into a single, large prompt for the LLM. Each subtitle is formatted as
#index#text, where the index is the subtitle's numerical order (starting from 1), and the text has spaces replaced with
underscores (_) – a trick potentially useful for navigating the LLM's safety filters. For example, a subtitle might be
encoded as `#1#The_quick_brown_fox_jumps_over_the_lazy_dog.`.

This encoded prompt, along with carefully crafted system instructions, is then sent to the chosen LLM. The tool
interacts with the LLM iteratively, receiving the translated response in chunks and continuing the conversation until
the entire translation is complete. It's designed to handle potential safety-related interruptions gracefully, ensuring
a complete translation. The response is expected to follow the same #index#text format.

The LLM's output is then decoded, parsing it back into index-text pairs. The tool is robust enough to handle minor
formatting inconsistencies from the LLM. During decoding, underscores are replaced with spaces, restoring the original
text formatting.

Finally, the decoded translations are integrated back into the original subtitle structure, and the complete, translated
SRT file is written to the specified output file.

With that, your translated subtitle file is ready to use!

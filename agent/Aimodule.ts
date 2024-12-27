import { readFileSync } from 'fs';
import {character, ANTHROPIC_API_KEY} from './Character';
import { Anthropic } from '@anthropic-ai/sdk';
// import { config } from 'dotenv';

// Load environment variables
// config();

// const ANTHROPIC_API_KEY = ; // process.env.ANTHROPIC_API_KEY_TBG;
// const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key is missing. Please set ANTHROPIC_API_KEY_TBG in your .env file.");
}

class AIResponder {
    private client: Anthropic;

    constructor() {
        // Initialize Anthropic client
        this.client = new Anthropic({ apiKey: ANTHROPIC_API_KEY,
            dangerouslyAllowBrowser: true
         });
    }

    async processTextInput(userInput: string): Promise<string> {
        /**
         * Process text input and return AI response.
         */

        try {
            const response = await this.client.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 200,
                messages:[{ role: "user", content: userInput }],
                temperature: 0.7,
                system: character,
                
            });

            return response.content[0].text.toString();
        } catch (error) {
            console.error("Error processing text input:", error);
            throw error;
        }
    }
}

export default AIResponder;

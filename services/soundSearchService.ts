import { GoogleGenAI, Type } from "@google/genai";

export interface Sound {
    name: string;
    url: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Finds royalty-free MP3 sounds based on a text description using the Gemini API.
 */
export const findSounds = async (prompt: string): Promise<Sound[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find 3-5 royalty-free, publicly available sounds in MP3 format based on the following description: "${prompt}". Provide direct download links to the .mp3 files.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: {
                                type: Type.STRING,
                                description: "A descriptive name for the sound effect.",
                            },
                            url: {
                                type: Type.STRING,
                                description: "A direct public URL to the .mp3 file.",
                            },
                        },
                        required: ["name", "url"],
                    },
                },
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            return [];
        }
        
        const results = JSON.parse(jsonText);
        // Basic validation to ensure we have an array of objects with the correct properties
        if (Array.isArray(results) && results.every(r => typeof r === 'object' && 'name' in r && 'url' in r)) {
            return results as Sound[];
        } else {
            console.error("Parsed JSON does not match expected schema:", results);
            return [];
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to search for sounds. Please check your connection or try again later.");
    }
};

import { GoogleGenAI, Type, Chat } from "@google/genai";
import { DebateResult, VerificationResult } from "../types";

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this environment, we assume the key is present.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

async function makeApiCall<T,>(payload: any, retries = 3, delay = 1000): Promise<T | null> {
    try {
        const response = await ai.models.generateContent(payload);
        const textResponse = response.text;
        if (!textResponse) {
             throw new Error("Empty response from API");
        }
        return JSON.parse(textResponse) as T;
    } catch (error) {
        console.error("API call failed:", error);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeApiCall(payload, retries - 1, delay * 2);
        } else {
            return null;
        }
    }
}

const editionHistorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            "edition": { type: Type.STRING },
            "number": { type: Type.STRING },
            "meaning": { type: Type.STRING },
            "status": { type: Type.STRING }
        },
        required: ["edition", "number", "meaning", "status"],
    }
};

export const getDebateClassification = async (title: string, hint: string, edition: string, lang: string) => {
    const systemPrompt = `You are a team of senior DDC catalogers from the Library of Congress, tasked with finding the most accurate classification using a structured, multi-point analysis. Your explanations must be brief and to the point.

For the given title, simulate a debate with the following steps for maximum accuracy:
1.  **WorldCat Analysis**: First, you MUST perform a simulated search on OCLC WorldCat for the title/subject. Present this as a 'worldcatAnalysis' string, briefly summarizing your findings.
2.  **OCLC Candidate**: Based on your WorldCat analysis, propose the single most representative classification number. Provide a brief justification.
3.  **AI Candidates**: Now, have two AI catalogers propose two *additional*, different, and plausible DDC numbers. Provide a brief justification for each.
4.  **Debate Analysis:** Write a 'Debate Analysis' that briefly and critically compares the pros and cons of all three candidates.
5.  **Final Decision:** Conclude with a 'Final Decision' containing the single most specific and accurate classification. This decision MUST include:
    - \`number\`: The final DDC number.
    - \`name\`: The subject name for the number.
    - \`confidence\`: A numerical confidence score.
    - \`finalRationale\`: A concise but detailed explanation for the choice.
    - \`classificationHierarchy\`: The full classification hierarchy.
    - \`buildSteps\`: A concise, step-by-step explanation of how the number was constructed.
6.  **Historical Analysis:** Provide a historical analysis for the final decided number's subject across DDC editions 19 through 23.

Respond entirely in ${lang} in the specified JSON format. Use DDC edition ${edition}.`;
    const userQuery = `Debate the DDC classification for:\nTitle / Subject: "${title}"\nInstruction / Hint: "${hint}"`;

    const candidateSchema = {
        type: Type.OBJECT,
        properties: { "number": { type: Type.STRING }, "name": { type: Type.STRING }, "confidence": { type: Type.NUMBER }, "justification": { type: Type.STRING } },
        required: ["number", "name", "confidence", "justification"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            "worldcatAnalysis": { type: Type.STRING },
            "oclcCandidate": candidateSchema,
            "aiCandidates": {
                type: Type.ARRAY,
                items: candidateSchema
            },
            "debateAnalysis": { type: Type.STRING },
            "finalDecision": {
                type: Type.OBJECT,
                properties: { 
                    "number": { type: Type.STRING }, 
                    "name": { type: Type.STRING }, 
                    "confidence": { type: Type.NUMBER }, 
                    "finalRationale": { type: Type.STRING },
                    "classificationHierarchy": { type: Type.STRING },
                    "buildSteps": { type: Type.STRING }
                },
                 required: ["number", "name", "confidence", "finalRationale", "classificationHierarchy", "buildSteps"]
            },
            "editionHistory": editionHistorySchema
        },
        required: ["worldcatAnalysis", "oclcCandidate", "aiCandidates", "debateAnalysis", "finalDecision"]
    };
    const payload = { model: "gemini-2.5-flash", contents: userQuery, config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema } };
    return makeApiCall<DebateResult>(payload);
};


export const verifyDDCClassification = async (title: string, hint: string, numberToVerify: string, edition: string, lang: string) => {
    const systemPrompt = `You are an expert DDC cataloger from the Library of Congress. Your task is to verify a DDC number with utmost precision. Your explanations must be brief and to the point.

The user has provided a title/subject and a DDC number.
1.  **WorldCat Analysis**: As a critical first step, you MUST perform a simulated search on OCLC WorldCat. Present this as a 'worldcatAnalysis' string, briefly summarizing your findings.
2.  **Analyze Provided Number:** Briefly analyze the provided number, explaining its meaning.
3.  **Verification:** State clearly if the number is correct. Provide a brief but detailed rationale for your decision, referencing your WorldCat Analysis.
4.  **Correction (if needed):** If the number is incorrect, provide the single most accurate DDC number. For this correct number, you MUST provide:
    - \`correctNumber\`: The correct DDC number.
    - \`correctNumberRationale\`: Briefly explain why this number is correct.
    - \`classificationHierarchy\`: The full classification hierarchy.
    - \`buildSteps\`: A concise, step-by-step explanation of how the correct number is constructed.
5.  **Historical Analysis:** Provide a historical analysis for the correct number's subject (or the provided number's subject if it was correct) across DDC editions 19 through 23.

Always state the DDC edition used for analysis (${edition}). Respond ENTIRELY in ${lang}. Provide the output in the specified JSON format.`;
    const userQuery = `Verify DDC classification:\nTitle / Subject: "${title}"\nProvided DDC Number: "${numberToVerify}"\nInstruction / Hint: "${hint}"`;
    const responseSchema = {
        type: Type.OBJECT, properties: { "worldcatAnalysis": { type: Type.STRING }, "isCorrect": { type: Type.BOOLEAN }, "verificationRationale": { type: Type.STRING }, "providedNumberAnalysis": { type: Type.STRING }, "correctNumber": { type: Type.STRING }, "correctNumberRationale": { type: Type.STRING }, "editionUsed": { type: Type.STRING }, "classificationHierarchy": { type: Type.STRING }, "buildSteps": { type: Type.STRING }, "editionHistory": editionHistorySchema }
    };
    const payload = { model: "gemini-2.5-flash", contents: userQuery, config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema } };
    return makeApiCall<VerificationResult>(payload);
};

export const extractTextFromImage = async (base64ImageData: string, mimeType: string) => {
    const prompt = `Analyze the book cover image. Extract the title, subtitle, and author. Respond with only a JSON object in the format: {"title": "...", "subtitle": "...", "author": "..."}. If a field is not found, use an empty string. Clean the extracted text to remove noise.`;
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    const textPart = { text: prompt };

    const payload = {
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { "title": { type: Type.STRING }, "subtitle": { type: Type.STRING }, "author": { type: Type.STRING } },
            }
        }
    };
    return makeApiCall<{ title: string; subtitle: string; author: string }>(payload);
};

export const getQuizQuestions = async (stageIndex: number, count: number, lang: string) => {
    const stageTopics = ["DDC Fundamentals: its history, purpose, main classes, notation, and the organization that maintains it.", "DDC Tables and Rules: questions about Tables 1-6, number building, and key classification rules like the 'Rule of Zero'.", "DDC Main Classes: questions testing knowledge of which subjects fall into which of the ten main classes (000-900)."];
    const systemPrompt = `You are an expert DDC quiz generator. Create ${count} unique, high-quality multiple-choice questions in ${lang} about the following topic: "${stageTopics[stageIndex]}". Each question must have exactly four plausible options (one correct, three incorrect). For each question, provide a brief, helpful explanation for the correct answer. Do not repeat questions. Respond ONLY with the specified JSON format.`;
    const userQuery = `Generate ${count} quiz questions for DDC stage ${stageIndex + 1} in ${lang}.`;
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            "questions": {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "q": { type: Type.STRING },
                        "o": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "a": { type: Type.NUMBER },
                        "e": { type: Type.STRING }
                    },
                }
            }
        },
    };
    const payload = {
        model: "gemini-2.5-flash",
        contents: userQuery,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };
    return makeApiCall<{ questions: any[] }>(payload);
};

export const getLivePracticeTitles = async (count: number, lang: string) => {
    const systemPrompt = `You are an AI generating a list of simple, beginner-friendly book titles for a DDC classification practice game. Create a JSON array of ${count} unique, easy-to-classify titles. The topics should be clear, single-subject, and cover all main DDC classes (000-900) evenly. Use titles like 'History of Pakistan', 'Introduction to Artificial Intelligence', 'Basics of Environmental Science', 'Islamic Architecture', 'History of Computers', 'Life of Allama Iqbal', 'Introduction to Psychology', 'Principles of Economics', 'World War II', 'Basic Chemistry', 'Geography of Asia'. The titles must be in ${lang}.`;
    const userQuery = `Generate ${count} book titles for a DDC practice session in ${lang}. Example format: {"titles": ["Title 1", "Title 2", ...]}`;
     const responseSchema = {
        type: Type.OBJECT,
        properties: {
            "titles": {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
    };
    const payload = { model: "gemini-2.5-flash", contents: userQuery, config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: responseSchema } };
    return makeApiCall<{ titles: string[] }>(payload);
};

export const getDdcNumberExplanation = async (context: string) => {
    const systemPrompt = `You are an expert DDC cataloger. Based on the user's context, provide a concise explanation for a specific part of a DDC number. Respond ONLY with a JSON object containing an 'explanation' key. The explanation should be clear and directly related to the provided context.`;
    const userQuery = context;

    const responseSchema = {
        type: Type.OBJECT,
        properties: { "explanation": { type: Type.STRING } }
    };

    const payload = {
        model: "gemini-2.5-flash",
        contents: userQuery,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema
        }
    };
    return makeApiCall<{ explanation: string }>(payload);
};

export const getSubjectSuggestions = async (topic: string, lang: string) => {
    const systemPrompt = `You are an expert librarian and DDC cataloger. The user has provided a broad topic. Generate a list of 5-7 more specific, clearly defined subjects related to this topic that are suitable for DDC classification. The subjects should be concise. Respond in ${lang}. Respond ONLY with a JSON object in the format: {"suggestions": ["Subject 1", "Subject 2", ...]}`;
    const userQuery = `Generate subject suggestions for the topic: "${topic}"`;
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            "suggestions": {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
    };
    const payload = {
        model: "gemini-2.5-flash",
        contents: userQuery,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema
        }
    };
    return makeApiCall<{ suggestions: string[] }>(payload);
};

export const startChat = (lang: string): Chat => {
  const systemInstruction = `You are Dewey Brain, an expert DDC (Dewey Decimal Classification) assistant. Your role is to help librarians and catalogers with their questions about DDC, library science, and classification. Be helpful, accurate, and concise. All your responses should be in ${lang}.`;
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
  return chat;
};
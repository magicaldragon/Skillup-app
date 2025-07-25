
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const assignmentSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A creative and engaging title for the assignment."
    },
    description: {
      type: Type.STRING,
      description: "A detailed description of the assignment. It must be formatted with Markdown. It should include the task, requirements, any necessary reading passages, 5 questions in the specified format, and any other relevant instructions."
    },
  },
  required: ['title', 'description']
};


export const generateAssignmentContent = async (category: string, questionType: string, topic: string): Promise<{title: string, description: string}> => {
  try {
    const prompt = `You are an expert curriculum designer for English language learners. Your primary goal is to generate a complete, high-quality assignment based on the provided specifications.

**Assignment Specifications:**
- **Topic:** "${topic}"
- **Category:** "${category}"
- **Question Type:** "${questionType}"

**Your Task:**
Generate a JSON object with a 'title' and a 'description'.

**Detailed Instructions:**
1.  **Title:** Create a creative, engaging, and relevant title for the assignment.
2.  **Description (Markdown Format):**
    - **Introduction:** Start with a brief, engaging introduction to the topic for the student.
    - **Reading/Listening Context:**
        - For categories like 'Reading', 'Full Practice Tests', 'Mini Tests', or any question type that requires context (like 'Multiple Choice', 'T/F/NG', 'Matching Headings'), you **MUST** first write a well-structured reading passage of about 200-250 words on the specified topic.
        - For 'Listening', mention that the student should listen to the provided audio to answer the questions. Do not generate a passage.
        - For 'Writing' or 'Speaking', provide a clear prompt or task for the student. Do not generate a passage or questions.
    - **Questions:** Create exactly 5 questions that match the specified **Question Type**.
        - **Multiple Choice:** Each question must have four options (A, B, C, D). Clearly indicate the correct answer by appending "**(Correct)**" to it.
        - **True/False/Not Given:** Create 5 statements. The student must determine if the statement is True, False, or Not Given based *only* on the provided reading passage.
        - **Yes/No/Not Given:** Similar to T/F/NG, but the statements should be based on the writer's claims or opinions within the passage. The student answers Yes, No, or Not Given.
        - **Matching Headings:**
            1. First, create a reading passage divided into 4 lettered sections (A, B, C, D).
            2. Then, provide a list of 6-7 numbered headings (i, ii, iii, etc.).
            3. The student's task is to match one heading to each section. Do not provide answers.
        - **Fill in the Blanks:** Create 5 sentences with a blank space indicated by '____'. The answers should be found within the provided reading passage.
        - **Mixed:** Provide a mix of the above question types (e.g., 2 Multiple Choice, 3 T/F/NG).
    - **Conclusion:** End with a short, motivating sentence for the student.

**Example Structure for a Reading Task:**
### [Generated Title]
[Brief Introduction]

**Reading Passage**
[Your 200-250 word passage here...]

**Questions**
[Your 5 questions in the specified format here...]

Good luck!`;


    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: assignmentSchema,
        temperature: 0.8,
      }
    });

    const jsonText = (response.text || '').trim();
    // In case the response is wrapped in markdown json block
    const sanitizedJson = (jsonText.replace(/^```json/, '').replace(/```$/, '') || '').trim();
    return JSON.parse(sanitizedJson);

  } catch (error) {
    console.error("Error generating assignment content:", error);
    throw new Error("Failed to generate assignment. Please try a different topic.");
  }
};


export const generateFeedback = async (submissionText: string, assignmentTitle: string): Promise<string> => {
  try {
    const prompt = `You are a helpful and encouraging English teacher providing feedback on a student's work. The assignment is titled "${assignmentTitle}".

Please provide constructive feedback on the following submission. Start with a positive comment, then offer 1-2 specific, actionable suggestions for improvement focusing on clarity, grammar, or style. Keep the tone supportive and the feedback concise.

Student's Submission:
---
${submissionText}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback.");
  }
};

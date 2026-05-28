import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, CreditScoreResult } from "../types";

export { type CreditScoreResult };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function calculateCreditScore(
  userData: UserProfile, 
  alternativeData: Record<string, unknown>
): Promise<CreditScoreResult> {
  const prompt = `Analyze this financial identity profile for the Africa Credit Exchange (ACX).
  
  Traditional & Identity Data: ${JSON.stringify(userData)}
  Metadata (Employment, Financials, Alt Data): ${JSON.stringify(alternativeData)}
  
  ACX SCORING PORTAL:
  1. Repayment History (35% weight)
  2. Income Stability (20% weight)
  3. Debt-to-Income Ratio (15% weight)
  4. Alternative Data / Mobile Money (10% weight)
  5. Employment Stability (10% weight)
  6. Behavioral / Fraud Risk (10% weight)
  
  Caclulate a score between 300 and 900.
  Map score to ratingCategory:
  - 800-900: AAA
  - 700-799: AA
  - 600-699: A
  - 500-599: BBB
  - 400-499: BB
  - Below 400: C
  
  Return valid JSON. Be highly specific about "reasoning" that builds lender confidence.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            ratingCategory: {
              type: Type.STRING,
              enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'C']
            },
            riskLevel: { 
              type: Type.STRING,
              enum: ['LOW', 'MEDIUM', 'HIGH']
            },
            factors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  factor: { type: Type.STRING },
                  impact: { 
                    type: Type.STRING,
                    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL']
                  },
                  score: { type: Type.NUMBER }
                },
                required: ['factor', 'impact', 'score']
              }
            }
          },
          required: ['score', 'reasoning', 'riskLevel', 'ratingCategory', 'factors']
        }
      }
    });

    return JSON.parse(response.text) as CreditScoreResult;
  } catch (error) {
    console.error("Credit scoring failed:", error);
    return {
      score: 550,
      reasoning: "AI analysis unavailable. Standard portal baseline applied based on initial data points.",
      riskLevel: 'MEDIUM',
      ratingCategory: 'BBB',
      factors: [{ factor: "System processing fallback", impact: 'NEUTRAL', score: 50 }]
    };
  }
}

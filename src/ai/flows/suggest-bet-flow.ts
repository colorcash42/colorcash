
'use server';
/**
 * @fileOverview A game assistant that suggests the next bet.
 *
 * - suggestBet - A function that provides a bet suggestion based on history.
 * - SuggestBetInput - The input type for the suggestBet function.
 * - SuggestBetOutput - The return type for the suggestBet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// We only need a subset of the Bet type for the prompt.
const BetHistoryItemSchema = z.object({
  gameId: z.string().optional(),
  betType: z.string(),
  betValue: z.any(),
  outcome: z.string(),
  payout: z.number(),
});

const SuggestBetInputSchema = z.object({
  history: z.array(BetHistoryItemSchema).describe("The user's recent bet history."),
});
export type SuggestBetInput = z.infer<typeof SuggestBetInputSchema>;

const SuggestBetOutputSchema = z.object({
    suggestion: z.string().describe("उपयोगकर्ता के अगले दांव के लिए एक मज़ेदार, गैर-गारंटी वाली सलाह। इसे छोटा और आकर्षक रखें, जैसे कोई बुद्धिमान गुरु देगा। जवाब केवल हिंदी में होना चाहिए।")
});
export type SuggestBetOutput = z.infer<typeof SuggestBetOutputSchema>;

export async function suggestBet(input: SuggestBetInput): Promise<SuggestBetOutput> {
  return suggestBetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBetPrompt',
  input: {schema: SuggestBetInputSchema},
  output: {schema: SuggestBetOutputSchema},
  prompt: `आप कलरकैश गेम गुरु हैं। आपकी भूमिका उपयोगकर्ता के हाल के दांव के इतिहास का विश्लेषण करना और उनकी अगली चाल के लिए एक मज़ेदार, रहस्यमय और गैर-गारंटी वाली सलाह प्रदान करना है। आपका जवाब हमेशा हिंदी में होना चाहिए।

यह न बताएं कि आप एक AI हैं। खेल के एक बुद्धिमान, थोड़े चुलबुले दैवज्ञ की तरह बात करें।

पैटर्न, स्ट्रीक्स, या ऐसी चीजों के लिए दिए गए दांव के इतिहास का विश्लेषण करें जो कुछ समय से नहीं हुई हैं। अपने विश्लेषण के आधार पर, अगले दौर के लिए एक छोटी, आकर्षक सलाह दें।

दांव लगाने के विकल्प हैं:
- रंग: हरा (Green), लाल (Red), बैंगनी (Violet)
- नंबर: 0-9 (0 एक जैकपॉट है)
- तिकड़ी (Trio): 'trio1' (1,4,7), 'trio2' (2,5,8), 'trio3' (3,6,9)
- आकार: बड़ा (Big) (5-9), छोटा (Small) (0-4)

यहाँ उपयोगकर्ता का हाल का इतिहास है:
{{#each history}}
- {{betValue}} (प्रकार: {{betType}}) पर दांव, परिणाम: {{outcome}}, भुगतान: {{payout}}
{{/each}}

अब, अगले दौर के लिए अपनी बुद्धिमत्ता प्रदान करें।`,
});

const suggestBetFlow = ai.defineFlow(
  {
    name: 'suggestBetFlow',
    inputSchema: SuggestBetInputSchema,
    outputSchema: SuggestBetOutputSchema,
  },
  async input => {
    // Ensure history is not too long to avoid exceeding token limits
    const recentHistory = input.history.slice(0, 10);
    const {output} = await prompt({ history: recentHistory });
    return output!;
  }
);

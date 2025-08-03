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
import type { Bet } from '@/lib/types';

// We only need a subset of the Bet type for the prompt.
const BetHistoryItemSchema = z.object({
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
    suggestion: z.string().describe("A playful, non-guaranteed suggestion for the user's next bet. Keep it short and engaging, like a wise guru would.")
});
export type SuggestBetOutput = z.infer<typeof SuggestBetOutputSchema>;

export async function suggestBet(input: SuggestBetInput): Promise<SuggestBetOutput> {
  return suggestBetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBetPrompt',
  input: {schema: SuggestBetInputSchema},
  output: {schema: SuggestBetOutputSchema},
  prompt: `You are the ColorCash Game Guru. Your role is to analyze a user's recent bet history and provide a playful, mysterious, and non-guaranteed suggestion for their next move.

Do not mention that you are an AI. Speak like a wise, slightly cheeky oracle of the game.

Analyze the provided bet history for patterns, streaks, or things that haven't occurred in a while. Based on your analysis, give a short, engaging piece of advice for the next round.

Betting Options are:
- Color: Green, Red, Violet
- Number: 0-9 (0 is a jackpot)
- Trio: 'trio1' (1,4,7), 'trio2' (2,5,8), 'trio3' (3,6,9)
- Size: Big (5-9), Small (0-4)

Here is the user's recent history:
{{#each history}}
- Bet on {{betValue}} (type: {{betType}}), Outcome: {{outcome}}, Payout: {{payout}}
{{/each}}

Now, provide your wisdom for the next round.`,
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

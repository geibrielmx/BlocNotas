'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting related notes
 * based on the content of a given note.
 *
 * @function suggestRelatedNotes - The main function to trigger the flow.
 * @typedef {SuggestRelatedNotesInput} SuggestRelatedNotesInput - The input type for the suggestRelatedNotes function.
 * @typedef {SuggestRelatedNotesOutput} SuggestRelatedNotesOutput - The output type for the suggestRelatedNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedNotesInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the current note for which to find related notes.'),
});

export type SuggestRelatedNotesInput = z.infer<typeof SuggestRelatedNotesInputSchema>;

const SuggestRelatedNotesOutputSchema = z.object({
  relatedNotes: z
    .array(z.string())
    .describe('An array of strings, each representing the content of a related note.'),
});

export type SuggestRelatedNotesOutput = z.infer<typeof SuggestRelatedNotesOutputSchema>;

export async function suggestRelatedNotes(input: SuggestRelatedNotesInput): Promise<SuggestRelatedNotesOutput> {
  return suggestRelatedNotesFlow(input);
}

const suggestRelatedNotesPrompt = ai.definePrompt({
  name: 'suggestRelatedNotesPrompt',
  input: {schema: SuggestRelatedNotesInputSchema},
  output: {schema: SuggestRelatedNotesOutputSchema},
  prompt: `You are an AI assistant designed to suggest related notes based on the content of a given note.

  Given the following note content, suggest a list of related notes that might be relevant to the user.
  Return only the content of each related note.

  Note Content: {{{noteContent}}}
  `,
});

const suggestRelatedNotesFlow = ai.defineFlow(
  {
    name: 'suggestRelatedNotesFlow',
    inputSchema: SuggestRelatedNotesInputSchema,
    outputSchema: SuggestRelatedNotesOutputSchema,
  },
  async input => {
    const {output} = await suggestRelatedNotesPrompt(input);
    return output!;
  }
);

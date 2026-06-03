'use server';
/**
 * @fileOverview An AI agent for generating compelling and concise product descriptions for digital products.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productType: z
    .enum(['virtual number', 'eSIM', 'VPN subscription'])
    .describe('The type of digital product (virtual number, eSIM, or VPN subscription).'),
  keyFeatures: z
    .array(z.string())
    .describe('A list of key features or selling points for the product.'),
  targetAudience: z
    .string()
    .optional()
    .describe('The intended target audience for the product, if applicable.'),
  tone: z
    .string()
    .optional()
    .describe('The desired tone for the description (e.g., professional, friendly, exciting).'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert copywriter specializing in digital product marketing.
Your task is to create a compelling and concise product description for a {{productType}}.

Use the following information:

Product Type: {{{productType}}}
Key Features:
{{#each keyFeatures}}- {{{this}}}
{{/each}}

{{#if targetAudience}}Target Audience: {{{targetAudience}}}{{/if}}
{{#if tone}}Tone: {{{tone}}}{{/if}}

Craft a description that highlights the benefits of the key features, is engaging for the {{#if targetAudience}}{{{targetAudience}}}{{else}}general audience{{/if}}, and uses a {{#if tone}}{{{tone}}}{{else}}professional and persuasive{{/if}} tone.
The description should be concise and no more than 150 words.

Output ONLY the description.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

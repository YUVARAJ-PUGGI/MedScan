
'use server';
/**
 * @fileOverview An AI flow for recognizing a patient's face.
 *
 * - recognizeFace - Compares a captured photo against registered patient photos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PatientDataSchema, type PatientData } from '@/lib/schemas'; // Import a Zod schema for PatientData

const FaceRecognitionInputSchema = z.object({
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person captured via webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  registeredPatients: z.array(PatientDataSchema).describe("An array of all registered patients to compare against."),
});

type FaceRecognitionInput = z.infer<typeof FaceRecognitionInputSchema>;

const FaceRecognitionOutputSchema = z.object({
  matchFound: z.boolean().describe("Whether a matching patient was found."),
  patient: PatientDataSchema.nullable().describe("The data of the matched patient, or null if no match was found."),
});

export type FaceRecognitionOutput = z.infer<typeof FaceRecognitionOutputSchema>;

export async function recognizeFace(input: FaceRecognitionInput): Promise<FaceRecognitionOutput> {
  return faceRecognitionFlow(input);
}

// Create a new prompt specifically for comparing two images and determining if they are the same person.
const faceComparisonPrompt = ai.definePrompt({
    name: 'faceComparisonPrompt',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        registeredPhoto: z.string(),
    }) },
    output: { schema: z.object({
        isSamePerson: z.boolean().describe("Whether the two images are of the same person.")
    }) },
    prompt: `You are a highly accurate face recognition AI. Your task is to determine if the two provided images are of the same person.

    Image 1 is a newly captured photo.
    Image 2 is a photo from a patient registration record.

    Analyze the facial features in both images carefully.

    Captured Photo: {{media url=capturedPhoto}}
    Registered Photo: {{media url=registeredPhoto}}

    Are these two images of the same person? Respond with a boolean value in the structured output.`,
});

const faceRecognitionFlow = ai.defineFlow(
  {
    name: 'faceRecognitionFlow',
    inputSchema: FaceRecognitionInputSchema,
    outputSchema: FaceRecognitionOutputSchema,
  },
  async (input) => {
    if (input.registeredPatients.length === 0) {
      return { matchFound: false, patient: null };
    }

    // Iterate through each registered patient and compare their photo with the captured one.
    for (const patient of input.registeredPatients) {
      if (!patient.faceImageUrl) {
        continue; // Skip patients without a registered image.
      }
      
      console.log(`AI: Comparing captured photo against patient: ${patient.name} (${patient.id})`);

      try {
        const { output } = await faceComparisonPrompt({
          capturedPhoto: input.capturedPhotoDataUri,
          registeredPhoto: patient.faceImageUrl,
        });

        if (output && output.isSamePerson) {
          console.log(`AI: Match found! Patient is ${patient.name}`);
          return { matchFound: true, patient: patient };
        }
      } catch (error) {
        console.error(`AI: Error comparing face for patient ${patient.id}.`, error);
        // Continue to the next patient even if one comparison fails.
      }
    }
    
    // If the loop completes without finding a match.
    console.log("AI: No match found after checking all registered patients.");
    return { matchFound: false, patient: null };
  }
);

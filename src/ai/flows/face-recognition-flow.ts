
'use server';
/**
 * @fileOverview An AI flow for recognizing a patient's face with higher accuracy.
 *
 * - recognizeFace - Compares a captured photo against registered patient photos using a multi-stage process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PatientDataSchema, type PatientData } from '@/lib/schemas'; 

const FaceRecognitionInputSchema = z.object({
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person captured via webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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

// Prompt to get a confidence score for a face match.
const faceScoringPrompt = ai.definePrompt({
    name: 'faceScoringPrompt',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        registeredPhoto: z.string(),
    }) },
    output: { schema: z.object({
        confidenceScore: z.number().min(0).max(100).describe("A confidence score from 0 to 100 indicating the likelihood that the two images are of the same person. 100 is a perfect match.")
    }) },
    prompt: `You are a sophisticated facial recognition system. Your task is to analyze two images and return a confidence score representing the likelihood they are the same person.

    Analyze key facial geometry (distance between eyes, nose shape, jawline). Be critical of differences. A score of 95-100 means you are almost certain it's the same person. A score below 70 indicates it's likely a different person.

    Captured Photo: {{media url=capturedPhoto}}
    Registered Photo: {{media url=registeredPhoto}}

    Return a confidence score from 0-100.`,
});

// Prompt for a final, binary verification on the best candidate.
const finalVerificationPrompt = ai.definePrompt({
    name: 'finalVerificationPrompt',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        candidatePhoto: z.string(),
        candidateName: z.string(),
    }) },
    output: { schema: z.object({
        isMatch: z.boolean().describe("Return true only if you are absolutely certain this is the same person. This is a final security check.")
    }) },
    prompt: `You are a final verifier in a 'face lock' system. You have been given a candidate photo that scored highest in a preliminary scan. Your job is to make a final, critical decision.

    Only return 'true' if the captured photo and the candidate photo are definitively the same person. If there is ANY doubt—due to angle, lighting, or slight feature differences—return 'false'. The cost of a false positive is high.

    Captured Photo: {{media url=capturedPhoto}}
    Candidate Photo of {{candidateName}}: {{media url=candidatePhoto}}

    Is this a definitive match?`,
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

    let bestCandidate: { patient: PatientData, score: number } | null = null;
    const HIGH_CONFIDENCE_THRESHOLD = 95;
    const MINIMUM_CONFIDENCE_THRESHOLD = 75;

    // STAGE 1: Iterate and score all patients
    for (const patient of input.registeredPatients) {
      if (!patient.faceImageUrl || !patient.faceImageUrl.startsWith('data:image')) {
        console.log(`AI: Skipping patient ${patient.name} (${patient.id}) due to missing image.`);
        continue;
      }
      
      console.log(`AI: Scoring captured photo against patient: ${patient.name}`);

      try {
        const { output } = await faceScoringPrompt({
          capturedPhoto: input.capturedPhotoDataUri,
          registeredPhoto: patient.faceImageUrl,
        });

        if (output) {
          console.log(`AI: Confidence score for ${patient.name} is ${output.confidenceScore}.`);
          // STAGE 1a: Immediate high-confidence match found.
          if (output.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
            console.log(`AI: High-confidence match found for ${patient.name}.`);
            return { matchFound: true, patient: patient };
          }

          // Keep track of the best candidate so far.
          if (output.confidenceScore > (bestCandidate?.score || 0)) {
            bestCandidate = { patient, score: output.confidenceScore };
          }
        }
      } catch (error) {
        console.error(`AI: Error during face scoring for patient ${patient.id}.`, error);
      }
    }

    // STAGE 2: Evaluate the best candidate if no high-confidence match was found.
    if (bestCandidate && bestCandidate.score >= MINIMUM_CONFIDENCE_THRESHOLD) {
      console.log(`AI: Best candidate is ${bestCandidate.patient.name} with score ${bestCandidate.score}. Performing final verification.`);

      // STAGE 3: Perform final verification on the best candidate.
      try {
        const { output } = await finalVerificationPrompt({
          capturedPhoto: input.capturedPhotoDataUri,
          candidatePhoto: bestCandidate.patient.faceImageUrl!,
          candidateName: bestCandidate.patient.name,
        });

        if (output?.isMatch) {
          console.log(`AI: Final verification PASSED for ${bestCandidate.patient.name}.`);
          return { matchFound: true, patient: bestCandidate.patient };
        } else {
          console.log(`AI: Final verification FAILED for ${bestCandidate.patient.name}.`);
        }
      } catch (error) {
        console.error(`AI: Error during final verification for patient ${bestCandidate.patient.id}.`, error);
      }
    }
    
    console.log("AI: No definitive match found after multi-stage verification.");
    return { matchFound: false, patient: null };
  }
);

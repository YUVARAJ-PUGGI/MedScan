
import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().int().positive({ message: "Age must be a positive number." }),
  gender: z.enum(['male', 'female', 'other'], { message: "Please select a gender." }),
  bloodGroup: z.string().min(1, { message: "Blood group is required." }),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  recentSurgeries: z.string().optional(),
  implantedDevices: z.string().optional(),
  emergencyContactName: z.string().min(2, { message: "Emergency contact name is required." }),
  emergencyContactPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format." }),
  facialImagePreview: z.string().optional(), // For storing data URL of the image
});

export type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;

export const emergencyAdmissionSchema = z.object({
  patientId: z.string(),
  admissionNotes: z.string().optional(),
  consentGiven: z.boolean().refine(val => val === true, { message: "Consent must be given." }),
  dateTime: z.string().datetime(),
  name: z.string(),
  age: z.number(),
  bloodGroup: z.string(),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  recentSurgeries: z.string().optional(),
  implantedDevices: z.string().optional(),
});

export type EmergencyAdmissionFormData = z.infer<typeof emergencyAdmissionSchema>;

// Defines a single medical note entry
export const MedicalNoteSchema = z.object({
    date: z.string().describe("ISO string format of the note date"),
    content: z.string().describe("The content of the medical note"),
});
export type MedicalNote = z.infer<typeof MedicalNoteSchema>;


// Zod schema for PatientData, useful for validating data in AI flows
export const PatientDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    gender: z.string(),
    bloodGroup: z.string(),
    allergies: z.string(),
    medicalConditions: z.string(),
    recentSurgeries: z.string().optional(),
    implantedDevices: z.string().optional(),
    emergencyContactName: z.string(),
    emergencyContactPhone: z.string(),
    faceImageUrl: z.string().optional(),
    medicalHistory: z.array(MedicalNoteSchema).optional(),
});

// Patient data structure for use across the app
export interface PatientData extends z.infer<typeof PatientDataSchema> {}

// OPD Slip Data
export const OpdSlipDataSchema = z.object({
  id: z.string().describe("Unique ID for this OPD slip instance."),
  patientId: z.string().describe("ID of the patient for whom the slip is generated."),
  patientName: z.string().describe("Name of the patient."),
  patientAge: z.number().describe("Age of the patient."),
  patientGender: z.string().describe("Gender of the patient."),
  tokenNumber: z.string().describe("Unique token number for the OPD visit."),
  slipDate: z.string().datetime().describe("Date and time the slip was generated (ISO string)."),
  department: z.string().optional().describe("Department for consultation (e.g., General Medicine)."),
  doctorName: z.string().optional().describe("Assigned doctor's name (if applicable)."),
  // Add any other relevant fields like fees, etc.
});
export type OpdSlipData = z.infer<typeof OpdSlipDataSchema>;

// Input for generating OPD slip
export const GenerateOpdSlipInputSchema = z.object({
  patient: patientRegistrationSchema.extend({ id: z.string() }) // Use PatientData structure
});
export type GenerateOpdSlipInput = z.infer<typeof GenerateOpdSlipInputSchema>;

// Symptom Checker Schemas
export const SymptomAnalysisInputSchema = z.object({
  symptoms: z.string().describe('A description of the patient\'s symptoms.'),
});
export type SymptomAnalysisInput = z.infer<typeof SymptomAnalysisInputSchema>;

export const SymptomAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A preliminary analysis of the symptoms, including potential conditions and recommended next steps or specialists.'),
});
export type SymptomAnalysisOutput = z.infer<typeof SymptomAnalysisOutputSchema>;

// Note Generator Schemas
export const NoteGeneratorInputSchema = z.object({
  keywords: z.string().describe('A comma-separated list of keywords or phrases from a patient consultation.'),
});
export type NoteGeneratorInput = z.infer<typeof NoteGeneratorInputSchema>;

export const NoteGeneratorOutputSchema = z.object({
  subjective: z.string().describe("Patient's reported complaints (the 'S' in a SOAP note)."),
  objective: z.string().describe("Doctor's observations and findings (the 'O' in a SOAP note)."),
  assessment: z.string().describe("The diagnosis or assessment (the 'A' in a SOAP note)."),
  plan: z.string().describe("The treatment plan and next steps (the 'P' in a SOAP note)."),
  disclaimer: z.string().describe("A disclaimer that the note is AI-generated and requires review."),
});
export type NoteGeneratorOutput = z.infer<typeof NoteGeneratorOutputSchema>;


// Report Summarizer Schemas
export const ReportSummarizerInputSchema = z.object({
  reportText: z.string().describe('The full text of a medical report to be summarized.'),
});
export type ReportSummarizerInput = z.infer<typeof ReportSummarizerInputSchema>;

export const ReportSummarizerOutputSchema = z.object({
  keyFindings: z.array(z.string()).describe('A list of the most important observations from the report.'),
  diagnosis: z.string().describe('The final conclusion or diagnosis mentioned in the report.'),
  recommendations: z.array(z.string()).describe('A list of recommended next steps, treatments, or follow-ups.'),
  disclaimer: z_string().describe('A disclaimer that this is an AI-generated summary.'),
});
export type ReportSummarizerOutput = z.infer<typeof ReportSummarizerOutputSchema>;


// Prescription Helper Schemas
export const PrescriptionHelperInputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis for which a prescription suggestion is needed.'),
});
export type PrescriptionHelperInput = z.infer<typeof PrescriptionHelperInputSchema>;

export const PrescriptionHelperOutputSchema = z.object({
    medications: z.array(z.object({
        name: z.string().describe("Name of the medication."),
        dosage: z.string().describe("Recommended dosage, e.g., '500mg'."),
        frequency: z.string().describe("How often to take the medication, e.g., 'Twice a day'."),
    })).describe("A list of suggested medications."),
    advice: z.array(z.string()).describe("A list of general, non-pharmacological advice for the patient."),
    disclaimer: z.string().describe("A prominent disclaimer that this is an AI-generated suggestion for professional review."),
});
export type PrescriptionHelperOutput = z.infer<typeof PrescriptionHelperOutputSchema>;

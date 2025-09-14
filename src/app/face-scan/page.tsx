
"use client";

import { useState } from 'react';
import WebcamCapture from '@/components/core/webcam-capture';
import EmergencyDisplay from '@/components/core/emergency-display';
import { type PatientData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ScanFace, ServerCrash, UserCheck, UserX, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { usePatientData } from '@/context/PatientDataContext';

// Mock function to simulate face recognition against registered patients
async function recognizeFaceAndFetchData(
  imageDataUrl: string,
  allPatients: PatientData[]
): Promise<PatientData | null> {
  console.log("Simulating face recognition for image (first 50 chars):", imageDataUrl.substring(0, 50));
  console.log("Matching against registered patients:", allPatients.map(p => p.id));
  await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate network latency & recognition processing

  if (allPatients.length === 0) {
    console.log("No registered patients to match against.");
    return null;
  }

  // Simulate different outcomes
  const randomOutcome = Math.random();

  if (randomOutcome < 0.7 && allPatients.length > 0) { // 70% chance of match if patients exist
    const randomIndex = Math.floor(Math.random() * allPatients.length);
    const matchedPatient = allPatients[randomIndex];
    
    console.log(`SIMULATED MATCH: Matched with patient ${matchedPatient.name} (ID: ${matchedPatient.id})`);
    
    // ---- SIMULATE FIREBASE INTEGRATION ----
    // In a real application, you would use the Firebase SDK here to log this event.
    console.log(`SIMULATING: Storing identification event for patient ${matchedPatient.id} to Firebase.`);
    return { ...matchedPatient, name: `${matchedPatient.name}` }; // Return a copy
  } else if (randomOutcome < 0.9) { // 20% chance of no match
    console.log("SIMULATED: No matching patient record found among registered patients.");
    return null;
  } else { // 10% chance of a simulated API/recognition error
    console.log("SIMULATED: Error during face recognition process.");
    throw new Error("Simulated face recognition service error.");
  }
}

export default function FaceScanPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [scanStep, setScanStep] = useState<'initial' | 'capturing' | 'processing' | 'result'>('initial');
  const { toast } = useToast();
  const { patients: registeredPatients } = usePatientData();

  const handleStartScan = () => {
    setScanStep('capturing');
  }

  const handleCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setScanStep('processing');
    setIsLoading(true);
    setPatientData(null);
    setScanError(null);
    setNoMatchFound(false);

    try {
      const data = await recognizeFaceAndFetchData(imageSrc, registeredPatients);
      if (data) {
        setPatientData(data);
        toast({
          title: "Patient Identified",
          description: `${data.name} recognized.`,
          variant: "default",
        });
      } else {
        setNoMatchFound(true);
        toast({
          title: "No Match",
          description: "The scanned face did not match any registered patient records.",
          variant: "default",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during face scan.";
      setScanError(errorMessage);
      toast({
        title: "Scan Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setScanStep('result');
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setPatientData(null);
    setIsLoading(false);
    setScanError(null);
    setNoMatchFound(false);
    setScanStep('initial');
  };

  const renderContent = () => {
    switch (scanStep) {
      case 'initial':
        return (
          <div className="text-center p-4">
            <p className="mb-4">Click the button below to start the camera and scan for a patient's face.</p>
            <Button onClick={handleStartScan} size="lg">
              <ScanFace className="mr-2 h-5 w-5" /> Start Face Scan
            </Button>
          </div>
        );
      case 'capturing':
        return <WebcamCapture onCapture={handleCapture} onCancel={resetScan} captureButtonText="Scan Face" cancelButtonText='Cancel Scan'/>;
      
      case 'processing':
         return (
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg font-medium text-foreground">Scanning and Identifying...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process the image.</p>
               {capturedImage && (
                <Image 
                    src={capturedImage} 
                    alt="Captured face" 
                    width={100} 
                    height={100} 
                    className="rounded-md border mt-4 shadow-md opacity-50" 
                />
              )}
            </div>
          );

      case 'result':
        return (
          <div className='space-y-4'>
            {scanError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center space-y-3">
                <ServerCrash className="h-10 w-10 mx-auto mb-2" />
                <p className="text-xl font-semibold">Scan Failed</p>
                <p>{scanError}</p>
              </div>
            )}
            
            {noMatchFound && !patientData && !scanError && (
              <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-center space-y-3">
                  <UserX className="h-10 w-10 mx-auto mb-2 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xl font-semibold">No Match Found</p>
                  <p>The scanned image did not match any patient in our records.</p>
              </div>
            )}

            {patientData && (
              <div className="p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-center space-y-3">
                <UserCheck className="h-10 w-10 mx-auto mb-2 text-green-600 dark:text-green-500" />
                <p className="text-xl font-semibold">Patient Identified!</p>
                <EmergencyDisplay patient={patientData} />
              </div>
            )}

            <Button onClick={resetScan} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Face
            </Button>
          </div>
        );

      default:
        return null;
    }
  }


  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <ScanFace className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Emergency Face Scan</CardTitle>
          </div>
          <CardDescription className="text-md">
            Use the webcam to capture a facial image for patient identification against registered records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}


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
import { recognizeFace } from '@/ai/flows/face-recognition-flow';

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
       // Call the new AI flow
      const result = await recognizeFace({ 
        capturedPhotoDataUri: imageSrc, 
        registeredPatients: registeredPatients 
      });

      if (result.matchFound) {
        setPatientData(result.patient);
        toast({
          title: "Patient Identified",
          description: `${result.patient!.name} recognized.`,
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
             {registeredPatients.length > 0 ? (
              <>
                <p className="mb-4">Click the button below to start the camera and scan for a patient's face.</p>
                <Button onClick={handleStartScan} size="lg">
                  <ScanFace className="mr-2 h-5 w-5" /> Start Face Scan
                </Button>
              </>
            ) : (
              <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-center space-y-3">
                 <UserX className="h-10 w-10 mx-auto mb-2 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xl font-semibold">No Patients Registered</p>
                  <p>Please register a patient first to use the face scan feature.</p>
              </div>
            )}
          </div>
        );
      case 'capturing':
        return <WebcamCapture onCapture={handleCapture} onCancel={resetScan} captureButtonText="Scan Face" cancelButtonText='Cancel Scan'/>;
      
      case 'processing':
         return (
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg font-medium text-foreground">Scanning and Identifying...</p>
              <p className="text-sm text-muted-foreground">Comparing against registered patient photos.</p>
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

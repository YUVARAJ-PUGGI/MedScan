
"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Ban, Loader2, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel?: () => void;
  captureButtonText?: string;
  cancelButtonText?: string;
}

export default function WebcamCapture({
  onCapture,
  onCancel,
  captureButtonText = "Capture Photo",
  cancelButtonText = "Cancel"
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      // Check for mediaDevices support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          title: "Webcam Not Supported",
          description: "Your browser does not support webcam access.",
          variant: "destructive",
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Cleanup function to stop all tracks of the stream
        return () => {
            stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png');
        onCapture(imageSrc);
      }
    }
  };
  
  if (hasCameraPermission === null) {
     return (
      <div className="flex flex-col items-center justify-center p-4 h-64 bg-muted rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Requesting camera permission...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-2 border rounded-lg bg-card">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-md overflow-hidden">
        {/* The video tag is always rendered to receive the stream */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover transform -scale-x-100"
          autoPlay
          playsInline
          muted
        />
        {/* Overlay an error message if permission is denied */}
        {hasCameraPermission === false && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                <VideoOff className="h-10 w-10 mb-2" />
                <p className="font-semibold text-center">Camera Access Denied</p>
                <p className="text-sm text-center text-muted-foreground">Please allow camera access in your browser settings and refresh the page.</p>
             </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex space-x-3">
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            <Ban className="mr-2 h-4 w-4" />
            {cancelButtonText}
          </Button>
        )}
        <Button onClick={handleCapture} disabled={!hasCameraPermission}>
          <Camera className="mr-2 h-4 w-4" />
          {captureButtonText}
        </Button>
      </div>
    </div>
  );
}

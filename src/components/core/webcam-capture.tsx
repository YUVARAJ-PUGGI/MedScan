
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null: pending, true: granted, false: denied
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    async function setupWebcam() {
      setIsLoading(true);
      setHasPermission(null);

      // Check for mediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        toast({
          title: "Webcam Not Supported",
          description: "Your browser does not support webcam access. Please use a different browser.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(currentStream);
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setHasPermission(false);
        toast({
          title: "Webcam Access Denied",
          description: "Camera access was denied. Please enable camera permissions in your browser settings to use this feature.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    setupWebcam();

    return () => {
      // Cleanup function to stop all tracks of the stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally for a mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png');
        onCapture(imageSrc);
      }
    }
  };

  if (isLoading || hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-64 bg-muted rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Initializing webcam...</p>
      </div>
    );
  }
  
  if (hasPermission === false) {
    return (
      <Alert variant="destructive" className="text-center">
        <VideoOff className="h-5 w-5" />
        <AlertTitle>Camera Access Required</AlertTitle>
        <AlertDescription>
          Webcam access was denied or is not available. Please check your browser's permissions for this site.
        </AlertDescription>
         {onCancel && (
           <Button onClick={onCancel} variant="outline" className="mt-4">
             {cancelButtonText}
           </Button>
        )}
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-2 border rounded-lg bg-card">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-md overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
        />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="flex space-x-3">
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            <Ban className="mr-2 h-4 w-4" />
            {cancelButtonText}
          </Button>
        )}
        <Button onClick={handleCapture}>
          <Camera className="mr-2 h-4 w-4" />
          {captureButtonText}
        </Button>
      </div>
    </div>
  );
}

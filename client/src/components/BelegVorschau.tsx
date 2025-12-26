import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X,
  Maximize2,
  Download,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BelegVorschauProps {
  file: File | null;
  onClose?: () => void;
}

export default function BelegVorschau({ file, onClose }: BelegVorschauProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileType, setFileType] = useState<"image" | "pdf" | "unknown">("unknown");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Dateityp bestimmen
      if (file.type.startsWith("image/")) {
        setFileType("image");
      } else if (file.type === "application/pdf") {
        setFileType("pdf");
      } else {
        setFileType("unknown");
      }

      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setFileType("unknown");
    }
  }, [file]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (file && previewUrl) {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!file || !previewUrl) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Beleg-Vorschau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">Kein Beleg ausgewählt</p>
            <p className="text-xs mt-1">Laden Sie einen Beleg hoch oder wählen Sie eine Buchung aus</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PreviewContent = () => (
    <div 
      className="relative overflow-auto bg-slate-100 rounded-lg"
      style={{ 
        height: isFullscreen ? "calc(100vh - 120px)" : "320px",
      }}
    >
      {fileType === "image" && (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      )}
      
      {fileType === "pdf" && (
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full rounded-lg"
          title={file.name}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            width: `${10000 / zoom}%`,
            height: `${10000 / zoom}%`,
          }}
        />
      )}
      
      {fileType === "unknown" && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="font-medium">{file.name}</p>
          <p className="text-sm mt-1">Vorschau nicht verfügbar</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Herunterladen
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {fileType === "image" ? (
                <ImageIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              <span className="truncate max-w-[150px]" title={file.name}>
                {file.name}
              </span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Verkleinern"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-slate-500 w-10 text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Vergrößern"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              {fileType === "image" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleRotate}
                  title="Drehen"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setIsFullscreen(true)}
                title="Vollbild"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                  onClick={onClose}
                  title="Schließen"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PreviewContent />
          
          {/* Datei-Info */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={handleDownload}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vollbild-Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fileType === "image" ? (
                <ImageIcon className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5 text-red-500" />
              )}
              {file.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4 mr-1" />
              Verkleinern
            </Button>
            <span className="text-sm text-slate-500 px-2">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4 mr-1" />
              Vergrößern
            </Button>
            {fileType === "image" && (
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4 mr-1" />
                Drehen
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
          <PreviewContent />
        </DialogContent>
      </Dialog>
    </>
  );
}

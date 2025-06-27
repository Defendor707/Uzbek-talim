import { usePWA } from '@/hooks/usePWA';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineIndicator = () => {
  const { isOffline, updateApp } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className="rounded-none border-amber-500 bg-amber-100 border-x-0 border-t-0">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 flex items-center justify-between">
          <span>Internet aloqasi yo'q. Offline rejimda ishlayapsiz.</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={updateApp}
            className="text-amber-800 hover:bg-amber-200 h-6"
          >
            <Download className="h-3 w-3 mr-1" />
            Yangilash
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;
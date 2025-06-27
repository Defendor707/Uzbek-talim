import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PWAInstall = () => {
  const { isInstalled, isInstallable, isOffline, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !isVisible) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-blue-200 z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">Ilova sifatida o'rnating</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          O'zbek Talim'ni telefoningizga o'rnating va tezroq kirish
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={installApp}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          O'rnatish
        </Button>
      </CardContent>
    </Card>
  );
};

export const PWAStatus = () => {
  const { isInstalled, isOffline } = usePWA();

  if (isOffline) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Internet aloqasi yo'q. Ba'zi funksiyalar cheklangan rejimda ishlaydi.
        </AlertDescription>
      </Alert>
    );
  }

  if (isInstalled) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Smartphone className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <Wifi className="h-4 w-4 inline mr-1" />
          Ilova muvaffaqiyatli o'rnatilgan va onlayn rejimda ishlayapti
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default PWAInstall;
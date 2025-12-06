declare module 'react-qr-scanner' {
  import * as React from 'react';

  interface QrScannerProps {
    delay?: number;
    style?: React.CSSProperties;
    onError?: (error: any) => void;
    onScan?: (result: string | null) => void;
    facingMode?: "user" | "environment";
  }

  const QrReader: React.ComponentType<QrScannerProps>;
  export default QrReader;
}

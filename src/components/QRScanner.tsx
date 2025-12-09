import { useState, useEffect } from 'react';
import { ArrowLeft, QrCode, Download, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { generateQRPayload, parseQRPayload } from '../lib/utils';
import type { UPIAccount } from '../lib/database.types';

interface QRScannerProps {
  onBack: () => void;
}

export function QRScanner({ onBack }: QRScannerProps) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<'show' | 'scan'>('show');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [primaryUPI, setPrimaryUPI] = useState<UPIAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [scannedData, setScannedData] = useState<{
    upiId: string;
    name: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    loadPrimaryUPI();
  }, [profile?.id]);

  useEffect(() => {
    if (primaryUPI && mode === 'show') {
      generateQR();
    }
  }, [primaryUPI, amount, mode]);

  const loadPrimaryUPI = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('upi_accounts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (data) setPrimaryUPI(data);
  };

  const generateQR = async () => {
    if (!primaryUPI) return;

    const payload = generateQRPayload(
      primaryUPI.upi_id,
      profile!.name,
      amount ? parseFloat(amount) : undefined
    );

    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const demoPayload = generateQRPayload('demo@bank', 'Demo User', 100);
        const parsed = parseQRPayload(demoPayload);
        if (parsed) {
          setScannedData(parsed);
        }
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${primaryUPI?.upi_id}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Code</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('show')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              mode === 'show'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Show My QR
          </button>
          <button
            onClick={() => setMode('scan')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              mode === 'scan'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Scan QR
          </button>
        </div>

        {mode === 'show' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {qrDataUrl && (
              <>
                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
                </div>

                <div className="text-center mb-4">
                  <p className="font-semibold text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-gray-600">{primaryUPI?.upi_id}</p>
                  {amount && (
                    <p className="text-lg font-bold text-blue-600 mt-2">₹{amount}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                  />
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  <Download className="w-5 h-5" />
                  Download QR Code
                </button>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  This QR contains demo UPI payment data. Share it with other demo users to receive payments.
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Scan QR Code</h3>
              <p className="text-sm text-gray-600">Upload a QR code image to scan</p>
            </div>

            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Click to upload QR image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </label>

            {scannedData && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">QR Code Scanned!</p>
                <div className="space-y-1 text-sm text-green-800">
                  <p>
                    <span className="font-medium">Name:</span> {scannedData.name}
                  </p>
                  <p>
                    <span className="font-medium">UPI ID:</span> {scannedData.upiId}
                  </p>
                  {scannedData.amount && (
                    <p>
                      <span className="font-medium">Amount:</span> ₹{scannedData.amount}
                    </p>
                  )}
                </div>
                <button className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                  Proceed to Pay
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              Demo Mode: Upload any QR code image to simulate scanning. In a production app, this would use the device camera.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

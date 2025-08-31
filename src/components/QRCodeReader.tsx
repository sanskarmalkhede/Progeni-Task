import { useState, useRef, useEffect, useCallback } from 'react';
import { UserFormData } from '../lib/types';
import { X, Upload, Camera, AlertCircle, CheckCircle } from 'lucide-react';

interface QRData {
  type: string;
  version: string;
  data: UserFormData;
}

const QRCodeReader = ({ isOpen, onClose, onQRCodeRead }: {
  isOpen: boolean;
  onClose: () => void;
  onQRCodeRead: (userData: UserFormData) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'camera'>('file');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check if camera is available
    QrScanner.hasCamera().then(setHasCamera);
    
    return () => {
      // Cleanup scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && hasCamera && videoRef.current) {
      initializeCamera();
    } else if (scannerRef.current) {
      scannerRef.current.stop();
    }
  }, [isOpen, activeTab, hasCamera, initializeCamera]);

  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      // Create scanner instance
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: () => {
            // Don't show decode errors as they're normal when no QR code is visible
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          returnDetailedScanResult: true
        }
      );

      await scannerRef.current.start();
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to access camera. Please check permissions and try again.');
      setIsScanning(false);
    }
  }, [handleScanResult]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setSuccess('');
      setIsScanning(true);

      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      handleScanResult(result.data);
    } catch (err) {
      console.error('Error scanning image:', err);
      setError('No valid QR code found in the image. Please try another image.');
    } finally {
      setIsScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScanResult = useCallback((data: string) => {
    try {
      setError('');
      
      // Parse QR code data
      const qrData: QRData = JSON.parse(data);
      
      // Validate QR code format
      if (qrData.type !== 'user_profile' || !qrData.data) {
        throw new Error('Invalid QR code format');
      }

      // Validate required fields
      if (!qrData.data.fullName || !qrData.data.email) {
        throw new Error('QR code is missing required user information');
      }

      setSuccess('QR code successfully read! User data will be populated in the form.');
      
      // Convert the data to match UserFormData interface
      const userData: UserFormData = {
        fullName: qrData.data.fullName || '',
        email: qrData.data.email || '',
        phoneNumber: qrData.data.phoneNumber || '',
        bio: qrData.data.bio || '',
        avatarUrl: qrData.data.avatarUrl || '',
        dateOfBirth: qrData.data.dateOfBirth || '',
        location: qrData.data.location || ''
      };

      // Call the callback with the parsed data
      setTimeout(() => {
        onQRCodeRead(userData);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error parsing QR code:', err);
      setError('Invalid QR code format. Please scan a valid user profile QR code.');
    }
  }, [onQRCodeRead, onClose]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    setError('');
    setSuccess('');
    setIsScanning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scan QR Code</h2>
              <p className="text-sm text-gray-500">Import user profile from QR code</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            disabled={!hasCamera}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'camera'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            } ${!hasCamera ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Use Camera
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload QR Code Image</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select an image file containing a user profile QR code
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isScanning}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScanning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                <p>• Make sure the QR code is clearly visible and not blurry</p>
                <p>• Only user profile QR codes generated by this app are supported</p>
              </div>
            </div>
          )}

          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!hasCamera ? (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Camera Available</h3>
                  <p className="text-sm text-gray-500">
                    Camera access is not available on this device or browser.
                    Please use the file upload option instead.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Point your camera at a user profile QR code</p>
                    <p>• Make sure the QR code is well-lit and clearly visible</p>
                    <p>• The scan will happen automatically when a valid QR code is detected</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeReader;
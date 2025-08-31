import { useEffect, useState, useCallback } from 'react';
import { User } from '../lib/types';
import { X, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

const QRCodeModal = ({ isOpen, user, onClose }: {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && user) {
      generateQRCode();
    }
  }, [isOpen, user, generateQRCode]);

  const generateQRCode = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError('');

      // Create QR code data with user profile information
      const qrData = {
        type: 'user_profile',
        version: '1.0',
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          location: user.location,
          dateOfBirth: user.dateOfBirth,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }
      };

      const qrString = JSON.stringify(qrData);
      
      // Generate QR code with high quality settings
      const dataURL = await QRCode.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeDataURL(dataURL);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = `${user.fullName.replace(/\s+/g, '_')}_profile_qr.png`;
    link.href = qrCodeDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
              <p className="text-sm text-gray-500">{user.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={generateQRCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : qrCodeDataURL ? (
            <div className="flex flex-col items-center">
              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                <img
                  src={qrCodeDataURL}
                  alt={`QR Code for ${user.fullName}`}
                  className="w-64 h-64"
                />
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h3 className="font-medium text-gray-900 mb-1">{user.fullName}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.location && (
                  <p className="text-sm text-gray-500">{user.location}</p>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={downloadQRCode}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </button>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Scan this QR code to quickly access profile information</li>
                  <li>• Share the downloaded image with others</li>
                  <li>• Use the QR scanner feature to read profile QR codes</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
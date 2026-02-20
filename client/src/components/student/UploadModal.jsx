import { useState } from 'react';
import PropTypes from 'prop-types';

const UploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleUpload = () => {
    onUpload(documentName, selectedFile);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">Add New Document</h3>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Document Name</label>
          <input
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            placeholder="e.g., Aadhar Card"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Upload Document</label>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !documentName.trim() || !selectedFile}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'UPLOAD'}
          </button>
        </div>
      </div>
    </div>
  );
};

UploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  isUploading: PropTypes.bool.isRequired,
};

export default UploadModal;

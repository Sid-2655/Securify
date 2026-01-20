import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const StudentDashboard = () => {
  const { contract, account, sendTransaction, callContract } = useWeb3();
  const [profile, setProfile] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [contract, account]);

  const loadData = async () => {
    if (!contract || !account) return;

    try {
      // Load profile
      const profileData = await contract.getProfile(account);
      setProfile({
        name: profileData[0],
        profilePicture: profileData[1],
        exists: profileData[2],
        isInstitute: profileData[3],
      });

      // Load institute
      const instituteAddress = await contract.getStudentInstitute(account);
      if (instituteAddress && instituteAddress !== '0x0000000000000000000000000000000000000000') {
        const instituteProfile = await contract.getProfile(instituteAddress);
        setInstitute({
          address: instituteAddress,
          name: instituteProfile[0],
        });
      }

      // Load certificates
      const certs = await contract.getStudentCertificates(account);
      setCertificates(certs.map((cert, index) => ({
        index,
        ipfsHash: cert[0],
        documentName: cert[1],
        uploader: cert[2],
        isVerified: cert[3],
        uploadTimestamp: Number(cert[4]),
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUpload = async () => {
    if (!documentName.trim() || !selectedFile) {
      alert('Please enter document name and select a file');
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Replace with actual IPFS upload
      // For now, using mock hash
      const mockIpfsHash = 'QM_MOCK_HASH_' + Date.now();
      
      // Real IPFS upload would go here:
      // const ipfsHash = await uploadToIPFS(selectedFile);
      
      const tx = await contract.uploadCertificate(account, mockIpfsHash, documentName, {
        gasLimit: 500000
      });
      await tx.wait();
      
      alert('Certificate uploaded successfully! Waiting for verification.');
      setShowUploadModal(false);
      setDocumentName('');
      setSelectedFile(null);
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.reason || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-6">My Profile</h2>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl text-purple-600">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <p className="font-semibold text-lg">{profile?.name || 'Loading...'}</p>
          <p className="text-sm text-gray-600 mt-2">My Address: {truncateAddress(account)}</p>
          {institute && (
            <p className="text-sm text-gray-600 mt-2">
              Current Institute: {institute.name}
            </p>
          )}
        </div>
        <button className="w-full px-4 py-2 border-2 border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors">
          VIEW PROFILE
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">My Documents</h1>
        <p className="text-gray-600 mb-4">(Click on the Document name to view.)</p>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {certificates.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            certificates.map((cert) => (
              <div key={cert.index} className="border-b border-gray-200 py-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      cert.isVerified ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <svg className={`w-6 h-6 ${cert.isVerified ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">{cert.documentName}</p>
                      <p className="text-sm text-gray-500">
                        {cert.isVerified ? 'Verified' : 'Pending Verification'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Uploaded by: {truncateAddress(cert.uploader)}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    VIEW
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
        >
          ADD NEW DOCUMENT
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
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
                onClick={() => {
                  setShowUploadModal(false);
                  setDocumentName('');
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'UPLOAD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;


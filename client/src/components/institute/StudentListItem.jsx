import PropTypes from 'prop-types';

const StudentListItem = ({ student, certificates, onVerifyClick }) => {
  const truncateAddress = (address) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const unverifiedCerts = certificates.filter((c) => !c.isVerified);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-green-600">{student.name?.[0]?.toUpperCase() || 'S'}</span>
          </div>
          <div>
            <p className="font-semibold text-lg">{student.name}</p>
            <p className="text-sm text-gray-500">ADDRESS: {truncateAddress(student.address).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            VIEW
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            CHANGE INSTITUTE
          </button>
        </div>
      </div>

      {unverifiedCerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Pending Verification:</p>
          {unverifiedCerts.map((cert) => (
            <div key={cert.index} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg mb-2">
              <div>
                <p className="font-medium">{cert.documentName}</p>
                <p className="text-xs text-gray-500">Uploaded: {new Date(cert.uploadTimestamp * 1000).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => onVerifyClick(student.address, cert.index)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Verify
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

StudentListItem.propTypes = {
  student: PropTypes.object.isRequired,
  certificates: PropTypes.array.isRequired,
  onVerifyClick: PropTypes.func.isRequired,
};

export default StudentListItem;

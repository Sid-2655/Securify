import PropTypes from 'prop-types';

const DocumentListItem = ({ document }) => {
  const truncateAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const openInIPFS = () => {
    window.open(`https://ipfs.io/ipfs/${document.ipfsHash}`, '_blank');
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            document.isVerified ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          {/* Icon can be customized based on verification status */}
        </div>
        <div>
          <p
            className="font-semibold cursor-pointer hover:underline"
            onClick={openInIPFS}
          >
            {document.documentName}
          </p>
          <p className="text-sm text-gray-500">
            {document.isVerified ? 'Verified' : 'Pending Verification'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Uploaded by: {truncateAddress(document.uploader)}
          </p>
        </div>
      </div>
      <button
        onClick={openInIPFS}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        VIEW
      </button>
    </div>
  );
};

DocumentListItem.propTypes = {
  document: PropTypes.object.isRequired,
};

export default DocumentListItem;

import PropTypes from 'prop-types';
import DocumentListItem from './DocumentListItem';
import DocumentListSkeleton from './DocumentListSkeleton';

const DocumentList = ({ documents, onAddNew, isLoading }) => (
  <div className="flex-1 p-8">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-purple-600">My Documents</h1>
      <button
        onClick={onAddNew}
        className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
      >
        ADD NEW DOCUMENT
      </button>
    </div>
    <p className="text-gray-600 mb-4">Click on a document name to view it on IPFS.</p>

    <div className="bg-white rounded-lg shadow-md p-6">
      {isLoading ? (
        <DocumentListSkeleton />
      ) : documents.length === 0 ? (
        <p className="text-gray-500">No documents uploaded yet.</p>
      ) : (
        documents.map((doc) => <DocumentListItem key={doc.index} document={doc} />)
      )}
    </div>
  </div>
);

DocumentList.propTypes = {
  documents: PropTypes.array.isRequired,
  onAddNew: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default DocumentList;

import PropTypes from 'prop-types';

const Sidebar = ({ profile, account, institute, onLink, onViewProfile }) => {
  const truncateAddress = (address) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
      <h2 className="text-2xl font-bold text-purple-600 mb-6">My Profile</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl text-purple-600">{profile?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
        <p className="font-semibold text-lg">{profile?.name || 'Loading...'}</p>
        <p className="text-sm text-gray-600 mt-2">My Address: {truncateAddress(account)}</p>
        {institute && (
          <p className="text-sm text-gray-600 mt-2">Current Institute: {institute.name}</p>
        )}
      </div>
      <button
        onClick={onViewProfile}
        className="w-full px-4 py-2 border-2 border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors mb-4"
      >
        VIEW PROFILE
      </button>
      {!institute && (
        <button
          onClick={onLink}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          LINK TO INSTITUTE
        </button>
      )}
    </div>
  );
};

Sidebar.propTypes = {
  profile: PropTypes.object,
  account: PropTypes.string,
  institute: PropTypes.object,
  onLink: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};

export default Sidebar;

import PropTypes from 'prop-types';

const LoginCard = ({ type, onButtonClick, isLoading }) => {
  const isStudent = type === 'student';
  const title = isStudent ? 'Student' : 'Institute';
  const gradient = isStudent
    ? 'from-blue-400 to-purple-500'
    : 'from-yellow-400 to-red-500';

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 w-full max-w-sm transform transition-all hover:scale-105 hover:shadow-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
      <div className="flex justify-center mb-6">
        <div className={`w-32 h-32 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center`}>
          {/* Icon can be passed as a prop if you want to customize it */}
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isStudent ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            )}
          </svg>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => onButtonClick(type)}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : `Connect as ${title}`}
        </button>
      </div>
    </div>
  );
};

LoginCard.propTypes = {
  type: PropTypes.oneOf(['student', 'institute']).isRequired,
  onButtonClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default LoginCard;

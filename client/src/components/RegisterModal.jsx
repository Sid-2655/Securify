import PropTypes from 'prop-types';

const RegisterModal = ({ isOpen, onClose, onRegister, isRegistering, registerName, setRegisterName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">Create New Account</h3>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Name</label>
          <input
            type="text"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            placeholder="Enter your name"
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
            onClick={onRegister}
            disabled={isRegistering || !registerName.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? 'Registering...' : 'CREATE'}
          </button>
        </div>
      </div>
    </div>
  );
};

RegisterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
  isRegistering: PropTypes.bool.isRequired,
  registerName: PropTypes.string.isRequired,
  setRegisterName: PropTypes.func.isRequired,
};

export default RegisterModal;

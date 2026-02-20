import { useEffect } from 'react';
import PropTypes from 'prop-types';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = 'fixed top-5 right-5 p-4 rounded-lg text-white max-w-sm shadow-lg z-50';
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error']).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Toast;

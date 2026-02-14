import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';

const Login = () => {
  const navigate = useNavigate();
  const { connectWallet, contract, account, isConnected, isLoading } = useWeb3();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerType, setRegisterType] = useState(null); // 'student' or 'institute'
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (isConnected && contract && account) {
      const checkProfile = async () => {
        try {
          const profile = await contract.getProfile(account);
          if (profile.exists) {
            if (profile.isInstitute) {
              navigate('/institute');
            } else {
              navigate('/student');
            }
          }
        } catch (error) {
          console.error('Error checking profile automatically:', error);
          alert('Error checking profile automatically. Please try again.');
        }
      };

      checkProfile();
    }
  }, [isConnected, contract, account, navigate]);

  const handleCardClick = async (type) => {
    if (!isConnected) {
      await connectWallet();
    } else {
      try {
        const profile = await contract.getProfile(account);
        if (!profile.exists) {
          setRegisterType(type);
          setShowRegisterModal(true);
        }
      } catch (error) {
        console.error('Error checking profile on click:', error);
        alert('Error checking profile. Please try again.');
      }
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerName.trim()) {
      alert('Please enter a name');
      return;
    }

    if (!contract) {
      alert('Contract not initialized. Please connect wallet first.');
      return;
    }

    setIsRegistering(true);
    try {
      const isInstitute = registerType === 'institute';
      
      const tx = await contract.createProfile(registerName.trim(), '', isInstitute, {
        gasLimit: 500000
      });
      
      await tx.wait();
      
      if (isInstitute) {
        navigate('/institute');
      } else {
        navigate('/student');
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed: ';
      if (error.reason) {
        errorMessage += error.reason;
      } else if (error.data?.message) {
        errorMessage += error.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      alert(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-blue-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 flex gap-8 flex-wrap justify-center max-w-4xl w-full">
        <div 
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 w-full max-w-sm cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl shadow-xl"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Student</h2>
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => handleCardClick('student')}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'LOGIN'}
            </button>
            <button 
              onClick={() => handleCardClick('student')}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
            >
              SIGN UP
            </button>
          </div>
        </div>

        <div 
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 w-full max-w-sm cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl shadow-xl"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Institute</h2>
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => handleCardClick('institute')}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'LOGIN'}
            </button>
            <button 
              onClick={() => handleCardClick('institute')}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg border-2 border-pink-600 hover:bg-pink-600 transition-colors font-semibold"
            >
              SIGN UP
            </button>
          </div>
        </div>
      </div>

      {showRegisterModal && (
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
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isRegistering ? 'Registering...' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

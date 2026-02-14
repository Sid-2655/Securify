import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider, useWeb3 } from './contexts/Web3Context';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import InstituteDashboard from './components/InstituteDashboard';

const AppContent = () => {
  const { isLoading } = useWeb3();

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/institute" element={<InstituteDashboard />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <Web3Provider>
        <AppContent />
      </Web3Provider>
    </Router>
  );
}

export default App;

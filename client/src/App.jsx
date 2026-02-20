import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
    <>
      <nav>
        <ul style={{ listStyleType: 'none', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#333' }}>
          <li style={{ float: 'left' }}><Link style={{ display: 'block', color: 'white', textAlign: 'center', padding: '14px 16px', textDecoration: 'none' }} to="/login">Login</Link></li>
          <li style={{ float: 'left' }}><Link style={{ display: 'block', color: 'white', textAlign: 'center', padding: '14px 16px', textDecoration: 'none' }} to="/">Student Dashboard</Link></li>
          <li style={{ float: 'left' }}><Link style={{ display: 'block', color: 'white', textAlign: 'center', padding: '14px 16px', textDecoration: 'none' }} to="/institute">Institute Dashboard</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/institute" element={<InstituteDashboard />} />
      </Routes>
    </>
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
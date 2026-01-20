import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import InstituteDashboard from './components/InstituteDashboard';

function App() {
  return (
    <Web3Provider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/institute" element={<InstituteDashboard />} />
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;

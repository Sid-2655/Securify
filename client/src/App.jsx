
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import InstituteDashboard from './components/InstituteDashboard';

function App() {
  return (
    <div>
      <h1>Rendering before Web3Provider</h1>
      <Web3Provider>
        <h1>Rendering inside Web3Provider</h1>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/institute" element={<InstituteDashboard />} />
          </Routes>
        </Router>
      </Web3Provider>
    </div>
  );
}

export default App;

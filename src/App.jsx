import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import { Toaster } from 'react-hot-toast';

import Home from './pages/camera/Home'; 
import Login from './pages/Login';
import Register from './pages/Register';

import DashboardHome from './pages/DashboardHome';
import ValidasiSensor from './pages/validasisensor/index'; 
import Profile from './pages/Profile';
import AnalisisLaporan from './pages/AnalisisLaporan';

import LaporanAdmin from './pages/admin/LaporanAdmin';
import ManajemenUser from './pages/admin/ManajemenUser';
import ManajemenData from './pages/admin/ManajemenData';
import NotifikasiAlarmAdmin from './pages/admin/NotifikasiAlarmAdmin';
import JaringanWifi from './pages/admin/JaringanWifi'; 

import LaporanDinas from './pages/dinas/LaporanDinas';
import NotifikasiAlarmDinas from './pages/dinas/NotifikasiAlarmDinas';

function LayoutPublik({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dinas');
  
  return (
    <>
      {!isDashboard && <Navbar />}
      {children}
    </>
  );
}

function PrivateRoute({ children, allowedRole }) {
  const activeRole = localStorage.getItem('active_role');
  if (activeRole !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const activeRole = localStorage.getItem('active_role');
  
  return (
    <Router>
      <CssBaseline /> 
      <LayoutPublik>
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ success: { duration: 2000 }, error: { duration: 3000 } }}/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/admin" element={<PrivateRoute allowedRole="admin"><Sidebar /></PrivateRoute>}>
            <Route path="dashboard" element={<DashboardHome />} />
            
            {/* Rute tanpa prop yang rentan hilang */}
            <Route path="laporan" element={<LaporanAdmin />} />
            
            <Route path="notif" element={<NotifikasiAlarmAdmin />} />
            <Route path="analisis" element={<AnalisisLaporan />} />
            <Route path="manajemen-user" element={<ManajemenUser />} />
            <Route path="manajemen-data" element={<ManajemenData />} />
            <Route path="jaringan-wifi" element={<JaringanWifi />} />
            
            {/* Rute tanpa prop yang rentan hilang */}
            <Route path="validasi-sensor" element={<ValidasiSensor userRole={activeRole} />} />
            
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/dinas" element={<PrivateRoute allowedRole="dinas"><Sidebar /></PrivateRoute>}>
            <Route path="dashboard" element={<DashboardHome />} />
            
            {/* Rute tanpa prop yang rentan hilang */}
            <Route path="laporan" element={<LaporanDinas />} />
            
            <Route path="notif" element={<NotifikasiAlarmDinas />} /> 
            <Route path="analisis" element={<AnalisisLaporan />} />
            
            {/* Rute tanpa prop yang rentan hilang */}
            <Route path="validasi-sensor" element={<ValidasiSensor userRole={activeRole} />} />
            
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </LayoutPublik>
    </Router>
  );
}

export default App;
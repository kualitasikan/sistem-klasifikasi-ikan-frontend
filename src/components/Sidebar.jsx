import { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Select, MenuItem, FormControl 
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Assignment, People, 
  BarChart, Notifications, Person, ExitToApp, Wifi as WifiIcon, Sensors,
  SwapHoriz as SwapHorizIcon 
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 260;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Baca peran apa yang SEDANG DIPAKAI dari localStorage
  const activeRole = localStorage.getItem('active_role'); 
  
  // Mengecek apakah akun ini adalah Multi-Role (mengandung koma)
  const isMultiRole = userData && userData.role && userData.role.includes(',');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setUserData(JSON.parse(user));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('active_role');
    navigate('/login');
  };

  // Fungsi saat pengguna menukar role di navbar dashboard
  const handleRoleSwitch = (event) => {
    const newRole = event.target.value;
    localStorage.setItem('active_role', newRole);
    navigate(newRole === 'admin' ? '/admin/dashboard' : '/dinas/dashboard');
  };

  const getMenuItems = () => {
    // Menu di-generate berdasarkan activeRole yang sedang aktif
    const basePath = activeRole === 'admin' ? '/admin' : '/dinas';

    const commonMenus = [
      { text: 'Dashboard', icon: <Dashboard />, path: `${basePath}/dashboard` },
      { text: 'Laporan', icon: <Assignment />, path: `${basePath}/laporan` },
      { text: 'Analisis Laporan', icon: <BarChart />, path: `${basePath}/analisis` },
      { text: 'Notifikasi & Alarm', icon: <Notifications />, path: `${basePath}/notif` },
      { text: 'Validasi IoT', icon: <Sensors />, path: `${basePath}/validasi-sensor` }, 
      { text: 'Profile', icon: <Person />, path: `${basePath}/profile` },
    ];

    if (activeRole === 'admin') {
      commonMenus.splice(5, 0, 
        { text: 'Jaringan / WiFi', icon: <WifiIcon />, path: '/admin/jaringan-wifi' },
        { text: 'Manajemen User', icon: <People />, path: '/admin/manajemen-user' }
      );
    }
    return commonMenus;
  };

  // Huruf kapital awal untuk Header Sidebar
  const displayRoleText = activeRole === 'admin' ? 'Admin' : 'Dinas';

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          {displayRoleText} Panel
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Masuk sebagai:</Typography>
        <Typography variant="subtitle1" fontWeight="bold">{userData?.nama_lengkap}</Typography>
        <Typography variant="caption" color="text.secondary">NIP: {userData?.nip}</Typography>
      </Box>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              selected={location.pathname === item.path}
              sx={{ '&.Mui-selected': { backgroundColor: '#e3f2fd', borderRight: '4px solid #1976d2' } }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><ExitToApp /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  if (!userData) return null; 

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header Atas di dalam Dashboard */}
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, backgroundColor: '#1976d2' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          
          {/* Bagian Kiri: Tombol Menu Mobile & Judul */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Sistem Monitoring Kualitas Ikan
            </Typography>
          </Box>

          {/* Bagian Kanan: Tombol Switch Role (Hanya Muncul Jika Multi-Role) */}
          {isMultiRole && (
            <FormControl size="small">
              <Select
                value={activeRole}
                onChange={handleRoleSwitch}
                displayEmpty
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHorizIcon fontSize="small" />
                    <Typography variant="body2" fontWeight="bold">
                      {value === 'admin' ? 'Mode Admin' : 'Mode Dinas'}
                    </Typography>
                  </Box>
                )}
                sx={{
                  color: 'white',
                  borderRadius: 2,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="admin" sx={{ fontWeight: 'bold' }}>Beralih ke Admin</MenuItem>
                <MenuItem value="dinas" sx={{ fontWeight: 'bold' }}>Beralih ke Dinas</MenuItem>
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toolbar /> 
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Outlet /> 
        </Box>
        <Box component="footer" sx={{ mt: 'auto', py: 3, textAlign: 'center', borderTop: '1px solid #ddd', backgroundColor: '#ffffff' }}>
          <Typography variant="body2" fontWeight="bold" color="text.secondary">© 2026 Dinas Kelautan dan Perikanan Provinsi Sulawesi Utara</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Dalam kerjasama dengan Maksy Sendiang P3M Politeknik Negeri Manado</Typography>
        </Box>
      </Box>
    </Box>
  );
}
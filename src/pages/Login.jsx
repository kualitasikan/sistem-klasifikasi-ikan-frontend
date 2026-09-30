import { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, InputAdornment, Avatar, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import PhishingIcon from '@mui/icons-material/Phishing'; 

export default function Login() {
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State untuk Popup Pilihan Role
  const [openModal, setOpenModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users') 
        .select('*')
        .eq('nip', nip)
        .eq('password', password)
        .single(); 

      if (fetchError || !user) {
        throw new Error('NIP atau Password salah!');
      }

      // 1. Simpan data lengkap user
      localStorage.setItem('user', JSON.stringify(user));
      
      // 2. Simpan nama_lengkap secara spesifik
      localStorage.setItem('nama_lengkap', user.nama_lengkap);

      // --- LOGIKA PENGECEKAN MULTI-ROLE (SUPER BULLETPROOF) ---
      let userRoles = [];

      if (user.role) {
        if (Array.isArray(user.role)) {
          // Jika dari Supabase sudah berupa Array murni (kolom tipe jsonb)
          userRoles = user.role; 
        } else if (typeof user.role === 'string') {
          try {
            // Coba tangkap jika formatnya stringifikasi JSON: '["Admin", "Dinas"]'
            userRoles = JSON.parse(user.role);
          } catch (err) {
            // Jika gagal parse JSON, berarti formatnya koma: "Admin, Dinas" atau "Admin,Dinas"
            userRoles = user.role.split(',').map(role => role.trim());
          }
        }
      }

      // Bersihkan array jika ada string kosong (mencegah error jika data di DB "Admin, ")
      userRoles = userRoles.filter(role => role !== '');

      // TAMPILKAN DI CONSOLE UNTUK DEBUGGING:
      console.log("Role yang berhasil dideteksi:", userRoles); 

      // Evaluasi Jumlah Role
      if (userRoles.length > 1) {
        // Jika isi array lebih dari 1 (punya 2 role), tampilkan popup
        setOpenModal(true);
      } else if (userRoles.length === 1) {
        // Jika akun single-role, arahkan langsung
        const singleRole = userRoles[0].toLowerCase().includes('admin') ? 'admin' : 'dinas';
        localStorage.setItem('active_role', singleRole);
        navigate(singleRole === 'admin' ? '/admin/dashboard' : '/dinas/dashboard');
      } else {
        throw new Error('Akun ini tidak memiliki role yang valid!');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (roleChoice) => {
    localStorage.setItem('active_role', roleChoice);
    setOpenModal(false);
    navigate(roleChoice === 'admin' ? '/admin/dashboard' : '/dinas/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: 2 }}>
      <Container maxWidth="xs">
        <Paper elevation={12} sx={{ p: 4, borderRadius: 4, backdropFilter: 'blur(10px)' }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar sx={{ m: 1, bgcolor: '#1976d2', width: 56, height: 56 }}><PhishingIcon fontSize="large" /></Avatar>
            <Typography variant="h5" fontWeight="900" color="#1e3c72" gutterBottom>PORTAL LOGIN</Typography>
            <Typography variant="body2" align="center" color="text.secondary">Sistem Klasifikasi Kualitas Ikan AI</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Nomor Induk Pegawai (NIP)" variant="outlined" margin="normal" required value={nip} onChange={(e) => setNip(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment>) }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" required value={password} onChange={(e) => setPassword(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>) }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 4, mb: 3, py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)', boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
              {loading ? 'MEMVERIFIKASI...' : 'MASUK SEKARANG'}
            </Button>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">Belum memiliki akses?{' '}<Link to="/register" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>Daftar di sini</Link></Typography>
            </Box>
          </form>
        </Paper>
      </Container>

      {/* POPUP PILIHAN ROLE SAAT LOGIN */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { borderRadius: 3, padding: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1e3c72' }}>Pilih Peran Login</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Akun Anda terdaftar dengan peran ganda. Sebagai apa Anda ingin masuk hari ini?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button fullWidth variant="contained" size="large" onClick={() => handleSelectRole('admin')} sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}>Admin</Button>
            <Button fullWidth variant="outlined" size="large" onClick={() => handleSelectRole('dinas')} sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold', borderWidth: 2 }}>Dinas</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
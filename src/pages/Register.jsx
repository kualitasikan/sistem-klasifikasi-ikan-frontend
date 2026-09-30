import { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Alert, 
  InputAdornment, Avatar, FormGroup, FormControlLabel, Checkbox, FormControl, FormLabel 
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    password: ''
  });
  const [roles, setRoles] = useState(['Dinas']); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setRoles([...roles, value]);
    } else {
      setRoles(roles.filter((role) => role !== value));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (roles.length === 0) {
        throw new Error('Silakan pilih minimal satu Hak Akses (Role)!');
      }

      // Cek apakah NIP sudah terdaftar
      const { data: existingUser } = await supabase
        .from('users')
        .select('nip')
        .eq('nip', formData.nip)
        .single();

      if (existingUser) {
        throw new Error('NIP ini sudah terdaftar di sistem!');
      }

      // LANGSUNG KIRIM ARRAY!
      // Kita tidak lagi menggabungkannya dengan .join(',') agar sesuai dengan aturan Supabase
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            password: formData.password,
            role: roles 
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={12} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Avatar sx={{ m: 1, bgcolor: '#21CBF3', width: 56, height: 56 }}>
              <AppRegistrationIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight="900" color="#1e3c72" gutterBottom>
              REGISTRASI AKUN
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Lengkapi data diri Anda untuk mengakses sistem pengawasan dinas.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Registrasi berhasil! Mengalihkan ke halaman Login...</Alert>}

          <form onSubmit={handleRegister}>
            <TextField fullWidth label="Nama Lengkap" name="nama_lengkap" variant="outlined" margin="normal" required value={formData.nama_lengkap} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            <TextField fullWidth label="Nomor Induk Pegawai (NIP)" name="nip" variant="outlined" margin="normal" required value={formData.nip} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            <TextField fullWidth label="Password" name="password" type="password" variant="outlined" margin="normal" required value={formData.password} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            
            <FormControl component="fieldset" sx={{ mt: 2, ml: 1 }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', color: '#1e3c72' }}>Hak Akses (Centang yang sesuai)</FormLabel>
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={roles.includes('Admin')} onChange={handleRoleChange} value="Admin" color="primary" />} label="Admin" />
                <FormControlLabel control={<Checkbox checked={roles.includes('Dinas')} onChange={handleRoleChange} value="Dinas" color="primary" />} label="Dinas" />
              </FormGroup>
            </FormControl>

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 4, mb: 3, py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)', boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.01)' } }}>
              {loading ? 'MEMPROSES DATA...' : 'DAFTARKAN AKUN'}
            </Button>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">Sudah memiliki akun?{' '}<Link to="/login" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>Masuk di sini</Link></Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
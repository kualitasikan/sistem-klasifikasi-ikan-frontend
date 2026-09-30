import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Avatar, Grid, Divider, 
  Button, List, ListItem, ListItemText, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Stack, Chip 
} from '@mui/material';
import { 
  Person, Badge, AdminPanelSettings, VerifiedUser, 
  PhotoCamera, Edit, LockReset, WorkOutline
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // Pastikan path ini benar sesuai struktur folder kamu
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Data User
  const [userData, setUserData] = useState(null);

  // State Dialog Edit Profil
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [editForm, setEditForm] = useState({ nama_lengkap: '', jabatan: '' });

  // State Dialog Edit Password
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  // Mengambil data terbaru dari database
  const fetchUserData = async () => {
    const localUser = JSON.parse(localStorage.getItem('user'));
    if (!localUser) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_user', localUser.id_user)
      .single();

    if (data && !error) {
      setUserData(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
  };

  // --- FUNGSI UPLOAD FOTO PROFIL ---
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadToast = toast.loading('Mengunggah foto profil...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.id_user}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profil_user').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profil_user').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('users').update({ foto_profil: publicUrl }).eq('id_user', userData.id_user);
      if (updateError) throw updateError;

      toast.success('Foto profil berhasil diperbarui!', { id: uploadToast });
      fetchUserData(); 
    } catch (error) {
      toast.error('Gagal mengunggah foto: ' + error.message, { id: uploadToast });
    }
  };

  // --- FUNGSI EDIT PROFIL ---
  const openEditProfile = () => {
    setEditForm({
      nama_lengkap: userData.nama_lengkap,
      jabatan: userData.jabatan || ''
    });
    setOpenProfileDialog(true);
  };

  const handleSaveProfile = async () => {
    const saveToast = toast.loading('Menyimpan perubahan...');
    const { error } = await supabase
      .from('users')
      .update({ nama_lengkap: editForm.nama_lengkap, jabatan: editForm.jabatan })
      .eq('id_user', userData.id_user);

    if (!error) {
      toast.success('Profil berhasil diperbarui!', { id: saveToast });
      setOpenProfileDialog(false);
      fetchUserData();
    } else {
      toast.error('Gagal menyimpan profil.', { id: saveToast });
    }
  };

  // --- FUNGSI EDIT PASSWORD ---
  const handleSavePassword = async () => {
    if (passwords.oldPassword !== userData.password) {
      toast.error('Gagal: Password lama yang Anda masukkan salah!');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password baru minimal harus 6 karakter!');
      return;
    }

    const passToast = toast.loading('Mengubah password...');
    const { error } = await supabase
      .from('users')
      .update({ password: passwords.newPassword })
      .eq('id_user', userData.id_user);

    if (!error) {
      toast.success('Password berhasil diubah!', { id: passToast });
      setOpenPasswordDialog(false);
      setPasswords({ oldPassword: '', newPassword: '' });
      fetchUserData();
    } else {
      toast.error('Terjadi kesalahan saat mengubah password.', { id: passToast });
    }
  };

  if (!userData) return null;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="#1976d2">
        Profil Pengguna
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, mt: 1 }}>
        Kelola informasi personal dan keamanan akun Anda di sini.
      </Typography>

      {/* SATU PAPER UTAMA YANG MEMBUNGKUS SEMUANYA */}
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Grid container spacing={4} alignItems="center">
          
          {/* KOLOM KIRI: FOTO PROFIL */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar 
                src={userData.foto_profil || ''}
                sx={{ 
                  width: 160, 
                  height: 160, 
                  margin: '0 auto', 
                  bgcolor: '#1976d2',
                  fontSize: '4.5rem',
                  boxShadow: 3,
                  border: '4px solid white'
                }}
              >
                {!userData.foto_profil && userData.nama_lengkap.charAt(0)}
              </Avatar>
              
              <Tooltip title="Ubah Foto Profil">
                <IconButton 
                  onClick={handleUploadClick}
                  color="primary"
                  sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    right: 5, 
                    backgroundColor: 'white', 
                    boxShadow: 3,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </Tooltip>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            </Box>

            <Typography variant="h5" sx={{ mt: 3, fontWeight: 'bold' }}>
              {userData.nama_lengkap}
            </Typography>
            <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ mt: 0.5 }}>
              {userData.role}
            </Typography>
            <Chip 
              icon={<VerifiedUser />} 
              label="Akun Aktif" 
              color="success" 
              variant="outlined" 
              sx={{ mt: 2, fontWeight: 'bold', borderRadius: '12px' }} 
            />
          </Grid>

          {/* KOLOM KANAN: INFORMASI DETAIL & TOMBOL AKSI */}
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Informasi Detail
              </Typography>
              <Box>
                <Button variant="outlined" startIcon={<Edit />} onClick={openEditProfile} sx={{ mr: 2, borderRadius: '20px', fontWeight: 'bold', px: 3 }}>
                  EDIT PROFIL
                </Button>
                <Button variant="outlined" color="error" startIcon={<LockReset />} onClick={() => setOpenPasswordDialog(true)} sx={{ borderRadius: '20px', fontWeight: 'bold', px: 3 }}>
                  UBAH PASSWORD
                </Button>
              </Box>
            </Stack>
            
            <Divider sx={{ mb: 1 }} />

            <List sx={{ width: '100%' }}>
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon><Person color="primary" fontSize="large" /></ListItemIcon>
                <ListItemText primary="Nama Lengkap" secondary={userData.nama_lengkap} primaryTypographyProps={{ fontWeight: 'medium' }} />
              </ListItem>
              <Divider component="li" variant="inset" />
              
              <ListItem sx={{ py: 2 }}>
                <ListItemIcon><Badge color="primary" fontSize="large" /></ListItemIcon>
                <ListItemText primary="Nomor Induk Pegawai (NIP)" secondary={userData.nip} primaryTypographyProps={{ fontWeight: 'medium' }} />
              </ListItem>
              <Divider component="li" variant="inset" />

              <ListItem sx={{ py: 2 }}>
                <ListItemIcon><WorkOutline color="primary" fontSize="large" /></ListItemIcon>
                <ListItemText 
                  primary="Jabatan" 
                  secondary={userData.jabatan ? userData.jabatan : <Typography component="span" color="error" variant="body2">Belum diisi</Typography>} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <Divider component="li" variant="inset" />

              <ListItem sx={{ py: 2 }}>
                <ListItemIcon><AdminPanelSettings color="primary" fontSize="large" /></ListItemIcon>
                <ListItemText primary="Hak Akses Sistem" secondary={userData.role} primaryTypographyProps={{ fontWeight: 'medium' }} />
              </ListItem>
            </List>
          </Grid>

        </Grid>
      </Paper>

      {/* --- DIALOG EDIT PROFIL --- */}
      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: 12 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Informasi Profil</DialogTitle>
        <DialogContent dividers>
          <TextField 
            fullWidth label="Nama Lengkap" margin="normal" 
            value={editForm.nama_lengkap} 
            onChange={(e) => setEditForm({ ...editForm, nama_lengkap: e.target.value })} 
          />
          <TextField 
            fullWidth label="Jabatan" margin="normal" 
            value={editForm.jabatan} 
            onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })} 
            placeholder="Contoh: Kepala Bidang Perikanan"
          />
          <TextField 
            fullWidth label="NIP" margin="normal" 
            value={userData.nip} 
            disabled // NIP tidak bisa diedit
            helperText="Nomor Induk Pegawai tidak dapat diubah."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenProfileDialog(false)} color="inherit">Batal</Button>
          <Button onClick={handleSaveProfile} variant="contained" sx={{ borderRadius: 2 }}>Simpan Perubahan</Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG EDIT PASSWORD --- */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} fullWidth maxWidth="xs" PaperProps={{ style: { borderRadius: 12 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>Ubah Password Keamanan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Demi keamanan, masukkan password lama Anda sebelum membuat password yang baru.
          </Typography>
          <TextField 
            fullWidth label="Password Lama" type="password" margin="normal" 
            value={passwords.oldPassword} 
            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} 
          />
          <TextField 
            fullWidth label="Password Baru" type="password" margin="normal" 
            value={passwords.newPassword} 
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} 
            helperText="Minimal 6 karakter."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPasswordDialog(false)} color="inherit">Batal</Button>
          <Button onClick={handleSavePassword} variant="contained" color="error" sx={{ borderRadius: 2 }}>Perbarui Password</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Stack, DialogContentText,
  TablePagination, Chip, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { Edit, Delete, PersonAdd, WarningAmber } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

export default function ManajemenUser() {
  const [users, setUsers] = useState([]);
  
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    password: ''
  });
  
  const [selectedRoles, setSelectedRoles] = useState(['Dinas']); 

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error) {
      setUsers(data);
      setPage(0); 
    } else {
      toast.error('Gagal mengambil data user.');
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditMode(true);
      setSelectedId(user.id_user);
      setFormData({
        nama_lengkap: user.nama_lengkap,
        nip: user.nip,
        password: user.password
      });
      
      // PERBAIKAN 1: Deteksi aman apakah role itu Array atau String
      let parsedRoles = [];
      if (Array.isArray(user.role)) {
        parsedRoles = user.role;
      } else if (typeof user.role === 'string' && user.role.trim() !== '') {
        parsedRoles = user.role.split(',');
      }
      setSelectedRoles(parsedRoles);
      
    } else {
      setEditMode(false);
      setFormData({ nama_lengkap: '', nip: '', password: '' });
      setSelectedRoles(['Dinas']);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, value]);
    } else {
      setSelectedRoles(selectedRoles.filter((role) => role !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0) {
      toast.error("Pilih setidaknya satu role!");
      return;
    }

    const submitToast = toast.loading(editMode ? 'Menyimpan perubahan...' : 'Menambahkan user baru...');
    
    const sortedRoles = [...selectedRoles].sort();
    // Biarkan disatukan dengan koma saat disimpan, Supabase seringkali akan 
    // menyimpannya sebagai text dan membacanya kembali sesuai format aslinya.
    const dataToSubmit = { ...formData, role: sortedRoles.join(',') };

    if (editMode) {
      const { error } = await supabase
        .from('users')
        .update(dataToSubmit)
        .eq('id_user', selectedId);
        
      if (error) {
        toast.error(`Gagal: ${error.message}`, { id: submitToast });
      } else {
        toast.success('Data user berhasil diperbarui!', { id: submitToast });
        fetchUsers(); 
        handleClose();
      }
    } else {
      const { error } = await supabase.from('users').insert([dataToSubmit]);
      
      if (error) {
        toast.error(`Gagal: ${error.message}`, { id: submitToast });
      } else {
        toast.success('User baru berhasil ditambahkan!', { id: submitToast });
        fetchUsers(); 
        handleClose();
      }
    }
  };

  const handleOpenDelete = (id) => {
    setUserToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    setOpenDeleteDialog(false); 
    
    if (userToDelete) {
      const deleteToast = toast.loading('Menghapus user...');
      const { error } = await supabase.from('users').delete().eq('id_user', userToDelete);
      
      if (!error) {
        toast.success('User berhasil dihapus!', { id: deleteToast });
        fetchUsers();
      } else {
        toast.error('Gagal menghapus user.', { id: deleteToast });
      }
      setUserToDelete(null);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = rowsPerPage > 0 
    ? users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : users;

  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  const tableHeaderBg = '#1e293b';

  // PERBAIKAN 2: Fungsi helper untuk merender role dengan aman di tabel
  const renderRoles = (roleData) => {
    let roles = [];
    if (Array.isArray(roleData)) {
      roles = roleData;
    } else if (typeof roleData === 'string' && roleData.trim() !== '') {
      roles = roleData.split(',');
    }

    return roles.map((r, idx) => (
      <Chip 
        key={idx}
        label={r.trim()} 
        color={r.trim() === 'Admin' ? 'primary' : 'secondary'} 
        size="small" 
        sx={{ fontWeight: 'bold', borderRadius: 1.5 }} 
      />
    ));
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a' }}>Manajemen User</Typography>
          <Typography variant="body2" color="text.secondary">Kelola data akun Admin dan Dinas.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => handleOpen()} disableElevation sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none', px: 3, py: 1 }}>
          Tambah User
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: softShadow, backgroundColor: '#ffffff' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: tableHeaderBg }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Nama Lengkap</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>NIP</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Role</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }} align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id_user} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' }, '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{user.nama_lengkap}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{user.nip}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {renderRoles(user.role)}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpen(user)} sx={{ mr: 1, backgroundColor: '#eff6ff', '&:hover': { backgroundColor: '#dbeafe' } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleOpenDelete(user.id_user)} sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#64748b' }}>Belum ada data user.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[5, 10, 25, 50, { label: 'Semua', value: -1 }]} component="div" count={users.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Baris per halaman:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`} sx={{ borderTop: '1px solid #f1f5f9' }} />
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ style: { borderRadius: 16 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a' }}>{editMode ? 'Edit Data User' : 'Tambah User Baru'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
            <TextField fullWidth label="Nama Lengkap" margin="dense" required value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth label="NIP" margin="dense" required value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" margin="dense" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} sx={{ mb: 2 }} />
            
            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Hak Akses (Role)</FormLabel>
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={selectedRoles.includes('Admin')} onChange={handleRoleChange} value="Admin" />} label="Admin" />
                <FormControlLabel control={<Checkbox checked={selectedRoles.includes('Dinas')} onChange={handleRoleChange} value="Dinas" />} label="Dinas" />
              </FormGroup>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: 'bold', textTransform: 'none' }}>Batal</Button>
            <Button type="submit" variant="contained" disableElevation sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', px: 3 }}>Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={handleCloseDelete} PaperProps={{ style: { borderRadius: 16, padding: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold' }}><WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan</DialogTitle>
        <DialogContent><DialogContentText sx={{ color: '#475569' }}>Apakah Anda yakin ingin menghapus user ini? Mereka <b style={{ color: '#0f172a' }}>tidak akan bisa lagi mengakses sistem</b> setelah dihapus.</DialogContentText></DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDelete} sx={{ color: '#64748b', fontWeight: 'bold', textTransform: 'none' }}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation autoFocus sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
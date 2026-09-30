import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Alert, Stack 
} from '@mui/material';
import { Edit, Storage } from '@mui/icons-material';
import { supabase } from '../../supabase';

export default function ManajemenData() {
  const [kategori, setKategori] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    nama_kategori: '',
    deskripsi_ciri_ciri: '',
    saran_tindakan: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    const { data, error } = await supabase
      .from('manajemen_klasifikasi')
      .select('*')
      .order('nama_kategori', { ascending: true });
    if (!error) setKategori(data);
  };

  const handleOpen = (item) => {
    setSelectedId(item.id_klasifikasi);
    setFormData({
      nama_kategori: item.nama_kategori,
      deskripsi_ciri_ciri: item.deskripsi_ciri_ciri,
      saran_tindakan: item.saran_tindakan
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase
      .from('manajemen_klasifikasi')
      .update(formData)
      .eq('id_klasifikasi', selectedId);

    if (error) {
      setError(error.message);
    } else {
      fetchKategori();
      handleClose();
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Manajemen Data Klasifikasi</Typography>
          <Typography variant="body2" color="text.secondary">Kelola parameter informasi kualitas ikan untuk edukasi masyarakat.</Typography>
        </Box>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell fontWeight="bold">Kategori</TableCell>
              <TableCell fontWeight="bold">Ciri-Ciri Fisik</TableCell>
              <TableCell fontWeight="bold">Saran Tindakan</TableCell>
              <TableCell fontWeight="bold" align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kategori.map((item) => (
              <TableRow key={item.id_klasifikasi} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{item.nama_kategori}</TableCell>
                <TableCell sx={{ maxWidth: 300 }}>{item.deskripsi_ciri_ciri}</TableCell>
                <TableCell>{item.saran_tindakan}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(item)}><Edit /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Informasi Klasifikasi</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth label="Nama Kategori" margin="dense" disabled
              value={formData.nama_kategori}
            />
            <TextField
              fullWidth label="Ciri-Ciri Fisik" margin="normal" multiline rows={4} required
              value={formData.deskripsi_ciri_ciri}
              onChange={(e) => setFormData({...formData, deskripsi_ciri_ciri: e.target.value})}
              helperText="Gunakan tanda koma untuk memisahkan poin-poin ciri fisik."
            />
            <TextField
              fullWidth label="Saran Tindakan" margin="normal" multiline rows={2} required
              value={formData.saran_tindakan}
              onChange={(e) => setFormData({...formData, saran_tindakan: e.target.value})}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">Batal</Button>
            <Button type="submit" variant="contained" startIcon={<Storage />}>Perbarui Data</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
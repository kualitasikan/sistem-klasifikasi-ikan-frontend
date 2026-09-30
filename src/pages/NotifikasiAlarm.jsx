import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Switch, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeleteIcon from '@mui/icons-material/Delete';
import { WarningAmber } from '@mui/icons-material';
import { supabase } from '../supabase';
import toast from 'react-hot-toast'; // <-- Import Toast

export default function NotifikasiAlarm() {
  const [logs, setLogs] = useState([]);
  const [daftarPenerima, setDaftarPenerima] = useState([]);
  
  // State Form Input
  const [namaPenerima, setNamaPenerima] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  
  // State untuk kontrol Dialog Hapus
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteData, setDeleteData] = useState({ type: '', id: null }); // type: 'penerima' atau 'log'

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchLogs();
    if (isAdmin) {
      fetchPengaturan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // --- MENGAMBIL DATA ---
  const fetchLogs = async () => {
    const { data, error } = await supabase.from('log_alarm').select('*').order('waktu_kejadian', { ascending: false });
    if (!error && data) setLogs(data);
  };

  const fetchPengaturan = async () => {
    const { data, error } = await supabase.from('pengaturan_notifikasi').select('*').order('created_at', { ascending: true });
    if (!error && data) setDaftarPenerima(data);
  };

  // --- AKSI FORM ---
  const handleSimpanPengaturan = async (e) => {
    e.preventDefault();
    const saveToast = toast.loading('Menambahkan nomor...'); // Toast Loading

    try {
      const { error } = await supabase.from('pengaturan_notifikasi').insert([{ 
        nama_penerima: namaPenerima, 
        nomor_whatsapp: nomorWa, 
        status_notif: true 
      }]);
      if (error) throw error;
      
      toast.success('Nomor WhatsApp berhasil ditambahkan!', { id: saveToast }); // Sukses
      setNamaPenerima('');
      setNomorWa('');
      fetchPengaturan(); 
    } catch (error) {
      toast.error('Gagal menambah nomor: ' + error.message, { id: saveToast }); // Error
    }
  };

  const toggleStatusNotif = async (id, currentStatus) => {
    const { error } = await supabase.from('pengaturan_notifikasi').update({ status_notif: !currentStatus }).eq('id_pengaturan', id);
    if (!error) {
      toast.success(`Notifikasi nomor ini telah di${!currentStatus ? 'aktifkan' : 'matikan'}.`);
      fetchPengaturan();
    } else {
      toast.error('Gagal mengubah status notifikasi.');
    }
  };

  // --- KONTROL DIALOG HAPUS ---
  const handleOpenDelete = (type, id) => {
    setDeleteData({ type, id });
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setDeleteData({ type: '', id: null });
  };

  const confirmDelete = async () => {
    setOpenDeleteDialog(false);
    const deleteToast = toast.loading('Menghapus data...');

    if (deleteData.type === 'penerima') {
      const { error } = await supabase.from('pengaturan_notifikasi').delete().eq('id_pengaturan', deleteData.id);
      if (!error) {
        toast.success('Nomor berhasil dihapus dari daftar!', { id: deleteToast });
        fetchPengaturan();
      } else {
        toast.error('Gagal menghapus nomor.', { id: deleteToast });
      }
    } 
    else if (deleteData.type === 'log') {
      const { error } = await supabase.from('log_alarm').delete().eq('id_log', deleteData.id);
      if (!error) {
        toast.success('Riwayat alarm berhasil dihapus!', { id: deleteToast });
        fetchLogs();
      } else {
        toast.error('Gagal menghapus riwayat alarm.', { id: deleteToast });
      }
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Notifikasi & Alarm Peringatan Dini</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isAdmin 
          ? 'Atur daftar penerima pesan WhatsApp Gateway dan pantau riwayat aktivasi perangkat IoT.' 
          : 'Pantau riwayat aktivasi peringatan dini perangkat IoT dan pengiriman WhatsApp.'}
      </Typography>

      <Grid container spacing={3}>
        
        {/* KOLOM KIRI: FORM & TABEL PENERIMA WA (KHUSUS ADMIN) */}
        {isAdmin && (
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActiveIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">Tambah Penerima WhatsApp</Typography>
              </Box>

              <form onSubmit={handleSimpanPengaturan}>
                <TextField fullWidth label="Nama Pemilik Nomor" variant="outlined" margin="normal" size="small"
                  value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} required />
                <TextField fullWidth label="Nomor WhatsApp (Contoh: 0812345...)" variant="outlined" margin="normal" size="small"
                  value={nomorWa} onChange={(e) => setNomorWa(e.target.value)} required />
                <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<SaveIcon />} sx={{ mt: 2 }}>
                  Tambahkan Nomor
                </Button>
              </form>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Daftar Nomor Terdaftar</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                    <TableRow>
                      <TableCell fontWeight="bold">Nama</TableCell>
                      <TableCell fontWeight="bold">Nomor WA</TableCell>
                      <TableCell align="center" fontWeight="bold">Aktif</TableCell>
                      <TableCell align="center" fontWeight="bold">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {daftarPenerima.map((row) => (
                      <TableRow key={row.id_pengaturan}>
                        <TableCell>{row.nama_penerima}</TableCell>
                        <TableCell>{row.nomor_whatsapp}</TableCell>
                        <TableCell align="center">
                          <Switch size="small" checked={row.status_notif} onChange={() => toggleStatusNotif(row.id_pengaturan, row.status_notif)} color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Hapus Nomor">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete('penerima', row.id_pengaturan)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {daftarPenerima.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Belum ada nomor didaftarkan.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* KOLOM KANAN: TABEL RIWAYAT ALARM */}
        <Grid item xs={12} md={isAdmin ? 7 : 12}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Riwayat Alarm (IoT & Sistem)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell fontWeight="bold">Waktu</TableCell>
                    <TableCell fontWeight="bold">Lokasi</TableCell>
                    <TableCell align="center" fontWeight="bold">Kasus</TableCell>
                    <TableCell fontWeight="bold">Status WA</TableCell>
                    {isAdmin && <TableCell align="center" fontWeight="bold">Aksi</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id_log} hover>
                      <TableCell>{new Date(log.waktu_kejadian).toLocaleString('id-ID')}</TableCell>
                      <TableCell fontWeight="medium">{log.lokasi_kejadian}</TableCell>
                      <TableCell align="center"><Chip label={log.jumlah_laporan_terkait} color="error" size="small" /></TableCell>
                      <TableCell>
                        <Chip label={log.status_wa || 'Terkirim'} color={log.status_wa?.includes('Gagal') ? 'error' : 'success'} size="small" variant="outlined" />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                           <Tooltip title="Hapus Log">
                             <IconButton size="small" color="error" onClick={() => handleOpenDelete('log', log.id_log)}>
                               <DeleteIcon fontSize="small" />
                             </IconButton>
                           </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 3 }}>Belum ada riwayat alarm.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* --- DIALOG KONFIRMASI HAPUS DINAMIS --- */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        PaperProps={{ style: { borderRadius: 12, padding: '8px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#d32f2f', fontWeight: 'bold' }}>
          <WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteData.type === 'penerima' 
              ? 'Apakah Anda yakin ingin menghapus nomor WhatsApp ini dari daftar penerima notifikasi?' 
              : 'Apakah Anda yakin ingin menghapus riwayat alarm ini? Data tidak dapat dikembalikan.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit" variant="text" sx={{ fontWeight: 'bold' }}>
            Batal
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus sx={{ borderRadius: 2 }}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
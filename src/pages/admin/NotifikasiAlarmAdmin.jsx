import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Switch, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, Stack,
  TablePagination
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeleteIcon from '@mui/icons-material/Delete';
import { WarningAmber, Search, FilterAlt, RestartAlt, Download } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

export default function NotifikasiAlarmAdmin() {
  const [logs, setLogs] = useState([]);
  const [daftarPenerima, setDaftarPenerima] = useState([]);
  
  // State Filter Log
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '' });

  // State Form Input WA
  const [namaPenerima, setNamaPenerima] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  
  // State untuk kontrol Dialog Hapus
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteData, setDeleteData] = useState({ type: '', id: null }); 

  // --- State Pagination Penerima ---
  const [pagePenerima, setPagePenerima] = useState(0);
  const [rowsPerPagePenerima, setRowsPerPagePenerima] = useState(5);

  // --- State Pagination Log Alarm ---
  const [pageLog, setPageLog] = useState(0);
  const [rowsPerPageLog, setRowsPerPageLog] = useState(5);

  // Mengambil daftar nomor WA sekali saja di awal
  useEffect(() => {
    fetchPengaturan();
  }, []);

  // Mengambil Log Alarm dan Setup Realtime
  useEffect(() => {
    fetchLogs();

    // SETUP SUPABASE REALTIME: Mendengarkan perubahan otomatis dari tabel log_alarm
    const alarmSubscription = supabase
      .channel('realtime-admin-log')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'log_alarm' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.error(`⚠️ ALARM BARU: Terdeteksi 3 laporan di ${payload.new.lokasi_kejadian}`, { duration: 6000, icon: '🚨' });
          }
          fetchLogs(); // Refresh tabel otomatis
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alarmSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // --- MENGAMBIL DATA ---
  const fetchLogs = async () => {
    let query = supabase.from('log_alarm').select('*').order('waktu_kejadian', { ascending: false });

    if (filter.tanggal) {
      query = query.gte('waktu_kejadian', `${filter.tanggal}T00:00:00Z`).lte('waktu_kejadian', `${filter.tanggal}T23:59:59Z`);
    }
    if (filter.lokasi) {
      query = query.ilike('lokasi_kejadian', `%${filter.lokasi}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data);
      setPageLog(0); // Reset pagination saat filter berubah
    }
  };

  const fetchPengaturan = async () => {
    const { data, error } = await supabase.from('pengaturan_notifikasi').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setDaftarPenerima(data);
      setPagePenerima(0);
    }
  };

  // --- AKSI FORM ---
  const handleSimpanPengaturan = async (e) => {
    e.preventDefault();
    const saveToast = toast.loading('Menambahkan nomor...');

    try {
      const { error } = await supabase.from('pengaturan_notifikasi').insert([{ 
        nama_penerima: namaPenerima, 
        nomor_whatsapp: nomorWa, 
        status_notif: true 
      }]);
      if (error) throw error;
      
      toast.success('Nomor WhatsApp berhasil ditambahkan!', { id: saveToast });
      setNamaPenerima('');
      setNomorWa('');
      fetchPengaturan(); 
    } catch (error) {
      toast.error('Gagal menambah nomor: ' + error.message, { id: saveToast });
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

  // --- FUNGSI PAGINATION ---
  const handleChangePagePenerima = (event, newPage) => setPagePenerima(newPage);
  const handleChangeRowsPerPagePenerima = (event) => {
    setRowsPerPagePenerima(parseInt(event.target.value, 10));
    setPagePenerima(0);
  };

  const handleChangePageLog = (event, newPage) => setPageLog(newPage);
  const handleChangeRowsPerPageLog = (event) => {
    setRowsPerPageLog(parseInt(event.target.value, 10));
    setPageLog(0);
  };

  // Hitung data yang tampil
  const paginatedPenerima = rowsPerPagePenerima > 0 
    ? daftarPenerima.slice(pagePenerima * rowsPerPagePenerima, pagePenerima * rowsPerPagePenerima + rowsPerPagePenerima) 
    : daftarPenerima;

  const paginatedLogs = rowsPerPageLog > 0 
    ? logs.slice(pageLog * rowsPerPageLog, pageLog * rowsPerPageLog + rowsPerPageLog) 
    : logs;

  // --- FUNGSI EXPORT CSV ---
  const escapeCSV = (str) => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""'); 
    return `"${clean}"`; 
  };

  const handleExportPenerima = () => {
    if (paginatedPenerima.length === 0) {
      toast.error('Tidak ada data penerima untuk diekspor.');
      return;
    }
    const headers = ['Nama Pemilik', 'Nomor WA', 'Status Notifikasi'];
    const csvRows = paginatedPenerima.map(row => [
      escapeCSV(row.nama_penerima),
      escapeCSV(row.nomor_whatsapp),
      escapeCSV(row.status_notif ? 'Aktif' : 'Mati')
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daftar_Penerima_WA_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Berhasil mengekspor data Penerima ke CSV!');
  };

  const handleExportLog = () => {
    if (paginatedLogs.length === 0) {
      toast.error('Tidak ada riwayat alarm untuk diekspor.');
      return;
    }
    const headers = ['Waktu Kejadian', 'Lokasi Penemuan', 'Jumlah Laporan', 'Status Pengiriman WA'];
    const csvRows = paginatedLogs.map(row => [
      escapeCSV(new Date(row.waktu_kejadian).toLocaleString('id-ID')),
      escapeCSV(row.lokasi_kejadian),
      escapeCSV(row.jumlah_laporan_terkait),
      escapeCSV(row.status_wa || 'Terkirim')
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Riwayat_Alarm_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Berhasil mengekspor Riwayat Alarm ke CSV!');
  };

  // --- DESAIN UI MODERN ---
  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  const tableHeaderBg = '#1e293b';

  return (
    <Box>
      <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a' }} gutterBottom>
        Notifikasi & Alarm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Atur daftar penerima pesan WhatsApp Gateway dan pantau riwayat aktivasi perangkat IoT secara penuh.
      </Typography>

      {/* ========================================================= */}
      {/* BAGIAN 1: PENGATURAN WHATSAPP (LEBAR PENUH) */}
      {/* ========================================================= */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, backgroundColor: '#ffffff', boxShadow: softShadow }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsActiveIcon color="primary" fontSize="large" sx={{ mr: 1, color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="bold" color="#0f172a">Pengaturan Penerima WhatsApp Gateway</Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Form Tambah Nomor */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box component="form" onSubmit={handleSimpanPengaturan} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="#334155">Tambah Nomor Baru</Typography>
              <TextField fullWidth label="Nama Pemilik Nomor" variant="outlined" margin="normal" size="small"
                value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} required sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField fullWidth label="Nomor WA (Contoh: 08123...)" variant="outlined" margin="normal" size="small"
                value={nomorWa} onChange={(e) => setNomorWa(e.target.value)} required sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<SaveIcon />} disableElevation sx={{ mt: 2, borderRadius: 2, fontWeight: 'bold', py: 1 }}>
                Simpan Nomor
              </Button>
            </Box>
          </Grid>

          {/* Tabel Nomor Terdaftar */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#334155">Daftar Nomor Terdaftar</Typography>
              <Button variant="contained" startIcon={<Download />} onClick={handleExportPenerima} disableElevation sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none', height: '36px' }}>
                Export
              </Button>
            </Box>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: tableHeaderBg }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: '600' }}>Nama Pemilik</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: '600' }}>Nomor WA</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: '600' }}>Status Notifikasi</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: '600' }}>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPenerima.map((row) => (
                      <TableRow key={row.id_pengaturan} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                        <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{row.nama_penerima}</TableCell>
                        <TableCell sx={{ color: '#475569' }}>{row.nomor_whatsapp}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" alignItems="center" justifyContent="center">
                             <Switch size="small" checked={row.status_notif} onChange={() => toggleStatusNotif(row.id_pengaturan, row.status_notif)} color="primary" />
                             <Typography variant="caption" sx={{ minWidth: 40, color: row.status_notif ? '#10b981' : '#94a3b8', fontWeight: 'bold' }}>
                               {row.status_notif ? 'Aktif' : 'Mati'}
                             </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Hapus Nomor">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete('penerima', row.id_pengaturan)} sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {daftarPenerima.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748b' }}>Belum ada nomor didaftarkan.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: 'Semua', value: -1 }]}
                component="div"
                count={daftarPenerima.length}
                rowsPerPage={rowsPerPagePenerima}
                page={pagePenerima}
                onPageChange={handleChangePagePenerima}
                onRowsPerPageChange={handleChangeRowsPerPagePenerima}
                labelRowsPerPage="Baris:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
                sx={{ borderTop: '1px solid #f1f5f9' }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* ========================================================= */}
      {/* BAGIAN 2: RIWAYAT ALARM (LEBAR PENUH) */}
      {/* ========================================================= */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, backgroundColor: '#ffffff', boxShadow: softShadow }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="#0f172a">Riwayat Alarm Peringatan Dini</Typography>
        
        {/* Filter Riwayat & Button Export */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
            <FilterAlt fontSize="small" sx={{ mr: 1 }} /> Filter & Export Riwayat Alarm
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Tanggal Alarm" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth
                value={filter.tanggal} onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} 
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Cari Lokasi..." size="small" fullWidth
                value={filter.lokasi} onChange={(e) => setFilter({ ...filter, lokasi: e.target.value })}
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button variant="outlined" color="inherit" fullWidth startIcon={<RestartAlt />}
                onClick={() => setFilter({ tanggal: '', lokasi: '' })}
                sx={{ height: '40px', borderRadius: 2, fontWeight: 'bold' }}
              >
                Reset
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button variant="contained" fullWidth startIcon={<Download />}
                onClick={handleExportLog} disableElevation
                sx={{ height: '40px', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
              >
                Export Riwayat
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Tabel Riwayat */}
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: tableHeaderBg }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: '600' }}>Waktu Kejadian</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: '600' }}>Lokasi Penemuan</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: '600' }}>Laporan (Kasus)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: '600' }}>Status WA</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: '600' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id_log} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{new Date(log.waktu_kejadian).toLocaleString('id-ID')}</TableCell>
                    <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{log.lokasi_kejadian}</TableCell>
                    <TableCell align="center">
                      <Chip label={log.jumlah_laporan_terkait} sx={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold', borderRadius: 1.5 }} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.status_wa || 'Terkirim'} 
                        color={log.status_wa?.includes('Gagal') ? 'error' : 'success'} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Hapus Log">
                        <IconButton size="small" color="error" onClick={() => handleOpenDelete('log', log.id_log)} sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b' }}>{filter.tanggal || filter.lokasi ? "Tidak ada riwayat alarm yang sesuai pencarian." : "Belum ada riwayat alarm."}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, { label: 'Semua', value: -1 }]}
            component="div"
            count={logs.length}
            rowsPerPage={rowsPerPageLog}
            page={pageLog}
            onPageChange={handleChangePageLog}
            onRowsPerPageChange={handleChangeRowsPerPageLog}
            labelRowsPerPage="Baris:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
            sx={{ borderTop: '1px solid #f1f5f9' }}
          />
        </Paper>
      </Paper>

      {/* --- DIALOG KONFIRMASI HAPUS DINAMIS --- */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        PaperProps={{ style: { borderRadius: 16, padding: '12px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold' }}>
          <WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            {deleteData.type === 'penerima' 
              ? 'Apakah Anda yakin ingin menghapus nomor WhatsApp ini dari daftar penerima notifikasi?' 
              : 'Apakah Anda yakin ingin menghapus riwayat alarm ini? Data tidak dapat dikembalikan.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDelete} sx={{ color: '#64748b', fontWeight: 'bold', textTransform: 'none' }}>
            Batal
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation autoFocus sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
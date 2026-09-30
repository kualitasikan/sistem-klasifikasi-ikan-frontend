import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  TablePagination 
} from '@mui/material';
import { Search, FilterAlt, RestartAlt, Download } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

export default function NotifikasiAlarmDinas() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '' });

  // --- State Pagination ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchLogs();

    // SETUP SUPABASE REALTIME: Tabel update otomatis
    const alarmSubscription = supabase
      .channel('realtime-dinas-log')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'log_alarm' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.error(`⚠️ ALARM BARU: Terdeteksi 3 laporan di ${payload.new.lokasi_kejadian}`, { duration: 6000, icon: '🚨' });
          }
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alarmSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      setPage(0); // Reset ke halaman pertama saat filter berubah atau data baru masuk
    } else {
      toast.error('Gagal mengambil riwayat alarm dari server.');
    }
  };

  // --- FUNGSI PAGINATION ---
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLogs = rowsPerPage > 0 
    ? logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) 
    : logs;

  // --- FUNGSI EXPORT CSV ---
  const handleExportCSV = () => {
    if (paginatedLogs.length === 0) {
      toast.error('Tidak ada riwayat alarm di halaman ini untuk diekspor.');
      return;
    }

    const headers = ['Waktu Kejadian', 'Lokasi Penemuan', 'Jumlah Kasus', 'Status WhatsApp Gateway'];
    
    const escapeCSV = (str) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""'); 
      return `"${clean}"`; 
    };

    const csvRows = paginatedLogs.map(row => [
      escapeCSV(new Date(row.waktu_kejadian).toLocaleString('id-ID')),
      escapeCSV(row.lokasi_kejadian),
      row.jumlah_laporan_terkait,
      escapeCSV(row.status_wa || 'Terkirim')
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `Riwayat_Alarm_Dinas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Berhasil mengekspor Riwayat Alarm ke CSV!');
  };

  // --- GAYA UI MODERN ---
  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  const tableHeaderBg = '#1e293b';

  return (
    <Box>
      <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a' }} gutterBottom>
        Riwayat Alarm Peringatan Dini
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Pantau riwayat aktivasi perangkat IoT (Sirine/LED) dan status pengiriman pesan darurat WhatsApp.
      </Typography>

      {/* --- BAGIAN FILTER & EXPORT --- */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, backgroundColor: '#ffffff', boxShadow: softShadow }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
          <FilterAlt fontSize="small" sx={{ mr: 1 }} /> Filter & Export Riwayat Alarm
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField label="Tanggal Kejadian" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth
              value={filter.tanggal} onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} 
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField label="Cari Lokasi Penemuan..." size="small" fullWidth
              value={filter.lokasi} onChange={(e) => setFilter({ ...filter, lokasi: e.target.value })}
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              variant="outlined" color="inherit" fullWidth startIcon={<RestartAlt />}
              onClick={() => setFilter({ tanggal: '', lokasi: '' })}
              sx={{ height: '40px', borderRadius: 2, fontWeight: 'bold' }}
            >
              Reset
            </Button>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              variant="contained" fullWidth startIcon={<Download />}
              onClick={handleExportCSV} disableElevation
              sx={{ height: '40px', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* --- BAGIAN TABEL RIWAYAT --- */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: softShadow, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: tableHeaderBg }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: '600', py: 2 }}>Waktu Kejadian</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Lokasi Penemuan</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: '600' }}>Jumlah Kasus</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Status WhatsApp Gateway</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id_log} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                  <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
                    {new Date(log.waktu_kejadian).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell sx={{ color: '#334155', fontWeight: 600 }}>
                    {log.lokasi_kejadian}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={log.jumlah_laporan_terkait} 
                      sx={{ backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold', borderRadius: 1.5 }} 
                      size="small" 
                    />
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
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#64748b' }}>
                    {filter.tanggal || filter.lokasi 
                      ? "Tidak ada data riwayat alarm yang cocok dengan pencarian Anda." 
                      : "Belum ada riwayat alarm tercatat. Sistem dalam keadaan aman."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, { label: 'Semua', value: -1 }]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
          sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Paper>
    </Box>
  );
}
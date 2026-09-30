import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, TablePagination, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stack, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Download, Delete, WarningAmber } from '@mui/icons-material'; 
import toast from 'react-hot-toast';
import { supabase } from '../../supabase'; 

export default function RiwayatPanel({ riwayat, isAdmin, onRefreshRiwayat }) {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  useEffect(() => { setPage(0); }, [filterStartDate, filterEndDate, filterStatus]);

  const filteredRiwayat = riwayat.filter((item) => {
    const matchStatus = filterStatus === 'Semua' || item.status_ikan === filterStatus;
    let matchDate = true;
    if (filterStartDate || filterEndDate) {
      const itemDate = new Date(new Date(item.waktu_rekam).toISOString().split('T')[0]);
      const startDate = filterStartDate ? new Date(filterStartDate) : null;
      const endDate = filterEndDate ? new Date(filterEndDate) : null;
      if (startDate && endDate) matchDate = itemDate >= startDate && itemDate <= endDate;
      else if (startDate) matchDate = itemDate >= startDate;
      else if (endDate) matchDate = itemDate <= endDate;
    }
    return matchStatus && matchDate;
  });

  const paginatedRiwayat = rowsPerPage > 0 ? filteredRiwayat.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredRiwayat;

  const handleExportCSV = () => {
    if (filteredRiwayat.length === 0) return toast.error('Tidak ada data untuk diekspor.');
    
    const headers = ['Waktu Rekam', 'Petugas', 'Lokasi/Pasar', 'Suhu (°C)', 'Kelembapan (%)', 'MQ135', 'MQ137', 'CH2O (ppb)', 'BME688 Gas (Ohm)', 'Status Akhir'];
    
    const csvRows = filteredRiwayat.map(row => {
      const escapeStr = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      return [
        escapeStr(new Date(row.waktu_rekam).toLocaleString('id-ID')), 
        escapeStr(row.nama_petugas || '-'), 
        escapeStr(row.lokasi_alamat || '-'), 
        row.suhu != null ? Number(row.suhu).toFixed(1) : 0, // Dibulatkan 1 angka belakang koma
        row.kelembapan != null ? Number(row.kelembapan).toFixed(1) : 0, // Dibulatkan 1 angka belakang koma
        row.nilai_mq135, 
        row.nilai_mq137, 
        row.nilai_ze08, 
        row.nilai_bme_gas || 0, 
        escapeStr(row.status_ikan)
      ].join(',');
    });
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Validasi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Berhasil mengekspor data laporan!');
  };

  const confirmDelete = async () => {
    setOpenDeleteDialog(false);
    if (selectedId && isAdmin) {
      const deleteToast = toast.loading('Menghapus riwayat...');
      const { error } = await supabase.from('riwayat_validasi').delete().eq('id', selectedId);
      if (!error) { toast.success('Riwayat berhasil dihapus!', { id: deleteToast }); onRefreshRiwayat(); } 
      else toast.error('Gagal menghapus riwayat.', { id: deleteToast });
      setSelectedId(null);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#ffffff', boxShadow: softShadow }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', color: '#0f172a', mb: { xs: 2, md: 0 } }}><HistoryIcon sx={{ mr: 1, color: '#3b82f6' }} /> Riwayat Perekaman Validasi</Typography>
        <Button variant="contained" startIcon={<Download />} onClick={handleExportCSV} disableElevation sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Export CSV ({filteredRiwayat.length} Data)</Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
           <Grid size={{ xs: 12, md: 1 }}><Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}><FilterListIcon sx={{ mr: 0.5, fontSize: 18 }} /> Filter:</Typography></Grid>
           <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="Tanggal Mulai" type="date" size="small" InputLabelProps={{ shrink: true }} value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1 }} /></Grid>
           <Grid size={{ xs: 12, sm: 6, md: 3 }}><TextField fullWidth label="Tanggal Akhir" type="date" size="small" InputLabelProps={{ shrink: true }} value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1 }} /></Grid>
           <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                <InputLabel>Status Akhir</InputLabel>
                <Select value={filterStatus} label="Status Akhir" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="Semua">Semua Status</MenuItem>
                  <MenuItem value="Segar">Segar</MenuItem>
                  <MenuItem value="Kurang Segar">Kurang Segar</MenuItem>
                  <MenuItem value="Busuk">Busuk</MenuItem>
                </Select>
              </FormControl>
           </Grid>
           <Grid size={{ xs: 12, md: 2 }}><Button fullWidth variant="text" color="error" size="small" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterStatus('Semua'); }}>Reset Filter</Button></Grid>
        </Grid>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1e293b' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Waktu Rekam</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Petugas / Lokasi</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Suhu & Kelembapan</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600', minWidth: 150 }}>Data 4 Sensor Gas</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Hasil Kesimpulan AI</TableCell>
                {isAdmin && <TableCell sx={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Aksi</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRiwayat.length === 0 ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 6, color: '#64748b' }}>Tidak ada data yang sesuai filter.</TableCell></TableRow>
              ) : (
                paginatedRiwayat.map((row) => {
                let statusAI = String(row.status_ikan || '').toUpperCase().trim();
                let badgeColor = 'default'; 

                    if (statusAI === 'KURANG SEGAR' || statusAI === 'KRG SEGAR') {
                    badgeColor = 'warning'; 
                    } else if (statusAI.includes('BUSUK')) {
                    badgeColor = 'error';   
                    } else if (statusAI === 'SEGAR') {
                    badgeColor = 'success'; 
                    }
                  return (
                    <TableRow key={row.id} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                      <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{new Date(row.waktu_rekam).toLocaleString('id-ID')}</TableCell>
                      <TableCell sx={{ color: '#0f172a' }}><b>{row.nama_petugas || '-'}</b><br/><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.lokasi_alamat || '-'}</span></TableCell>
                      
                      {/* PERBAIKAN: Membulatkan Suhu dan Kelembapan menjadi 1 desimal */}
                      <TableCell sx={{ color: '#475569' }}>
                        Suhu: <b>{row.suhu != null ? Number(row.suhu).toFixed(1) : '-'}°C</b><br/>
                        Kelembapan: <b>{row.kelembapan != null ? Number(row.kelembapan).toFixed(1) : '-'}%</b>
                      </TableCell>

                      <TableCell sx={{ color: '#475569', fontSize: '0.9rem' }}>
                        MQ135 ADC: <b>{row.nilai_mq135 || 0}</b> | MQ137 NH₃: <b>{row.nilai_mq137 || 0} ppm</b><br/>
                        CH2O: <b>{row.nilai_ze08 || 0} ppb</b> | BME: <b>{row.nilai_bme_gas ? (row.nilai_bme_gas / 1000).toFixed(1) : 0} kOhm</b>
                      </TableCell>
                      <TableCell align="center"><Chip label={row.status_ikan} color={badgeColor} size="small" sx={{ fontWeight: 'bold', borderRadius: 1.5 }} /></TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <Tooltip title="Hapus Data"><IconButton size="small" color="error" onClick={() => { setSelectedId(row.id); setOpenDeleteDialog(true); }} sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[5, 10, 25, 50, { label: 'Semua', value: -1 }]} component="div" count={filteredRiwayat.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Baris per halaman:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`} sx={{ borderTop: '1px solid #f1f5f9' }} />
      </Paper>

      <Dialog open={openDeleteDialog} onClose={() => { setOpenDeleteDialog(false); setSelectedId(null); }} PaperProps={{ style: { borderRadius: 16, padding: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold' }}><WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan</DialogTitle>
        <DialogContent><DialogContentText sx={{ color: '#475569' }}>Apakah Anda yakin ingin menghapus data riwayat validasi ini? Data yang dihapus <b style={{ color: '#0f172a' }}>tidak dapat dikembalikan</b>.</DialogContentText></DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={() => { setOpenDeleteDialog(false); setSelectedId(null); }} sx={{ color: '#64748b', fontWeight: 'bold', textTransform: 'none' }}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation autoFocus sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
import { useState, useEffect } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Box,
  TextField, MenuItem, IconButton, Tooltip, Button, Grid, InputAdornment,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TablePagination
} from '@mui/material';
import { Delete, Search, FilterAlt, RestartAlt, WarningAmber, Download, OpenInNew } from '@mui/icons-material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; 

export default function LaporanAdmin() {
  const [laporan, setLaporan] = useState([]);
  const [filter, setFilter] = useState({ tanggal: '', lokasi: '', status: 'Semua' });
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchLaporan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLaporan = async () => {
    let query = supabase.from('laporan').select('*').order('created_at', { ascending: false });

    if (filter.tanggal) query = query.gte('created_at', `${filter.tanggal}T00:00:00Z`).lte('created_at', `${filter.tanggal}T23:59:59Z`);
    if (filter.lokasi) query = query.ilike('lokasi_alamat', `%${filter.lokasi}%`);
    if (filter.status !== 'Semua') query = query.eq('status_penanganan', filter.status);

    const { data, error } = await query;
    if (!error) {
      setLaporan(data);
      setPage(0); 
    } else {
      toast.error('Gagal mengambil data laporan dari server.');
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedId(null);
  };

  const confirmDelete = async () => {
    setOpenDialog(false);
    
    if (selectedId) {
      const deleteToast = toast.loading('Menghapus laporan...'); 
      
      const { error } = await supabase.from('laporan').delete().eq('id_laporan', selectedId);
      
      if (!error) {
        fetchLaporan();
        toast.success('Laporan berhasil dihapus permanen!', { id: deleteToast }); 
      } else {
        toast.error('Gagal menghapus laporan.', { id: deleteToast }); 
      }
      setSelectedId(null);
    }
  };

  const handleOpenImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageDialog(true);
  };

  const handleCloseImage = () => {
    setOpenImageDialog(false);
    setSelectedImage(null);
  };

  const getStatusColor = (status) => {
    if (status === 'Selesai') return 'success';
    if (status === 'Diproses') return 'warning';
    return 'error';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Menggunakan 'laporan' secara langsung karena data 'laporan' ini sudah terfilter dari backend
  const paginatedLaporan = rowsPerPage > 0 
    ? laporan.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : laporan;

  // PERBAIKAN: Export mengambil data 'laporan' (yang sudah terfilter dari DB), BUKAN data satu halaman
  const handleExportCSV = () => {
    if (laporan.length === 0) {
      toast.error('Tidak ada data yang sesuai filter untuk diekspor.');
      return;
    }

    const headers = ['Waktu', 'Jenis Ikan', 'Lokasi/Alamat', 'Keterangan', 'Status Penanganan', 'Petugas', 'Link Foto'];
    
    const csvRows = laporan.map(row => {
      const date = new Date(row.created_at).toLocaleDateString('id-ID');
      
      const escapeString = (str) => {
        if (!str) return '""';
        const clean = String(str).replace(/"/g, '""'); 
        return `"${clean}"`; 
      };

      return [
        escapeString(date),
        escapeString(row.jenis_ikan),
        escapeString(row.lokasi_alamat),
        escapeString(row.keterangan || '-'),
        escapeString(row.status_penanganan),
        escapeString(row.nama_petugas || '-'), // Ekspor kolom petugas
        escapeString(row.foto_ikan) 
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `Laporan_Ikan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Berhasil mengekspor data ke CSV!');
  };

  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  const tableHeaderBg = '#1e293b'; 

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a' }} gutterBottom>
            Daftar Laporan Masyarakat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pantau dan kelola seluruh laporan hasil deteksi kualitas ikan dari masyarakat.
          </Typography>
        </Box>
      </Box>
      
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, backgroundColor: '#ffffff', boxShadow: softShadow }}>
        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
          <FilterAlt fontSize="small" sx={{ mr: 1 }} /> Filter & Pencarian Laporan
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Tanggal Laporan" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth
              value={filter.tanggal} onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Cari Lokasi / Pasar" placeholder="Ketik lokasi..." size="small" fullWidth
              value={filter.lokasi} onChange={(e) => setFilter({ ...filter, lokasi: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField select label="Status" size="small" fullWidth
              value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <MenuItem value="Semua">Semua Status</MenuItem>
              <MenuItem value="Menunggu">Menunggu</MenuItem>
              <MenuItem value="Diproses">Diproses</MenuItem>
              <MenuItem value="Selesai">Selesai</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button 
              variant="outlined" color="inherit" fullWidth startIcon={<RestartAlt />}
              onClick={() => setFilter({ tanggal: '', lokasi: '', status: 'Semua' })}
              sx={{ height: '40px', borderRadius: 2, fontWeight: 'bold' }}
            >
              Reset
            </Button>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button 
              variant="contained" fullWidth startIcon={<Download />}
              onClick={handleExportCSV}
              sx={{ height: '40px', borderRadius: 2, fontWeight: 'bold', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, boxShadow: 'none' }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: softShadow, backgroundColor: '#ffffff' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: tableHeaderBg }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Waktu</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Ikan</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Lokasi</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600', minWidth: 200 }}>Keterangan</TableCell> 
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Petugas</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: '600' }} align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLaporan.map((row) => (
                <TableRow key={row.id_laporan} sx={{ transition: '0.2s', '&:hover': { backgroundColor: '#f8fafc' }, '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{new Date(row.created_at).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Tooltip title="Klik untuk memperbesar foto" placement="top">
                        <img 
                          src={row.foto_ikan} 
                          alt="Ikan" 
                          onClick={() => handleOpenImage(row.foto_ikan)}
                          style={{ 
                            width: 50, height: 50, borderRadius: 8, objectFit: 'cover', 
                            border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.3s'
                          }} 
                          onMouseOver={(e) => e.currentTarget.style.opacity = 0.8}
                          onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                        />
                      </Tooltip>
                      <Typography variant="body2" fontWeight="600" color="#334155">{row.jenis_ikan}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#475569' }}>{row.lokasi_alamat}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.keterangan ? row.keterangan : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status_penanganan} color={getStatusColor(row.status_penanganan)} size="small" sx={{ fontWeight: 'bold', borderRadius: 1.5 }} />
                  </TableCell>
                  
                  {/* TAMPILAN PETUGAS */}
                  <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                     {row.nama_petugas ? row.nama_petugas : <Typography variant="caption" color="text.secondary">-</Typography>}
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Hapus Laporan">
                      <IconButton color="error" onClick={() => handleDeleteClick(row.id_laporan)} sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {laporan.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <FilterAlt sx={{ fontSize: 40, color: '#cbd5e1' }} />
                      <Typography variant="body1">Tidak ada data laporan yang cocok dengan filter.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, { label: 'Semua', value: -1 }]}
          component="div"
          count={laporan.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
          sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Paper>

      {/* --- DIALOG KONFIRMASI HAPUS --- */}
      <Dialog open={openDialog} onClose={handleCloseDialog} PaperProps={{ style: { borderRadius: 16, padding: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: 'bold' }}>
          <WarningAmber sx={{ mr: 1 }} /> Konfirmasi Penghapusan
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Apakah Anda yakin ingin menghapus laporan ini? 
            Tindakan ini <b style={{ color: '#0f172a' }}>permanen</b> dan data tidak dapat dikembalikan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#64748b', fontWeight: 'bold', textTransform: 'none' }}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation autoFocus sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>
            Ya, Hapus Permanen
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG UNTUK MEMPERBESAR FOTO --- */}
      <Dialog open={openImageDialog} onClose={handleCloseImage} maxWidth="md" fullWidth PaperProps={{ style: { borderRadius: 12, overflow: 'hidden' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', py: 1.5 }}>
          <Typography fontWeight="bold" color="#334155">Detail Foto Laporan</Typography>
          <Button onClick={handleCloseImage} color="inherit" sx={{ fontWeight: 'bold' }}>Tutup</Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0, textAlign: 'center', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <img 
            src={selectedImage} 
            alt="Perbesar Ikan" 
            style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} 
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#f8fafc', p: 2, justifyContent: 'center' }}>
          <Button 
            href={selectedImage} 
            target="_blank" 
            rel="noopener noreferrer" 
            variant="contained" 
            color="primary" 
            startIcon={<OpenInNew />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            disableElevation
          >
            Buka Resolusi Penuh di Tab Baru
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
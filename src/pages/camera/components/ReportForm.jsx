import { Box, Paper, Typography, Alert, Stack, TextField, IconButton, CircularProgress, Button } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SendIcon from '@mui/icons-material/Send';

export default function ReportForm({
  submitStatus, handleSubmitReport, lokasi, setLokasi, ambilLokasiOtomatis,
  loadingLokasi, koordinat, keterangan, setKeterangan, isSubmitting
}) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#d32f2f' }}>Form Pelaporan Dinas</Typography>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
        {submitStatus && <Alert severity={submitStatus.type} sx={{ mb: 3 }}>{submitStatus.message}</Alert>}
        
        <form onSubmit={handleSubmitReport}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField 
              fullWidth 
              label="Lokasi/Alamat Ditemukan" 
              variant="filled" 
              margin="normal" 
              required 
              multiline    // <-- Diubah agar alamat panjang bisa terbaca
              rows={2}     // <-- Diubah agar alamat panjang bisa terbaca
              value={lokasi} 
              onChange={(e) => setLokasi(e.target.value)} 
              sx={{ mt: 1 }}
            />
            <IconButton onClick={ambilLokasiOtomatis} disabled={loadingLokasi} sx={{ mt: 2, bgcolor: '#f1f5f9', p: 2 }}>
              {loadingLokasi ? <CircularProgress size={24} /> : <MyLocationIcon color="primary" />}
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0, mb: 1, ml: 1 }}>
            {koordinat.lat ? `Koordinat Satelit Terkunci: ${koordinat.lat}, ${koordinat.lng}` : "GPS Siap. Klik ikon radar di kanan input untuk melacak posisi Anda."}
          </Typography>

          <TextField 
            fullWidth 
            label="Detail Keterangan (Patokan tempat/Kondisi)" 
            variant="filled" 
            margin="normal" 
            multiline 
            rows={3} 
            value={keterangan} 
            onChange={(e) => setKeterangan(e.target.value)} 
          />
          
          <Button type="submit" variant="contained" color="error" fullWidth size="large" startIcon={<SendIcon />} sx={{ mt: 3, py: 1.5, borderRadius: 3 }} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses Laporan & Enkripsi GPS...' : 'Kirim Laporan Resmi'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
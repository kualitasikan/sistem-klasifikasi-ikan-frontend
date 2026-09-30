import { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, TextField, Stack, Tooltip } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import CloudIcon from '@mui/icons-material/Cloud';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import ScienceIcon from '@mui/icons-material/Science';
import SaveIcon from '@mui/icons-material/Save';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { Refresh, AccessTime, RestartAlt, PhotoCamera, Analytics } from '@mui/icons-material'; 
import toast from 'react-hot-toast'; 

export default function MonitorPanel({ sensorData, isDeviceOnline, namaPetugas, isSaving, isRefreshing, isResetting, onAnalisaAI, onSimpanData, onReset, onRefresh }) {
  const [lokasiInput, setLokasiInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const softShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  // TOMBOL 1: Validasi AI (Hanya Foto)
  const handleTriggerAnalisa = () => {
    if (sensorData.status_sistem !== 'Selesai') return toast.error('Validasi belum selesai! Alat ESP32 masih memproses.');
    if (!imageFile) return toast.error('Silakan ambil foto ikan terlebih dahulu!');
    
    onAnalisaAI(imageFile);
  };

  // TOMBOL 2: Simpan Riwayat (Lokasi dibutuhkan)
  const handleTriggerSimpan = () => {
    if (!sensorData?.hasil_ai || sensorData.hasil_ai === '-' || sensorData.hasil_ai === 'Menunggu AI...') {
      return toast.error('Lakukan Analisa AI terlebih dahulu sebelum menyimpan data!');
    }
    if (!lokasiInput.trim()) return toast.error('Silakan isi nama lokasi/pasar terlebih dahulu!');
    
    onSimpanData(lokasiInput, () => {
       setLokasiInput(''); setImageFile(null); setImagePreview(null);
    });
  };

  // ========================================================
  // RUMUS MATEMATIKA KONVERSI (SINKRON DENGAN LAYAR OLED)
  // ========================================================
  const raw_mq135 = sensorData?.nilai_mq135 || 0;
  const raw_mq137 = sensorData?.nilai_mq137 || 0;
  const raw_ze08 = sensorData?.nilai_ze08 || 0;
  const raw_bme_gas = sensorData?.nilai_bme_gas || 0;

  let mq137_ppm = 0;
  const v_rl = raw_mq137 * (3.3 / 4095.0);
  if (v_rl > 0.01 && v_rl < 3.29) {
      const r_s = 10.0 * ((3.3 - v_rl) / v_rl);
      const ratio = r_s / 10.0;
      if (ratio > 0) mq137_ppm = 44.047 * Math.pow(ratio, -0.342);
      if (mq137_ppm > 1000) mq137_ppm = 1000;
  }

  const h2co_mgm3 = raw_ze08 * 0.00123;
  // ========================================================

  let statusColor = '#10b981'; 
  if (sensorData?.hasil_ai === 'Kurang Segar') statusColor = '#f59e0b'; 
  else if (sensorData?.hasil_ai === 'Busuk') statusColor = '#ef4444'; 
  else if (sensorData?.hasil_ai === 'Menunggu AI...' || sensorData?.hasil_ai === 'MENUNGGU...' || !sensorData?.hasil_ai || sensorData?.hasil_ai === '-') statusColor = '#64748b'; 

  const isWaiting = sensorData?.status_sistem !== 'Selesai';
  // Mengecek apakah alat sudah siap untuk disimpan ke riwayat
  const hasAIResult = sensorData?.hasil_ai && sensorData.hasil_ai !== '-' && sensorData.hasil_ai !== 'Menunggu AI...' && sensorData.hasil_ai !== 'MENUNGGU...';

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#ffffff', mb: 4, boxShadow: softShadow }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>Live Monitor Box Validasi IoT</Typography>
          <Typography variant="body2" color="text.secondary">
            Pembaruan Terakhir: <b style={{ color: '#3b82f6' }}>{sensorData ? new Date(sensorData.created_at).toLocaleTimeString('id-ID') : '-'}</b>
            <span style={{ marginLeft: '10px' }}>| Petugas Aktif: <b>{namaPetugas}</b></span>
          </Typography>
        </Box>
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          <Chip icon={isDeviceOnline ? <WifiIcon /> : <WifiOffIcon />} label={isDeviceOnline ? "Alat Online" : "Alat Offline"} color={isDeviceOnline ? "success" : "error"} variant={isDeviceOnline ? "filled" : "outlined"} sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 1, py: 2.5, borderRadius: 3 }} />
        </Box>
      </Stack>

      <Box sx={{ mb: 3, p: 3, border: '2px dashed #cbd5e1', borderRadius: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 'bold' }}>Mata Elektronik (Input Visual AI - CNN)</Typography>
        {!imagePreview ? (
          <Button component="label" variant="outlined" startIcon={<PhotoCamera />} sx={{ borderRadius: 2, py: 1.5, px: 3, fontWeight: 'bold', borderWidth: 2 }}>
            Buka Kamera / Pilih Foto <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageChange} />
          </Button>
        ) : (
          <Box>
            <img src={imagePreview} alt="Preview Ikan" style={{ maxHeight: '180px', borderRadius: '12px', marginBottom: '10px', boxShadow: softShadow }} /><br/>
            <Button component="label" variant="text" color="error" size="small" sx={{ fontWeight: 'bold' }}>
              Ulangi Ambil Foto <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageChange} />
            </Button>
          </Box>
        )}
      </Box>

      {/* PANEL KONTROL MULTI-TOMBOL BARU */}
      <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', mb: 4 }}>
        <Grid container spacing={2} alignItems="stretch">
          
          {/* Tombol Tahap 1: Kirim & Analisa AI */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button fullWidth variant="contained" color="primary" disableElevation startIcon={isWaiting ? <AccessTime /> : <Analytics />} onClick={handleTriggerAnalisa} disabled={isSaving || isWaiting || !isDeviceOnline} sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.1, height: '100%', backgroundColor: isWaiting ? '#94a3b8' : '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}>
              {isSaving ? 'Menganalisa...' : (isWaiting ? 'Menunggu Sensor...' : 'Kirim & Analisa AI')}
            </Button>
          </Grid>

          {/* Kolom Tahap 2: Input Lokasi & Tombol Simpan */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <TextField fullWidth label="Lokasi Validasi (Isi setelah Analisa)" placeholder="Contoh: Pasar Bersehati" variant="outlined" size="small" value={lokasiInput} onChange={(e) => setLokasiInput(e.target.value)} disabled={!hasAIResult} InputProps={{ startAdornment: <LocationOnIcon color="action" sx={{ mr: 1, color: '#64748b' }} /> }} sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 }, height: '100%', justifyContent: 'center' }} />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
            <Button fullWidth variant="contained" color="success" disableElevation startIcon={<SaveIcon />} onClick={handleTriggerSimpan} disabled={!hasAIResult || isSaving} sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.1, height: '100%', backgroundColor: hasAIResult ? '#10b981' : '#94a3b8', '&:hover': { backgroundColor: '#059669' } }}>
              Simpan Data
            </Button>
          </Grid>

          {/* Tombol Utilities Tambahan */}
          <Grid size={{ xs: 12, sm: 6, md: 2, lg: 1.5 }}>
            <Tooltip title="Reset & kalibrasi ulang alat tanpa cabut kabel"><span><Button fullWidth variant="outlined" color="error" disableElevation startIcon={<RestartAlt />} onClick={onReset} disabled={isResetting || !isDeviceOnline} sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.1, height: '100%', borderWidth: 2, '&:hover': { borderWidth: 2 } }}>Reset Alat</Button></span></Tooltip>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2, lg: 1.5 }}>
            <Tooltip title="Muat ulang data terbaru tanpa merefresh halaman"><span><Button fullWidth variant="outlined" color="inherit" disableElevation startIcon={<Refresh />} onClick={onRefresh} disabled={isRefreshing} sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.1, height: '100%', color: '#475569', borderColor: '#cbd5e1', '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' } }}>Reload</Button></span></Tooltip>
          </Grid>

        </Grid>
      </Box>

      {/* TAMPILAN 6 KARTU SENSOR (SINKRON DENGAN OLED ESP32) */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #ffedd5', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <ThermostatIcon sx={{ fontSize: 36, color: '#f97316', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">Temperatur / Suhu (C)</Typography><Typography variant="h6" fontWeight="900" color="#431407">{sensorData?.suhu?.toFixed(1) || '0.0'}°C</Typography></Box>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #dbeafe', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <OpacityIcon sx={{ fontSize: 36, color: '#3b82f6', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">RH / Kelembapan</Typography><Typography variant="h6" fontWeight="900" color="#1e3a8a">{sensorData?.kelembapan?.toFixed(0) || '0'}%</Typography></Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#fdf4ff', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #fae8ff', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <CloudIcon sx={{ fontSize: 36, color: '#d946ef', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">MQ137 NH₃ (ppm)</Typography><Typography variant="h6" fontWeight="900" color="#701a75">{mq137_ppm.toFixed(1)}</Typography></Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #d1fae5', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <AirIcon sx={{ fontSize: 36, color: '#10b981', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">BME688 Gas Resistensi (kOhm)</Typography><Typography variant="h6" fontWeight="900" color="#064e3b">{(raw_bme_gas / 1000).toFixed(1)}</Typography></Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#e0e7ff', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #c7d2fe', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <SpeedIcon sx={{ fontSize: 36, color: '#6366f1', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">MQ135 ADC</Typography><Typography variant="h6" fontWeight="900" color="#312e81">{raw_mq135}</Typography></Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #bbf7d0', filter: isDeviceOnline ? 'none' : 'grayscale(100%)' }}>
            <ScienceIcon sx={{ fontSize: 36, color: '#22c55e', mr: 2 }} />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">H2CO (mg/m³)</Typography><Typography variant="h6" fontWeight="900" color="#14532d">{h2co_mgm3.toFixed(3)}</Typography></Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 3, bgcolor: isDeviceOnline ? (isWaiting ? '#475569' : statusColor) : '#cbd5e1', borderRadius: 3, textAlign: 'center', color: 'white', boxShadow: isDeviceOnline && !isWaiting ? `0 10px 15px -3px ${statusColor}40` : 'none' }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 'bold' }}>{isWaiting && isDeviceOnline ? 'STATUS ALAT SAAT INI' : 'HASIL DECISION FUSION (CNN + RANDOM FOREST)'}</Typography>
        <Typography variant="h3" fontWeight="900" sx={{ mt: 0.5 }}>{isDeviceOnline ? (isWaiting ? (sensorData?.status_sistem?.toUpperCase() || 'MEMPROSES') : (sensorData?.hasil_ai || '-')) : 'ALAT TERPUTUS'}</Typography>
        {isWaiting && isDeviceOnline && <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>Mohon jangan buka boks. ESP32 sedang memproses data...</Typography>}
      </Box>
    </Paper>
  );
}
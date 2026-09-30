import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, Stack, Button, IconButton, Typography, CircularProgress, 
  Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, 
  FormControl, Select, MenuItem 
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos'; 
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import CropIcon from '@mui/icons-material/Crop';

// Import React Crop
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function CameraSection({
  isCameraOpen, videoRef, ambilFotoDariStream, matikanKamera, preview, 
  result, confidence, layakKonsumsi, nyalakanKamera, handleImageChange, 
  handleClassify, isClassifying, facingMode, gantiKamera, isFlashOn, toggleFlash
}) {
  
  // Efek Cermin Otomatis
  const isMirrored = facingMode === 'user';

  // =======================================================================
  // STATE UNTUK JALUR 2: FRAMING GUIDE (PANDUAN KAMERA)
  // =======================================================================
  const [frameMode, setFrameMode] = useState('seluruh'); 

  // Dimensi frame berdasarkan mode yang dipilih
  const getFrameStyles = () => {
    const baseStyle = {
      position: 'absolute',
      border: '2px dashed #00e676', // Warna hijau terang agar jelas
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', // Menggelapkan area luar kotak
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 5,
      pointerEvents: 'none', // Agar klik tombol di baliknya tetap tembus
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (frameMode) {
      case 'mata':
        return { ...baseStyle, width: '100px', height: '100px', borderRadius: '50%' }; // Lingkaran kecil
      case 'setengah':
        return { ...baseStyle, width: '220px', height: '220px', borderRadius: '15px' }; // Kotak sedang
      case 'seluruh':
      default:
        return { ...baseStyle, width: '320px', height: '180px', borderRadius: '15px' }; // Persegi panjang
    }
  };

  // =======================================================================
  // STATE & FUNGSI UNTUK FITUR CROP UPLOAD GAMBAR
  // =======================================================================
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // 1. Tangkap file yang diupload, tapi jangan langsung dikirim ke parent
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = null; // Reset input agar bisa upload file yang sama jika batal
    }
  };

  // 2. Fungsi memotong gambar menggunakan Canvas
  const createCropBlob = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = 'cropped_ikan.jpg';
        const file = new File([blob], 'cropped_ikan.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  };

  // 3. Simpan hasil potong dan kirimkan secara "Palsu" ke handleImageChange bawaan Anda
  const handleSaveCrop = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const croppedFile = await createCropBlob(imgRef.current, completedCrop);
      
      // Simulasi Event object yang diharapkan oleh handleImageChange di parent
      const fakeEvent = { target: { files: [croppedFile] } };
      handleImageChange(fakeEvent); 
      
      setCropModalOpen(false);
    }
  };

  return (
    <>
      {/* VIEW BOX STREAM KAMERA LENGKAP DENGAN FRAMING GUIDE */}
      {isCameraOpen && (
        <Box sx={{ position: 'relative', mb: 3, bgcolor: '#000', borderRadius: '15px', overflow: 'hidden' }}>
          
          {/* Pilihan Mode Kamera (Dropdown Overlay di Atas) */}
          <Box sx={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '80%' }}>
             <FormControl fullWidth size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
               <Select
                 value={frameMode}
                 onChange={(e) => setFrameMode(e.target.value)}
                 displayEmpty
                 sx={{ fontWeight: 'bold', textAlign: 'center' }}
               >
                 <MenuItem value="seluruh">Mode: Seluruh Badan Ikan</MenuItem>
                 <MenuItem value="setengah">Mode: Setengah Badan (Kepala - Perut)</MenuItem>
                 <MenuItem value="mata">Mode: Fokus Mata Ikan</MenuItem>
               </Select>
             </FormControl>
             <Typography variant="caption" sx={{ color: '#fff', display: 'block', textAlign: 'center', mt: 1, textShadow: '1px 1px 2px #000' }}>
                *Posisikan objek tepat di dalam batas hijau
             </Typography>
          </Box>

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ 
              width: '100%', 
              maxHeight: '500px', 
              objectFit: 'cover',
              transform: isMirrored ? 'scaleX(-1)' : 'none'
            }} 
          />

          {/* KOTAK PANDUAN KAMERA (FRAMING GUIDE) */}
          <div style={getFrameStyles()}></div>

          {/* KONTROL KAMERA (Bawah) */}
          <Stack direction="row" spacing={1.5} sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <Button variant="contained" color="primary" onClick={ambilFotoDariStream} sx={{ borderRadius: 5, px: 3, fontWeight: 'bold', boxShadow: 3 }}>
              Ambil Foto
            </Button>
            
            {facingMode === 'environment' && (
              <Tooltip title={isFlashOn ? "Matikan Flash" : "Nyalakan Flash"} placement="top">
                <IconButton 
                  onClick={toggleFlash} 
                  sx={{ 
                    bgcolor: isFlashOn ? '#ef4444' : 'rgba(255, 255, 255, 0.2)', 
                    color: '#fff', 
                    backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: isFlashOn ? '#dc2626' : 'rgba(255, 255, 255, 0.4)' } 
                  }}
                >
                  {isFlashOn ? <FlashOnIcon sx={{ color: '#facc15' }} /> : <FlashOffIcon />}
                </IconButton>
              </Tooltip>
            )}

            <IconButton onClick={gantiKamera} sx={{ bgcolor: 'secondary.main', color: '#fff', '&:hover': { bgcolor: 'secondary.dark' } }}>
              <FlipCameraIosIcon />
            </IconButton>

            <IconButton onClick={matikanKamera} sx={{ bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      )}

      {/* BOX PREVIEW GAMBAR + BADGE HASIL AI */}
      {preview && !isCameraOpen && (
        <Box sx={{ position: 'relative', mb: 3 }}>
          <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '400px', borderRadius: '15px', objectFit: 'cover' }} />
          {result && (
            <Chip 
              label={`${result} (${confidence || '0%'})`} 
              color={layakKonsumsi ? 'success' : 'error'}
              sx={{ position: 'absolute', top: 20, right: 20, fontWeight: 'bold', px: 2, py: 2.5, fontSize: '1rem', boxShadow: 2 }} 
            />
          )}
        </Box>
      )}

      {/* CONTAINER VIEW AWAL KOSONG */}
      {!preview && !isCameraOpen && (
        <Box sx={{ py: 8, border: '2px dashed #b0bec5', borderRadius: 4, mb: 3, bgcolor: '#fafafa' }}>
          <PhotoCamera sx={{ fontSize: 60, color: '#b0bec5', mb: 2 }} />
          <Typography color="text.secondary">Belum ada foto objek ikan yang diambil</Typography>
        </Box>
      )}

      {/* TOMBOL AKSI UTAMA */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button variant="contained" color="primary" startIcon={<PhotoCamera />} onClick={() => nyalakanKamera()} disabled={isCameraOpen} sx={{ borderRadius: 3, px: 3 }}>
          Buka Kamera Langsung
        </Button>
        <Button variant="outlined" component="label" size="large" startIcon={<CropIcon />} sx={{ borderRadius: 3, px: 3 }}>
          Pilih & Potong dari Galeri
          {/* Input file ditangkap oleh onSelectFile untuk dicrop dulu */}
          <input hidden accept="image/*" type="file" onChange={onSelectFile} />
        </Button>
        
        {preview && !result && !isCameraOpen && (
          <Button variant="contained" color="success" size="large" onClick={handleClassify} disabled={isClassifying} sx={{ borderRadius: 3, px: 4 }}>
            {isClassifying ? <CircularProgress size={24} color="inherit" /> : 'Cek Kualitas Sekarang'}
          </Button>
        )}
      </Stack>

      {/* MODAL CROP GAMBAR (Muncul saat user upload gambar dari galeri) */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Sesuaikan Area Ikan</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#333' }}>
          {imageSrc && (
            <ReactCrop 
              crop={crop} 
              onChange={(c) => setCrop(c)} 
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img 
                ref={imgRef} 
                src={imageSrc} 
                alt="Crop preview" 
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            *Potong area yang tidak perlu agar AI lebih akurat
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setCropModalOpen(false)} color="inherit">Batal</Button>
            <Button onClick={handleSaveCrop} variant="contained" color="primary">Simpan Potongan</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
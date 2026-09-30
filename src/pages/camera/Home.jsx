import { Container, Typography, Box, Paper, Grid, Avatar } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PhishingIcon from '@mui/icons-material/Phishing'; // Ikon pemanis tema ikan
import ClassificationForm from './ClassificationForm';

export default function Home() {
  return (
    <Box sx={{ bgcolor: '#f4f7fc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* =================================================================== */}
      {/* HERO SECTION (Bagian Atas) */}
      {/* =================================================================== */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)', // Gradien Biru
          color: 'white', 
          py: { xs: 8, md: 12 }, 
          textAlign: 'center', 
          mb: 6,
          boxShadow: '0px 4px 20px rgba(13, 71, 161, 0.3)',
          borderBottomLeftRadius: { xs: 20, md: 40 }, // Membuat sudut melengkung
          borderBottomRightRadius: { xs: 20, md: 40 }
        }}
      >
        <Container maxWidth="md">
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, mx: 'auto', mb: 3 }}>
            <PhishingIcon sx={{ fontSize: 40, color: 'white' }} />
          </Avatar>
          <Typography variant="h3" fontWeight="900" gutterBottom sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, letterSpacing: '-0.5px' }}>
            Pastikan Ikan Anda <span style={{ color: '#ffca28' }}>Segar & Layak</span>
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: '80%', mx: 'auto' }}>
            Teknologi AI cerdas untuk memantau kualitas konsumsi ikan masyarakat Sulawesi Utara secara instan dan akurat.
          </Typography>
        </Container>
      </Box>

      {/* =================================================================== */}
      {/* KONTEN UTAMA (Kiri: Instruksi, Kanan: Form Kamera) */}
      {/* =================================================================== */}
      <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
        <Grid container spacing={4} justifyContent="center">
          
          {/* Kolom Kiri: Instruksi */}
          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <Box sx={{ position: 'sticky', top: 24 }}> {/* Membuat instruksi tetap di layar saat scroll */}
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#0d47a1', mb: 3 }}>
                <InfoIcon sx={{ mr: 1 }} /> Panduan Cepat
              </Typography>
              
              <Box>
                {[
                  'Ambil foto ikan secara jelas (fokus pada mata/insang).',
                  'Klik tombol "Cek Kualitas" untuk klasifikasi AI.',
                  'Lihat hasil kelayakan secara instan di layar.',
                  'Laporkan jika menemukan ikan tidak layak di pasar.',
                  'Pastikan hanya memotret SATU ekor ikan dalam satu frame (fokus close-up pada mata/badan ikan). Sistem tidak dapat memproses foto tumpukan ikan secara bersamaan.'
                ].map((text, i) => (
                  <Paper 
                    key={i} 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      borderRadius: 3,
                      border: '1px solid #e0e6ed',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-4px)', 
                        boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                        borderColor: '#1976d2'
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#e3f2fd', color: '#0d47a1', fontWeight: 'bold', mr: 2, width: 35, height: 35 }}>
                      {i + 1}
                    </Avatar>
                    <Typography variant="body2" fontWeight="500" color="text.secondary">
                      {text}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Kolom Kanan: Fitur Utama AI */}
          <Grid size={{ xs: 12, md: 9, lg: 8 }}>
            {/* ClassificationForm sudah memiliki Paper sendiri di dalamnya, jadi tidak perlu dibungkus lagi */}
            <ClassificationForm />
          </Grid>
          
        </Grid>
      </Container>

      {/* =================================================================== */}
      {/* FOOTER */}
      {/* =================================================================== */}
      <Box 
        sx={{ 
          mt: 8, 
          py: 4, 
          textAlign: 'center', 
          bgcolor: '#0d47a1', // Menggunakan warna gelap agar kontras
          color: 'rgba(255, 255, 255, 0.7)'
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'white' }}>
          © 2026 Dinas Kelautan dan Perikanan Provinsi Sulawesi Utara
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          Dalam kerjasama dengan Maksy Sendiang P3M Politeknik Negeri Manado
        </Typography>
      </Box>

    </Box>
  );
}
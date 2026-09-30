import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../supabase'; 

export default function AnalisisLaporan() {
  const [dataStatistik, setDataStatistik] = useState([]);
  const [totalLaporan, setTotalLaporan] = useState(0);

  // Palet warna yang lebih banyak agar tidak ada warna berulang untuk lokasi yang banyak
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#e91e63', '#9c27b0', '#3f51b5', '#009688', '#4caf50', 
    '#ffeb3b', '#795548', '#607d8b'
  ];

  useEffect(() => {
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    // Mengambil data laporan untuk dihitung statistiknya
    const { data, error } = await supabase.from('laporan').select('lokasi_alamat');

    if (!error && data) {
      setTotalLaporan(data.length);

      // Mengelompokkan data berdasarkan lokasi
      const counts = data.reduce((acc, curr) => {
        const lokasi = curr.lokasi_alamat;
        acc[lokasi] = (acc[lokasi] || 0) + 1;
        return acc;
      }, {});

      // Mengubah format data dan MENGURUTKAN dari yang terbesar
      const formattedData = Object.keys(counts)
        .map(key => ({
          name: key,
          jumlah: counts[key]
        }))
        .sort((a, b) => b.jumlah - a.jumlah);

      setDataStatistik(formattedData);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analisis & Statistik Laporan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualisasi data laporan ikan tidak layak konsumsi berdasarkan wilayah.
      </Typography>

      <Grid container spacing={3}>
        
        {/* ================= BARIS 1: Angka Ringkasan & Grafik Lingkaran ================= */}
        
        {/* Kolom Kiri: Ringkasan Angka */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ backgroundColor: '#1976d2', color: 'white', height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 1, borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Total Laporan Masuk</Typography>
              <Typography variant="h1" fontWeight="bold" sx={{ my: 2 }}>{totalLaporan}</Typography>
              <Typography variant="body2">Laporan dari seluruh wilayah</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Kolom Kanan: Grafik Lingkaran (Donut) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3, height: 420, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">Distribusi Lokasi Laporan</Typography>
            
            {/* Box container diatur flex-row untuk Desktop agar pie dan legend sebelahan */}
            <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
              
              {/* AREA 1: PIE CHART (Kiri di Desktop) */}
              <Box sx={{ height: { xs: '55%', md: '100%' }, width: { xs: '100%', md: '50%' }, minHeight: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataStatistik}
                      cx="50%"
                      cy="50%"
                      innerRadius={55} 
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="jumlah"
                      labelLine={false}
                      label={false} 
                    >
                      {dataStatistik.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Laporan`, 'Jumlah Laporan']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* AREA 2: CUSTOM LEGEND (Kanan di Desktop) */}
              <Box 
                sx={{ 
                  height: { xs: '45%', md: '100%' }, 
                  width: { xs: '100%', md: '50%' },
                  overflowY: 'auto', 
                  mt: { xs: 2, md: 0 },
                  pl: { xs: 0, md: 2 },
                  pr: 1,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bdbdbd', borderRadius: '4px' }
                }}
              >
                {dataStatistik.map((entry, index) => {
                  const persentase = totalLaporan > 0 
                    ? ((entry.jumlah / totalLaporan) * 100).toFixed(1) 
                    : 0;

                  return (
                    <Stack key={index} direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                      <Typography 
                        variant="caption" 
                        noWrap 
                        title={entry.name} 
                        sx={{ flexGrow: 1, color: 'text.secondary' }}
                      >
                        {entry.name}
                      </Typography>
                      <Typography variant="caption" fontWeight="bold" sx={{ flexShrink: 0 }}>
                        {entry.jumlah} ({persentase}%)
                      </Typography>
                    </Stack>
                  );
                })}
                {dataStatistik.length === 0 && (
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    Belum ada data lokasi
                  </Typography>
                )}
              </Box>

            </Box>
          </Paper>
        </Grid>

        {/* ================= BARIS 2: Grafik Batang Full Width ================= */}
        
        {/* Kolom Lebar Penuh: Grafik Batang */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">Grafik Batang Wilayah Pelaporan</Typography>
            <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataStatistik} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    // Teks lebih panjang karena kanvasnya lebih luas (full width)
                    tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f5f5f5' }} />
                  <Bar dataKey="jumlah" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={50}>
                    {/* Opsional: Mewarnai batang sesuai dengan warna di Pie Chart */}
                    {dataStatistik.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
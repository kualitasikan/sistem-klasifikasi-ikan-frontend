import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Stack 
} from '@mui/material';
import { 
  Assignment, NotificationsActive, People, History 
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../supabase';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalLaporan: 0,
    totalUser: 0,
    totalAlarm: 0,
    laporanHariIni: 0
  });
  const [chartData, setChartData] = useState([]);
  const [lokasiData, setLokasiData] = useState([]); 
  const user = JSON.parse(localStorage.getItem('user'));

  // Palet warna untuk Pie Chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#e91e63', '#9c27b0', '#3f51b5', '#009688', '#4caf50', 
    '#ffeb3b', '#795548', '#607d8b'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Ambil Total Laporan, Total User, Total Alarm
      const { count: countLaporan } = await supabase.from('laporan').select('*', { count: 'exact', head: true });
      const { count: countUser } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: countAlarm } = await supabase.from('log_alarm').select('*', { count: 'exact', head: true });

      const todayDate = new Date().toISOString().split('T')[0];
      const { count: countToday } = await supabase
        .from('laporan')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayDate}T00:00:00Z`);

      setStats({
        totalLaporan: countLaporan || 0,
        totalUser: countUser || 0,
        totalAlarm: countAlarm || 0,
        laporanHariIni: countToday || 0
      });

      // 2. Ambil Data untuk Grafik Tren (7 Hari Terakhir)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const { data: rawLaporan, error } = await supabase
        .from('laporan')
        .select('created_at, lokasi_alamat') 
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // 3. Proses Grouping Data per Hari untuk Grafik Tren (Area Chart)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        
        const count = rawLaporan.filter(item => item.created_at.startsWith(dateString)).length;
        
        last7Days.push({
          day: dayName,
          fullDate: dateString,
          jumlah: count
        });
      }
      setChartData(last7Days);

      // 4. Proses Grouping Data per Lokasi untuk Pie Chart
      const { data: allLokasi } = await supabase.from('laporan').select('lokasi_alamat');
      if (allLokasi) {
        const counts = allLokasi.reduce((acc, curr) => {
          const lokasi = curr.lokasi_alamat;
          acc[lokasi] = (acc[lokasi] || 0) + 1;
          return acc;
        }, {});

        // Mengurutkan data dari jumlah terbanyak agar pie chart lebih proporsional
        const formattedData = Object.keys(counts)
          .map(key => ({
            name: key,
            jumlah: counts[key]
          }))
          .sort((a, b) => b.jumlah - a.jumlah);

        setLokasiData(formattedData);
      }

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    }
  };

  const statCards = [
    { title: 'Total Laporan', value: stats.totalLaporan, icon: <Assignment fontSize="large" />, color: '#1976d2' },
    { title: 'Laporan Hari Ini', value: stats.laporanHariIni, icon: <History fontSize="large" />, color: '#2e7d32' },
    { title: 'Alarm Terdeteksi', value: stats.totalAlarm, icon: <NotificationsActive fontSize="large" />, color: '#d32f2f' },
    { title: 'Total Pengguna', value: stats.totalUser, icon: <People fontSize="large" />, color: '#ed6c02' },
  ];

  // FITUR BARU: Menghitung total seluruh laporan lokasi untuk rumus persentase
  const totalLaporanLokasi = lokasiData.reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Ringkasan Sistem
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Selamat datang kembali, <strong>{user?.nama_lengkap}</strong>. Berikut adalah ringkasan data pemantauan kualitas ikan.
      </Typography>

      {/* Baris Kartu Statistik */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card elevation={3} sx={{ borderLeft: `6px solid ${card.color}`, borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, opacity: 0.8 }}>
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Baris Grafik */}
      <Grid container spacing={3}>
        
        {/* KOLOM KIRI: Grafik Tren Area (Lebar 8) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3, height: 420, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tren Laporan Ikan Tidak Layak (Minggu Ini)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorJumlah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="jumlah" 
                  stroke="#1976d2" 
                  fillOpacity={1} 
                  fill="url(#colorJumlah)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* KOLOM KANAN: Grafik Lingkaran Distribusi Lokasi (Lebar 4) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, height: 420, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
              Distribusi Lokasi Laporan
            </Typography>
            
            <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* AREA 1: PIE CHART (Donut Style, Tanpa Label Eksternal) */}
              <Box sx={{ height: '55%', minHeight: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lokasiData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45} 
                      outerRadius={75}
                      paddingAngle={3} 
                      dataKey="jumlah"
                      labelLine={false} 
                      label={false}     
                    >
                      {lokasiData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Laporan`, 'Jumlah Laporan']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* AREA 2: CUSTOM LEGEND DENGAN PERSENTASE */}
              <Box 
                sx={{ 
                  height: '45%', 
                  overflowY: 'auto', 
                  mt: 2, 
                  pr: 1,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bdbdbd', borderRadius: '4px' }
                }}
              >
                {lokasiData.map((entry, index) => {
                  // Hitung persentase untuk setiap baris
                  const persentase = totalLaporanLokasi > 0 
                    ? ((entry.jumlah / totalLaporanLokasi) * 100).toFixed(1) 
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
                      {/* Menampilkan Jumlah Laporan beserta Persentasenya */}
                      <Typography variant="caption" fontWeight="bold" sx={{ flexShrink: 0 }}>
                        {entry.jumlah} ({persentase}%)
                      </Typography>
                    </Stack>
                  );
                })}
                {lokasiData.length === 0 && (
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    Belum ada data lokasi
                  </Typography>
                )}
              </Box>

            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
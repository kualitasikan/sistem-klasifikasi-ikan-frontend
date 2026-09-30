import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, CircularProgress, 
  TextField, Alert, Chip, LinearProgress, Stack, Tooltip, Grid,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Fade, Paper, Tabs, Tab
} from '@mui/material';
import { 
  Wifi as WifiIcon, 
  WifiOff as WifiOffIcon, 
  CheckCircle as CheckCircleIcon,
  Sensors as SensorsIcon,
  Lock as LockIcon,
  DeveloperBoard as BoardIcon
} from '@mui/icons-material';

import { supabase } from '../../supabase';

const DEVICE_1 = 'ESP32-SIDAK-01'; 
const DEVICE_2 = 'ESP32-SENSOR-02'; 

export default function WifiManager() {
  const [tabIndex, setTabIndex] = useState(0); 
  const currentDeviceId = tabIndex === 0 ? DEVICE_1 : DEVICE_2;

  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [password, setPassword] = useState('');
  
  const [rawDeviceStatus, setRawDeviceStatus] = useState('Mengecek...');
  const [isOnline, setIsOnline] = useState(false);
  
  const [connectionMessage, setConnectionMessage] = useState(null);

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('iot_config')
      .select('*')
      .eq('device_id', currentDeviceId)
      .single();

    if (data) {
      setRawDeviceStatus(data.connection_status || 'Status Tidak Diketahui');
      setNetworks(data.scan_results || []);
      
      if (data.last_seen) {
        const lastSeenTime = new Date(data.last_seen).getTime();
        const currentTime = new Date().getTime();
        const differenceInSeconds = (currentTime - lastSeenTime) / 1000;

        if (differenceInSeconds > 15) {
          setIsOnline(false);
        } else {
          setIsOnline(true);
        }
      } else {
        setIsOnline(false); 
      }
      
      if (data.command === 'IDLE' && isScanning) {
        setIsScanning(false);
      }
    } else {
      // SELF HEALING: Jika baris belum ada di database, daftarkan otomatis!
      if (error && error.code === 'PGRST116') {
         await supabase.from('iot_config').insert([{
           device_id: currentDeviceId,
           command: 'IDLE',
           connection_status: 'DISCONNECTED',
           scan_results: []
         }]);
      }
      setRawDeviceStatus('Mendaftarkan alat ke database...');
      setIsOnline(false);
      setNetworks([]);
    }
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 3000);
    return () => clearInterval(interval);
  }, [currentDeviceId, isScanning]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setIsScanning(false);
    setNetworks([]);
    setSelectedSsid('');
    setPassword('');
    setRawDeviceStatus('Mengecek...');
    setIsOnline(false);
    setConnectionMessage(null);
  };

  const handleScanClick = async () => {
    setIsScanning(true);
    setConnectionMessage(null); 
    setNetworks([]); 
    setSelectedSsid(''); 
    await supabase
      .from('iot_config')
      .update({ command: 'SCAN', scan_results: [] })
      .eq('device_id', currentDeviceId);
  };

  const handleConnectClick = async () => {
    if (!selectedSsid || !password) return;
    
    setConnectionMessage('Mengirim perintah koneksi ke ESP32...');
    
    if(isOnline) {
       setRawDeviceStatus('MENYAMBUNGKAN...');
    }

    await supabase
      .from('iot_config')
      .update({ 
        command: 'CONNECT', 
        target_ssid: selectedSsid, 
        target_pass: password,
        connection_status: isOnline ? 'MENYAMBUNGKAN...' : rawDeviceStatus
      })
      .eq('device_id', currentDeviceId);
      
    setPassword(''); 
  };

  const finalDisplayStatus = isOnline ? rawDeviceStatus : 'PERANGKAT OFFLINE (MATI)';
  const isConnected = isOnline && rawDeviceStatus === 'BERHASIL TERHUBUNG';
  const isConnecting = isOnline && rawDeviceStatus === 'MENYAMBUNGKAN...';

  const renderSignalBars = (rssi) => {
    let bars = 1;
    if (rssi >= -60) bars = 4;
    else if (rssi >= -70) bars = 3;
    else if (rssi >= -80) bars = 2;

    return (
      <Tooltip title={`Sinyal: ${rssi} dBm`} placement="top">
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 20, gap: 0.5 }}>
          {[1, 2, 3, 4].map((bar) => (
            <Box 
              key={bar} 
              sx={{ 
                width: 4, 
                height: bar * 5, 
                backgroundColor: bar <= bars ? '#1976d2' : '#e0e0e0',
                borderRadius: 1
              }} 
            />
          ))}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Jaringan & Konektivitas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Kelola sambungan WiFi untuk perangkat IoT secara nirkabel.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ mb: 4, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ '& .MuiTab-root': { py: 2, fontWeight: 'bold', fontSize: '1rem' } }}
        >
          <Tab icon={<BoardIcon />} iconPosition="start" label="ALAT 1 : SIRINE ALARM" />
          <Tab icon={<SensorsIcon />} iconPosition="start" label="ALAT 2 : SENSOR VALIDASI" />
        </Tabs>
      </Paper>

      <Grid container spacing={4}>
        
        {/* KOLOM KIRI */}
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={3}>
            
            {/* Card Status */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {isConnecting && <LinearProgress color="warning" />}
              <CardContent sx={{ p: 4 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                  Status Modul ({currentDeviceId})
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: '50%', 
                    backgroundColor: !isOnline ? '#fee2e2' : (isConnected ? '#dcfce7' : (isConnecting ? '#fef08a' : '#f1f5f9')),
                    color: !isOnline ? '#ef4444' : (isConnected ? '#16a34a' : (isConnecting ? '#ca8a04' : '#64748b'))
                  }}>
                    {!isOnline ? <WifiOffIcon fontSize="large" /> : (isConnected ? <CheckCircleIcon fontSize="large" /> : (isConnecting ? <SensorsIcon fontSize="large" /> : <WifiOffIcon fontSize="large" />))}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: !isOnline ? '#ef4444' : '#0f172a' }}>
                      {finalDisplayStatus}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Respon Terakhir: {isOnline ? 'Saat ini' : 'Terputus'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Card Tombol Scan */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', opacity: !isOnline ? 0.6 : 1 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <SensorsIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Pemindaian Radar
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Perintahkan <b>{tabIndex === 0 ? 'Alat Alarm' : 'Alat Sensor'}</b> untuk memindai jaringan WiFi yang tersedia di sekitarnya.
                </Typography>
                
                <Button 
                  fullWidth
                  variant="contained" 
                  size="large"
                  disableElevation
                  startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <WifiIcon />}
                  onClick={handleScanClick}
                  disabled={isScanning || !isOnline} 
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    backgroundColor: '#2563eb',
                    '&:hover': { backgroundColor: '#1d4ed8' }
                  }}
                >
                  {!isOnline ? 'Alat Offline' : (isScanning ? 'Proses Memindai...' : 'Mulai Pindai WiFi')}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* KOLOM KANAN */}
        <Grid item xs={12} md={7} lg={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', height: '100%', opacity: !isOnline ? 0.6 : 1 }}>
            <CardContent sx={{ p: 0 }}>
              
              <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Jaringan Tersedia ({tabIndex === 0 ? 'Alat 1' : 'Alat 2'})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {!isOnline 
                    ? 'Alat sedang tidak aktif. Nyalakan alat untuk memindai.' 
                    : (networks.length > 0 ? `Ditemukan ${networks.length} jaringan.` : 'Klik tombol pindai di panel kiri untuk mencari jaringan.')}
                </Typography>
              </Box>

              {isScanning && (
                <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={50} thickness={4} />
                  <Typography variant="body1" color="text.secondary">
                    ESP32 sedang mencari sinyal, mohon tunggu...
                  </Typography>
                </Box>
              )}

              {!isScanning && networks.length > 0 && isOnline && (
                <Fade in={!isScanning}>
                  <Box>
                    <List sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      {networks.map((net, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                          <ListItemButton 
                            selected={selectedSsid === net.ssid}
                            onClick={() => setSelectedSsid(net.ssid)}
                            sx={{ 
                              borderRadius: 2, 
                              border: '1px solid',
                              borderColor: selectedSsid === net.ssid ? '#3b82f6' : '#f1f5f9',
                              backgroundColor: selectedSsid === net.ssid ? '#eff6ff' : 'transparent',
                              '&:hover': { backgroundColor: '#f8fafc' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <ListItemIcon>
                              {renderSignalBars(net.rssi)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={net.ssid} 
                              primaryTypographyProps={{ fontWeight: selectedSsid === net.ssid ? 700 : 500 }}
                            />
                            {selectedSsid === net.ssid && (
                              <Chip size="small" label="Terpilih" color="primary" sx={{ fontWeight: 600 }} />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>

                    {selectedSsid && (
                      <Fade in={Boolean(selectedSsid)}>
                        <Paper elevation={0} sx={{ p: 4, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#334155' }}>
                            Otentikasi untuk "{selectedSsid}"
                          </Typography>
                          
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Masukkan Password WiFi"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                  startAdornment: <LockIcon sx={{ color: 'action.active', mr: 1 }} />,
                                  sx: { borderRadius: 3, backgroundColor: '#ffffff' }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Button 
                                fullWidth 
                                variant="contained" 
                                color="success"
                                size="large"
                                onClick={handleConnectClick}
                                disabled={!password || isConnecting}
                                disableElevation
                                sx={{ borderRadius: 3, py: 1.8, fontWeight: 700, textTransform: 'none' }}
                              >
                                Hubungkan
                              </Button>
                            </Grid>
                          </Grid>

                          {connectionMessage && (
                            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                              {connectionMessage}
                            </Alert>
                          )}
                        </Paper>
                      </Fade>
                    )}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
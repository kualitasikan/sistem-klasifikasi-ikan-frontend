import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { supabase } from '../../supabase'; 
import toast from 'react-hot-toast';
import MonitorPanel from './MonitorPanel';
import RiwayatPanel from './RiwayatPanel';

export default function ValidasiSensor({ userRole }) {
  const [sensorData, setSensorData] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [isResetting, setIsResetting] = useState(false); 
  const [namaPetugas, setNamaPetugas] = useState('Petugas Anonim');

  const isAdmin = userRole === 'Admin' || window.location.pathname.includes('/admin');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData?.nama_lengkap) setNamaPetugas(userData.nama_lengkap);
    }
  }, []);

  useEffect(() => {
    fetchLatestData();
    fetchRiwayat();
    checkDeviceStatus();

    const sensorSubscription = supabase
      .channel('realtime-sensor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_validasi' }, (payload) => {
        setSensorData(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sensor_validasi' }, (payload) => {
        setSensorData(payload.new);
      })
      .subscribe();

    const timerInterval = setInterval(() => checkDeviceStatus(), 3000);

    return () => {
      supabase.removeChannel(sensorSubscription);
      clearInterval(timerInterval);
    };
  }, []);

  const checkDeviceStatus = async () => {
    const { data, error } = await supabase.from('sensor_validasi').select('created_at').order('created_at', { ascending: false }).limit(1).single();
    if (!error && data?.created_at) {
      const isOnline = (new Date().getTime() - new Date(data.created_at).getTime()) <= 35000;
      setIsDeviceOnline(isOnline);
    } else {
      setIsDeviceOnline(false); 
    }
  };

  const fetchLatestData = async () => {
    const { data, error } = await supabase.from('sensor_validasi').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (!error && data) setSensorData(data);
  };

  const fetchRiwayat = async () => {
    const { data, error } = await supabase.from('riwayat_validasi').select('*').order('waktu_rekam', { ascending: false });
    if (!error && data) setRiwayat(data);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const refreshToast = toast.loading('Memperbarui data...');
    try {
      await fetchLatestData();
      await fetchRiwayat();
      await checkDeviceStatus();
      toast.success('Data berhasil diperbarui!', { id: refreshToast });
    } catch (error) {
      toast.error('Gagal memperbarui data.', { id: refreshToast });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoteReset = async () => {
    if (!isDeviceOnline) return toast.error('Alat sedang offline. Tidak bisa mengirim perintah reset.');
    setIsResetting(true);
    const resetToast = toast.loading('Mengirim perintah reset ke alat...');
    try {
      const { data, error } = await supabase.from('iot_config').update({ command: 'RESET_KALIBRASI' }).eq('device_id', 'ESP32-SENSOR-02').select(); 
      if (error) throw error;
      if (data?.length === 0) {
          await supabase.from('iot_config').insert([{ device_id: 'ESP32-SENSOR-02', command: 'RESET_KALIBRASI', connection_status: 'BERHASIL TERHUBUNG' }]);
      }
      toast.success('Perintah reset terkirim!', { id: resetToast });
    } catch (error) {
      toast.error(`Gagal: ${error.message}`, { id: resetToast });
    } finally {
      setIsResetting(false);
    }
  };

  // -----------------------------------------------------
  // TAHAP 1: Kirim Foto, Proses AI & Tampilkan Hasilnya
  // -----------------------------------------------------
  const handleAnalisaAI = async (imageFile) => {
    setIsSaving(true);
    const loadingToast = toast.loading('Memproses CNN dan Random Forest secara pararel...');

    try {
      const formDataImage = new FormData();
      formDataImage.append('file', imageFile); 
      const payloadSensor = { MQ1: parseFloat(sensorData.nilai_mq135), TGS1: parseFloat(sensorData.nilai_mq137) };

      const [cnnResponse, rfResponse] = await Promise.all([
        fetch("https://project-skripsi-klasifikasi-ikan-api.hf.space/predict", { method: 'POST', body: formDataImage }),
        fetch("https://project-skripsi-klasifikasi-ikan-api.hf.space/api/sensor", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadSensor) })
      ]);

      const cnnData = await cnnResponse.json();
      const rfData = await rfResponse.json();

      if (!cnnData.success) { toast.error(`Ditolak CNN: ${cnnData.message}`, { id: loadingToast, style: { border: '2px solid #ef4444' } }); setIsSaving(false); return; }
      if (!rfData.success) { toast.error(`Ditolak RF: ${rfData.message}`, { id: loadingToast }); setIsSaving(false); return; }

      toast.loading('Menghitung Algoritma Decision Fusion...', { id: loadingToast });

      const statusCNN = cnnData.status; 
      const statusRF = rfData.status_kesegaran; 
      let hasilKesegaranAI = "Tidak Diketahui";

      if (statusCNN === statusRF) hasilKesegaranAI = statusCNN;
      else if (statusCNN === "Busuk" || statusRF === "Busuk") hasilKesegaranAI = "Busuk";
      else hasilKesegaranAI = "Kurang Segar"; 

      toast.loading('Mengirim Hasil AI ke Layar ESP32...', { id: loadingToast });

      const { error: errUpdate1 } = await supabase.from('sensor_validasi').update({ hasil_ai: hasilKesegaranAI }).eq('id', sensorData.id);
      if (errUpdate1) throw errUpdate1;

      const { error: errUpdate2 } = await supabase.from('iot_config').update({ command: `RESULT:${hasilKesegaranAI}` }).eq('device_id', 'ESP32-SENSOR-02');
      if (errUpdate2) throw errUpdate2;

      toast.success(`Analisa Selesai: ${hasilKesegaranAI}! Silakan isi lokasi dan Simpan Data.`, { id: loadingToast, style: { border: '2px solid #10b981', padding: '16px', fontWeight: 'bold' } });
      
    } catch (error) {
      toast.error(`Gagal memproses AI: ${error.message || 'Cek console'}`, { id: loadingToast });
      console.error("Fusion Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------------------------
  // TAHAP 2: Merekam Seluruh Data (Sensor, Lokasi & Hasil) ke Riwayat
  // -----------------------------------------------------
  const handleSimpanData = async (lokasiInput, resetFormCallback) => {
    setIsSaving(true);
    const saveToast = toast.loading('Menyimpan data ke Riwayat...');

    try {
      // PERBAIKAN: Menambahkan 'const { error }' untuk menangkap pesan error asli dari Supabase
      const { error } = await supabase.from('riwayat_validasi').insert([{
        suhu: sensorData.suhu, 
        kelembapan: sensorData.kelembapan, 
        nilai_mq135: sensorData.nilai_mq135,
        nilai_mq137: sensorData.nilai_mq137, 
        nilai_ze08: sensorData.nilai_ze08, 
        nilai_bme_gas: sensorData.nilai_bme_gas,
        status_ikan: sensorData.hasil_ai, 
        lokasi_alamat: lokasiInput, 
        nama_petugas: namaPetugas 
      }]);

      if (error) throw error; // Jika ada error di Supabase, lemparkan ke blok catch!

      toast.success('Data riwayat berhasil disimpan!', { id: saveToast, style: { border: '2px solid #10b981' } });
      resetFormCallback();
      fetchRiwayat(); 
    } catch (error) {
      toast.error(`Gagal menyimpan data: ${error.message}`, { id: saveToast });
      console.error("Save Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!sensorData) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Menunggu koneksi dari alat ESP32 di lapangan...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <MonitorPanel 
        sensorData={sensorData} 
        isDeviceOnline={isDeviceOnline} 
        namaPetugas={namaPetugas}
        isSaving={isSaving}
        isRefreshing={isRefreshing}
        isResetting={isResetting}
        onAnalisaAI={handleAnalisaAI}
        onSimpanData={handleSimpanData}
        onReset={handleRemoteReset}
        onRefresh={handleManualRefresh}
      />
      <RiwayatPanel 
        riwayat={riwayat} 
        isAdmin={isAdmin} 
        onRefreshRiwayat={fetchRiwayat} 
      />
    </Box>
  );
}
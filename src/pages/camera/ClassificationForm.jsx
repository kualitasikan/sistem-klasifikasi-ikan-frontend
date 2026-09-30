import { useState, useRef, useEffect } from 'react';
import { Paper } from '@mui/material';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast'; 

// Import komponen UI yang sudah dipisah
import CameraSection from './components/CameraSection';
import ClassificationResult from './components/ClassificationResult';
import ReportForm from './components/ReportForm';

export default function ClassificationForm() {
  const API_BASE_URL = "https://project-skripsi-klasifikasi-ikan-api.hf.space";
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState(null); 
  const [jenisIkan, setJenisIkan] = useState(null); 
  const [confidence, setConfidence] = useState(null); 
  const [layakKonsumsi, setLayakKonsumsi] = useState(null); 
  
  // State Kamera, Flash & Lokasi GPS
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isFlashOn, setIsFlashOn] = useState(false); 

  const [koordinat, setKoordinat] = useState({ lat: null, lng: null });
  const [loadingLokasi, setLoadingLokasi] = useState(false);

  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    ambilLokasiOtomatis();
    return () => matikanKamera();
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // ==========================================
  // LOGIKA GPS, REVERSE GEOCODING, KAMERA & API AI 
  // ==========================================
  const ambilLokasiOtomatis = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung fitur deteksi GPS.");
      return;
    }
    setLoadingLokasi(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setKoordinat({ lat, lng });
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setLokasi(data.display_name);
          } else {
            setLokasi(`Titik Koordinat: ${lat}, ${lng}`);
          }
        } catch (error) {
          console.error("Gagal reverse geocoding:", error);
          setLokasi(`Titik Koordinat: ${lat}, ${lng}`);
        }

        setLoadingLokasi(false);
        toast.success("Lokasi GPS berhasil dikunci!", { position: 'bottom-right' });
      },
      (error) => {
        setLoadingLokasi(false);
        if (error.code === 1) { 
          console.warn("Peringatan: Izin lokasi (GPS) ditolak oleh browser.");
          toast.error("Izin GPS ditolak! Klik ikon gembok di URL bar browser lalu izinkan 'Location'.", { duration: 6000 });
        } else {
          toast.error("Gagal mendeteksi lokasi. Pastikan GPS perangkat Anda aktif.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const nyalakanKamera = async (mode = facingMode) => {
    setResult(null); setPreview(null);
    setIsFlashOn(false); 
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode }, 
        audio: false 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setFacingMode(mode);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Izin Kamera Ditolak! Klik ikon gembok di browser lalu izinkan 'Camera'.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error("Tidak ada hardware kamera yang terdeteksi di perangkat ini.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error("Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain lalu coba lagi.");
      } else {
        toast.error("Terjadi kesalahan saat mencoba mengakses kamera.");
      }
    }
  };

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities();
      if (!capabilities.torch) {
        toast.error("Perangkat atau browser Anda tidak mendukung kontrol lampu flash.");
        return;
      }

      const nextState = !isFlashOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsFlashOn(nextState);
    } catch (err) {
      console.error("Gagal mengubah status flash:", err);
      toast.error("Gagal mengaktifkan hardware lampu kilat.");
    }
  };

  const gantiKamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    nyalakanKamera(newMode);
  };

  const matikanKamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsFlashOn(false); 
    setIsCameraOpen(false);
  };

  const ambilFotoDariStream = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const fileFoto = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImage(fileFoto);
        setPreview(URL.createObjectURL(fileFoto));
        matikanKamera();
        toast.success("Foto ikan berhasil ditangkap!");
      }
    }, 'image/jpeg');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      matikanKamera(); setImage(file); setPreview(URL.createObjectURL(file));
      setResult(null); setJenisIkan(null); setConfidence(null); setLayakKonsumsi(null); setSubmitStatus(null);
      toast.success('Foto dari file lokal berhasil dimuat!');
    }
  };

  const handleClassify = async () => {
    if (!image) return;
    setIsClassifying(true);
    const loadingToast = toast.loading('AI sedang memindai validasi gambar...');

    try {
      const formData = new FormData();
      formData.append('file', image); 
      
      const response = await fetch(`${API_BASE_URL}/predict`, { 
        method: 'POST', 
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData 
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal terhubung ke server AI');
      }

      setResult(data.status); setJenisIkan(data.jenis_ikan); 
      setConfidence(data.confidence); setLayakKonsumsi(data.layak_konsumsi); 
      toast.dismiss(loadingToast);

      if (data.layak_konsumsi) {
        toast.success(`Selesai! Ikan terdeteksi Segar dengan akurasi ${data.confidence}.`, { duration: 4000 });
      } else {
        toast.error(`Awas! Ikan terdeteksi ${data.status.toUpperCase()} dengan akurasi ${data.confidence}.`, { duration: 4000 });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message, { 
        duration: 7000, 
        style: { border: '2px solid #d32f2f', padding: '16px', color: '#d32f2f', fontWeight: 'bold' },
        icon: '🚫'
      });
    } finally {
      setIsClassifying(false);
    }
  };

  // ===========================================================================
  // FUNGSI NOTIFIKASI ALARM & WHATSAPP (TELAH DIPERBARUI)
  // ===========================================================================
  const triggerAlarmDini = async (lokasiKejadian, logId) => {
    try {
      let statusWa = 'Gagal (Nomor tidak ada)';
      const { data: daftarPenerima } = await supabase.from('pengaturan_notifikasi').select('nomor_whatsapp').eq('status_notif', true);
      
      if (daftarPenerima && daftarPenerima.length > 0) {
        const tokenWA = import.meta.env.VITE_FONNTE_TOKEN;
        
        const jam = new Date().getHours();
        let sapaanWaktu = 'Selamat Pagi';
        if (jam >= 11 && jam <= 14) {
          sapaanWaktu = 'Selamat Siang';
        } else if (jam >= 15 && jam <= 18) {
          sapaanWaktu = 'Selamat Sore';
        } else if (jam >= 19 || jam < 4) {
          sapaanWaktu = 'Selamat Malam';
        }

        // 1. Fetch 3 laporan terakhir dari Supabase berdasarkan lokasi
        const { data: laporanTerakhir } = await supabase
          .from('laporan')
          .select('created_at, keterangan')
          .eq('lokasi_alamat', lokasiKejadian)
          .order('created_at', { ascending: false })
          .limit(3);

        // 2. Format hasil laporan menjadi teks bersusun
        let rincianLaporan = '';
        if (laporanTerakhir && laporanTerakhir.length > 0) {
          laporanTerakhir.forEach((lap, idx) => {
            // Karena laporan diurutkan dari yang terbaru (desc), laporan index 0 adalah laporan ke-3
            rincianLaporan += `\n*--- LAPORAN ${idx + 1} ---*\n`;
            rincianLaporan += `Waktu: *${new Date(lap.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}*\n`;
            rincianLaporan += `Detail Keterangan: *${lap.keterangan || 'Tidak ada catatan'}*\n`;
          });
        } else {
          rincianLaporan = `\n(Data rincian sedang diproses oleh sistem)\n`;
        }

        // 3. Masukkan ke dalam template pesan tanpa variabel jenis ikan
        const pesan = `⚠️ *PERINGATAN DINI SISTEM* ⚠️\n${sapaanWaktu}\n\nKepada dinas terkait, saat ini terdeteksi 3 laporan ikan tidak layak konsumsi di lokasi yang sama dengan rincian sebagai berikut:\n\nLokasi: *${lokasiKejadian}*\n${rincianLaporan}\n\nAlarm hardware di kantor telah diaktifkan.\nMohon segera lakukan tindak lanjut.\nTerima kasih.`;
        
        const targetNumbers = daftarPenerima.map(p => p.nomor_whatsapp).join(',');
        
        const formData = new FormData();
        formData.append('target', targetNumbers);
        formData.append('message', pesan);
        
        try {
          const waResponse = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { 'Authorization': tokenWA }, body: formData });
          const waResult = await waResponse.json();
          if (waResult.status) {
            statusWa = `Terkirim ke ${daftarPenerima.length} nomor`;
            toast.success('Notifikasi peringatan WhatsApp telah dikirim ke dinas!');
          } else {
            statusWa = 'Gagal (Dari API Fonnte)';
          }
        } catch (fetchError) { statusWa = 'Gagal (Koneksi Putus)'; }
      }

      await supabase.from('log_alarm').update({ status_wa: statusWa }).eq('id_log', logId);
      
      toast.error(`⚠️ SIRINE ALARM DINAS AKTIF!\nTerdeteksi lonjakan 3 laporan di ${lokasiKejadian}`, { duration: 10000, style: { border: '2px solid red', padding: '16px', color: '#d32f2f', fontWeight: 'bold' }, icon: '🚨' });
    } catch (error) {
      toast.error("Gagal mengirim notifikasi WhatsApp otomatis.");
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const submitToast = toast.loading('Mengunggah laporan dan data koordinat GPS...');

    try {
      const fileName = `${Math.random()}.${image.name.split('.').pop()}`;
      await supabase.storage.from('foto_ikan').upload(`public/${fileName}`, image);
      const { data: { publicUrl } } = supabase.storage.from('foto_ikan').getPublicUrl(`public/${fileName}`);

      await supabase.from('laporan').insert([{
          foto_ikan: publicUrl, jenis_ikan: jenisIkan, lokasi_alamat: lokasi,
          latitude: koordinat.lat, longitude: koordinat.lng, 
          keterangan: `${keterangan} (Hasil Deteksi AI: Kualitas ${result} dengan akurasi ${confidence})`,
          status_penanganan: 'Menunggu'
      }]);

      const { data: latestAlarm } = await supabase
        .from('log_alarm')
        .select('*')
        .eq('lokasi_kejadian', lokasi)
        .order('waktu_kejadian', { ascending: false })
        .limit(1);

      let alarmTriggered = false;

      if (latestAlarm && latestAlarm.length > 0) {
        const alarmTime = new Date(latestAlarm[0].waktu_kejadian).getTime();
        const now = Date.now();
        const diffInSeconds = (now - alarmTime) / 1000;

        if (diffInSeconds < 10) {
          alarmTriggered = true;
          // Pemanggilan fungsi diubah menjadi lebih ringkas sesuai parameter baru
          await triggerAlarmDini(lokasi, latestAlarm[0].id_log);
        }
      }

      if (!alarmTriggered) {
        toast.success(`Laporan tercatat di sistem.`);
      }

      setSubmitStatus({ type: 'success', message: 'Laporan Anda telah berhasil masuk ke sistem.' });
      setKeterangan('');
      toast.success('Laporan berhasil dikirim!', { id: submitToast });
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Terjadi kesalahan saat memproses pengiriman laporan.' });
      toast.error('Gagal mengirim laporan!', { id: submitToast });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <>
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center', backgroundColor: '#ffffff' }}>
        <CameraSection 
          isCameraOpen={isCameraOpen} videoRef={videoRef} ambilFotoDariStream={ambilFotoDariStream} 
          matikanKamera={matikanKamera} preview={preview} result={result} 
          confidence={confidence} layakKonsumsi={layakKonsumsi} nyalakanKamera={nyalakanKamera} 
          handleImageChange={handleImageChange} handleClassify={handleClassify} isClassifying={isClassifying} 
          facingMode={facingMode} gantiKamera={gantiKamera} 
          isFlashOn={isFlashOn} toggleFlash={toggleFlash} 
        />
        
        <ClassificationResult 
          result={result} jenisIkan={jenisIkan} layakKonsumsi={layakKonsumsi} confidence={confidence} 
        />
      </Paper>

      {result && !layakKonsumsi && (
        <ReportForm 
          submitStatus={submitStatus} handleSubmitReport={handleSubmitReport} 
          lokasi={lokasi} setLokasi={setLokasi} ambilLokasiOtomatis={ambilLokasiOtomatis} 
          loadingLokasi={loadingLokasi} koordinat={koordinat} 
          keterangan={keterangan} setKeterangan={setKeterangan} isSubmitting={isSubmitting} 
        />
      )}
    </>
  );
}
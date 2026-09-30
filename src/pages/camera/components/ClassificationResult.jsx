import { Box, Typography } from '@mui/material';

export default function ClassificationResult({ result, layakKonsumsi, confidence }) {
  if (!result) return null;

  return (
    <Box sx={{ mt: 4, p: 3, bgcolor: layakKonsumsi ? '#e8f5e9' : '#ffebee', borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" color={layakKonsumsi ? 'green' : '#d32f2f'}>
        Status Kualitas: {result}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        {layakKonsumsi 
          ? `Ikan ini terdeteksi memiliki struktur fisik yang SEGAR dengan validitas ${confidence} sehingga sangat baik dan layak untuk dikonsumsi.` 
          : `Peringatan: Ikan ini teridentifikasi ${result.toUpperCase()} dengan tingkat kepastian ${confidence}. Tidak layak konsumsi, harap laporkan.`}
      </Typography>
    </Box>
  );
}
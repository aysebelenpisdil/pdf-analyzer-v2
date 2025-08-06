import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker'ını ayarla - yerel dosyayı kullan
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * PDF dosyasından metin çıkarma fonksiyonu
 * Bu fonksiyon PDF.js kütüphanesini kullanarak PDF'i sayfa sayfa okur
 * ve tüm metni birleştirir
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Dosyayı ArrayBuffer formatına çevir (PDF.js bu formatı bekler)
    const arrayBuffer = await file.arrayBuffer();
    
    // PDF dosyasını yükle
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF yüklendi. Toplam sayfa sayısı: ${pdf.numPages}`);
    
    let extractedText = '';
    
    // Her sayfayı tek tek işle
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Sayfa ${pageNum} işleniyor...`);
      
      // Sayfayı al
      const page = await pdf.getPage(pageNum);
      
      // Sayfadaki text content'i al
      const textContent = await page.getTextContent();
      
      // Text item'larını birleştir
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      // Sayfa metnini genel metne ekle
      extractedText += pageText + '\n\n';
    }
    
    console.log(`Metin çıkarma tamamlandı. Toplam karakter sayısı: ${extractedText.length}`);
    return extractedText.trim();
    
  } catch (error) {
    console.error('PDF metin çıkarma hatası:', error);
    throw new Error('PDF dosyası işlenirken bir hata oluştu. Dosyanın bozuk olmadığından emin olun.');
  }
};

/**
 * Metnin kalitesini kontrol eden fonksiyon
 * Çok kısa metinleri veya sadece özel karakterlerden oluşan metinleri filtreler
 */
export const validateExtractedText = (text: string): boolean => {
  // Boş veya çok kısa metinleri reddet
  if (!text || text.trim().length < 50) {
    return false;
  }
  
  // Sadece özel karakterlerden oluşan metinleri reddet
  const alphanumericCount = text.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').length;
  const totalLength = text.length;
  
  // En az %30'u alfanumerik karakter olmalı
  return (alphanumericCount / totalLength) >= 0.3;
};
import React, { useState } from 'react';
import './App.css';
import { extractTextFromPDF, validateExtractedText } from './utils/pdfExtractor';
import { extractKeywords, generateSummary, getTextStatistics } from './utils/nlpProcessor';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [textStats, setTextStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Önceki sonuçları temizle
      setExtractedText('');
      setKeywords([]);
      setSummary('');
      setTextStats(null);
    } else {
      alert('Lütfen sadece PDF dosyası seçin!');
    }
  };

  const processPDF = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      console.log('PDF işleniyor...', selectedFile.name);
      
      // 1. PDF'den metin çıkar
      const text = await extractTextFromPDF(selectedFile);
      
      // 2. Çıkarılan metnin kalitesini kontrol et
      if (!validateExtractedText(text)) {
        throw new Error('PDF\'den yeterli metin çıkarılamadı. Dosya metin içermiyor olabilir.');
      }
      
      // 3. Metni state'e kaydet
      setExtractedText(text);
      
      // 4. NLP işlemleri - anahtar kelime çıkarımı
      console.log('Anahtar kelimeler çıkarılıyor...');
      const extractedKeywords = extractKeywords(text, 12);
      setKeywords(extractedKeywords);
      
      // 5. NLP işlemleri - özet oluşturma  
      console.log('Özet oluşturuluyor...');
      const generatedSummary = generateSummary(text, 4);
      setSummary(generatedSummary);
      
      // 6. Metin istatistikleri
      const stats = getTextStatistics(text);
      setTextStats(stats);
      
      console.log('NLP analizi tamamlandı:', {
        keywords: extractedKeywords,
        summaryLength: generatedSummary.length,
        stats
      });
      
      console.log('PDF başarıyla işlendi!');
      
    } catch (error) {
      console.error('PDF işleme hatası:', error);
      alert(error instanceof Error ? error.message : 'PDF işlenirken bir hata oluştu');
      
      // Hata durumunda state'leri temizle
      setExtractedText('');
      setKeywords([]);
      setSummary('');
      setTextStats(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF Analiz Aracı</h1>
        <p>PDF dosyanızı yükleyin ve anahtar kelimeler ile özetini görün</p>
      </header>
      
      <main className="App-main">
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="file-input"
          />
          
          {selectedFile && (
            <div className="file-info">
              <p>Seçilen dosya: <strong>{selectedFile.name}</strong></p>
              <button 
                onClick={processPDF} 
                disabled={isProcessing}
                className="process-button"
              >
                {isProcessing ? 'İşleniyor...' : 'PDF\'i Analiz Et'}
              </button>
            </div>
          )}
        </div>

        {extractedText && (
          <div className="results-container">
            <div className="results-top-section">
              <div className="pdf-info-panel">
                <h3>Belge Bilgileri</h3>
                <div className="pdf-details">
                  <div className="detail-item">
                    <span className="detail-label">Dosya Adı</span>
                    <span className="detail-value">{selectedFile?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dosya Boyutu</span>
                    <span className="detail-value">{selectedFile ? Math.round(selectedFile.size / 1024) : 0} KB</span>
                  </div>
                  {textStats && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Toplam Kelime</span>
                        <span className="detail-value">{textStats.totalWords}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Benzersiz Kelime</span>
                        <span className="detail-value">{textStats.uniqueWords}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Toplam Cümle</span>
                        <span className="detail-value">{textStats.totalSentences}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="keywords-section">
                  <h4>Anahtar Kelimeler</h4>
                  <div className="keywords">
                    {keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="summary-panel">
                <h3>Belge Özeti</h3>
                <p className="summary">{summary}</p>
                
                <div className="text-preview">
                  <h4>Metin Önizlemesi</h4>
                  <div className="extracted-text-container">
                    <p className="extracted-text">
                      {extractedText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {textStats && (
              <div className="analytics-section">
                <h3>Belge Analizleri</h3>
                <div className="analytics-grid">
                  <div className="analytic-card">
                    <div className="analytic-icon">📊</div>
                    <div className="analytic-content">
                      <h4>Kelime Analizi</h4>
                      <p>Ortalama {textStats.averageWordsPerSentence} kelime/cümle</p>
                      <div className="analytic-progress">
                        <div className="progress-bar" style={{width: `${Math.min((textStats.averageWordsPerSentence / 30) * 100, 100)}%`}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="analytic-card">
                    <div className="analytic-icon">📝</div>
                    <div className="analytic-content">
                      <h4>Kelime Çeşitliliği</h4>
                      <p>{Math.round((textStats.uniqueWords / textStats.totalWords) * 100)}% benzersiz kelime</p>
                      <div className="analytic-progress">
                        <div className="progress-bar" style={{width: `${(textStats.uniqueWords / textStats.totalWords) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="analytic-card">
                    <div className="analytic-icon">📖</div>
                    <div className="analytic-content">
                      <h4>Okuma Süresi</h4>
                      <p>Yaklaşık {Math.ceil(textStats.totalWords / 200)} dakika</p>
                      <div className="analytic-progress">
                        <div className="progress-bar" style={{width: '75%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

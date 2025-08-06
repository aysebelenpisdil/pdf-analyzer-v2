// Türkçe stopwords (gereksiz kelimeler) listesi
const TURKISH_STOPWORDS = new Set([
  'acaba', 'ama', 'aslında', 've', 'veya', 'ya', 'yahut', 'ancak', 'fakat', 'lakin', 'ne', 
  'ki', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bir', 'iki', 'üç', 'dört',
  'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'de', 'da', 'den', 'dan', 'e', 'a', 'i',
  'için', 'ile', 'gibi', 'kadar', 'daha', 'en', 'çok', 'az', 'var', 'yok', 'olan', 'olur',
  'bu', 'şu', 'o', 'bunlar', 'şunlar', 'onlar', 'her', 'bazı', 'hiç', 'tüm', 'hep', 'artık',
  'ayrıca', 'böyle', 'şöyle', 'nasıl', 'neden', 'niçin', 'ne', 'kim', 'nerede', 'ne zaman',
  'hangi', 'kaç', 'mi', 'mı', 'mu', 'mü', 'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür'
]);

// İngilizce stopwords listesi
const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'
]);

/**
 * Metni temizler ve normalize eder
 * - Noktalama işaretlerini kaldırır
 * - Küçük harfe çevirir
 * - Fazla boşlukları temizler
 */
export const cleanText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, '') // Türkçe karakterleri koru, diğer noktalama işaretlerini kaldır
    .replace(/\s+/g, ' ') // Fazla boşlukları tek boşluğa çevir
    .trim();
};

/**
 * Metni kelimelere böler ve stopword'leri filtreler
 */
export const tokenizeAndFilter = (text: string): string[] => {
  const words = cleanText(text).split(' ');
  
  return words.filter(word => {
    // Çok kısa kelimeleri filtrele
    if (word.length < 3) return false;
    
    // Stopword kontrolü (hem Türkçe hem İngilizce)
    if (TURKISH_STOPWORDS.has(word) || ENGLISH_STOPWORDS.has(word)) return false;
    
    // Sadece sayılardan oluşan kelimeleri filtrele
    if (/^\d+$/.test(word)) return false;
    
    return true;
  });
};

/**
 * TF-IDF (Term Frequency-Inverse Document Frequency) hesaplama
 * Bu algoritma kelimelerin önemini belirler
 * 
 * TF = (Kelimenin dokümandaki sayısı) / (Dokümandaki toplam kelime sayısı)
 * IDF = log(Toplam doküman sayısı / Kelimeyi içeren doküman sayısı)
 * TF-IDF = TF * IDF
 */
export const calculateTFIDF = (text: string): Array<{word: string, score: number}> => {
  const words = tokenizeAndFilter(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Term Frequency hesaplama
  const wordCounts: { [key: string]: number } = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const totalWords = words.length;
  
  // Inverse Document Frequency hesaplama (cümle bazında)
  const wordDocumentCounts: { [key: string]: number } = {};
  Object.keys(wordCounts).forEach(word => {
    let docCount = 0;
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(word)) {
        docCount++;
      }
    });
    wordDocumentCounts[word] = docCount;
  });
  
  // TF-IDF skorlarını hesapla
  const tfidfScores = Object.keys(wordCounts).map(word => {
    const tf = wordCounts[word] / totalWords;
    const idf = Math.log(sentences.length / (wordDocumentCounts[word] || 1));
    const score = tf * idf;
    
    return { word, score };
  });
  
  // Skora göre azalan sırada sırala
  return tfidfScores.sort((a, b) => b.score - a.score);
};

/**
 * Anahtar kelime çıkarımı
 * TF-IDF skorlarına dayalı olarak en önemli kelimeleri seçer
 */
export const extractKeywords = (text: string, maxKeywords: number = 10): string[] => {
  const tfidfResults = calculateTFIDF(text);
  
  // En yüksek skorlu kelimeleri al
  return tfidfResults
    .slice(0, maxKeywords)
    .map(item => item.word)
    .filter(word => word.length > 2); // Çok kısa kelimeleri filtrele
};

/**
 * Cümle skorlama fonksiyonu
 * Her cümlenin önemini anahtar kelimelere göre hesaplar
 */
export const scoreSentences = (text: string, keywords: string[]): Array<{sentence: string, score: number}> => {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Çok kısa cümleleri filtrele
  
  const keywordSet = new Set(keywords);
  
  return sentences.map(sentence => {
    const sentenceWords = tokenizeAndFilter(sentence);
    
    // Cümledeki anahtar kelime sayısını hesapla
    const keywordCount = sentenceWords.filter(word => keywordSet.has(word)).length;
    
    // Skor = (anahtar kelime sayısı / toplam kelime sayısı) * cümle uzunluğu faktörü
    const lengthFactor = Math.min(sentenceWords.length / 20, 1); // Çok uzun cümleleri cezalandır
    const score = (keywordCount / sentenceWords.length) * lengthFactor;
    
    return { sentence, score };
  });
};

/**
 * Extractive Summarization
 * En önemli cümleleri seçerek özet oluşturur
 */
export const generateSummary = (text: string, maxSentences: number = 3): string => {
  // Önce anahtar kelimeleri bul
  const keywords = extractKeywords(text, 15);
  
  // Cümleleri skorla
  const sentenceScores = scoreSentences(text, keywords);
  
  // En yüksek skorlu cümleleri seç
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .map(item => item.sentence);
  
  // Cümleleri birleştir
  return topSentences.join('. ') + '.';
};

/**
 * Metin istatistikleri
 * Debugging ve analiz için faydalı bilgiler
 */
export const getTextStatistics = (text: string) => {
  const words = tokenizeAndFilter(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const characters = text.length;
  
  return {
    totalWords: words.length,
    uniqueWords: new Set(words).size,
    totalSentences: sentences.length,
    totalCharacters: characters,
    averageWordsPerSentence: Math.round(words.length / sentences.length),
    averageCharactersPerWord: Math.round(characters / words.length)
  };
};
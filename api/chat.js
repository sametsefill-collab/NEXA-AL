
console.log("NEXA-AL CHAT.JS AKTİF - GEMINI 3.1 FLASH LITE");

module.exports = async (req, res) => {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // =========================
  // OPTIONS
  // =========================
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =========================
  // SADECE POST
  // =========================
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST destekleniyor."
    });
  }

  try {
    // =========================
    // API KEY
    // =========================
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY bulunamadı.");

      return res.status(500).json({
        error: "Gemini API anahtarı bulunamadı."
      });
    }

    // =========================
    // GELEN VERİ
    // =========================
    const { message, history = [] } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }

    // =========================
    // KONUŞMA GEÇMİŞİ
    // =========================
    let cleanHistory = [];

    if (Array.isArray(history)) {
      cleanHistory = history
        .filter(item =>
          item &&
          (item.role === "user" || item.role === "model") &&
          Array.isArray(item.parts)
        )
        .map(item => ({
          role: item.role,
          parts: item.parts
            .filter(part =>
              part &&
              typeof part.text === "string"
            )
            .map(part => ({
              text: part.text.slice(0, 6000)
            }))
        }))
        .filter(item => item.parts.length > 0)
        .slice(-30);
    }

    // Aynı role sahip ardışık mesajları birleştir.
    const normalizedHistory = [];

    for (const item of cleanHistory) {
      const previous =
        normalizedHistory[normalizedHistory.length - 1];

      if (previous && previous.role === item.role) {
        previous.parts.push(...item.parts);
      } else {
        normalizedHistory.push({
          role: item.role,
          parts: [...item.parts]
        });
      }
    }

    // Yeni mesaj eklenmeden önce geçmişin sonundaki
    // cevapsız kullanıcı mesajını kaldır.
    if (
      normalizedHistory.length > 0 &&
      normalizedHistory[normalizedHistory.length - 1].role === "user"
    ) {
      normalizedHistory.pop();
    }

    const contents = [
      ...normalizedHistory,
      {
        role: "user",
        parts: [{ text: message.trim().slice(0, 12000) }]
      }
    ];

    // =========================
    // NEXA-AL KİŞİLİĞİ
    // =========================
    const systemInstruction = `
Sen NEXA-AL adlı akıllı dijital asistansın.

DİL VE ÜSLUP:
- Kullanıcıyla Türkçe konuş.
- Samimi, doğal ve anlaşılır ol.
- Gereksiz uzun konuşma.
- Kullanıcının konuşma tarzına uyum sağla.
- Uygun olduğunda hafif esprili ol.
- Sorulan soruya doğrudan cevap ver.

KONUŞMA GEÇMİŞİ VE HAFIZA:
- Sana gönderilen konuşma geçmişini dikkatlice kullan.
- Kullanıcı adını veya kendisiyle ilgili bir bilgiyi geçmişte
  söylediyse ve bilgi mevcut geçmişte bulunuyorsa hatırla.
- Kullanıcı daha önce söylediği bir şeyi tekrar sorarsa
  önce konuşma geçmişinden cevabı bulmaya çalış.
- Geçmişte olmayan bilgileri uydurma.
- Önceki tüm konuşmalara erişimin olduğunu iddia etme.
- Kullanıcıya aynı bilgileri gereksiz yere tekrar sorma.

DOĞRULUK:
- Emin olmadığın bilgileri kesinmiş gibi sunma.
- Güncel bilgiye erişimin yoksa güncelmiş gibi davranma.
- İnternette arama yapmadıysan yaptığını söyleme.
- Kısa sorulara kısa cevap ver.
- Ayrıntı istendiğinde açıklayıcı cevap ver.

Sen NEXA-AL'sın.
`;

    // =========================
    // GEMINI API
    // ÜCRETSİZ KATMAN TESTİ
    // Google Search aracı bilerek kapalı.
    // =========================
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      25000
    );

    let response;

    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                { text: systemInstruction }
              ]
            },
            contents
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    // =========================
    // API CEVABI
    // =========================
    const data = await response.json();

    console.log(
      "Gemini model: gemini-3.1-flash-lite"
    );

    console.log(
      "Gemini HTTP:",
      response.status
    );

    // =========================
    // KOTA HATASI
    // =========================
    if (response.status === 429) {
      console.error(
        "Gemini kota/rate limit:",
        JSON.stringify(data, null, 2)
      );

      return res.status(429).json({
        error:
          "Gemini ücretsiz kullanım sınırına ulaşıldı " +
          "veya mevcut kotada sorun var. Biraz sonra tekrar deneyelim."
      });
    }

    // =========================
    // DİĞER API HATALARI
    // =========================
    if (!response.ok) {
      console.error(
        "Gemini API hatası:",
        JSON.stringify(data, null, 2)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API bağlantısında bir sorun oluştu."
      });
    }

    // =========================
    // CEVABI ÇIKAR
    // =========================
    const reply = data
      ?.candidates?.[0]
      ?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    // =========================
    // BOŞ CEVAP
    // =========================
    if (!reply) {
      console.error(
        "Gemini boş cevap:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        error:
          "NEXA-AL bu istekte cevap oluşturamadı. " +
          "Lütfen tekrar dene."
      });
    }

    // =========================
    // BAŞARILI
    // =========================
    console.log("NEXA-AL cevap oluşturdu.");

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "NEXA-AL sunucu hatası:",
      error
    );

    if (error.name === "AbortError") {
      return res.status(504).json({
        error:
          "Gemini yanıtı zamanında gelmedi. Tekrar deneyelim."
      });
    }

    return res.status(500).json({
      error:
        "NEXA-AL sunucu bağlantısında bir sorun oluştu."
    });
  }
};

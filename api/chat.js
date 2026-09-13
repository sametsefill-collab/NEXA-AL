module.exports = async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST destekleniyor."
    });
  }

  try {

    const { message, history = [] } = req.body || {};

    /* =========================
       API KEY KONTROLÜ
    ========================= */

    if (!process.env.GEMINI_API_KEY) {

      return res.status(500).json({
        error: "GEMINI_API_KEY bulunamadı. Vercel Environment Variables kontrol edilmeli."
      });

    }

    /* =========================
       MESAJ KONTROLÜ
    ========================= */

    if (!message || !message.trim()) {

      return res.status(400).json({
        error: "Mesaj gerekli."
      });

    }

    /* =========================
       GEÇMİŞİ SINIRLA
    ========================= */

    const safeHistory = Array.isArray(history)
      ? history.slice(-20)
      : [];

    /* =========================
       GEMINI İÇERİĞİ
    ========================= */

    const contents = [
      ...safeHistory,
      {
        role: "user",
        parts: [
          {
            text: message.trim()
          }
        ]
      }
    ];

    /* =========================
       GEMINI API
    ========================= */

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({

          system_instruction: {
            parts: [
              {
                text:
                  "Sen NEXA-AL adlı Türkçe konuşan akıllı dijital asistansın. " +
                  "Kullanıcıya Türkçe, samimi, anlaşılır ve faydalı cevaplar ver. " +
                  "Konuşma geçmişini dikkate al. " +
                  "Kullanıcı adını veya daha önce söylediği bilgileri geçmişte görüyorsan hatırla. " +
                  "Kendini NEXA-AL olarak tanıt."
              }
            ]
          },

          contents: contents,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }

        })
      }
    );

    /* =========================
       GEMINI CEVABINI OKU
    ========================= */

    const data = await response.json();

    console.log(
      "Gemini HTTP:",
      response.status
    );

    console.log(
      "Gemini response:",
      JSON.stringify(data)
    );

    /* =========================
       KOTA
    ========================= */

    if (response.status === 429) {

      return res.status(429).json({
        error:
          "Gemini API kotası dolmuş. " +
          "Bir süre beklemek veya Gemini API kota/plan ayarlarını kontrol etmek gerekiyor."
      });

    }

    /* =========================
       API KEY / YETKİ
    ========================= */

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      return res.status(response.status).json({
        error:
          "Gemini API anahtarı geçersiz veya bu API anahtarının Gemini API erişiminde bir sorun var."
      });

    }

    /* =========================
       MODEL / İSTEK HATASI
    ========================= */

    if (!response.ok) {

      const googleError =
        data?.error?.message ||
        "Google bilinmeyen bir hata döndürdü.";

      return res.status(response.status).json({

        error:
          "Gemini API hatası (" +
          response.status +
          "): " +
          googleError

      });

    }

    /* =========================
       CEVABI AL
    ========================= */

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {

      console.error(
        "Gemini cevap üretmedi:",
        JSON.stringify(data)
      );

      return res.status(200).json({
        reply:
          "NEXA-AL şu anda cevap oluşturamadı."
      });

    }

    /* =========================
       BAŞARILI
    ========================= */

    return res.status(200).json({
      reply: reply
    });

  }

  catch (error) {

    console.error(
      "NEXA-AL SUNUCU HATASI:",
      error
    );

    return res.status(500).json({

      error:
        "Sunucuda beklenmeyen bir hata oluştu: " +
        error.message

    });

  }

};

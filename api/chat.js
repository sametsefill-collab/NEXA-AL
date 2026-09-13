module.exports = async (req, res) => {

  // =========================
  // CORS
  // =========================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  // OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  // Sadece POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST destekleniyor."
    });
  }


  try {

    // =========================
    // API KEY KONTROLÜ
    // =========================

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {

      console.error(
        "GEMINI_API_KEY bulunamadı."
      );

      return res.status(500).json({
        error:
          "NEXA-AL yapılandırma hatası: Gemini API anahtarı bulunamadı."
      });

    }


    // =========================
    // GELEN VERİ
    // =========================

    const {
      message,
      history = []
    } = req.body || {};


    if (
      !message ||
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
          (
            item.role === "user" ||
            item.role === "model"
          ) &&
          Array.isArray(item.parts)
        )
        .slice(-20);

    }


    // =========================
    // GEMINI İÇERİĞİ
    // =========================

    const contents = [
      ...cleanHistory,

      {
        role: "user",

        parts: [
          {
            text: message.trim()
          }
        ]
      }
    ];


    // =========================
    // GEMINI 3.6 FLASH
    // =========================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey

        },

        body: JSON.stringify({

          system_instruction: {

            parts: [

              {
                text:
                  "Sen NEXA-AL adlı Türkçe konuşan " +
                  "akıllı dijital asistansın. " +

                  "Kullanıcıya Türkçe, anlaşılır, " +
                  "samimi ve faydalı cevaplar ver. " +

                  "Kullanıcının konuşma geçmişini dikkate al. " +

                  "Önceki mesajlarla bağlantılı sorulara " +
                  "tutarlı cevaplar ver. " +

                  "Kullanıcı adını, tercihlerini veya " +
                  "daha önce söylediği bilgileri " +
                  "konuşma geçmişinde görüyorsan " +
                  "bunları uygun şekilde kullan. " +

                  "Gereksiz yere aynı soruları tekrar sorma. " +

                  "Kısa sorulara gereksiz uzun cevaplar verme. " +

                  "Samimi ama güvenilir bir dijital asistan gibi davran."
              }

            ]

          },

          contents

        })

      }
    );


    // =========================
    // GEMINI CEVABI
    // =========================

    const data =
      await response.json();


    // LOG
    console.log(
      "Gemini HTTP:",
      response.status
    );


    // =========================
    // KOTA / RATE LIMIT
    // =========================

    if (response.status === 429) {

      console.error(
        "Gemini kota/rate limit:",
        data
      );

      return res.status(429).json({

        error:
          "NEXA-AL şu anda Gemini kullanım kotasına ulaştı. " +
          "Biraz sonra tekrar deneyelim. ⏳"

      });

    }


    // =========================
    // MODEL / API HATASI
    // =========================

    if (!response.ok) {

      console.error(
        "Gemini API hatası:",
        JSON.stringify(data, null, 2)
      );

      const apiError =
        data?.error?.message ||
        "Bilinmeyen Gemini API hatası.";

      return res.status(
        response.status
      ).json({

        error:
          "NEXA-AL AI bağlantısında sorun oluştu.\n\n" +
          apiError

      });

    }


    // =========================
    // CEVABI ÇIKAR
    // =========================

    const reply =
      data
        ?.candidates?.[0]
        ?.content
        ?.parts
        ?.map(
          part => part.text || ""
        )
        .join("")
        .trim();


    // =========================
    // BOŞ CEVAP
    // =========================

    if (!reply) {

      console.error(
        "Gemini boş cevap döndürdü:",
        data
      );

      return res.status(200).json({

        reply:
          "NEXA-AL şu anda cevap oluşturamadı. " +
          "Bir kez daha deneyelim."

      });

    }


    // =========================
    // BAŞARILI
    // =========================

    return res.status(200).json({

      reply: reply

    });


  } catch (error) {

    // =========================
    // SUNUCU HATASI
    // =========================

    console.error(
      "NEXA-AL sunucu hatası:",
      error
    );


    return res.status(500).json({

      error:
        "NEXA-AL AI bağlantısında bir sorun oluştu. " +
        "Lütfen biraz sonra tekrar dene."

    });

  }

};

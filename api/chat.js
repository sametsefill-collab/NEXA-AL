console.log("NEXA-AL YENİ CHAT.JS ÇALIŞIYOR - GEMINI 3.5 FLASH LITE");
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

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {

      console.error(
        "GEMINI_API_KEY bulunamadı."
      );

      return res.status(500).json({
        error:
          "Gemini API anahtarı bulunamadı."
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
    // GEMINI CONTENTS
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
    // GEMINI 3.5 FLASH-LITE
    // =========================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
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

                  "Konuşma geçmişini dikkate al. " +

                  "Kullanıcının adını, tercihlerini ve " +
                  "daha önce söylediği bilgileri " +
                  "geçmişte görüyorsan hatırla. " +

                  "Önceki konuşmalarla bağlantılı " +
                  "sorulara tutarlı cevaplar ver. " +

                  "Gereksiz yere aynı soruları tekrar sorma. " +

                  "Kısa sorulara kısa ve net cevap ver. " +

                  "Samimi, doğal ve yardımcı ol."
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


    console.log(
      "Gemini HTTP:",
      response.status
    );


    // =========================
    // KOTA
    // =========================

    if (response.status === 429) {

      console.error(
        "Gemini kota hatası:",
        data
      );

      return res.status(429).json({

        error:
          "NEXA-AL kullanım sınırına ulaştı. " +
          "Biraz sonra tekrar deneyelim. ⏳"

      });
    }


    // =========================
    // DİĞER API HATALARI
    // =========================

    if (!response.ok) {

      console.error(
        "Gemini API hatası:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "Gemini API bağlantısında bir sorun oluştu."

      });
    }


    // =========================
    // CEVABI AL
    // =========================

    const reply =
      data
        ?.candidates?.[0]
        ?.content?.parts
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
        "Gemini boş cevap:",
        data
      );

      return res.status(200).json({

        reply:
          "NEXA-AL şu anda cevap oluşturamadı. " +
          "Tekrar deneyelim."

      });
    }


    // =========================
    // BAŞARILI
    // =========================

    return res.status(200).json({

      reply

    });


  } catch (error) {

    console.error(
      "NEXA-AL sunucu hatası:",
      error
    );

    return res.status(500).json({

      error:
        "NEXA-AL AI bağlantısında bir sorun oluştu."

    });

  }

};

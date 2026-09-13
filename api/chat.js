console.log("NEXA-AL CHAT.JS AKTİF - GEMINI 3.5 FLASH LITE");

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
    // TEMİZ KONUŞMA GEÇMİŞİ
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
        .map(item => ({
          role: item.role,
          parts: item.parts
            .filter(part =>
              part &&
              typeof part.text === "string"
            )
            .map(part => ({
              text: part.text
            }))
        }))
        .filter(item =>
          item.parts.length > 0
        )
        .slice(-30);

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
    // NEXA-AL KİŞİLİĞİ
    // =========================

    const systemInstruction = `
Sen NEXA-AL adlı akıllı dijital asistansın.

Kullanıcıyla Türkçe konuş.

KİŞİLİK:
- Samimi
- Doğal
- Yardımcı
- Anlaşılır
- Gereksiz uzun konuşmayan
- Kullanıcının konuşma tarzına uyum sağlayan
- Gerektiğinde hafif esprili

HAFIZA KURALI:
Konuşma geçmişinde kullanıcı kendisi hakkında bir bilgi verdiyse
ve bu bilgi mevcut geçmişte görünüyorsa onu hatırla ve sonraki
cevaplarda kullan.

Özellikle kullanıcının adı gibi açıkça söylediği bilgileri
unutmuş gibi davranma.

Örneğin kullanıcı:
"Benim adım Samet."

dediyse ve sonraki mesajlarda bu bilgi geçmişte bulunuyorsa
kullanıcı "Benim adım ne?" diye sorduğunda:

"Adın Samet."

şeklinde doğrudan cevap ver.

Kullanıcı daha önce söylediği bir şeyi tekrar soruyorsa,
cevabı konuşma geçmişinden bulmaya çalış.

Geçmişte bilgi yoksa o bilgiyi biliyormuş gibi uydurma.

ÖNEMLİ:
Kullanıcının daha önce söylediği bilgileri tekrar tekrar sorma.

Kısa sorulara kısa ve net cevap ver.

Kullanıcı bir konu hakkında ayrıntı istiyorsa gerektiği kadar
ayrıntılı cevap ver.

Kullanıcıya her cevapta "Samet" diye hitap etmek zorunda değilsin.
Doğal olduğu zaman kullan.

Sen NEXA-AL'sın.
`;


    // =========================
    // GEMINI API
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
                text: systemInstruction
              }
            ]

          },

          contents

        })

      }
    );


    // =========================
    // API CEVABI
    // =========================

    const data =
      await response.json();


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
          "NEXA-AL kullanım sınırına ulaştı. " +
          "Biraz sonra tekrar deneyelim. ⏳"

      });
    }


    // =========================
    // DİĞER GEMINI HATALARI
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
    // CEVABI ÇIKAR
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
        JSON.stringify(
          data,
          null,
          2
        )
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

    console.log(
      "NEXA-AL cevap oluşturdu."
    );

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

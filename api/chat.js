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

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }

    const contents = [
      ...history,
      {
        role: "user",
        parts: [
          {
            text: message.trim()
          }
        ]
      }
    ];

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
                  "Kullanıcıya Türkçe, anlaşılır, samimi ve faydalı cevaplar ver. " +
                  "Konuşma geçmişini dikkate al ve önceki mesajlarla bağlantılı sorulara " +
                  "tutarlı cevaplar ver. " +
                  "Kullanıcının daha önce söylediği isim, tercih ve bilgileri konuşma geçmişinde " +
                  "varsa dikkate al."
              }
            ]
          },

          contents
        })
      }
    );

    const data = await response.json();

    // KOTA HATASI
    if (response.status === 429) {
      console.error("Gemini kota hatası:", data);

      return res.status(429).json({
        error:
          "NEXA-AL şu anda yoğun kullanım nedeniyle kısa süreliğine beklemede. " +
          "Lütfen biraz sonra tekrar dene. ⏳"
      });
    }

    // DİĞER GEMINI HATALARI
    if (!response.ok) {
      console.error("Gemini API hatası:", data);

      return res.status(response.status).json({
        error:
          "NEXA-AL AI bağlantısında geçici bir sorun oluştu. " +
          "Lütfen biraz sonra tekrar dene."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "NEXA-AL şu anda cevap oluşturamadı.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Sunucu hatası:", error);

    return res.status(500).json({
      error:
        "NEXA-AL AI bağlantısında bir sorun oluştu. " +
        "Lütfen biraz sonra tekrar dene."
    });
  }
};

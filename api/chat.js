
console.log("NEXA-AL CHAT.JS AKTİF - GEMINI 3.5 FLASH LITE");

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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY bulunamadı.");
      return res.status(500).json({
        error: "Gemini API anahtarı bulunamadı."
      });
    }

    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }

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
              part && typeof part.text === "string"
            )
            .map(part => ({
              text: part.text.slice(0, 6000)
            }))
        }))
        .filter(item => item.parts.length > 0)
        .slice(-30);
    }

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

    const systemInstruction = `
Sen NEXA-AL adlı akıllı dijital asistansın.

DİL VE ÜSLUP:
- Kullanıcıyla Türkçe konuş.
- Samimi, doğal ve anlaşılır ol.
- Gereksiz uzun konuşma; soruya doğrudan cevap ver.
- Uygun olduğunda hafif esprili ol.
- Kullanıcının konuşma tarzına uyum sağla.

KONUŞMA GEÇMİŞİ:
- Sana gönderilen konuşma geçmişini dikkatlice kullan.
- Geçmişte olmayan kişisel bilgileri uydurma.
- Önceki tüm konuşmalara erişimin olduğunu iddia etme.
- Kullanıcı daha önce söylediği bir şeyi sorarsa mevcut geçmişte ara.

DOĞRULUK:
- Emin olmadığın bilgileri kesinmiş gibi sunma.
- Güncel bilgiye erişimin yoksa güncelmiş gibi davranma.
- İnternette arama yapmadıysan yaptığını söyleme.
- Kısa sorulara kısa; ayrıntı istendiğinde açıklayıcı cevap ver.

Sen NEXA-AL'sın.
`;

    const model = "gemini-3.5-flash-lite";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    console.log("Gemini model:", model);

    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents
    });

    let response;
    let data;

    // 503 hatasında yalnızca bir kez yeniden dene.
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        25000
      );

      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: requestBody,
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      data = await response.json();

      console.log(
        "Gemini HTTP:",
        response.status,
        "Deneme:",
        attempt + 1
      );

      if (response.status !== 503 || attempt === 1) {
        break;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 1200)
      );
    }

    if (response.status === 429) {
      console.error(
        "Gemini kota/rate limit:",
        JSON.stringify(data)
      );

      return res.status(429).json({
        error:
          "Gemini ücretsiz kullanım sınırına ulaşmış olabilir. " +
          "Biraz sonra tekrar dene; ücretli kullanıma geçilmedi."
      });
    }

    if (!response.ok) {
      console.error(
        "Gemini API hatası:",
        JSON.stringify(data, null, 2)
      );

      if (response.status === 503) {
        return res.status(503).json({
          error:
            "Google modelinde şu anda yoğunluk var. " +
            "Biraz sonra tekrar dene."
        });
      }

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API bağlantısında bir sorun oluştu."
      });
    }

    const reply = data
      ?.candidates?.[0]
      ?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error(
        "Gemini boş cevap:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          "NEXA-AL bu istekte cevap oluşturamadı. " +
          "Lütfen tekrar dene."
      });
    }

    console.log("NEXA-AL cevap oluşturdu.");

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("NEXA-AL sunucu hatası:", error);

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

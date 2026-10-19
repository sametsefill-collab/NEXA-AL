
console.log("NEXA-AL CHAT.JS AKTİF - HAFIZA SİSTEMİ");

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
      return res.status(500).json({
        error: "Gemini API anahtarı bulunamadı."
      });
    }

    const {
      message,
      history = [],
      memory = []
    } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }

    // Konuşma geçmişini güvenli biçimde temizle.
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
        .slice(-40);
    }

    // Ardışık aynı rolleri birleştir.
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

    // Son kayıt kullanıcı mesajıysa tekrarlanmasını önle.
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

    // Tarayıcıdan gelen kayıtlı bilgileri al.
    const cleanMemory = Array.isArray(memory)
      ? memory
          .filter(item => typeof item === "string")
          .slice(0, 50)
          .map(item => item.slice(0, 1000))
      : [];

    const memoryText = cleanMemory.length
      ? cleanMemory.map((item, index) =>
          `${index + 1}. ${item}`
        ).join("\n")
      : "Henüz kayıtlı kullanıcı bilgisi gönderilmedi.";

    const systemInstruction = `
Sen NEXA-AL adlı akıllı dijital asistansın.

KİŞİLİK VE ÜSLUP:
- Kullanıcıyla Türkçe konuş.
- Samimi, doğal ve anlaşılır ol.
- Gereksiz uzatma; soruya doğrudan cevap ver.
- Uygun olduğunda hafif esprili ol.
- Kullanıcının konuşma tarzına uyum sağla.

KAYITLI KULLANICI BİLGİLERİ:
Aşağıdaki bilgiler önceki etkileşimlerden kaydedilmiş olabilir.
İlgili sorularda bunları kullan. İlgisiz olduklarında sıralama.
Bilgiler çelişiyorsa kesin konuşmak yerine açıklama iste.
Bu liste dışında kullanıcı hakkında bilgi uydurma.

${memoryText}

KONUŞMA GEÇMİŞİ:
- Sana gönderilen konuşma geçmişini kullan.
- Kullanıcının daha önce söylediği bilgileri mevcut geçmişte ara.
- Önceki tüm sohbetlere veya başka cihazlardaki bilgilere
  erişimin olduğunu iddia etme.
- Bir bilginin kayıtlı olmadığını fark edersen bunu açıkça söyle.

DOĞRULUK:
- Emin olmadığın bilgileri kesinmiş gibi sunma.
- Güncel bilgiye erişimin yoksa güncelmiş gibi davranma.
- İnternette arama yapmadıysan yaptığını söyleme.
- Kısa sorulara kısa cevap ver.
- Hafızaya yeni bir bilgi kaydedildiğini, gerçekten
  kalıcı olarak kaydetme işlemi yapılmadıysa iddia etme.

Sen NEXA-AL'sın.
`;

    // Ücretsiz kullanım için mevcut model korunuyor.
    const model = "gemini-3.5-flash-lite";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents
    });

    let response;
    let data;

    // 503 yoğunluk hatasında yalnızca bir kez yeniden dene.
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
      return res.status(429).json({
        error:
          "Ücretsiz kullanım kotası dolmuş olabilir. " +
          "Biraz sonra tekrar dene."
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
            "Google modeli şu anda yoğun. Biraz sonra tekrar dene."
        });
      }

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API bağlantısında sorun oluştu."
      });
    }

    const reply = data
      ?.candidates?.[0]
      ?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error:
          "NEXA-AL bu istekte cevap oluşturamadı. Tekrar dene."
      });
    }

    console.log(
      "NEXA-AL cevap oluşturdu. Gönderilen hafıza:",
      cleanMemory.length
    );

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("NEXA-AL sunucu hatası:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "Yanıt zaman aşımına uğradı. Tekrar dene."
      });
    }

    return res.status(500).json({
      error: "NEXA-AL sunucu bağlantısında sorun oluştu."
    });
  }
};

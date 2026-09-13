module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST destekleniyor." });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Mesaj gerekli." });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
                text: "Sen NEXA-AL adlı Türkçe konuşan akıllı dijital asistansın. Kullanıcıya Türkçe, anlaşılır, samimi ve faydalı cevaplar ver."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API hatası."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "NEXA-AL cevap oluşturamadı.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Sunucu hatası."
    });
  }
};

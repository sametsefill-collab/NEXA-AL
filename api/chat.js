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
      return res.status(400).json({ error: "Mesaj boş." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions:
          "Sen NEXA-AL adlı Türkçe konuşan bir yapay zeka asistanısın. Kullanıcıya doğal, yardımcı ve anlaşılır cevaplar ver.",
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
  console.error(data);
  return res.status(response.status).json({
    error: data?.error?.message || "OpenAI bağlantı hatası."
  });
}
    
    const reply =
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") ||
      "NEXA-AL cevap oluşturamadı.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Sunucu hatası."
    });
  }
};

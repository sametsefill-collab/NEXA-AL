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

    const {
      message,
      history = []
    } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }

    /*
     * NEXA-AL konuşma geçmişini sınırlıyoruz.
     * Böylece gereksiz token tüketimini azaltıyoruz.
     */

    const limitedHistory =
      Array.isArray(history)
        ? history.slice(-12)
        : [];


    const contents = [
      ...limitedHistory,

      {
        role: "user",

        parts: [
          {
            text: message.trim()
          }
        ]
      }
    ];


    /*
     * GEMINI API
     *
     * Daha hafif ve ücretsiz katmana uygun model.
     */

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({

          system_instruction: {

            parts: [

              {
                text:
                  "Sen NEXA-AL adlı Türkçe konuşan akıllı dijital asistansın. " +

                  "Kullanıcıya Türkçe, samimi, doğal, anlaşılır ve faydalı cevaplar ver. " +

                  "Kullanıcı sana adını söylediğinde konuşma geçmişinden bunu hatırla " +
                  "ve sonraki mesajlarda ismiyle hitap et. " +

                  "Önceki konuşmaları dikkate al. " +

                  "Aynı soruya gereksiz yere aynı cevabı tekrar etme. " +

                  "Kısa sorulara kısa ve doğal cevaplar ver. " +

                  "Gerektiğinde detaylı açıklama yap. " +

                  "Kullanıcıyla robot gibi değil, doğal bir dijital asistan gibi konuş."
              }

            ]

          },

          contents,

          generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 500

          }

        })

      }
    );


    const data =
      await response.json();


    /*
     * KOTA / RATE LIMIT
     */

    if (response.status === 429) {

      console.error(
        "Gemini kota/rate limit:",
        data
      );

      return res.status(429).json({

        error:
          "NEXA-AL şu anda kısa süreli kullanım limitine ulaştı. " +
          "Biraz bekleyip tekrar deneyebilirsin. ⏳"

      });

    }


    /*
     * DİĞER API HATALARI
     */

    if (!response.ok) {

      console.error(
        "Gemini API hatası:",
        data
      );

      return res.status(response.status).json({

        error:
          "NEXA-AL bağlantısında geçici bir sorun oluştu. " +
          "Lütfen biraz sonra tekrar dene."

      });

    }


    /*
     * CEVABI AL
     */

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();


    if (!reply) {

      return res.status(200).json({

        reply:
          "Şu anda buna cevap oluşturamadım. Bir kez daha sorar mısın? 😊"

      });

    }


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
        "NEXA-AL bağlantısında geçici bir sorun oluştu. " +
        "Lütfen biraz sonra tekrar dene."

    });

  }

};

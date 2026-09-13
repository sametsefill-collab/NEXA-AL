module.exports = async (req, res) => {

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


    if (!message) {
      return res.status(400).json({
        error: "Mesaj gerekli."
      });
    }


    /*
     * FRONTEND HAFIZASINI
     * GEMINI FORMATINA ÇEVİR
     */

    const formattedHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            item.content &&
            (
              item.role === "user" ||
              item.role === "assistant"
            )
          )
          .map(item => ({

            role:
              item.role === "assistant"
                ? "model"
                : "user",

            parts: [
              {
                text: String(item.content)
              }
            ]

          }))
      : [];


    /*
     * SON MESAJ ZATEN HISTORY'DE VARSA
     * TEKRAR EKLEME
     */

    const lastMessage =
      formattedHistory[
        formattedHistory.length - 1
      ];


    const contents =
      lastMessage &&
      lastMessage.role === "user" &&
      lastMessage.parts?.[0]?.text === message

        ? formattedHistory

        : [
            ...formattedHistory,

            {
              role: "user",

              parts: [
                {
                  text: message
                }
              ]
            }
          ];


    /*
     * GEMINI API
     */

    const response = await fetch(

      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "x-goog-api-key":
            process.env.GEMINI_API_KEY

        },

        body: JSON.stringify({

          system_instruction: {

            parts: [

              {

                text:
                  "Sen NEXA-AL adlı Türkçe konuşan akıllı dijital asistansın. " +

                  "Kullanıcıya Türkçe, anlaşılır, samimi, doğal ve faydalı cevaplar ver. " +

                  "Konuşma geçmişini dikkatle kullan. " +

                  "Kullanıcı daha önce adını, tercihlerini veya başka bilgileri söylediyse " +

                  "bunları sonraki mesajlarda hatırla ve uygun olduğunda kullan. " +

                  "Kullanıcı 'Benim adım ne?' gibi bir soru sorarsa geçmiş konuşmalardan " +

                  "bildiğin bilgiyi kullan. " +

                  "Bilmediğin bir şeyi biliyormuş gibi uydurma."

              }

            ]

          },

          contents

        })

      }

    );


    const data =
      await response.json();


    /*
     * GEMINI HATA KONTROLÜ
     */

    if (!response.ok) {

      console.error(
        "Gemini API hatası:",
        data
      );

      return res
        .status(response.status)
        .json({

          error:
            data?.error?.message ||
            "Gemini API hatası."

        });

    }


    /*
     * CEVABI AL
     */

    const reply =

      data
        ?.candidates?.[0]
        ?.content?.parts
        ?.map(
          part => part.text || ""
        )
        .join("") ||

      "NEXA-AL cevap oluşturamadı.";


    /*
     * CEVABI GÖNDER
     */

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
        error?.message ||
        "Sunucu hatası."

    });

  }

};

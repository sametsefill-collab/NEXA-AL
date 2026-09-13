document.addEventListener("DOMContentLoaded", function () {

  console.log("NEXA-AL başlatıldı.");

  const startBtn = document.getElementById("startBtn");
  const aiBtn = document.getElementById("aiBtn");
  const exploreBtn = document.getElementById("exploreBtn");
  const menuBtn = document.getElementById("menuBtn");

  const panel = document.getElementById("nexaAiPanel");
  const closeBtn = document.getElementById("nexaAiClose");
  const sendBtn = document.getElementById("nexaAiSend");
  const input = document.getElementById("nexaAiInput");
  const messages = document.getElementById("nexaAiMessages");


  /* =========================
     AYARLAR
  ========================= */

  const STORAGE_KEY = "nexa_al_history";

  // Hafızanın gereksiz büyümesini engeller.
  // 12 mesaj = yaklaşık 6 kullanıcı + 6 AI mesajı.
  const MAX_HISTORY = 12;

  let history = [];
  let isSending = false;


  /* =========================
     KONUŞMA HAFIZASINI YÜKLE
  ========================= */

  try {

    const savedHistory =
      localStorage.getItem(STORAGE_KEY);

    if (savedHistory) {

      const parsedHistory =
        JSON.parse(savedHistory);

      if (Array.isArray(parsedHistory)) {

        history =
          parsedHistory
            .filter(item =>
              item &&
              (item.role === "user" ||
               item.role === "model") &&
              Array.isArray(item.parts)
            )
            .slice(-MAX_HISTORY);

      }

    }

  } catch (error) {

    console.error(
      "NEXA-AL hafızası okunamadı:",
      error
    );

    history = [];

  }


  /* =========================
     HAFIZAYI KAYDET
  ========================= */

  function saveHistory() {

    try {

      history =
        history.slice(-MAX_HISTORY);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
      );

    } catch (error) {

      console.error(
        "NEXA-AL hafızası kaydedilemedi:",
        error
      );

    }

  }


  /* =========================
     AI PANELİNİ AÇ
  ========================= */

  function openAiPanel() {

    if (!panel) {

      console.error(
        "NEXA-AL AI paneli bulunamadı."
      );

      return;

    }

    panel.classList.add("active");

    if (input) {

      setTimeout(function () {

        input.focus();

      }, 100);

    }

  }


  /* =========================
     BAŞLA BUTONU
  ========================= */

  if (startBtn) {

    startBtn.addEventListener(
      "click",
      function () {

        console.log(
          "Başla butonuna basıldı."
        );

        openAiPanel();

      }
    );

  }


  /* =========================
     AI'I AÇ
  ========================= */

  if (aiBtn) {

    aiBtn.addEventListener(
      "click",
      function () {

        openAiPanel();

      }
    );

  }


  /* =========================
     KEŞFET
  ========================= */

  if (exploreBtn) {

    exploreBtn.addEventListener(
      "click",
      function () {

        const features =
          document.querySelector(".features");

        if (features) {

          features.scrollIntoView({
            behavior: "smooth"
          });

        }

      }
    );

  }


  /* =========================
     AI KAPAT
  ========================= */

  if (closeBtn && panel) {

    closeBtn.addEventListener(
      "click",
      function () {

        panel.classList.remove("active");

      }
    );

  }


  /* =========================
     PANEL DIŞINA TIKLAMA
  ========================= */

  if (panel) {

    panel.addEventListener(
      "click",
      function (event) {

        if (event.target === panel) {

          panel.classList.remove("active");

        }

      }
    );

  }


  /* =========================
     MESAJ EKLE
  ========================= */

  function addMessage(text, type) {

    if (!messages) return;

    const message =
      document.createElement("div");

    message.className =
      "nexa-msg " + type;

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop =
      messages.scrollHeight;

  }


  /* =========================
     API'DEN CEVAP AL
  ========================= */

  async function getAnswer(text, oldHistory) {

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          message: text,

          history: oldHistory

        })

      }
    );


    let data = {};

    try {

      data = await response.json();

    } catch (error) {

      console.error(
        "API cevabı JSON değil:",
        error
      );

    }


    if (!response.ok) {

      console.error(
        "NEXA-AL API hatası:",
        data
      );

      const error =
        new Error(
          data?.error ||
          "Sunucu hatası."
        );

      error.status =
        response.status;

      throw error;

    }


    return data.reply ||
      "NEXA-AL şu anda cevap oluşturamadı.";

  }


  /* =========================
     MESAJ GÖNDER
  ========================= */

  async function sendMessage() {

    if (!input) return;

    // Aynı anda iki istek gönderilmesini engeller.
    if (isSending) return;


    const text =
      input.value.trim();


    if (!text) return;


    isSending = true;


    // Butonu geçici olarak pasifleştir.
    if (sendBtn) {

      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";

    }


    // Kullanıcı mesajını ekrana göster.
    addMessage(
      text,
      "user"
    );


    input.value = "";


    /*
     * API'YE GÖNDERECEĞİMİZ GEÇMİŞ
     *
     * Yeni kullanıcı mesajını burada
     * history'ye eklemiyoruz.
     *
     * Çünkü /api/chat zaten mevcut
     * mesajı kendisi contents'e ekliyor.
     */

    const oldHistory =
      history.slice(-MAX_HISTORY);


    /* =========================
       YÜKLENİYOR
    ========================= */

    const loadingMessage =
      document.createElement("div");

    loadingMessage.className =
      "nexa-msg ai";

    loadingMessage.textContent =
      "NEXA-AL düşünüyor...";


    if (messages) {

      messages.appendChild(
        loadingMessage
      );

      messages.scrollTop =
        messages.scrollHeight;

    }


    try {

      /*
       * TEK API ÇAĞRISI
       */

      const answer =
        await getAnswer(
          text,
          oldHistory
        );


      /* Loading kaldır */

      if (loadingMessage) {

        loadingMessage.remove();

      }


      /* AI cevabını ekrana yaz */

      addMessage(
        answer,
        "ai"
      );


      /*
       * API BAŞARILI OLDU.
       *
       * Ancak şimdi hafızaya ekliyoruz.
       */

      history.push({

        role: "user",

        parts: [
          {
            text: text
          }
        ]

      });


      history.push({

        role: "model",

        parts: [
          {
            text: answer
          }
        ]

      });


      /*
       * Sadece son MAX_HISTORY
       * mesajı sakla.
       */

      history =
        history.slice(-MAX_HISTORY);


      saveHistory();


    } catch (error) {

      /* Loading kaldır */

      if (loadingMessage) {

        loadingMessage.remove();

      }


      console.error(
        "NEXA-AL bağlantı hatası:",
        error
      );


      let errorMessage =
        "Üzgünüm, AI bağlantısında geçici bir sorun oluştu.";


      /*
       * KOTA HATASI
       */

      if (error.status === 429) {

        errorMessage =
          "NEXA-AL şu anda yoğun kullanım nedeniyle " +
          "kısa süreliğine beklemede. ⏳\n\n" +
          "Biraz sonra tekrar deneyebilirsin.";

      }


      /*
       * Diğer sunucu hataları
       */

      else if (
        error.status >= 500
      ) {

        errorMessage =
          "NEXA-AL sunucusunda geçici bir sorun oluştu. " +
          "Lütfen biraz sonra tekrar dene.";

      }


      addMessage(
        errorMessage,
        "ai"
      );


      /*
       * ÖNEMLİ:
       *
       * Hata alan mesajı hafızaya
       * KAYDETMİYORUZ.
       */

    }


    finally {

      isSending = false;


      if (sendBtn) {

        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";

      }


      if (input) {

        input.focus();

      }

    }

  }


  /* =========================
     GÖNDER BUTONU
  ========================= */

  if (sendBtn) {

    sendBtn.addEventListener(
      "click",
      sendMessage
    );

  }


  /* =========================
     ENTER
  ========================= */

  if (input) {

    input.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );

  }


  /* =========================
     MENÜ
  ========================= */

  if (menuBtn) {

    menuBtn.addEventListener(
      "click",
      function () {

        alert(
          "NEXA-AL menüsü yakında aktif olacak. 🚀"
        );

      }
    );

  }


  /* =========================
     HAFIZAYI TEMİZLEME
  ========================= */

  window.clearNexaMemory =
    function () {

      history = [];

      localStorage.removeItem(
        STORAGE_KEY
      );

      console.log(
        "NEXA-AL hafızası temizlendi."
      );

    };


  console.log(
    "NEXA-AL hafızası yüklendi:",
    history.length,
    "mesaj"
  );


});

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
     KONUŞMA HAFIZASI
  ========================= */

  let history = [];

  try {

    const savedHistory =
      localStorage.getItem("nexa_al_history");

    if (savedHistory) {

      history = JSON.parse(savedHistory);

    }

  } catch (error) {

    console.error(
      "Hafıza okunamadı:",
      error
    );

    history = [];

  }


  function saveHistory() {

    try {

      localStorage.setItem(
        "nexa_al_history",
        JSON.stringify(history)
      );

    } catch (error) {

      console.error(
        "Hafıza kaydedilemedi:",
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

  async function getAnswer(text) {

    try {

      const response = await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            message: text,

            /*
             * ÖNCEKİ KONUŞMALAR
             * BURADA API'YE GİDİYOR
             */
            history: history

          })

        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          "API hatası:",
          data
        );

        throw new Error(
          data?.error ||
          "Sunucu hatası: " +
          response.status
        );

      }


      return data.reply ||
        "NEXA-AL şu anda cevap veremiyor.";

    }

    catch (error) {

      console.error(
        "NEXA-AL AI hatası:",
        error
      );

      return (
        "Üzgünüm, AI bağlantısında " +
        "bir sorun oluştu.\n\n" +
        "Hata: " +
        error.message
      );

    }

  }


  /* =========================
     MESAJ GÖNDER
  ========================= */

  async function sendMessage() {

    if (!input) return;

    const text =
      input.value.trim();

    if (!text) return;


    /* Kullanıcı mesajını ekrana yaz */

    addMessage(
      text,
      "user"
    );

    input.value = "";


    /* API'ye gönderilecek eski geçmiş */

    const previousHistory =
      [...history];


    /* Kullanıcı mesajını hafızaya ekle */

    history.push({

      role: "user",

      parts: [
        {
          text: text
        }
      ]

    });


    saveHistory();


    /* Yükleniyor mesajı */

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


    /*
     * API'YE ESKİ GEÇMİŞİ GÖNDERİYORUZ.
     * Mevcut mesaj API tarafından
     * ayrıca eklenecek.
     */

    const oldHistory =
      history.slice(0, -1);


    const answer =
      await getAnswerWithHistory(
        text,
        oldHistory
      );


    /* Loading kaldır */

    if (loadingMessage) {

      loadingMessage.remove();

    }


    /* Cevabı ekrana yaz */

    addMessage(
      answer,
      "ai"
    );


    /* AI cevabını hafızaya ekle */

    history.push({

      role: "model",

      parts: [
        {
          text: answer
        }
      ]

    });


    saveHistory();

  }


  /* =========================
     API + HISTORY
  ========================= */

  async function getAnswerWithHistory(
    text,
    oldHistory
  ) {

    try {

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


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          "API hatası:",
          data
        );

        throw new Error(
          data?.error ||
          "Sunucu hatası: " +
          response.status
        );

      }


      return data.reply ||
        "NEXA-AL cevap oluşturamadı.";

    }

    catch (error) {

      console.error(
        "NEXA-AL bağlantı hatası:",
        error
      );

      return (
        "Üzgünüm, AI bağlantısında " +
        "bir sorun oluştu.\n\n" +
        "Hata: " +
        error.message
      );

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
        "nexa_al_history"
      );

      console.log(
        "NEXA-AL hafızası temizlendi."
      );

    };


});

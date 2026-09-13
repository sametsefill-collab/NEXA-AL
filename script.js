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


  /* ==========================================
     NEXA-AL HAFIZA SİSTEMİ
     ========================================== */

  const MEMORY_KEY = "nexa_al_conversation";

  let conversationHistory = [];


  /* KAYITLI HAFIZAYI YÜKLE */

  try {

    const savedMemory =
      localStorage.getItem(MEMORY_KEY);

    if (savedMemory) {

      const parsedMemory =
        JSON.parse(savedMemory);

      if (Array.isArray(parsedMemory)) {

        conversationHistory = parsedMemory;

        console.log(
          "NEXA-AL hafızası yüklendi:",
          conversationHistory.length,
          "mesaj"
        );

      }

    }

  } catch (error) {

    console.error(
      "Hafıza yüklenemedi:",
      error
    );

    conversationHistory = [];

  }


  /* HAFIZAYI KAYDET */

  function saveMemory() {

    try {

      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(conversationHistory)
      );

    } catch (error) {

      console.error(
        "Hafıza kaydedilemedi:",
        error
      );

    }

  }


  /* HAFIZAYI TEMİZLEME */

  function clearMemory() {

    conversationHistory = [];

    localStorage.removeItem(
      MEMORY_KEY
    );

    console.log(
      "NEXA-AL hafızası temizlendi."
    );

  }


  /* ==========================================
     AI PANELİNİ AÇ
     ========================================== */

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


  /* ==========================================
     BAŞLA BUTONU
     ========================================== */

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


  /* ==========================================
     AI BUTONU
     ========================================== */

  if (aiBtn) {

    aiBtn.addEventListener(
      "click",
      function () {

        openAiPanel();

      }
    );

  }


  /* ==========================================
     KEŞFET
     ========================================== */

  if (exploreBtn) {

    exploreBtn.addEventListener(
      "click",
      function () {

        const features =
          document.querySelector(
            ".features"
          );

        if (features) {

          features.scrollIntoView({
            behavior: "smooth"
          });

        }

      }
    );

  }


  /* ==========================================
     AI KAPAT
     ========================================== */

  if (closeBtn && panel) {

    closeBtn.addEventListener(
      "click",
      function () {

        panel.classList.remove(
          "active"
        );

      }
    );

  }


  /* ==========================================
     PANEL DIŞINA TIKLAMA
     ========================================== */

  if (panel) {

    panel.addEventListener(
      "click",
      function (event) {

        if (event.target === panel) {

          panel.classList.remove(
            "active"
          );

        }

      }
    );

  }


  /* ==========================================
     MESAJ EKLE
     ========================================== */

  function addMessage(
    text,
    type
  ) {

    if (!messages) return;

    const message =
      document.createElement(
        "div"
      );

    message.className =
      "nexa-msg " + type;

    message.textContent = text;

    messages.appendChild(
      message
    );

    messages.scrollTop =
      messages.scrollHeight;

  }


  /* ==========================================
     GEMINI / API CEVABI
     ========================================== */

  async function getAnswer(text) {

    try {

      /*
       * API'YE MEVCUT HAFIZAYI GÖNDERİYORUZ.
       *
       * ÖNEMLİ:
       * Yeni mesajı ayrıca gönderiyoruz.
       * Böylece aynı mesaj iki kez gitmiyor.
       */

      const response =
        await fetch(
          "/api/chat",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              message: text,

              history:
                conversationHistory

            })

          }
        );


      /* CEVABI JSON OLARAK AL */

      const data =
        await response.json();


      /* API HATASI */

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


      /* AI CEVABI */

      const reply =
        data?.reply ||
        "NEXA-AL cevap oluşturamadı.";


      /* =====================================
         KULLANICI MESAJINI HAFIZAYA EKLE
         ===================================== */

      conversationHistory.push({

        role: "user",

        parts: [
          {
            text: text
          }
        ]

      });


      /* =====================================
         AI CEVABINI HAFIZAYA EKLE
         ===================================== */

      conversationHistory.push({

        role: "model",

        parts: [
          {
            text: reply
          }
        ]

      });


      /*
       * SON 30 MESAJI TUT.
       * Böylece istekler gereksiz şekilde
       * büyümez.
       */

      if (
        conversationHistory.length >
        30
      ) {

        conversationHistory =
          conversationHistory.slice(
            -30
          );

      }


      /* HAFIZAYI TELEFONA KAYDET */

      saveMemory();


      console.log(
        "NEXA-AL hafızası güncellendi."
      );


      return reply;


    } catch (error) {

      console.error(
        "NEXA-AL AI hatası:",
        error
      );


      return (
        "Üzgünüm, AI bağlantısında " +
        "bir sorun oluştu. (" +
        error.message +
        ")"
      );

    }

  }


  /* ==========================================
     MESAJ GÖNDER
     ========================================== */

  async function sendMessage() {

    if (!input) return;


    const text =
      input.value.trim();


    if (!text) return;


    /* KULLANICI MESAJINI EKRANA YAZ */

    addMessage(
      text,
      "user"
    );


    /* INPUT TEMİZLE */

    input.value = "";


    /* =====================================
       DÜŞÜNÜYOR MESAJI
       ===================================== */

    const loadingMessage =
      document.createElement(
        "div"
      );

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


    /* =====================================
       API'DEN CEVAP AL
       ===================================== */

    const answer =
      await getAnswer(text);


    /* DÜŞÜNÜYOR YAZISINI SİL */

    if (loadingMessage) {

      loadingMessage.remove();

    }


    /* AI CEVABINI EKRANA YAZ */

    addMessage(
      answer,
      "ai"
    );

  }


  /* ==========================================
     GÖNDER BUTONU
     ========================================== */

  if (sendBtn) {

    sendBtn.addEventListener(
      "click",
      sendMessage
    );

  }


  /* ==========================================
     ENTER İLE GÖNDER
     ========================================== */

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


  /* ==========================================
     MENÜ
     ========================================== */

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


  /* ==========================================
     TEST İÇİN KONSOL
     ========================================== */

  console.log(
    "NEXA-AL hazır."
  );

  console.log(
    "Kayıtlı hafıza:",
    conversationHistory
  );

});

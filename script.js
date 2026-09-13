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


  /* =========================================
     NEXA-AL HAFIZA
  ========================================= */

  let conversationHistory = [];

  try {

    const savedHistory =
      localStorage.getItem("nexaAlHistory");

    if (savedHistory) {

      conversationHistory =
        JSON.parse(savedHistory);

      console.log(
        "NEXA-AL hafızası yüklendi:",
        conversationHistory
      );

    }

  } catch (error) {

    console.error(
      "Hafıza yüklenemedi:",
      error
    );

    conversationHistory = [];

  }


  function saveHistory() {

    try {

      localStorage.setItem(
        "nexaAlHistory",
        JSON.stringify(conversationHistory)
      );

    } catch (error) {

      console.error(
        "Hafıza kaydedilemedi:",
        error
      );

    }

  }


  /* =========================================
     AI PANELİNİ AÇ
  ========================================= */

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


  /* =========================================
     BAŞLA BUTONU
  ========================================= */

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


  /* =========================================
     AI BUTONU
  ========================================= */

  if (aiBtn) {

    aiBtn.addEventListener(
      "click",
      function () {

        openAiPanel();

      }
    );

  }


  /* =========================================
     KEŞFET
  ========================================= */

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


  /* =========================================
     AI KAPAT
  ========================================= */

  if (closeBtn && panel) {

    closeBtn.addEventListener(
      "click",
      function () {

        panel.classList.remove("active");

      }
    );

  }


  /* =========================================
     PANEL DIŞINA TIKLAMA
  ========================================= */

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


  /* =========================================
     MESAJ EKLE
  ========================================= */

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


  /* =========================================
     KAYITLI MESAJLARI EKRANA GETİR
  ========================================= */

  function restoreMessages() {

    if (!messages) return;

    conversationHistory.forEach(
      function (item) {

        if (
          item.role === "user"
        ) {

          addMessage(
            item.content,
            "user"
          );

        }

        if (
          item.role === "assistant"
        ) {

          addMessage(
            item.content,
            "ai"
          );

        }

      }
    );

  }


  restoreMessages();


  /* =========================================
     API CEVABI
  ========================================= */

  async function getAnswer(text) {

    try {

      const response =
        await fetch("/api/chat", {

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

        });


      if (!response.ok) {

        throw new Error(
          "Sunucu hatası: " +
          response.status
        );

      }


      const data =
        await response.json();


      return data.reply ||
        "NEXA-AL şu anda cevap veremiyor.";


    } catch (error) {

      console.error(
        "NEXA-AL AI hatası:",
        error
      );


      return (
        "Üzgünüm, AI bağlantısında " +
        "bir sorun oluştu."
      );

    }

  }


  /* =========================================
     MESAJ GÖNDER
  ========================================= */

  async function sendMessage() {

    if (!input) return;

    const text =
      input.value.trim();

    if (!text) return;


    /* Kullanıcı mesajını ekle */

    addMessage(
      text,
      "user"
    );


    input.value = "";


    /* Kullanıcı mesajını hafızaya ekle */

    conversationHistory.push({

      role: "user",

      content: text

    });


    saveHistory();


    /* Düşünüyor mesajı */

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


    /* AI cevabı */

    const answer =
      await getAnswer(text);


    /* Düşünüyor mesajını kaldır */

    if (loadingMessage) {

      loadingMessage.remove();

    }


    /* AI cevabını ekrana yaz */

    addMessage(
      answer,
      "ai"
    );


    /* AI cevabını hafızaya ekle */

    conversationHistory.push({

      role: "assistant",

      content: answer

    });


    saveHistory();


    console.log(
      "NEXA-AL hafızası güncellendi:",
      conversationHistory
    );

  }


  /* =========================================
     GÖNDER BUTONU
  ========================================= */

  if (sendBtn) {

    sendBtn.addEventListener(
      "click",
      sendMessage
    );

  }


  /* =========================================
     ENTER İLE GÖNDER
  ========================================= */

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


  /* =========================================
     MENÜ
  ========================================= */

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

});

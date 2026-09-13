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

  /* NEXA-AL SOHBET HAFIZASI */

  let chatHistory = [];


  /* AI PANELİNİ AÇ */

  function openAiPanel() {

    if (!panel) {
      console.error("NEXA-AL AI paneli bulunamadı.");
      return;
    }

    panel.classList.add("active");

    if (input) {
      setTimeout(function () {
        input.focus();
      }, 100);
    }

  }


  /* BAŞLA BUTONU */

  if (startBtn) {

    startBtn.addEventListener("click", function () {

      console.log("Başla butonuna basıldı.");

      openAiPanel();

    });

  }


  /* AI'I AÇ BUTONU */

  if (aiBtn) {

    aiBtn.addEventListener("click", function () {

      openAiPanel();

    });

  }


  /* KEŞFET BUTONU */

  if (exploreBtn) {

    exploreBtn.addEventListener("click", function () {

      const features = document.querySelector(".features");

      if (features) {

        features.scrollIntoView({
          behavior: "smooth"
        });

      }

    });

  }


  /* AI KAPAT */

  if (closeBtn && panel) {

    closeBtn.addEventListener("click", function () {

      panel.classList.remove("active");

    });

  }


  /* PANEL DIŞINA TIKLAMA */

  if (panel) {

    panel.addEventListener("click", function (event) {

      if (event.target === panel) {

        panel.classList.remove("active");

      }

    });

  }


  /* MESAJ EKLE */

  function addMessage(text, type) {

    if (!messages) return;

    const message = document.createElement("div");

    message.className = "nexa-msg " + type;

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

  }


  /* AI CEVABI */

  async function getAnswer(text) {

    try {

      const response = await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          message: text,

          history: chatHistory

        })

      });


      if (!response.ok) {

        throw new Error(
          "Sunucu hatası: " + response.status
        );

      }


      const data = await response.json();

      return data.reply ||
        "NEXA-AL şu anda cevap veremiyor.";

    }

    catch (error) {

      console.error(
        "NEXA-AL AI hatası:",
        error
      );

      return "Üzgünüm, AI bağlantısında bir sorun oluştu.";

    }

  }


  /* MESAJ GÖNDER */

  async function sendMessage() {

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;


    /* KULLANICI MESAJINI GÖSTER */

    addMessage(text, "user");

    input.value = "";


    /* YÜKLENİYOR */

    const loadingMessage = document.createElement("div");

    loadingMessage.className = "nexa-msg ai";

    loadingMessage.textContent =
      "NEXA-AL düşünüyor...";

    if (messages) {

      messages.appendChild(loadingMessage);

      messages.scrollTop =
        messages.scrollHeight;

    }


    /* AI CEVABI AL */

    const answer = await getAnswer(text);


    /* YÜKLENİYOR MESAJINI SİL */

    if (loadingMessage) {

      loadingMessage.remove();

    }


    /* AI CEVABINI GÖSTER */

    addMessage(answer, "ai");


    /* HAFIZAYA KAYDET */

    chatHistory.push({

      role: "user",

      parts: [
        {
          text: text
        }
      ]

    });


    chatHistory.push({

      role: "model",

      parts: [
        {
          text: answer
        }
      ]

    });


    console.log(
      "NEXA-AL hafızası:",
      chatHistory
    );

  }


  /* GÖNDER BUTONU */

  if (sendBtn) {

    sendBtn.addEventListener(
      "click",
      sendMessage
    );

  }


  /* ENTER İLE GÖNDER */

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


  /* MENÜ */

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

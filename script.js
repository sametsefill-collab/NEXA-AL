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
     BAŞLA BUT

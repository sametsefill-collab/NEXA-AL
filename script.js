document.addEventListener("DOMContentLoaded", function () {

  console.log("NEXA-AL başlatıldı.");

  const aiBtn = document.getElementById("aiBtn");
  const menuBtn = document.getElementById("menuBtn");

  const panel = document.getElementById("nexaAiPanel");
  const closeBtn = document.getElementById("nexaAiClose");
  const sendBtn = document.getElementById("nexaAiSend");
  const input = document.getElementById("nexaAiInput");
  const messages = document.getElementById("nexaAiMessages");

  /* AI BUTONU */

if (aiBtn && panel) {
    aiBtn.addEventListener("click", function () {
        panel.classList.add("active");

        if (input) {
            setTimeout(function () {
                input.focus();
            }, 100);
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

  /* BASİT AI CEVAPLARI */

  function getAnswer(text) {

    const message = text.toLowerCase();

    if (
      message.includes("merhaba") ||
      message.includes("selam")
    ) {
      return "Merhaba 👋 Ben NEXA-AL AI. Sana nasıl yardımcı olabilirim?";
    }

    if (
      message.includes("kimsin") ||
      message.includes("nesin")
    ) {
      return "Ben NEXA-AL AI 🤖 Yeni nesil dijital asistanın.";
    }

    if (
      message.includes("nasılsın") ||
      message.includes("nasilsin")
    ) {
      return "Gayet iyiyim! 🚀 Senin için çalışmaya hazırım.";
    }

    if (
      message.includes("nexa") ||
      message.includes("nexa-al")
    ) {
      return "Buradayım. NEXA-AL'ın AI sistemi aktif. ✨";
    }

    return "Mesajını aldım. 🤖 Gerçek AI motoruna bağlandığımda sana çok daha gelişmiş cevaplar vereceğim.";
  }

  /* MESAJ GÖNDER */

  function sendMessage() {

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    setTimeout(function () {

      const answer = getAnswer(text);

      addMessage(answer, "ai");

    }, 500);
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (input) {

    input.addEventListener("keydown", function (event) {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    });

  }

  /* MENÜ */

  if (menuBtn) {

    menuBtn.addEventListener("click", function () {

      alert("NEXA-AL menüsü yakında aktif olacak. 🚀");

    });

  }

});

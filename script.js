
document.addEventListener("DOMContentLoaded", function () {
  console.log("NEXA-AL hafıza sistemi başlatıldı.");

  const startBtn = document.getElementById("startBtn");
  const aiBtn = document.getElementById("aiBtn");
  const exploreBtn = document.getElementById("exploreBtn");
  const menuBtn = document.getElementById("menuBtn");
  const panel = document.getElementById("nexaAiPanel");
  const closeBtn = document.getElementById("nexaAiClose");
  const sendBtn = document.getElementById("nexaAiSend");
  const input = document.getElementById("nexaAiInput");
  const messages = document.getElementById("nexaAiMessages");

  const HISTORY_KEY = "nexa_al_history";
  const MEMORY_KEY = "nexa_al_memory";
  const MAX_HISTORY = 40;

  let history = [];
  let isSending = false;

  // İlk kullanım için başlangıç bilgileri.
  // Bu bilgiler yalnızca bu tarayıcıda saklanır.
  const defaultMemory = [
    "Kullanıcının lojistik sektöründe yaklaşık 13 yıl 4 ay deneyimi var.",
    "Kullanıcı 10.04.2013 tarihinde MNG Kargo'da işe başladı ve 01.08.2026 tarihinde ayrıldı.",
    "Kullanıcı müşteri hizmetleri, şube yönetimi ve operasyon yöneticiliği yaptı.",
    "Kullanıcı Arvento araç takip sistemi, CRM, Excel ve filo operasyonları konusunda deneyimli.",
    "Kullanıcı Türkçe iletişim tercih ediyor."
  ];

  let memory = [];

  try {
    const savedHistory = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    if (Array.isArray(savedHistory)) {
      history = savedHistory
        .filter(item =>
          item &&
          ["user", "model"].includes(item.role) &&
          Array.isArray(item.parts)
        )
        .slice(-MAX_HISTORY);
    }

    const savedMemory = JSON.parse(
      localStorage.getItem(MEMORY_KEY) || "null"
    );

    memory = Array.isArray(savedMemory)
      ? savedMemory.filter(
          item => typeof item === "string"
        ).slice(0, 50)
      : [...defaultMemory];

    if (!savedMemory) {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
      );
    }
  } catch (error) {
    console.error("Hafıza yüklenemedi:", error);
    history = [];
    memory = [...defaultMemory];
  }

  function saveHistory() {
    try {
      history = history.slice(-MAX_HISTORY);
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error("Konuşma geçmişi kaydedilemedi:", error);
    }
  }

  function saveMemory() {
    try {
      memory = memory.slice(0, 50);
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
      );
    } catch (error) {
      console.error("Kullanıcı hafızası kaydedilemedi:", error);
    }
  }

  function openAiPanel() {
    if (!panel) return;
    panel.classList.add("active");
    if (input) input.focus();
  }

  if (startBtn) startBtn.addEventListener("click", openAiPanel);
  if (aiBtn) aiBtn.addEventListener("click", openAiPanel);

  if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
      const features = document.querySelector(".features");
      if (features) {
        features.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", function () {
      panel.classList.remove("active");
    });
  }

  if (panel) {
    panel.addEventListener("click", function (event) {
      if (event.target === panel) {
        panel.classList.remove("active");
      }
    });
  }

  function addMessage(text, type) {
    if (!messages) return;

    const element = document.createElement("div");
    element.className = "nexa-msg " + type;
    element.textContent = text;
    messages.appendChild(element);
    messages.scrollTop = messages.scrollHeight;
  }

  // Mevcut tarayıcıdaki konuşmaları ekranda göster.
  if (messages && history.length > 0) {
    messages.innerHTML = "";

    history.forEach(item => {
      const text = item.parts
        .map(part => part.text || "")
        .join("");

      if (text) {
        addMessage(
          text,
          item.role === "user" ? "user" : "ai"
        );
      }
    });
  }

  async function getAnswer(text) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: history.slice(-MAX_HISTORY),
        memory: memory
      })
    });

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      console.error("Sunucu yanıtı okunamadı:", error);
    }

    if (!response.ok) {
      const error = new Error(
        data.error || "Sunucu hatası."
      );
      error.status = response.status;
      throw error;
    }

    return data.reply ||
      "NEXA-AL bu istekte cevap oluşturamadı.";
  }

  async function sendMessage() {
    if (!input || isSending) return;

    const text = input.value.trim();
    if (!text) return;

    isSending = true;

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";
    }

    addMessage(text, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.className = "nexa-msg ai";
    loading.textContent = "NEXA-AL düşünüyor...";

    if (messages) {
      messages.appendChild(loading);
      messages.scrollTop = messages.scrollHeight;
    }

    // Önceki geçmişi istekten önce koru.
    const previousHistory = [...history];

    try {
      const answer = await getAnswer(text);

      if (loading.parentNode) loading.remove();
      addMessage(answer, "ai");

      history.push({
        role: "user",
        parts: [{ text }]
      });

      history.push({
        role: "model",
        parts: [{ text: answer }]
      });

      history = history.slice(-MAX_HISTORY);
      saveHistory();

    } catch (error) {
      if (loading.parentNode) loading.remove();

      // Başarısız mesajı konuşma geçmişine ekleme.
      history = previousHistory;

      console.error("NEXA-AL hatası:", error);

      let message =
        "NEXA-AL bağlantısında geçici bir sorun oluştu.";

      if (error.status === 429) {
        message =
          "Ücretsiz kullanım kotası dolmuş olabilir. " +
          "Biraz sonra tekrar dene.";
      } else if (error.status === 503) {
        message =
          "Google modeli şu anda yoğun. Biraz sonra tekrar dene.";
      } else if (error.status >= 500) {
        message =
          "NEXA-AL sunucusunda geçici bir sorun oluştu.";
      }

      addMessage(message, "ai");
    } finally {
      isSending = false;

      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
      }

      if (input) input.focus();
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      alert("NEXA-AL menüsü yakında aktif olacak. 🚀");
    });
  }

  // İleride kullanıcı bilgilerini eklemek veya düzeltmek için.
  window.addNexaMemory = function (fact) {
    if (typeof fact !== "string" || !fact.trim()) return;

    const normalized = fact.trim();

    if (!memory.includes(normalized)) {
      memory.push(normalized);
      saveMemory();
    }
  };

  window.clearNexaMemory = function () {
    history = [];
    memory = [];

    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(MEMORY_KEY);

    if (messages) messages.innerHTML = "";

    console.log("NEXA-AL hafızası temizlendi.");
  };

  console.log(
    "NEXA-AL hazır. Konuşma:",
    history.length,
    "mesaj; kayıtlı bilgi:",
    memory.length
  );
});

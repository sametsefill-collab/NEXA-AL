document.addEventListener("DOMContentLoaded", function () {

  console.log("NEXA-AL başlatıldı.");

  const startBtn = document.getElementById("startBtn");
  const exploreBtn = document.getElementById("exploreBtn");
  const aiBtn = document.getElementById("aiBtn");
  const menuBtn = document.getElementById("menuBtn");

  // BAŞLA
  if (startBtn) {
    startBtn.addEventListener("click", function () {
      document.querySelector(".features").scrollIntoView({
        behavior: "smooth"
      });
    });
  }

  // KEŞFET
  if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
      document.querySelector(".features").scrollIntoView({
        behavior: "smooth"
      });
    });
  }

  // AI BUTONU
  if (aiBtn) {
    aiBtn.addEventListener("click", function () {
      alert("NEXA-AL AI yakında aktif olacak! ✨");
    });
  }

  // MENÜ
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      alert("NEXA-AL menüsü yakında aktif olacak. 🚀");
    });
  }

});

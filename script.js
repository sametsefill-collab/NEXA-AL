document.addEventListener("DOMContentLoaded", function () {
  console.log("NEXA-AL başlatıldı.");

  const title = document.querySelector("h1");

  if (title) {
    title.addEventListener("click", function () {
      alert("NEXA-AL'a hoş geldin!");
    });
  }
});

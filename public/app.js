/* Sakshi Suit Collection — App JavaScript */

document.addEventListener("DOMContentLoaded", () => {
  // Automatically update the footer year.
  const year = document.querySelector("[data-current-year]");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Smooth navigation for links within the page.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  console.log("Sakshi Suit Collection website loaded.");
});

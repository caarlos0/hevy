const copyButtons = document.querySelectorAll("[data-copy]");

copyButtons.forEach((button) => {
  const original = button.innerHTML;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "COPIED";
      button.setAttribute("aria-label", "Copied to clipboard");
      window.setTimeout(() => {
        button.innerHTML = original;
        button.setAttribute("aria-label", `Copy ${button.dataset.copy} command`);
      }, 1600);
    } catch {
      button.textContent = "SELECT";
      const code = button.closest(".install-command, .install-option")?.querySelector("code");
      if (code) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  });
});

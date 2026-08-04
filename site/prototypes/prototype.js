const variants = ["chrome", "pixel", "schematic"];
const params = new URLSearchParams(location.search);
const initial = variants.includes(params.get("v")) ? params.get("v") : "chrome";

function setVariant(variant, updateHistory = true) {
  document.body.className = `v-${variant}`;
  document.querySelectorAll("[data-variant]").forEach((button) => {
    const active = button.dataset.variant === variant;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  if (updateHistory) history.replaceState(null, "", `?v=${variant}`);
}

setVariant(initial, false);

document.querySelectorAll("[data-variant]").forEach((button, index, buttons) => {
  button.addEventListener("click", () => setVariant(button.dataset.variant));
  button.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    setVariant(buttons[next].dataset.variant);
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const original = button.innerHTML;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "OK";
      button.setAttribute("aria-label", "Install command copied");
    } catch {
      const code = button.closest(".install").querySelector("code");
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "SELECTED";
    }
    setTimeout(() => { button.innerHTML = original; button.setAttribute("aria-label", "Copy install command"); }, 1400);
  });
});

const rep = document.querySelector("#rep-count");
const squatStage = document.querySelector(".robot-stage");
const upperBody = document.querySelector('[data-squat-part="upper-body"]');
const barbell = document.querySelector('[data-squat-part="barbell"]');
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const repDuration = 3200;
let count = 4;
let visible = true;
let previousCycle = -1;

const legs = [
  { side: "left", hip: [231, 326], ankle: [219, 474], outward: -1 },
  { side: "right", hip: [289, 326], ankle: [301, 474], outward: 1 },
].map((config) => {
  const leg = document.querySelector(`[data-squat-leg="${config.side}"]`);
  return {
    ...config,
    path: leg.querySelector(".leg-link"),
    hipJoint: leg.querySelector(".hip"),
    kneeJoint: leg.querySelector(".knee"),
  };
});

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function squatDepth(progress) {
  if (progress < 0.12 || progress >= 0.88) return 0;
  if (progress < 0.42) return smoothstep((progress - 0.12) / 0.3);
  if (progress < 0.6) return 1;
  return 1 - smoothstep((progress - 0.6) / 0.28);
}

function solveKnee(hip, ankle, outward) {
  const thigh = 83.3;
  const shin = 72.3;
  const dx = ankle[0] - hip[0];
  const dy = ankle[1] - hip[1];
  const distance = Math.hypot(dx, dy);
  const along = (thigh ** 2 - shin ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, thigh ** 2 - along ** 2));
  const centerX = hip[0] + (along * dx) / distance;
  const centerY = hip[1] + (along * dy) / distance;
  return [
    centerX + outward * height * (dy / distance),
    centerY - outward * height * (dx / distance),
  ];
}

function poseRobot(depth) {
  const drop = 60 * depth;
  const transform = `translate(0 ${drop.toFixed(2)})`;
  upperBody.setAttribute("transform", transform);
  barbell.setAttribute("transform", transform);

  legs.forEach(({ hip, ankle, outward, path, hipJoint, kneeJoint }) => {
    const posedHip = [hip[0], hip[1] + drop];
    const knee = solveKnee(posedHip, ankle, outward);
    path.setAttribute("d", `M${posedHip[0]} ${posedHip[1].toFixed(2)} L${knee[0].toFixed(2)} ${knee[1].toFixed(2)} L${ankle[0]} ${ankle[1]}`);
    hipJoint.setAttribute("cy", posedHip[1].toFixed(2));
    kneeJoint.setAttribute("cx", knee[0].toFixed(2));
    kneeJoint.setAttribute("cy", knee[1].toFixed(2));
  });
}

function animateSquat(timestamp) {
  if (!document.hidden && visible && !reducedMotion.matches) {
    const cycle = Math.floor(timestamp / repDuration);
    const progress = (timestamp % repDuration) / repDuration;
    poseRobot(squatDepth(progress));
    if (previousCycle >= 0 && cycle !== previousCycle) {
      count = count === 5 ? 1 : count + 1;
      rep.textContent = String(count).padStart(2, "0");
    }
    previousCycle = cycle;
  }
  requestAnimationFrame(animateSquat);
}

new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
}).observe(squatStage);

reducedMotion.addEventListener("change", () => poseRobot(0));
poseRobot(0);
requestAnimationFrame(animateSquat);

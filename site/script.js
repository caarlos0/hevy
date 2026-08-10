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

const rep = document.querySelector("#rep-count");
const squatStage = document.querySelector(".robot-stage");
const liftedLoad = document.querySelector('[data-squat-part="lifted-load"]');
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const repDuration = 3200;
let repCount = 4;
let stageVisible = false;
let previousCycle = -1;
let animationFrame = null;
let animationStart = null;
const legs = [
  { side: "left", hip: [231, 326], ankle: [219, 474], outward: -1 },
  { side: "right", hip: [289, 326], ankle: [301, 474], outward: 1 },
].map((config) => {
  const leg = document.querySelector(`[data-squat-leg="${config.side}"]`);
  return {
    ...config,
    path: leg?.querySelector(".leg-link"),
    hipJoint: leg?.querySelector(".hip"),
    kneeJoint: leg?.querySelector(".knee"),
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
  if (!liftedLoad) return;
  const drop = 60 * depth;
  const transform = `translate(0 ${drop.toFixed(2)})`;
  liftedLoad.setAttribute("transform", transform);
  legs.forEach(({ hip, ankle, outward, path, hipJoint, kneeJoint }) => {
    if (!path || !hipJoint || !kneeJoint) return;
    const posedHip = [hip[0], hip[1] + drop];
    const knee = solveKnee(posedHip, ankle, outward);
    path.setAttribute(
      "d",
      `M${posedHip[0]} ${posedHip[1].toFixed(2)} L${knee[0].toFixed(2)} ${knee[1].toFixed(2)} L${ankle[0]} ${ankle[1]}`,
    );
    hipJoint.setAttribute("cy", posedHip[1].toFixed(2));
    kneeJoint.setAttribute("cx", knee[0].toFixed(2));
    kneeJoint.setAttribute("cy", knee[1].toFixed(2));
  });
}
function animateSquat(timestamp) {
  if (!shouldAnimate()) {
    stopSquat();
    return;
  }
  animationStart ??= timestamp;
  const elapsed = timestamp - animationStart;
  const cycle = Math.floor(elapsed / repDuration);
  poseRobot(squatDepth((elapsed % repDuration) / repDuration));
  if (previousCycle >= 0 && cycle !== previousCycle && rep) {
    repCount = repCount === 5 ? 1 : repCount + 1;
    rep.textContent = String(repCount).padStart(2, "0");
  }
  previousCycle = cycle;
  animationFrame = requestAnimationFrame(animateSquat);
}
function shouldAnimate() {
  return Boolean(squatStage && stageVisible && !document.hidden && !reducedMotion.matches);
}
function startSquat() {
  if (animationFrame !== null || !shouldAnimate()) return;
  animationStart = null;
  previousCycle = -1;
  animationFrame = requestAnimationFrame(animateSquat);
}
function stopSquat() {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  animationStart = null;
  previousCycle = -1;
  poseRobot(0);
}
function syncSquat() {
  if (shouldAnimate()) startSquat();
  else stopSquat();
}
if (squatStage) {
  new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting;
    syncSquat();
  }).observe(squatStage);
}
document.addEventListener("visibilitychange", syncSquat);
reducedMotion.addEventListener("change", syncSquat);
poseRobot(0);

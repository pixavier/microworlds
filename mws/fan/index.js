const split = document.getElementById("split");
const divider = document.getElementById("divider");

const rootStyles = getComputedStyle(document.documentElement);
const gutter = Number.parseFloat(rootStyles.getPropertyValue("--gutter")) || 10;
const minPane = Number.parseFloat(rootStyles.getPropertyValue("--min-pane")) || 240;

let activePointerId = null;
let leftRatio = 0.5;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function getBounds() {
  const rect = split.getBoundingClientRect();
  const availableWidth = Math.max(0, rect.width - gutter);
  const effectiveMinimum = Math.min(minPane, availableWidth / 2);

  return {
    rect,
    availableWidth,
    minimumLeft: effectiveMinimum,
    maximumLeft: availableWidth - effectiveMinimum,
  };
}

function applyLeftWidth(requestedLeftWidth) {
  const { availableWidth, minimumLeft, maximumLeft } = getBounds();

  if (availableWidth <= 0) {
    return;
  }

  const leftWidth = clamp(requestedLeftWidth, minimumLeft, maximumLeft);
  const rightWidth = availableWidth - leftWidth;

  split.style.gridTemplateColumns = `${leftWidth}px ${gutter}px ${rightWidth}px`;
  leftRatio = leftWidth / availableWidth;
  divider.setAttribute("aria-valuenow", String(Math.round(leftRatio * 100)));
}

function setColumnsFromPointer(clientX) {
  const { rect } = getBounds();
  applyLeftWidth(clientX - rect.left);
}

function startDrag(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  activePointerId = event.pointerId;
  document.body.classList.add("dragging");

  try {
    divider.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is optional; document-level listeners still handle dragging.
  }

  setColumnsFromPointer(event.clientX);
  event.preventDefault();
}

function moveDrag(event) {
  if (activePointerId === null || activePointerId !== event.pointerId) {
    return;
  }

  setColumnsFromPointer(event.clientX);
  event.preventDefault();
}

function endDrag(event) {
  if (activePointerId === null || activePointerId !== event.pointerId) {
    return;
  }

  document.body.classList.remove("dragging");

  try {
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
  } catch {
    // The pointer may already have been released by the browser.
  }

  activePointerId = null;
}

function handleKeyboard(event) {
  const { availableWidth } = getBounds();
  const currentLeft = availableWidth * leftRatio;
  const step = event.shiftKey ? 50 : 10;
  let nextLeft = currentLeft;

  switch (event.key) {
    case "ArrowLeft":
      nextLeft -= step;
      break;
    case "ArrowRight":
      nextLeft += step;
      break;
    case "Home":
      nextLeft = 0;
      break;
    case "End":
      nextLeft = availableWidth;
      break;
    default:
      return;
  }

  applyLeftWidth(nextLeft);
  event.preventDefault();
}

divider.addEventListener("pointerdown", startDrag);
document.addEventListener("pointermove", moveDrag, { passive: false });
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
divider.addEventListener("lostpointercapture", () => {
  if (activePointerId !== null) {
    document.body.classList.remove("dragging");
    activePointerId = null;
  }
});
divider.addEventListener("keydown", handleKeyboard);

window.addEventListener("resize", () => {
  const { availableWidth } = getBounds();
  applyLeftWidth(availableWidth * leftRatio);
});

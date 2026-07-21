let lockDepth = 0;
let savedOverflow = "";
let savedPaddingRight = "";
let savedLenisStop: (() => void) | null = null;
let savedLenisStart: (() => void) | null = null;

function applyLockedStyle() {
  savedOverflow = document.body.style.overflow;
  savedPaddingRight = document.body.style.paddingRight;
  document.body.style.overflow = "hidden";
}

function restoreLockedStyle() {
  document.body.style.overflow = savedOverflow;
  document.body.style.paddingRight = savedPaddingRight;
  savedOverflow = "";
  savedPaddingRight = "";
}

export function lockBodyScroll(opts?: { onStop?: () => void; onStart?: () => void }) {
  if (lockDepth === 0) {
    applyLockedStyle();
    savedLenisStop = opts?.onStop ?? null;
    savedLenisStart = opts?.onStart ?? null;
    savedLenisStop?.();
  } else if (opts?.onStop) {
    savedLenisStop = opts.onStop;
    opts.onStop();
  }
  lockDepth += 1;
}

export function unlockBodyScroll() {
  if (lockDepth <= 0) return;
  lockDepth -= 1;
  if (lockDepth === 0) {
    restoreLockedStyle();
    savedLenisStart?.();
    savedLenisStop = null;
    savedLenisStart = null;
  }
}

export function isBodyScrollLocked() {
  return lockDepth > 0;
}
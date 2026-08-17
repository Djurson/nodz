import { useEffect, useRef, useState } from "react";
import { SpinnerIcon } from "@phosphor-icons/react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/hooks/app/hook";

const MIN_VISIBLE_MS = 10;

// Keeps `active` visible for at least minMs once it turns true, even if the
// underlying condition flips back to false sooner. Without this, a fast
// repo scan can complete inside a single React commit — the true/false
// state transition gets batched together and the loading UI never actually
// paints a visible frame, so "click a repo" appears to do nothing for an
// instant before the repository view just appears.
function useMinVisible(active: boolean, minMs: number) {
  const [show, setShow] = useState(active);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      shownAt.current = Date.now();
      setShow(true);
      return;
    }
    const elapsed = shownAt.current ? Date.now() - shownAt.current : minMs;
    const timeout = setTimeout(() => setShow(false), Math.max(0, minMs - elapsed));
    return () => clearTimeout(timeout);
  }, [active, minMs]);

  return show;
}

const LOADING_MESSAGES = [
  "Vibing with your packages",
  "Questioning your architecture choices",
  "Taking a break because this repository is exhausting",
  "This would load faster if your code was better",
  "Bribing the garbage collector",
  "Googling how to center a div",
  // "Negotiating with node_modules",
  "Blaming the intern",
  "Honestly, I'm just as surprised it's taking this long",
  "Have to download more RAM",
  "Almost there (probably)",
];

const ROTATE_MS = 2000;
const FADE_MS = 200;

// Picks a random index other than current (so it never "rotates" to the
// same message twice in a row — with plain Math.random() that's a visible,
// annoying repeat roughly 1 in LOADING_MESSAGES.length of the time).
function randomNextIndex(current: number) {
  if (LOADING_MESSAGES.length <= 1) return 0;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return next;
}

// Rotates through LOADING_MESSAGES in random order while active, fading out
// the current one before swapping to the next and fading it back in.
// Always starts from message 0 ("Scanning files…") each time a fresh load
// starts.
function useRotatingMessage(active: boolean) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  // False on mount/reset, so the very first message has no transition class
  // on it at all — guaranteed no fade-in, rather than relying on visible
  // already being true (fragile: still fades if anything nudges a style
  // recompute before first paint). Flips true shortly after activation,
  // well before the first actual fade (see the effect below).
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Unconditional, on every change of `active` in either direction — not
    // just when turning on. This component never truly unmounts (it's
    // always rendered; the parent just returns null while inactive), so if
    // `visible` was left false mid fade-out from a previous close, the next
    // open would otherwise start from opacity-0 and visibly fade back in
    // for what looks like "the first message," but is really stale state
    // from last time.
    setIndex(0);
    setVisible(true);
    setAnimated(false);

    if (!active) return;

    // Enable the transition class well before the first fade actually
    // happens (the first interval tick, ROTATE_MS later), rather than
    // flipping it on in the same update as the first opacity change. Keeps
    // "enable transitions" and "start the fade" as two separately-committed
    // steps, so the very first fade-out can't race the transition property
    // being registered in the same style recalc as the opacity change.
    setAnimated(true);

    let fadeTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => randomNextIndex(i));
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, [active]);

  return { message: LOADING_MESSAGES[index], visible, animated };
}

// Shown while selectRepository's OpenRepository call is in flight. Backend
// emits repo:scan-progress as it walks a repo's files (see
// app_repository.go), so this can show a real percentage once at least one
// event has arrived, not just an indeterminate spinner.
export function OpeningRepositoryOverlay() {
  const { loading, scanProgress } = useAppContext();
  const show = useMinVisible(loading.selectedDirectory, MIN_VISIBLE_MS);
  const { message, visible, animated } = useRotatingMessage(show);
  if (!show) return null;

  const percent = scanProgress && scanProgress.total > 0 ? Math.round((scanProgress.done / scanProgress.total) * 100) : null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <SpinnerIcon className="size-8 animate-spin text-foreground" />
      {percent !== null && (
        <div className="flex w-64 flex-col gap-1.5">
          <Progress value={percent} />
          <span className="text-center text-xs text-muted-foreground tabular-nums">
            {scanProgress!.done} of {scanProgress!.total} files ({percent}%)
          </span>
        </div>
      )}
      <p className={cn("text-sm font-medium text-foreground will-change-[opacity]", animated && "transition-opacity ease-in-out", visible ? "opacity-100" : "opacity-0")} style={animated ? { transitionDuration: `${FADE_MS}ms` } : undefined}>
        {message}
      </p>
    </div>
  );
}

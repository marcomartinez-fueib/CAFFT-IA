import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour of a modal dialog (WCAG 2.1.2, 2.4.3): the focus moves
 * into it when it opens and stays inside while it is open, Escape closes it
 * (unless `onClose` is omitted, for a dialog that needs an answer), and the
 * focus goes back to where it was when it closes.
 *
 *   const dialog = useDialog(() => setOpen(false));
 *   <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="…">
 */
export function useDialog(onClose?: () => void) {
  const node = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const el = node.current;
    if (!el) return;
    if (e.key === 'Escape' && close.current) {
      e.stopPropagation();
      close.current();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((i) => i.offsetParent !== null || i === document.activeElement);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // A callback ref: it runs when the dialog appears and disappears.
  const returnTo = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        returnTo.current = document.activeElement as HTMLElement | null;
        node.current = el;
        document.addEventListener('keydown', onKeyDown, true);
        // After the dialog's own effects (e.g. an input focused on purpose).
        requestAnimationFrame(() => {
          if (!el.contains(document.activeElement)) {
            const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE);
            if (target) target.focus();
            else {
              el.tabIndex = -1;
              el.focus();
            }
          }
        });
      } else {
        document.removeEventListener('keydown', onKeyDown, true);
        node.current = null;
        returnTo.current?.focus?.();
      }
    },
    [onKeyDown],
  );

  useEffect(() => () => document.removeEventListener('keydown', onKeyDown, true), [onKeyDown]);
  return ref;
}

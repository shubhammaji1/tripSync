'use client';

import { HTMLAttributes, useEffect, useRef } from 'react';

/** Shared focus and keyboard behavior for the existing modal layouts. */
export function AccessibleOverlay({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const title = root.querySelector<HTMLElement>('h1,h2,h3,h4');
    if (title) {
      title.id ||= `dialog-title-${crypto.randomUUID()}`;
      root.setAttribute('aria-labelledby', title.id);
    } else root.setAttribute('aria-label', 'TripSync dialog');
    const close = root.querySelector('svg.lucide-x')?.closest('button') || Array.from(root.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Cancel');
    close?.setAttribute('aria-label', 'Close dialog');
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    (focusable()[0] || root).focus();
    const keydown = (event: KeyboardEvent) => {
      const dialogs = Array.from(document.querySelectorAll('[aria-modal="true"]'));
      if (dialogs[dialogs.length - 1] !== root) return;
      if (event.key === 'Escape' && close) { event.preventDefault(); close.click(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0], last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); root.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div {...props} ref={ref} role="dialog" aria-modal="true" tabIndex={-1}>{children}</div>;
}

'use client';

import { useEffect } from 'react';

export function FormAccessibility() {
  useEffect(() => {
    const associate = () => {
      document.querySelectorAll<HTMLLabelElement>('label:not([for])').forEach(label => {
        const control = label.querySelector<HTMLInputElement>('input,select,textarea') || label.parentElement?.querySelector<HTMLInputElement>('input,select,textarea');
        if (!control || control.closest('label') && control.closest('label') !== label) return;
        control.id ||= `field-${crypto.randomUUID()}`;
        label.htmlFor = control.id;
      });
      document.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
        if (!button.textContent?.trim() && !button.hasAttribute('aria-label')) {
          const icon = button.querySelector('svg');
          const name = button.title || (icon?.classList.contains('lucide-x') ? 'Close' : icon?.classList.contains('lucide-trash-2') ? 'Delete' : icon?.classList.contains('lucide-pencil') ? 'Edit' : 'Action');
          button.setAttribute('aria-label', name);
        }
      });
    };
    associate();
    const observer = new MutationObserver(associate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

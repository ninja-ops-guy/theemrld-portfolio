import { useEffect, useRef } from 'react';

interface TextDecodeOptions {
  duration?: number;
  speed?: number;
  charset?: string;
  staggerPerChar?: number;
  trigger?: 'auto' | 'scroll' | 'manual';
}

const defaults: Required<TextDecodeOptions> = {
  duration: 2.5,
  speed: 20,
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  staggerPerChar: 0.08,
  trigger: 'auto',
};

export class TextDecodeReveal {
  el: HTMLElement;
  originalText: string;
  options: Required<TextDecodeOptions>;
  chars: { el: HTMLSpanElement; original: string; resolved: boolean; totalDelay?: number; settleTime?: number }[] = [];
  intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(element: HTMLElement, options: TextDecodeOptions = {}) {
    this.el = element;
    this.originalText = this.el.textContent || '';
    this.options = Object.assign({}, defaults, options);
    this._init();
  }

  _randomChar(): string {
    return this.options.charset.charAt(Math.floor(Math.random() * this.options.charset.length));
  }

  _init() {
    this.el.innerHTML = '';
    this.chars = [];
    for (let i = 0; i < this.originalText.length; i++) {
      const char = this.originalText[i];
      const span = document.createElement('span');
      span.className = 'decode-char';
      if (char === ' ') span.innerHTML = '&nbsp;';
      else span.textContent = this._randomChar();
      this.el.appendChild(span);
      this.chars.push({ el: span, original: char, resolved: false });
    }
    if (this.options.trigger === 'auto') setTimeout(() => this.animate(), 100);
  }

  animate() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    const startTime = performance.now();
    for (let i = 0; i < this.chars.length; i++) {
      const c = this.chars[i];
      c.totalDelay = i * this.options.staggerPerChar * 1000;
      c.settleTime = startTime + c.totalDelay + this.options.duration * 1000;
      c.resolved = false;
      if (c.original !== ' ') c.el.textContent = this._randomChar();
    }
    this.intervalId = setInterval(() => {
      const now = performance.now();
      let allResolved = true;
      for (let i = 0; i < this.chars.length; i++) {
        const c = this.chars[i];
        if (now >= (c.settleTime || 0)) {
          c.el.textContent = c.original === ' ' ? '\u00A0' : c.original;
          c.el.classList.add('resolved');
          c.resolved = true;
          continue;
        }
        c.el.textContent = this._randomChar();
        c.el.classList.remove('resolved');
        allResolved = false;
      }
      if (allResolved && this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    }, this.options.speed);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

export function useTextDecode(
  ref: React.RefObject<HTMLElement | null>,
  options: TextDecodeOptions = {}
) {
  const instanceRef = useRef<TextDecodeReveal | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const init = () => { if (!ref.current) return; instanceRef.current = new TextDecodeReveal(ref.current, options); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
    else init();
    return () => { instanceRef.current?.destroy(); };
  }, [ref]);
  return instanceRef;
}

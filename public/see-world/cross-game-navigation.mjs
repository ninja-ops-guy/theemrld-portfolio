// See World is hosted in a portfolio iframe. A real cross-game link must leave
// that shell, otherwise returning from the native game nests another portfolio.
// Keep the normal anchor/user gesture; never navigate from a received message.
const native = new URL('../../techops-hero/', import.meta.url);
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('a.native-link') : null;
  if (!target) return;
  const destination = new URL(target.href, location.href);
  if (destination.origin !== location.origin || destination.pathname !== native.pathname) return;
  target.target = '_top';
}, { capture: true });

// Keep loading recovery separate from the authority-owning linked application.
try {
  await import('./linked-app.mjs');
  try { await import('./presentation.mjs'); }
  catch (error) { console.warn('Presentation enhancement unavailable; the story reader remains active.', error); }
} catch (error) {
  const main = document.getElementById('content');
  main.replaceChildren();
  const title = document.createElement('h1'); title.textContent = 'The story reader could not open.';
  const text = document.createElement('p'); text.textContent = 'Your saved progress has not been changed. Check your connection and try again, or return to the media hub.';
  const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'primary'; retry.textContent = 'Try again'; retry.onclick = () => location.reload();
  const link = document.createElement('a'); link.href = '../#/links'; link.target = '_top'; link.textContent = 'Back to the media hub'; link.className = 'secondary';
  main.append(title, text, retry, link); main.classList.add('boot-message');
  document.getElementById('storage-status').textContent = 'The reader is unavailable. No progress was imported, reset, or awarded.';
  console.warn('Story reader load failed.', error);
}

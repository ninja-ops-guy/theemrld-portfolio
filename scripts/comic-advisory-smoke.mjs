export async function acknowledgeReaderAdvisory(page, expectation) {
  const warning = page.getByRole('dialog', { name: 'Parental advisory', exact: true });
  const artwork = page.locator('.comic-page-image');
  // Allow the old deployed build to have no advisory. The new edition requires it.
  if (expectation === 'legacy') {
    await warning.or(artwork).first().waitFor({ state: 'visible', timeout: 30000 });
    if (!(await warning.isVisible())) return false;
  } else if (expectation === 'already-acknowledged') {
    await artwork.waitFor({ state: 'visible', timeout: 30000 });
    if (await warning.isVisible()) throw new Error('Advisory repeated within the same session');
    return false;
  } else {
    await warning.waitFor({ state: 'visible', timeout: 30000 });
  }
  if (await artwork.count()) throw new Error('Comic image mounted before advisory acknowledgement');
  const text = await warning.innerText();
  if (!text.includes('Contains violence, mature language, and mature themes.')) throw new Error('Wrong parental advisory');
  await warning.getByRole('button', { name: 'Continue to comic', exact: true }).click();
  await warning.waitFor({ state: 'hidden', timeout: 15000 });
  return true;
}

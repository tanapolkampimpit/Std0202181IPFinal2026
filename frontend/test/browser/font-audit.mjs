import assert from 'node:assert/strict';

export async function auditFonts(page, screen) {
  const report = await page.evaluate(async () => {
    await document.fonts.ready;
    const mismatches = [];
    let checked = 0;
    for (const element of document.querySelectorAll('body *')) {
      if (element.closest('script,style,noscript,svg,[data-testid="tnpkhr-logo"],[aria-hidden="true"]') || !element.getClientRects().length) continue;
      const hasText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (!hasText && !element.matches('input,textarea')) continue;
      const family = getComputedStyle(element).fontFamily;
      if (/ionicons/i.test(family)) continue;
      checked += 1;
      if (!family.includes('NotoSansThai_')) mismatches.push({ text: element.textContent.slice(0, 60), family });
    }
    const logos = [...document.querySelectorAll('[data-testid="tnpkhr-logo"]')].map((element) => ({ text: element.textContent, family: getComputedStyle(element).fontFamily }));
    const thaiAndLatinLoaded = document.fonts.check('16px NotoSansThai_400Regular', 'พนักงาน Salary ฿123');
    return { checked, mismatches, logos, thaiAndLatinLoaded };
  });
  assert.ok(report.checked > 0, 'No text was checked');
  assert.deepEqual(report.mismatches, [], `${screen}: some text does not use Noto Sans`);
  assert.ok(report.thaiAndLatinLoaded, `${screen}: the bundled Thai/Latin font is not ready`);
  assert.ok(report.logos.length > 0 && report.logos.every((logo) => logo.text === 'TNPKHR' && !logo.family.includes('Noto')), `${screen}: logo font/branding changed unexpectedly`);
  return { screen, ...report };
}

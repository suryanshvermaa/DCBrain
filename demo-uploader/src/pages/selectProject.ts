/**
 * Shared helper: select the target project in a module page's header <select>.
 *
 * Every module page (RFIs, NCRs, Inspections, Commissioning, Change Orders,
 * Simulations, Reports) renders a header <select> whose options are valued by
 * project id and labelled by project name. On mount the page defaults to the
 * FIRST project; to guarantee records land in the intended project we explicitly
 * select it by label here, then give the page a beat to refetch its data.
 *
 * If the select isn't present yet (still loading) or already shows the target,
 * this is a safe no-op.
 */

import type { Page } from 'playwright';

export async function selectProjectOnPage(page: Page, name: string, settleMs = 800): Promise<void> {
  const select = page.locator('select').first();
  // Wait up to 5s for the select to appear, since the Next.js page fetches projects asynchronously.
  await select.waitFor({ state: 'attached', timeout: 5000 }).catch(() => undefined);

  if (!(await select.count())) return;

  // Only switch if the target label exists as an option; otherwise leave the
  // default selection (the page may only have one project).
  const option = select.locator('option', { hasText: name });
  if (!(await option.count())) return;

  const current = await select.inputValue().catch(() => '');
  await select.selectOption({ label: name }).catch(() => undefined);
  const after = await select.inputValue().catch(() => '');

  // Give the page's data-refetch effect time to run only if the value changed.
  if (current !== after) await page.waitForTimeout(settleMs);
}

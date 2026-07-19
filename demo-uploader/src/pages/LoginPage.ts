/**
 * Login page object.
 *
 * Mirrors frontend/src/app/login/page.tsx:
 *   - #email, #password, submit button "Sign in"
 *   - on success the app navigates away from /login (router.replace(next))
 *   - errors render in an amber box (role differs, so we detect by staying on /login)
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';

export class LoginPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/login', this.config.baseUrl).toString();
  }

  async login(): Promise<void> {
    const { email, password } = this.config.credentials;
    this.log.info(`Logging in as ${email}`);
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });

    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]:has-text("Sign in")');

    // Success = we leave /login. Give the SPA a moment to redirect.
    try {
      await this.page.waitForURL((u) => !u.pathname.startsWith('/login'), {
        timeout: this.config.timeoutMs,
      });
    } catch {
      const err = await this.readError();
      throw new Error(`Login failed${err ? `: ${err}` : ' (still on /login after submit)'}`);
    }
    this.log.success('Login successful');
  }

  private async readError(): Promise<string | null> {
    const box = this.page.locator('.text-amber-900, [class*="danger"]').first();
    if (await box.count()) {
      return (await box.innerText()).trim();
    }
    return null;
  }
}

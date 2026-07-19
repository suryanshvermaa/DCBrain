/**
 * Project selection / creation, driven through the Documents page header controls.
 *
 * Mirrors frontend/src/app/documents/page.tsx + CreateProjectModal.tsx:
 *   - header <select> lists projects by name
 *   - "New project" button opens CreateProjectModal
 *   - modal fields: Project name, Project code (uppercased), Location, Description
 *   - "Create" button (disabled until name>=2 && code>=2)
 */

import type { Page } from 'playwright';
import type { UploadConfig } from '../config.js';
import type { Logger } from '../logger.js';

export class ProjectPage {
  constructor(
    private readonly page: Page,
    private readonly config: UploadConfig,
    private readonly log: Logger,
  ) {}

  private url(): string {
    return new URL('/documents', this.config.baseUrl).toString();
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url(), { waitUntil: 'domcontentloaded' });
    // Wait for the project <select> in the header actions to be present.
    await this.page.waitForSelector('select', { timeout: this.config.timeoutMs });
  }

  /** Names currently present in the project <select>. */
  async listProjectNames(): Promise<string[]> {
    const options = this.page.locator('header select option, select option');
    const count = await options.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).textContent())?.trim();
      if (text && text !== 'No projects') names.push(text);
    }
    return names;
  }

  /**
   * Ensure the target project exists and is selected. Returns the resolved name.
   */
  async ensureSelected(): Promise<string> {
    await this.goto();
    const target = this.config.project.name;
    
    let names: string[] = [];
    for (let i = 0; i < 10; i++) {
      names = await this.listProjectNames();
      if (names.includes(target)) {
        await this.select(target);
        this.log.info(`Selected existing project: ${target}`);
        return target;
      }
      await this.page.waitForTimeout(500);
    }

    if (!this.config.project.createIfMissing) {
      throw new Error(
        `Project "${target}" not found and createIfMissing=false. Available: ${names.join(', ') || '(none)'}`,
      );
    }

    await this.createProject();
    // Re-read + select
    await this.page.waitForTimeout(500);
    await this.select(target);
    this.log.success(`Created and selected project: ${target}`);
    return target;
  }

  private async select(name: string): Promise<void> {
    const select = this.page.locator('select').first();
    await select.selectOption({ label: name });
  }

  private async createProject(): Promise<void> {
    const { name, code, location, description } = this.config.project;
    this.log.info(`Creating project "${name}" (${code})`);
    await this.page.click('button:has-text("New project")');
    await this.page.waitForSelector('h2:has-text("Create project")', { timeout: this.config.timeoutMs });

    await this.page.fill('input[placeholder="Data Centre Expansion"]', name);
    await this.page.fill('input[placeholder="DC-2026-001"]', code);
    if (location) await this.page.fill('input[placeholder="Mumbai"]', location);
    if (description) {
      await this.page.fill('textarea[placeholder="Scope, phase, or delivery notes"]', description);
    }

    await this.page.click('button:has-text("Create")');
    // Modal closes on success.
    await this.page.waitForSelector('h2:has-text("Create project")', {
      state: 'detached',
      timeout: this.config.timeoutMs,
    });
  }
}

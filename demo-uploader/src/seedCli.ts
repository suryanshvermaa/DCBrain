/**
 * DCBrain demo-record seeder — CLI entrypoint.
 *
 * Populates ONE module with a fixed set of realistic demo records through the
 * UI (no API/DB calls). Each module has its own package.json script:
 *
 *   pnpm seed:rfis           pnpm seed:commissioning
 *   pnpm seed:ncrs           pnpm seed:change-orders
 *   pnpm seed:inspections    pnpm seed:reports
 *   pnpm seed:simulations
 *
 * Under the hood each maps to:  tsx src/seedCli.ts --module <key>
 *
 * Flags (override DCBRAIN_* env, which override upload.config.ts):
 *   --module <key>     Which module to seed (required).
 *   --headless/--headed
 *   --base-url <url>   Frontend base URL.
 *   --project "<name>" Target project name.
 *   --delay-ms <n>     Delay between records.
 *   -h, --help
 */

import { resolveConfig, type CliOverrides } from './config.js';
import { Logger } from './logger.js';
import { MODULE_KEYS, SEED_COUNTS, type ModuleKey } from './seedData.js';

interface ParsedArgs {
  module?: ModuleKey;
  overrides: CliOverrides;
  help: boolean;
}

function isModuleKey(v: string): v is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(v);
}

function parseArgs(argv: string[]): ParsedArgs {
  const overrides: CliOverrides = {};
  let module: ModuleKey | undefined;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Missing value for ${arg}`);
      return v;
    };
    switch (arg) {
      case '--module': {
        const key = next();
        if (!isModuleKey(key)) {
          throw new Error(`Unknown module "${key}". Valid: ${MODULE_KEYS.join(', ')}`);
        }
        module = key;
        break;
      }
      case '--headless': overrides.headless = true; break;
      case '--headed': overrides.headless = false; break;
      case '--base-url': overrides.baseUrl = next(); break;
      case '--project': overrides.project = next(); break;
      case '--email': overrides.email = next(); break;
      case '--password': overrides.password = next(); break;
      case '--browser': overrides.browser = next() as CliOverrides['browser']; break;
      case '--delay-ms': overrides.uploadDelayMs = Number(next()); break;
      case '--timeout-ms': overrides.timeoutMs = Number(next()); break;
      case '--help': case '-h': help = true; break;
      default:
        if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return { module, overrides, help };
}

function printHelp(): void {
  const counts = MODULE_KEYS.map((k) => `${k} (${SEED_COUNTS[k]})`).join(', ');
  /* eslint-disable no-console */
  console.log(`DCBrain demo-record seeder

Creates a FIXED set of realistic demo records in ONE module, through the UI.
Each module is independent — seeding one never touches another.

Modules & fixed counts:
  ${counts}

Usage:
  tsx src/seedCli.ts --module <key>        (or use the pnpm seed:<key> scripts)

Flags:
  --module <key>     rfis | ncrs | inspections | commissioning | change-orders | simulations | reports
  --email <email>    Login email override
  --password <pass>  Login password override
  --headless/--headed
  --base-url <url>   Frontend base URL (default from upload.config.ts).
  --project "<name>" Target project (default from upload.config.ts).
  --delay-ms <n>     Delay between records (ms).
  --browser <engine> chromium | firefox | webkit.
  -h, --help

Records are created one at a time, verified through the UI, with a delay between
each and automatic 429 / rate-limit cooldown + retry (aborting if it persists).
`);
  /* eslint-enable no-console */
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printHelp();
    return;
  }
  if (!parsed.module) {
    printHelp();
    throw new Error('--module <key> is required.');
  }

  const config = resolveConfig(parsed.overrides);
  const log = new Logger();

  log.info(`Module: ${parsed.module} (${SEED_COUNTS[parsed.module]} record(s))`);
  log.info(`Target: ${config.baseUrl} | project "${config.project.name}" | headless=${config.headless}`);

  // Lazy import so --help never needs Playwright.
  const { Seeder } = await import('./seeder.js');
  const seeder = new Seeder({ config, log });
  const summary = await seeder.run(parsed.module);

  log.info('─'.repeat(48));
  log.success(
    `${summary.module}: ${summary.created}/${summary.total} created, ${summary.failed} failed, ` +
      `${summary.aborted ? 'ABORTED' : 'completed'} in ${Math.round(summary.durationMs / 1000)}s`,
  );

  process.exitCode = summary.aborted || summary.failed > 0 ? 1 : 0;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});

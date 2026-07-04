# Lessons Learned

- **Architecture:** Keep it simple during the hackathon. Modular monolith avoids distributed system bugs.
- **Database:** Full-text search in PostgreSQL saves adding Elasticsearch, keeping infrastructure light.
- **AI:** Don't use LLMs for embeddings; dedicated embedding models (BAAI) are faster and more accurate.
- **Environment validation:** Strict Zod schemas catch misconfiguration early, but placeholder secrets must themselves satisfy validation rules (e.g., JWT secret >= 32 chars) or the first boot will fail.
- **Docker Compose + `.env` precedence:** Shell environment variables override `.env` values when Compose interpolates variables. A stale shell variable caused JWT validation failures even after `.env` was updated.
- **ChromaDB client/server compatibility:** The JS client version can target a different API version than the server image exposes. Verify health checks with the actual HTTP endpoint rather than assuming the SDK method matches.
- **TypeScript path aliases in Node:** `NodeNext` module resolution does not reliably resolve path aliases for a runnable CommonJS/ESM build. Using `CommonJS` + `node` resolution lets `tsc` rewrite aliases and produces a working production build.
- **Tailwind v4 theme tokens:** Defining only a single `--color-primary` does not generate shade utilities like `bg-primary-600`. A full scale (`--color-primary-50` … `--color-primary-950`) is required for the dashboard color tokens to render.
- **Prisma migrations in repos:** Committing initial migration files makes `prisma migrate deploy` work in fresh clones; gitignoring them forces every new environment to recreate migrations.

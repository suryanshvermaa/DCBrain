# Lessons Learned

- **Architecture:** Keep it simple during the hackathon. Modular monolith avoids distributed system bugs.
- **Database:** Full-text search in PostgreSQL saves adding Elasticsearch, keeping infrastructure light.
- **AI:** Don't use LLMs for embeddings; dedicated embedding models (BAAI) are faster and more accurate.

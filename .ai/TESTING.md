# Testing Strategy

- **Unit Tests:** Jest + Vitest. Mock external dependencies. Test services, utils, components.
- **Integration Tests:** Supertest for API endpoints. Verify request/response contracts using a test DB.
- **E2E Tests:** Playwright for critical user flows (Login, Upload, Search, Chat, Simulation execution).
- **AI Pipeline Tests:** Automated evaluation framework for assessing Supervisor Agent routing accuracy and Simulation output validity.
- **Coverage:** Aim for 80% coverage on backend, 70% on frontend components.

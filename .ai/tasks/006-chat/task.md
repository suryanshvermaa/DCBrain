# Task 006: Chat Interface

## Overview
- **ID:** 006
- **Priority:** P0 (Critical)
- **Estimate:** 6 hours
- **Sprint:** 2
- **Dependencies:** 005 (RAG Search)
- **Status:** Not Started

## Objective

Build a conversational AI chat interface that leverages the RAG pipeline. Users can ask project questions in natural language, receive sourced answers, and maintain conversation context within a session. Supports document referencing and follow-up questions.

## Acceptance Criteria

- [ ] Chat session CRUD endpoints
- [ ] Message endpoint with AI response (`POST /api/v1/projects/{id}/chat/sessions/{sid}/messages`)
- [ ] Conversation context maintained within a session (last 10 messages)
- [ ] AI responses include source citations
- [ ] Suggested follow-up questions generated after each response
- [ ] Document referencing in queries
- [ ] Chat session list and history
- [ ] Chat export as PDF
- [ ] Database migrations for `chat_sessions` and `chat_messages` tables
- [ ] Frontend chat window with message list
- [ ] User message bubbles (right-aligned)
- [ ] Assistant message rendering with markdown and source cards
- [ ] Message input with send button
- [ ] Suggested question pills
- [ ] Chat session list sidebar
- [ ] Streaming response support (optional for hackathon)

## Reference Documents
- [API.md](../../API.md) — Chat endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Chat tables schema
- [COMPONENTS.md](../../COMPONENTS.md) — Chat module components
- [UI_GUIDELINES.md](../../UI_GUIDELINES.md) — Chat interface design

# Task 006: Chat Interface — Implementation Plan

## Execution Order

### Step 1: Database & Models (30 min)
1. [x] Create migrations for `chat_sessions` and `chat_messages` tables.
2. [x] Create Prisma models and Zod schemas.

### Step 2: Chat Service (90 min)
1. [x] Create `src/modules/chat/service.ts`.
2. [x] Implement session management (create, list, get, delete).
3. [x] Implement message handling with conversation context (last 10 messages).
4. [x] Integrate with RAG pipeline for sourced answers.
5. [x] Generate follow-up question suggestions via LLM.
6. [x] Track response time per message.

### Step 3: Chat API (45 min)
1. [x] Create `src/modules/chat/routes.ts` router.
2. [x] Implement all chat endpoints.
3. [x] Add Markdown/PDF export endpoint (P2 for hackathon; Markdown first).

### Step 4: Frontend Chat UI (120 min)
1. [x] Create `src/components/chat/ChatWindow.tsx`.
2. [x] Create `src/components/chat/MessageList.tsx` with auto-scroll.
3. [x] Create `src/components/chat/UserMessage.tsx`.
4. [x] Create `src/components/chat/AssistantMessage.tsx` with markdown rendering.
5. [x] Create `src/components/chat/MessageInput.tsx` with textarea.
6. [x] Create `src/components/chat/SourceCitation.tsx`.
7. [x] Create `src/components/chat/SuggestedQuestions.tsx`.
8. [x] Create `src/components/chat/ChatSessionList.tsx`.
9. [x] Create `src/app/projects/[id]/chat/page.tsx`.
10. [x] Create `src/lib/api/chat.ts` and `src/hooks/useChat.ts`.

## Validation
- [x] Start a new chat → session created.
- [x] Ask "What UPS systems are specified?" → AI answer with spec citations.
- [x] Follow up "What is the delivery schedule?" → contextual answer.
- [x] View chat history → previous sessions listed.
- [x] Click suggested question → auto-sends message.

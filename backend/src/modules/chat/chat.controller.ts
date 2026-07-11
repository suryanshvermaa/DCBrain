import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { runChatAgent } from './agent';
import type { Prisma } from '@prisma/client';

export async function createSession(projectId: string, userId: string, title?: string) {
  const session = await prisma.chatSession.create({
    data: {
      projectId,
      userId,
      title: title || 'New Chat',
    },
  });
  return session;
}

export async function listSessions(projectId: string, userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where: { projectId, userId },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.chatSession.count({ where: { projectId, userId } }),
  ]);
  return { sessions, total };
}

export async function getSessionMessages(sessionId: string, projectId: string, userId: string) {
  // Ensure session belongs to this project and user
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, projectId, userId },
  });
  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return messages;
}

export async function sendMessage(sessionId: string, projectId: string, userId: string, content: string) {
  // 1. Verify session
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, projectId, userId },
  });
  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  // 2. Save user message
  const userMsg = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'USER',
      content,
    },
  });

  // 3. Fetch recent message history for context (last 10 messages)
  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  history.reverse();

  // 4. Run LangGraph agent
  logger.info('Running chat agent', { sessionId, projectId, userId });
  const agentResponse = await runChatAgent(projectId, userId, history);

  // 5. Save assistant message
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'ASSISTANT',
      content: agentResponse.content,
      sources: agentResponse.sources as any,
      metadata: agentResponse.suggestedQuestions.length > 0 ? { suggestedQuestions: agentResponse.suggestedQuestions } : undefined,
    },
  });

  // 6. Update session updatedAt (and optionally title if it's the first message)
  const sessionUpdates: any = { updatedAt: new Date() };
  if (history.length <= 2 && session.title === 'New Chat') {
    // Basic heuristics to generate title, or just use the first 30 chars of content
    sessionUpdates.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
  }
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: sessionUpdates,
  });

  return assistantMsg;
}

export async function exportSessionAsPDF(sessionId: string, projectId: string, userId: string): Promise<Buffer> {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, projectId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      project: { select: { name: true } }
    }
  });

  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  return new Promise((resolve, reject) => {
    // Dynamic import to avoid issues if pdfkit is not bundled correctly, but standard import is fine
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (buffer: Buffer) => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(`Chat Export: ${session.title}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Project: ${session.project.name}`, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Messages
    session.messages.forEach(msg => {
      const isUser = msg.role === 'USER';
      
      // Clean up markdown syntax for plain text PDF
      const cleanContent = msg.content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/#/g, '');

      // Draw avatar/name header
      doc.font('Helvetica-Bold').fontSize(12).fillColor(isUser ? '#2563eb' : '#1e293b')
         .text(isUser ? 'You' : 'DCBrain Assistant', { continued: false });
      doc.moveDown(0.3);
      
      // Draw content box (indented slightly for readability)
      doc.font('Helvetica').fontSize(10).fillColor('#334155')
         .text(cleanContent.trim(), { indent: 10, align: 'left', lineGap: 2 });
      
      // Add sources if any
      if (!isUser && msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0) {
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b')
           .text('References:', { indent: 10 });
        doc.moveDown(0.2);
        msg.sources.forEach((src: any, i: number) => {
          // Parse out the filename if it's formatted like `Document: File.txt, Page: 1\nContent: ...`
          let sourceText = src.content.substring(0, 150).replace(/\n/g, ' ') + '...';
          doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8')
             .text(`[${i + 1}] ${sourceText}`, { indent: 15, lineGap: 1 });
        });
      }

      doc.moveDown(1.5);
    });

    doc.end();
  });
}

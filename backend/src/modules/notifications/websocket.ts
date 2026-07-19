// @ts-nocheck
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '@/modules/auth/security';
import config from '@/core/config';
import { logger } from '@/lib/logger';

// Store multiple connections per userId (for multi-tab support)
const activeConnections = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket: any, head: Buffer) => {
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
      
      if (url.pathname !== '/ws') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      // Basic Origin Validation
      const origin = req.headers.origin;
      if (origin && config.FRONTEND_URL && !origin.startsWith(config.FRONTEND_URL)) {
        logger.warn('WebSocket upgrade rejected: Invalid Origin', { origin, expected: config.FRONTEND_URL });
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      const token = url.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket upgrade rejected: Missing token');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Verify the JWT token
      const claims = verifyAccessToken(token);
      const userId = claims.sub;

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, userId);
      });
    } catch (err) {
      logger.error('WebSocket upgrade authentication failed', { error: err });
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, userId: string) => {
    logger.info('WebSocket connection established', { userId });

    // Add to active connections map
    let userSockets = activeConnections.get(userId);
    if (!userSockets) {
      userSockets = new Set();
      activeConnections.set(userId, userSockets);
    }
    userSockets.add(ws);

    // Keepalive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => {
      logger.info('WebSocket connection closed', { userId });
      clearInterval(pingInterval);

      const sockets = activeConnections.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          activeConnections.delete(userId);
        }
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket connection error', { userId, error: err });
    });
  });

  return wss;
}

export function sendRealTimeNotification(userId: string, notification: any): void {
  const userSockets = activeConnections.get(userId);
  if (!userSockets || userSockets.size === 0) {
    return;
  }

  const payload = JSON.stringify({
    event: 'notification',
    data: notification,
  });

  for (const socket of userSockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

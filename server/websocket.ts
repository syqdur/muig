import { WebSocketServer } from 'ws';
import { Server } from 'http';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  
  const clients = new Set();
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Function to broadcast updates to all connected clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client: any) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  };
  
  return { broadcast };
}
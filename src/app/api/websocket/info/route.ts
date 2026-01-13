import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/websocket/info:
 *   get:
 *     summary: Get WebSocket connection information
 *     description: Returns WebSocket server URL and connection details
 *     tags:
 *       - WebSocket
 *     responses:
 *       200:
 *         description: WebSocket connection information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wsUrl:
 *                   type: string
 *                   example: ws://194.163.172.56:3013
 *                 protocol:
 *                   type: string
 *                   example: WebSocket
 *                 connectionFormat:
 *                   type: string
 *                   example: ws://194.163.172.56:3013?instanceId={moduleId}
 *                 description:
 *                   type: string
 *                   example: Connect to WebSocket server with your module ID
 */
export async function GET() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://194.163.172.56:3013';
  
  return NextResponse.json({
    wsUrl,
    protocol: 'WebSocket',
    connectionFormat: `${wsUrl}?instanceId={moduleId}`,
    description: 'Connect to WebSocket server with your module ID',
  });
}

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Automa API Documentation',
      version: '1.0.0',
      description: `
# Automa IoT Device Control System

This API provides endpoints for managing IoT devices and WebSocket connections.

## WebSocket Connection

Connect to the WebSocket server to control devices in real-time:

\`\`\`
ws://194.163.172.56:3013?instanceId={moduleId}
\`\`\`

### WebSocket Message Format

**Send message to control device:**
\`\`\`json
{
  "id": "unique-message-id",
  "pin": { "13": 1 },
  "sender": "User-abc123"
}
\`\`\`

**Receive message:**
\`\`\`json
{
  "id": "unique-message-id",
  "pin": { "13": 1 },
  "sender": "User-abc123",
  "instanceId": "module-name",
  "timestamp": "2024-01-13T10:30:00.000Z"
}
\`\`\`

### PIN Values
- \`0\` = OFF
- \`1\` = ON
      `,
    },
    servers: [
      {
        url: 'http://194.163.172.56:3012',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3012',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'System',
        description: 'System health and status endpoints',
      },
      {
        name: 'WebSocket',
        description: 'WebSocket connection information',
      },
      {
        name: 'Device Control',
        description: 'Control IoT devices via REST API',
      },
    ],
    components: {
      schemas: {
        Device: {
          type: 'object',
          required: ['pin', 'state', 'label', 'icon'],
          properties: {
            pin: {
              type: 'number',
              description: 'GPIO PIN number',
              example: 13,
            },
            state: {
              type: 'boolean',
              description: 'Device state (on/off)',
              example: true,
            },
            label: {
              type: 'string',
              description: 'Device label/name',
              example: 'Living Room Light',
            },
            icon: {
              type: 'string',
              description: 'Device icon name',
              example: 'Lightbulb',
            },
          },
        },
        WebSocketMessage: {
          type: 'object',
          required: ['id', 'pin', 'sender'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique message ID',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            pin: {
              type: 'object',
              description: 'PIN state object (key: pin number, value: 0 or 1)',
              example: { '13': 1 },
              additionalProperties: {
                type: 'number',
                enum: [0, 1],
              },
            },
            sender: {
              type: 'string',
              description: 'Sender identifier',
              example: 'User-abc123',
            },
            instanceId: {
              type: 'string',
              description: 'Instance/Module ID (added by server)',
              example: 'living-room',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message timestamp (added by server)',
              example: '2024-01-13T10:30:00.000Z',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-13T10:30:00.000Z',
            },
          },
        },
        WebSocketInfo: {
          type: 'object',
          properties: {
            wsUrl: {
              type: 'string',
              example: 'ws://194.163.172.56:3013',
            },
            protocol: {
              type: 'string',
              example: 'WebSocket',
            },
            connectionFormat: {
              type: 'string',
              example: 'ws://194.163.172.56:3013?instanceId={moduleId}',
            },
            description: {
              type: 'string',
              example: 'Connect to WebSocket server with your module ID',
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

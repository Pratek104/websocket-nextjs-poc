import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/device/control:
 *   post:
 *     summary: Control a device
 *     description: Turn a device ON or OFF by specifying the PIN number and action
 *     tags:
 *       - Device Control
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *               - action
 *               - instanceId
 *             properties:
 *               pin:
 *                 type: number
 *                 description: GPIO PIN number
 *                 example: 13
 *               action:
 *                 type: string
 *                 enum: [ON, OFF]
 *                 description: Device action (ON or OFF)
 *                 example: ON
 *               instanceId:
 *                 type: string
 *                 description: Module/Instance ID
 *                 example: living-room
 *     responses:
 *       200:
 *         description: Device control command sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Device control command sent
 *                 data:
 *                   type: object
 *                   properties:
 *                     pin:
 *                       type: number
 *                       example: 13
 *                     action:
 *                       type: string
 *                       example: ON
 *                     state:
 *                       type: number
 *                       example: 1
 *                     instanceId:
 *                       type: string
 *                       example: living-room
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, action, instanceId } = body;

    // Validate parameters
    if (typeof pin !== 'number' || !action || !instanceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters. Required: pin (number), action (ON/OFF), instanceId (string)' 
        },
        { status: 400 }
      );
    }

    // Validate action
    if (action !== 'ON' && action !== 'OFF') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Action must be either ON or OFF' 
        },
        { status: 400 }
      );
    }

    // Convert action to state (ON = 1, OFF = 0)
    const state = action === 'ON' ? 1 : 0;

    // In a real implementation, you would send this to the WebSocket server
    // For now, we'll just return the formatted response
    return NextResponse.json({
      success: true,
      message: 'Device control command sent',
      data: {
        pin,
        action,
        state,
        instanceId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid JSON body' 
      },
      { status: 400 }
    );
  }
}

/**
 * @swagger
 * /api/device/control:
 *   get:
 *     summary: Get device control information
 *     description: Returns information about how to control devices
 *     tags:
 *       - Device Control
 *     responses:
 *       200:
 *         description: Device control information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 endpoint:
 *                   type: string
 *                   example: POST /api/device/control
 *                 description:
 *                   type: string
 *                   example: Control devices by sending PIN and action
 *                 format:
 *                   type: object
 *                   properties:
 *                     pin:
 *                       type: string
 *                       example: "number (e.g., 13)"
 *                     action:
 *                       type: string
 *                       example: "ON or OFF"
 *                     instanceId:
 *                       type: string
 *                       example: "module name"
 *                 example:
 *                   type: object
 *                   example:
 *                     pin: 13
 *                     action: ON
 *                     instanceId: living-room
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/device/control',
    description: 'Control devices by sending PIN and action',
    format: {
      pin: 'number (e.g., 13)',
      action: 'ON or OFF',
      instanceId: 'module name',
    },
    example: {
      pin: 13,
      action: 'ON',
      instanceId: 'living-room',
    },
  });
}

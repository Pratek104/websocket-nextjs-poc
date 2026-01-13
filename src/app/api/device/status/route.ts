import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/device/status:
 *   get:
 *     summary: Get device status
 *     description: Get the current status of a device by PIN number
 *     tags:
 *       - Device Control
 *     parameters:
 *       - in: query
 *         name: pin
 *         required: true
 *         schema:
 *           type: number
 *         description: GPIO PIN number
 *         example: 13
 *       - in: query
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module/Instance ID
 *         example: living-room
 *     responses:
 *       200:
 *         description: Device status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     pin:
 *                       type: number
 *                       example: 13
 *                     state:
 *                       type: number
 *                       example: 1
 *                     action:
 *                       type: string
 *                       example: ON
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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pin = searchParams.get('pin');
  const instanceId = searchParams.get('instanceId');

  if (!pin || !instanceId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Missing required parameters: pin and instanceId' 
      },
      { status: 400 }
    );
  }

  const pinNumber = parseInt(pin);
  if (isNaN(pinNumber)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'PIN must be a valid number' 
      },
      { status: 400 }
    );
  }

  // In a real implementation, you would query the actual device state
  // For now, we'll return a mock response
  const state: number = 0; // Mock state (0 or 1)
  const action = state === 1 ? 'ON' : 'OFF';

  return NextResponse.json({
    success: true,
    data: {
      pin: pinNumber,
      state,
      action,
      instanceId,
      timestamp: new Date().toISOString(),
    },
  });
}

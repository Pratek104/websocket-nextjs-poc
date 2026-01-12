import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices/[deviceId] - Get specific device
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const device = deviceStore.getDevice(deviceId);

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch device' },
      { status: 500 }
    );
  }
}

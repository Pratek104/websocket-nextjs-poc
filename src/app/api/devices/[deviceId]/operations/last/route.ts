import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices/[deviceId]/operations/last - Get last operation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const lastOperation = deviceStore.getLastOperation(deviceId);

    if (!lastOperation) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No operations found for this device',
      });
    }

    return NextResponse.json({
      success: true,
      data: lastOperation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch last operation' },
      { status: 500 }
    );
  }
}

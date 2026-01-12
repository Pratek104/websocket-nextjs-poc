import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices/[deviceId]/history - Get complete device history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const history = deviceStore.getDeviceHistory(deviceId);

    // Apply limit if specified
    if (limit) {
      history.operations = history.operations.slice(-limit);
      history.logs = history.logs.slice(-limit);
      history.interactions = history.interactions.slice(-limit);
    }

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch device history' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices/[deviceId]/logs - Get device logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const logs = deviceStore.getLogs(deviceId, limit);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// POST /api/devices/[deviceId]/logs - Add device log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const body = await request.json();
    const { level, message, metadata } = body;

    if (!level || !message) {
      return NextResponse.json(
        { success: false, error: 'level and message are required' },
        { status: 400 }
      );
    }

    const log = deviceStore.addLog({
      deviceId,
      level,
      message,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add log' },
      { status: 500 }
    );
  }
}

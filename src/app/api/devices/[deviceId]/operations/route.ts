import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices/[deviceId]/operations - Get device operations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const operations = deviceStore.getOperations(deviceId, limit);

    return NextResponse.json({
      success: true,
      data: operations,
      count: operations.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
}

// POST /api/devices/[deviceId]/operations - Create new operation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const body = await request.json();
    const { type, action, payload } = body;

    if (!type || !action) {
      return NextResponse.json(
        { success: false, error: 'type and action are required' },
        { status: 400 }
      );
    }

    const operation = deviceStore.addOperation({
      deviceId,
      type,
      action,
      payload,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      data: operation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create operation' },
      { status: 500 }
    );
  }
}

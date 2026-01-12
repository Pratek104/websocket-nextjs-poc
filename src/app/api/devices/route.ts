import { NextRequest, NextResponse } from 'next/server';
const { deviceStore } = require('@/lib/shared-device-store.js');

// GET /api/devices - Fetch all devices
export async function GET() {
  try {
    const devices = deviceStore.getAllDevices();
    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// POST /api/devices - Register a new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, metadata } = body;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const device = deviceStore.registerDevice(deviceId, metadata);
    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Simulating email sending logic
        console.log('Contact form submitted:', body);

        return NextResponse.json({
            success: true,
            message: 'Message received'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}

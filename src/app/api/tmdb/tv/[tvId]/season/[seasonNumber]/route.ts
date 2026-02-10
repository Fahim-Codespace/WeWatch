import { NextRequest, NextResponse } from 'next/server';
import { getSeasonDetails } from '@/lib/tmdb';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ tvId: string; seasonNumber: string }> }
) {
    const params = await props.params;
    try {
        const tvId = parseInt(params.tvId);
        const seasonNumber = parseInt(params.seasonNumber);

        if (isNaN(tvId) || isNaN(seasonNumber)) {
            return NextResponse.json(
                { error: 'Invalid TV ID or season number' },
                { status: 400 }
            );
        }

        const data = await getSeasonDetails(tvId, seasonNumber);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching season details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch season details' },
            { status: 500 }
        );
    }
}

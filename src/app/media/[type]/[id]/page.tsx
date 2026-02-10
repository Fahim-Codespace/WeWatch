import { notFound } from 'next/navigation';
import { getMovieDetails, getTVShowDetails } from '@/lib/tmdb';
import MediaDetailView from '@/components/MediaDetailView';

interface PageProps {
    params: Promise<{
        type: 'movie' | 'tv';
        id: string;
    }>;
}

export default async function MediaDetailPage(props: PageProps) {
    const params = await props.params;
    const { type, id } = params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
        notFound();
    }

    // Fetch media details with error handling
    let media;
    try {
        media = type === 'movie'
            ? await getMovieDetails(mediaId)
            : await getTVShowDetails(mediaId);
    } catch (error) {
        console.error('Error fetching media details:', error);
        notFound();
    }

    return <MediaDetailView media={media} type={type} />;
}

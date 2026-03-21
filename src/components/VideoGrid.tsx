import { useEffect, useState } from 'react';

interface Video {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

interface Props {
  lang: 'tl' | 'en';
  channelId: string;
  apiKey: string;
}

const translations = {
  tl: {
    loading: 'Naglo-load ng mga video...',
    error: 'Hindi ma-load ang mga video. Bisitahin ang aming YouTube channel.',
    noVideos: 'Wala pang mga video.',
    watchOnYt: 'Panoorin sa YouTube',
    subscribe: 'I-Subscribe sa YouTube',
  },
  en: {
    loading: 'Loading videos...',
    error: 'Could not load videos. Visit our YouTube channel.',
    noVideos: 'No videos yet.',
    watchOnYt: 'Watch on YouTube',
    subscribe: 'Subscribe on YouTube',
  },
};

export default function VideoGrid({ lang, channelId, apiKey }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=12&type=video`
        );
        if (!res.ok) throw new Error('YouTube API error');
        const data = await res.json();
        const items: Video[] = (data.items || []).map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        }));
        setVideos(items);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [channelId, apiKey]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--t-text-sec)' }}>
        {t.loading}
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--t-text-sec)' }}>
        <p>{error ? t.error : t.noVideos}</p>
        <a
          href={`https://www.youtube.com/channel/${channelId}`}
          target="_blank"
          rel="noopener"
          className="btn-primary"
          style={{ marginTop: '1rem', display: 'inline-flex' }}
        >
          {t.subscribe}
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.25rem',
    }}>
      {videos.map((v) => (
        <a
          key={v.id}
          href={`https://youtube.com/shorts/${v.id}`}
          target="_blank"
          rel="noopener"
          className="card card-hover"
          style={{
            overflow: 'hidden',
            textDecoration: 'none',
            display: 'block',
          }}
        >
          <div style={{ position: 'relative', paddingBottom: '177.78%', background: '#111' }}>
            <img
              src={v.thumbnail}
              alt={v.title}
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Play overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)',
              transition: 'background 0.2s',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white" opacity={0.85}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div style={{ padding: '0.75rem' }}>
            <p style={{
              color: 'var(--t-text)',
              fontSize: '0.875rem',
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {v.title}
            </p>
            <p style={{
              color: 'var(--t-text-sec)',
              fontSize: '0.75rem',
              margin: '0.25rem 0 0',
            }}>
              {new Date(v.publishedAt).toLocaleDateString(lang === 'tl' ? 'fil-PH' : 'en-US', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

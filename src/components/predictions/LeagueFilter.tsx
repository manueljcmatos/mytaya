interface League {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  leagues: League[];
  selectedLeague: string | null;
  onSelect: (leagueId: string | null) => void;
  lang: 'tl' | 'en';
}

const allLabel: Record<string, string> = {
  tl: 'Lahat',
  en: 'All',
};

export default function LeagueFilter({ leagues, selectedLeague, onSelect, lang }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      <style>{`.league-scroll::-webkit-scrollbar { display: none; }`}</style>
      <button
        onClick={() => onSelect(null)}
        className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        style={{
          backgroundColor: selectedLeague === null
            ? 'var(--brand-primary, #0F766E)'
            : 'var(--t-surface, #1f2937)',
          color: selectedLeague === null
            ? '#ffffff'
            : 'var(--t-text-sec, #9ca3af)',
          border: selectedLeague === null
            ? 'none'
            : '1px solid var(--t-border, #374151)',
        }}
      >
        {allLabel[lang] || 'All'}
      </button>

      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => onSelect(league.id)}
          className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: selectedLeague === league.id
              ? 'var(--brand-primary, #0F766E)'
              : 'var(--t-surface, #1f2937)',
            color: selectedLeague === league.id
              ? '#ffffff'
              : 'var(--t-text-sec, #9ca3af)',
            border: selectedLeague === league.id
              ? 'none'
              : '1px solid var(--t-border, #374151)',
          }}
        >
          {league.name}
        </button>
      ))}
    </div>
  );
}

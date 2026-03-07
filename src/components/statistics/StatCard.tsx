interface Props {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}

export default function StatCard({ title, value, subtitle, valueColor }: Props) {
  return (
    <div
      style={{
        backgroundColor: 'var(--t-bg-card, #1f2937)',
        border: '1px solid var(--t-border, #374151)',
        borderRadius: '12px',
        padding: '1.25rem',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: 'var(--t-text-sec, #9ca3af)',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.5rem',
          lineHeight: 1,
          color: valueColor || 'var(--t-text, #f9fafb)',
          marginBottom: subtitle ? '0.25rem' : 0,
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          style={{
            color: 'var(--t-text-sec, #9ca3af)',
            fontSize: '0.8125rem',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

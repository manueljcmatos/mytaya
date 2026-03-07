import { useState } from 'react';
import { leadSchema } from '../lib/schemas';
import { createClient } from '@supabase/supabase-js';

const translations = {
  tl: {
    heading: 'Makakuha ng libreng hula araw-araw',
    emailPlaceholder: 'Ilagay ang iyong email',
    subscribe: 'Mag-subscribe',
    success: 'Salamat sa pag-subscribe!',
    error: 'May nangyaring mali. Subukan ulit.',
    telegramCta: 'Sumali rin sa aming Telegram',
    comingSoon: 'Mag-subscribe sa lalong madaling panahon!',
  },
  en: {
    heading: 'Get free daily predictions',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    success: 'Thanks for subscribing!',
    error: 'Something went wrong. Try again.',
    telegramCta: 'Also join our Telegram',
    comingSoon: 'Subscribe coming soon!',
  },
} as const;

interface Props {
  lang: 'tl' | 'en';
}

export default function LeadCaptureForm({ lang }: Props) {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const result = leadSchema.safeParse({ email, lang });
    if (!result.success) {
      setErrorMsg(result.error.errors[0]?.message || t.error);
      return;
    }

    if (!hasSupabase) {
      setStatus('success');
      return;
    }

    setStatus('loading');

    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
      const { error } = await supabase
        .from('leads')
        .upsert(
          { email: result.data.email, lang: result.data.lang, source: 'website' },
          { onConflict: 'email' }
        );

      if (error) {
        setStatus('error');
        setErrorMsg(t.error);
      } else {
        setStatus('success');
      }
    } catch {
      setStatus('error');
      setErrorMsg(t.error);
    }
  };

  if (!hasSupabase && status !== 'success') {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--t-text)' }}>
          {t.heading}
        </h3>
        <p className="text-sm" style={{ color: 'var(--t-muted)' }}>
          {t.comingSoon}
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-3">&#x2705;</div>
        <p className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>
          {t.success}
        </p>
        <a
          href="https://t.me/mytaya"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0088cc' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          {t.telegramCta}
        </a>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--t-text)' }}>
        {t.heading}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder={t.emailPlaceholder}
          className="w-full sm:flex-1 px-4 py-3 rounded-lg border text-base outline-none transition-colors"
          style={{
            backgroundColor: 'var(--t-surface)',
            borderColor: errorMsg ? '#ef4444' : 'var(--t-border)',
            color: 'var(--t-text)',
          }}
          disabled={status === 'loading'}
          aria-label={t.emailPlaceholder}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary, #0F766E)' }}
        >
          {status === 'loading' ? '...' : t.subscribe}
        </button>
      </form>
      {errorMsg && (
        <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
      )}
    </div>
  );
}

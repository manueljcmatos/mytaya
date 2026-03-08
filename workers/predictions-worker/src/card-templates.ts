/**
 * HTML template builders for prediction and result cards.
 * These produce HTML strings compatible with Satori (workers-og) CSS subset.
 * All styles must be inline flexbox — Satori does not support CSS classes.
 */

export interface PredictionCardInput {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  pick: string;
  odds: number;
  confidence: 'high' | 'medium' | 'low';
  sport: 'football' | 'basketball';
}

export interface ResultCardInput {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  pick: string;
  result: 'win' | 'loss' | 'push';
  sport: 'football' | 'basketball';
}

/** Get sport-themed accent color */
function getAccentColor(sport: 'football' | 'basketball'): string {
  return sport === 'basketball' ? '#f97316' : '#0F766E';
}

/** Get confidence badge text and color */
function getConfidenceBadge(confidence: 'high' | 'medium' | 'low'): { text: string; color: string } {
  switch (confidence) {
    case 'high':
      return { text: 'HIGH', color: '#22C55E' };
    case 'medium':
      return { text: 'MED', color: '#F59E0B' };
    case 'low':
      return { text: 'LOW', color: '#EF4444' };
  }
}

/** Format match date for display */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Build HTML for a prediction card (1200x630).
 * Uses Satori-compatible inline flexbox styles.
 */
export function buildPredictionCardHtml(data: PredictionCardInput): string {
  const accent = getAccentColor(data.sport);
  const conf = getConfidenceBadge(data.confidence);
  const dateStr = formatDate(data.matchDate);

  return `
<div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #0A0A0A; color: white; font-family: Inter, sans-serif; padding: 0; margin: 0;">
  <!-- Top bar -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 32px 48px 16px 48px;">
    <div style="display: flex; align-items: baseline;">
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: ${accent}; letter-spacing: 2px;">MY</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: white; letter-spacing: 2px;">TAYA</span>
    </div>
    <span style="font-size: 24px; color: #9CA3AF; font-family: Inter, sans-serif;">${escapeHtml(data.league)}</span>
  </div>

  <!-- Center: Teams -->
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 0 48px;">
    <span style="font-family: 'Bebas Neue', sans-serif; font-size: 56px; color: white; text-align: center; letter-spacing: 1px;">${escapeHtml(data.homeTeam)}</span>
    <span style="font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #6B7280; margin: 8px 0;">VS</span>
    <span style="font-family: 'Bebas Neue', sans-serif; font-size: 56px; color: white; text-align: center; letter-spacing: 1px;">${escapeHtml(data.awayTeam)}</span>
  </div>

  <!-- Bottom accent bar -->
  <div style="display: flex; align-items: center; justify-content: space-between; background-color: ${accent}; padding: 20px 48px;">
    <div style="display: flex; align-items: center; gap: 24px;">
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: white; letter-spacing: 1px;">PICK: ${escapeHtml(data.pick.toUpperCase())}</span>
      <span style="font-size: 22px; color: rgba(255,255,255,0.9);">@ ${data.odds.toFixed(2)}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 18px; color: rgba(255,255,255,0.8); background-color: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 4px;">${conf.text}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 48px 24px 48px;">
    <span style="font-size: 18px; color: #6B7280;">mytaya.com</span>
    <span style="font-size: 18px; color: #6B7280;">${escapeHtml(dateStr)}</span>
  </div>
</div>`;
}

/**
 * Build HTML for a result card (1200x630).
 * Shows final score and WIN/LOSS/PUSH badge.
 */
export function buildResultCardHtml(data: ResultCardInput): string {
  const accent = getAccentColor(data.sport);
  const resultColors: Record<string, string> = {
    win: '#22C55E',
    loss: '#EF4444',
    push: '#F59E0B',
  };
  const resultColor = resultColors[data.result] ?? '#6B7280';
  const resultLabel = data.result.toUpperCase();

  return `
<div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #0A0A0A; color: white; font-family: Inter, sans-serif; padding: 0; margin: 0; border: 4px solid ${resultColor};">
  <!-- Top bar -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 32px 48px 16px 48px;">
    <div style="display: flex; align-items: baseline;">
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: ${accent}; letter-spacing: 2px;">MY</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: white; letter-spacing: 2px;">TAYA</span>
    </div>
    <span style="font-size: 24px; color: #9CA3AF; font-family: Inter, sans-serif;">${escapeHtml(data.league)}</span>
  </div>

  <!-- Center: Teams with scores -->
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 0 48px;">
    <div style="display: flex; align-items: center; gap: 32px;">
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: white; text-align: right; min-width: 300px;">${escapeHtml(data.homeTeam)}</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 72px; color: white;">${data.homeScore}</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #6B7280;">-</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 72px; color: white;">${data.awayScore}</span>
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: white; text-align: left; min-width: 300px;">${escapeHtml(data.awayTeam)}</span>
    </div>

    <!-- Result badge -->
    <div style="display: flex; align-items: center; justify-content: center; margin-top: 24px; padding: 12px 48px; background-color: ${resultColor}; border-radius: 8px;">
      <span style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: white; letter-spacing: 4px;">${resultLabel}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 48px 24px 48px;">
    <span style="font-size: 18px; color: #6B7280;">mytaya.com</span>
    <span style="font-size: 18px; color: #6B7280;">Pick: ${escapeHtml(data.pick.toUpperCase())}</span>
  </div>
</div>`;
}

/** Escape HTML special characters to prevent injection */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

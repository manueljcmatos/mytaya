// IMPORTANT: Verify PAGCOR licensing status and affiliate URLs before launch
// Operator data is placeholder — replace affiliate URLs with verified partner links

export interface Operator {
  slug: string;
  name: string;
  logo: string;
  welcomeBonus: { tl: string; en: string };
  description: { tl: string; en: string };
  review: { tl: string; en: string };
  affiliateUrl: string;
  pagcorLicensed: boolean;
  rating: number;
  features: string[];
  sportsCovered: string[];
}

export const operators: Operator[] = [
  {
    slug: 'bk8',
    name: 'BK8',
    logo: '/operators/bk8.png',
    welcomeBonus: {
      tl: '100% Welcome Bonus hanggang PHP 10,000',
      en: '100% Welcome Bonus up to PHP 10,000',
    },
    description: {
      tl: 'Isa sa mga pinakatanyag na sportsbook sa Pilipinas na may malawak na saklaw ng sports betting markets.',
      en: 'One of the most popular sportsbooks in the Philippines with extensive sports betting market coverage.',
    },
    review: {
      tl: `Ang BK8 ay isa sa mga pinakakilalang online sportsbook sa Southeast Asia, at partikular na sikat sa merkado ng Pilipinas. Nag-aalok sila ng malawak na seleksyon ng sports betting markets kabilang ang basketball, football, boxing, at marami pa.

Ang kanilang welcome bonus ay napakagandang deal para sa mga bagong manlalaro. May 100% match bonus hanggang PHP 10,000 sa iyong unang deposito. Ang minimum na deposito ay PHP 500 lamang, kaya madaling magsimula.

Sa aspeto ng user experience, ang BK8 ay may modernong interface na madaling i-navigate. Available ang kanilang platform sa desktop at mobile, at may dedicated na app para sa Android at iOS. Mabilis ang payout processing, karaniwang 1-3 business days para sa e-wallet withdrawals.`,
      en: `BK8 is one of the most recognized online sportsbooks in Southeast Asia, particularly popular in the Philippine market. They offer an extensive selection of sports betting markets including basketball, football, boxing, and more.

Their welcome bonus is an excellent deal for new players. You get a 100% match bonus up to PHP 10,000 on your first deposit. The minimum deposit is only PHP 500, making it easy to get started.

In terms of user experience, BK8 features a modern interface that's easy to navigate. Their platform is available on both desktop and mobile, with a dedicated app for Android and iOS. Payout processing is fast, typically 1-3 business days for e-wallet withdrawals.`,
    },
    affiliateUrl: '#placeholder-affiliate-url-bk8',
    pagcorLicensed: true,
    rating: 4.5,
    features: ['Live Betting', 'Mobile App', 'Fast Payouts', 'E-wallet Support'],
    sportsCovered: ['Basketball', 'Football', 'Boxing', 'Tennis', 'Volleyball'],
  },
  {
    slug: 'bet88',
    name: 'Bet88',
    logo: '/operators/bet88.png',
    welcomeBonus: {
      tl: '150% Welcome Bonus hanggang PHP 15,000',
      en: '150% Welcome Bonus up to PHP 15,000',
    },
    description: {
      tl: 'Lokal na sportsbook na dinisenyo para sa Filipino bettors na may malakas na coverage sa PBA at local sports.',
      en: 'Local sportsbook designed for Filipino bettors with strong PBA and local sports coverage.',
    },
    review: {
      tl: `Ang Bet88 ay isang sportsbook na partikular na dinisenyo para sa merkado ng Pilipinas. Ang kanilang pangunahing lakas ay ang malalim na coverage ng PBA at iba pang lokal na sports leagues na hindi mo madalas makita sa ibang platforms.

Ang 150% welcome bonus nila hanggang PHP 15,000 ay isa sa mga pinakamataas sa industriya. Bagamat may 8x rollover requirement, makatwiran pa rin ito kumpara sa ibang operators. Marami ring ongoing promotions para sa mga existing players.

Ang Bet88 ay kilala sa kanilang customer support na available 24/7 sa Filipino at English. May GCash at Maya integration sila para sa madaling deposito at withdrawal, na isang malaking plus para sa Filipino bettors.`,
      en: `Bet88 is a sportsbook specifically designed for the Philippine market. Their primary strength is deep coverage of PBA and other local sports leagues that you won't easily find on other platforms.

Their 150% welcome bonus up to PHP 15,000 is one of the highest in the industry. While there's an 8x rollover requirement, it remains reasonable compared to other operators. There are also plenty of ongoing promotions for existing players.

Bet88 is known for their customer support available 24/7 in Filipino and English. They have GCash and Maya integration for easy deposits and withdrawals, which is a major plus for Filipino bettors.`,
    },
    affiliateUrl: '#placeholder-affiliate-url-bet88',
    pagcorLicensed: true,
    rating: 4.3,
    features: ['PBA Coverage', 'GCash/Maya', '24/7 Support', 'Filipino Interface'],
    sportsCovered: ['Basketball', 'Football', 'Boxing', 'E-sports', 'Cockfighting'],
  },
  {
    slug: '22bet',
    name: '22Bet',
    logo: '/operators/22bet.png',
    welcomeBonus: {
      tl: '100% Welcome Bonus hanggang PHP 7,000',
      en: '100% Welcome Bonus up to PHP 7,000',
    },
    description: {
      tl: 'International na sportsbook na may pinakamaraming betting markets at competitive odds sa lahat ng sports.',
      en: 'International sportsbook with the widest range of betting markets and competitive odds across all sports.',
    },
    review: {
      tl: `Ang 22Bet ay isang international sportsbook na nag-ooperate sa mahigit 100 bansa, kabilang ang Pilipinas. Kilala sila sa kanilang napakalawak na seleksyon ng betting markets — mula sa mainstream sports hanggang sa niche events tulad ng table tennis at darts.

Ang kanilang welcome bonus ay 100% match hanggang PHP 7,000, na may reasonable na 5x rollover requirement. Isa ito sa mga pinakamababang rollover sa industriya, kaya mas madaling i-convert ang bonus.

Ang 22Bet ay nag-aalok ng mahigit 1,000 live betting events araw-araw. Ang kanilang odds ay kadalasang mas competitive kaysa sa ibang operators, lalo na sa football at basketball. May crypto payment options din sila para sa mga gusto ng anonymous transactions.`,
      en: `22Bet is an international sportsbook operating in over 100 countries, including the Philippines. They are known for their exceptionally wide selection of betting markets — from mainstream sports to niche events like table tennis and darts.

Their welcome bonus is a 100% match up to PHP 7,000, with a reasonable 5x rollover requirement. This is one of the lowest rollovers in the industry, making it easier to convert the bonus into withdrawable funds.

22Bet offers over 1,000 live betting events daily. Their odds are often more competitive than other operators, especially on football and basketball. They also offer crypto payment options for those who prefer anonymous transactions.`,
    },
    affiliateUrl: '#placeholder-affiliate-url-22bet',
    pagcorLicensed: true,
    rating: 4.2,
    features: ['1000+ Live Events', 'Crypto Payments', 'Low Rollover', 'Wide Markets'],
    sportsCovered: ['Basketball', 'Football', 'Boxing', 'Tennis', 'Table Tennis', 'Darts'],
  },
  {
    slug: '1xbet',
    name: '1xBet',
    logo: '/operators/1xbet.png',
    welcomeBonus: {
      tl: '100% Welcome Bonus hanggang PHP 8,500',
      en: '100% Welcome Bonus up to PHP 8,500',
    },
    description: {
      tl: 'Global na sportsbook na may advanced na betting features tulad ng bet builder at cash out options.',
      en: 'Global sportsbook with advanced betting features like bet builder and cash out options.',
    },
    review: {
      tl: `Ang 1xBet ay isa sa mga pinakamalaking global sportsbook na may presensya sa mahigit 50 bansa. Sa Pilipinas, kilala sila sa kanilang advanced betting features na hindi madalas makita sa ibang platforms.

Ang kanilang welcome bonus ay 100% match hanggang PHP 8,500. Bukod dito, may regular na promotions sila tulad ng accumulator bonus na nagdadagdag ng hanggang 40% sa iyong parlay winnings. Ang kanilang bet builder feature ay nagbibigay-daan sa iyo na lumikha ng custom bets sa isang event.

Ang 1xBet ay may live streaming feature para sa maraming events, kaya pwede kang manood habang nagbe-bet. Ang kanilang cash out option ay available sa karamihan ng bets, nagbibigay sa iyo ng kontrol sa iyong mga taya kahit ongoing pa ang laro.`,
      en: `1xBet is one of the largest global sportsbooks with a presence in over 50 countries. In the Philippines, they are known for their advanced betting features that are not commonly found on other platforms.

Their welcome bonus is a 100% match up to PHP 8,500. Beyond this, they have regular promotions such as an accumulator bonus that adds up to 40% to your parlay winnings. Their bet builder feature allows you to create custom bets on a single event.

1xBet has a live streaming feature for many events, so you can watch while you bet. Their cash out option is available on most bets, giving you control over your wagers even while the game is still in progress.`,
    },
    affiliateUrl: '#placeholder-affiliate-url-1xbet',
    pagcorLicensed: true,
    rating: 4.0,
    features: ['Bet Builder', 'Live Streaming', 'Cash Out', 'Accumulator Bonus'],
    sportsCovered: ['Basketball', 'Football', 'Boxing', 'Tennis', 'MMA', 'E-sports'],
  },
  {
    slug: 'betway',
    name: 'Betway',
    logo: '/operators/betway.png',
    welcomeBonus: {
      tl: '100% Welcome Bonus hanggang PHP 5,000',
      en: '100% Welcome Bonus up to PHP 5,000',
    },
    description: {
      tl: 'Globally trusted na sportsbook na may simpleng interface at focus sa responsible gambling.',
      en: 'Globally trusted sportsbook with a clean interface and strong focus on responsible gambling.',
    },
    review: {
      tl: `Ang Betway ay isa sa mga pinakapinagkakatiwalaang pangalan sa online sports betting sa buong mundo. Kilala sila sa kanilang malinis at madaling gamitin na interface, na perpekto para sa mga baguhan at experienced bettors.

Ang kanilang welcome bonus ay 100% match hanggang PHP 5,000. Bagamat hindi ito ang pinakamataas, ang Betway ay kilala sa kanilang transparent na terms at conditions. Ang 6x rollover requirement ay makatwiran at walang hidden na mga kondisyon.

Ang Betway ay namumukod-tangi sa responsible gambling features. May deposit limits, self-exclusion options, at reality check reminders sila. Isa rin silang opisyal na betting partner ng ilang major sports teams at leagues sa buong mundo.`,
      en: `Betway is one of the most trusted names in online sports betting worldwide. They are known for their clean and user-friendly interface, which is perfect for both beginners and experienced bettors.

Their welcome bonus is a 100% match up to PHP 5,000. While not the highest, Betway is known for their transparent terms and conditions. The 6x rollover requirement is reasonable with no hidden conditions.

Betway stands out with their responsible gambling features. They have deposit limits, self-exclusion options, and reality check reminders. They are also an official betting partner of several major sports teams and leagues worldwide.`,
    },
    affiliateUrl: '#placeholder-affiliate-url-betway',
    pagcorLicensed: true,
    rating: 4.4,
    features: ['Responsible Gambling', 'Clean Interface', 'Trusted Brand', 'Quick Registration'],
    sportsCovered: ['Basketball', 'Football', 'Boxing', 'Cricket', 'Tennis'],
  },
];

import { Composition } from "remotion";
import { HulaNgAraw } from "./HulaNgAraw";
import { hulaNgArawSchema } from "./HulaNgAraw/schema";
import { BalitaSports } from "./BalitaSports";
import { balitaSportsSchema, BALITA_SCENES } from "./BalitaSports/schema";
import { AlaminMo } from "./AlaminMo";
import { alaminMoSchema, ALAMIN_SCENES } from "./AlaminMo/schema";
import { QuizSports } from "./QuizSports";
import { quizSportsSchema, QUIZ_SCENES } from "./QuizSports/schema";
import "./fonts";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HulaNgAraw"
        component={HulaNgAraw}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
        schema={hulaNgArawSchema}
        defaultProps={{
          hookText: "WALANG NAGSASABI NITO...",
          homeTeam: "Barangay Ginebra",
          awayTeam: "San Miguel Beermen",
          league: "PBA Philippine Cup 2026",
          matchDate: "15 Mar 2026 — 19:00",
          market: "Over 195.5 Points",
          odds: 1.85,
          stake: 7,
          confidence: "high" as const,
          hotTake: "Ang Ginebra ay nag-average ng 110 points sa last 5 games, at ang SMB hindi pumapalo ng below 100 sa conference na to",
          analysis: [
            "H2H: Over na sa 7 ng huling 10 laro nila",
            "Ginebra 3rd highest scoring team sa conference",
            "SMB walang injured na starter — full strength",
          ],
          ctaText: "I-follow para sa mga picks",
        }}
      />
      <Composition
        id="BalitaSports"
        component={BalitaSports}
        durationInFrames={BALITA_SCENES.opinionStart + BALITA_SCENES.ctaDuration}
        fps={30}
        width={1080}
        height={1920}
        schema={balitaSportsSchema}
        defaultProps={{
          date: "11 Mar 2026",
          headlineNumber: 1,
          headline: {
            title: "Kai Sotto napili sa All-Star Game ng PBA",
            summary: "Unang beses sa kasaysayan na may 7-footer na naglaro sa PBA All-Star.",
          },
          opinion: "Si Sotto ang future ng Philippine basketball. Kung magiging consistent siya, magiging unstoppable ang Converge.",
          ctaText: "I-follow para sa balita",
        }}
      />
      <Composition
        id="AlaminMo"
        component={AlaminMo}
        durationInFrames={ALAMIN_SCENES.explanationStart + ALAMIN_SCENES.ctaDuration}
        fps={30}
        width={1080}
        height={1920}
        schema={alaminMoSchema}
        defaultProps={{
          hookText: "Alam mo ba...",
          stat: "92%",
          factTitle: "ng free throws sa PBA Finals ay nako-convert",
          factContext: "Sa huling 5 PBA Finals series, ang free throw percentage ay nasa 92%, mas mataas kaysa sa regular season average na 78%.",
          bullets: [
            "8% lang ang namiss o na-block",
            "Ang left-handed shooters ay mas magaling sa free throws",
            "Ang clutch free throws ay 95% accurate sa finals",
          ],
          ctaText: "I-follow para sa iba pang datos",
        }}
      />
      <Composition
        id="QuizSports"
        component={QuizSports}
        durationInFrames={QUIZ_SCENES.revealStart + QUIZ_SCENES.ctaDuration}
        fps={30}
        width={1080}
        height={1920}
        schema={quizSportsSchema}
        defaultProps={{
          question: "Sino ang all-time leading scorer ng PBA?",
          options: [
            "Ramon Fernandez",
            "June Mar Fajardo",
            "Mon Fernandez",
          ],
          correctIndex: 0,
          explanation: "Si Ramon 'El Presidente' Fernandez ang may pinakamaraming career points sa PBA history na may 18,996 points.",
          ctaText: "Mas maraming quiz sa aming channel",
        }}
      />
    </>
  );
};

import fs from "fs";
import path from "path";

interface TTSRequest {
  text: string;
  outputPath: string;
}

async function getAccessToken(keyJson: string): Promise<string> {
  const key = JSON.parse(keyJson);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(key.private_key, "base64url");
  const jwt = `${header}.${claimSet}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = (await tokenRes.json()) as { access_token: string };
  return tokenData.access_token;
}

async function synthesizeSpeech(text: string, accessToken: string): Promise<Buffer> {
  const res = await fetch(
    "https://texttospeech.googleapis.com/v1/text:synthesize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "fil-PH",
          name: "fil-PH-Standard-A",
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}

function buildNarrationText(propsFile: string, compositionId: string): string {
  const props = JSON.parse(fs.readFileSync(propsFile, "utf-8"));

  const ctaLine = "Gusto mo bang makakuha ng mga tama na hula? Sumali sa aming Telegram, link sa description.";

  if (compositionId === "BalitaSports") {
    const lines: string[] = [];
    lines.push("Balita ngayon sa sports.");
    lines.push(`${props.headline.title}. ${props.headline.summary}`);
    lines.push(`Opinyon ko: ${props.opinion}`);
    lines.push(ctaLine);
    return lines.join(" ... ");
  }

  if (compositionId === "AlaminMo") {
    const lines: string[] = [];
    lines.push(props.hookText);
    lines.push(`${props.stat} ${props.factTitle}.`);
    lines.push(props.factContext);
    for (const b of props.bullets) {
      lines.push(b);
    }
    lines.push(ctaLine);
    return lines.join(" ... ");
  }

  if (compositionId === "QuizSports") {
    const lines: string[] = [];
    lines.push("Quiz sa sports.");
    lines.push(props.question);
    lines.push(`Opsyon A: ${props.options[0]}.`);
    lines.push(`Opsyon B: ${props.options[1]}.`);
    lines.push(`Opsyon C: ${props.options[2]}.`);
    lines.push("Tatlo, dalawa, isa...");
    const labels = ["A", "B", "C"];
    lines.push(`Ang tamang sagot ay ang ${labels[props.correctIndex]}: ${props.options[props.correctIndex]}.`);
    lines.push(props.explanation);
    lines.push(ctaLine);
    return lines.join(" ... ");
  }

  throw new Error(`TTS not supported for composition: ${compositionId}`);
}

async function main() {
  const propsFile = process.argv[2];
  const compositionId = process.argv[3];

  if (!propsFile || !compositionId) {
    console.error("Usage: npx tsx src/tts.ts <props.json> <compositionId>");
    process.exit(1);
  }

  const keyJson = process.env.GCP_TTS_KEY;
  if (!keyJson) {
    console.error("GCP_TTS_KEY environment variable required");
    process.exit(1);
  }

  const text = buildNarrationText(propsFile, compositionId);
  console.log(`Generating TTS for ${compositionId}...`);
  console.log(`Text: ${text.substring(0, 100)}...`);

  const accessToken = await getAccessToken(keyJson);
  const audioBuffer = await synthesizeSpeech(text, accessToken);

  const outputPath = path.resolve("public/narration.mp3");
  fs.writeFileSync(outputPath, audioBuffer);
  console.log(`Saved narration: ${outputPath} (${audioBuffer.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

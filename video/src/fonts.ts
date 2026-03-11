import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: bebasNeueFamily } = loadBebasNeue("normal", { weights: ["400"] });
export const { fontFamily: interFamily } = loadInter("normal", { weights: ["400", "500", "700"] });

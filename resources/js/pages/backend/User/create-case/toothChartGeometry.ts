import { palmerLabel } from './helpers';

/**
 * Occlusal outlines aligned to Tooth Chart.jpg class shapes, drawn in the same
 * detailed smooth-bezier style as the molar (the chart’s “shape good” reference).
 * All paths are closed, centered on the origin, and symmetric about x=0.
 * Per-tooth size on the arch still comes from TOP_POSITIONS / BOTTOM_POSITIONS
 * scale; class paths carry the anatomical proportions (central wider than lateral,
 * premolar smaller than molar). Idle chart stays B&W; fills color after selection.
 */

/**
 * Central incisor (Palmer 1): rounded 3-angle “guitar pick” — wide convex
 * labial edge at the top, two sides tapering to a soft lingual tip (matches
 * Tooth Chart.jpg). BBox ≈ x[-22,22], y[-22,26].
 */
export const TOOTH_PATH_INCISOR =
    'M-22,-16 C-12,-22 12,-22 22,-16 C26,-6 18,10 8,22 C4,26 0,27 0,27 C0,27 -4,26 -8,22 C-18,10 -26,-6 -22,-16 Z';

/**
 * Lateral incisor (Palmer 2): same 3-angle guitar-pick language as the central,
 * slightly narrower. BBox ≈ x[-18,18], y[-22,26].
 */
export const TOOTH_PATH_INCISOR_LATERAL =
    'M-17,-17 C-9,-22 9,-22 17,-17 C21,-8 15,10 7,22 C3,26 0,27 0,27 C0,27 -3,26 -7,22 C-15,10 -21,-8 -17,-17 Z';

/**
 * Canine (Palmer 3): soft rounded oval close to premolar bulk with a mild
 * labial cusp bulge — no sharp tip. BBox ≈ x[-20,20], y[-23,22].
 */
export const TOOTH_PATH_CANINE =
    'M0,-23 C8,-22 15,-17 18,-9 C20,-3 20,7 17,14 C12,20 6,22 0,22 C-6,22 -12,20 -17,14 C-20,7 -20,-3 -18,-9 C-15,-17 -8,-22 0,-23 Z';

/**
 * Premolar (Palmer 4–5): compact “little molar” — rounded square with a two-cusp
 * labial edge and a slight mesio-distal waist. BBox ≈ x[-22,22], y[-24,24].
 */
export const TOOTH_PATH_PREMOLAR =
    'M-20,-16 C-23,-6 -23,8 -19,17 C-13,24 -6,25 0,23 C6,25 13,24 19,17 C23,8 23,-6 20,-16 C14,-24 6,-22 0,-20 C-6,-22 -14,-24 -20,-16 Z';

/**
 * Molar (Palmer 6–8): detailed rounded square/trapezoid cusp outline — the
 * chart’s “shape good” reference. Do not break. BBox ≈ x[-29,29], y[-28,30].
 */
export const TOOTH_PATH_MOLAR =
    'M-27,-20 C-29,-8 -29,8 -25,18 C-18,28 -8,30 0,28 C8,30 18,28 25,18 C29,8 29,-8 27,-20 C20,-28 10,-26 0,-24 C-10,-26 -20,-28 -27,-20Z';

/** Fissure marks for molars (Palmer 6–8), matching the reference chart. */
export const TOOTH_GROOVE_PATH =
    'M-9,-12 C-13,-6 -10,-2 -6,2 M9,-12 C13,-6 10,-2 6,2 M-9,9 C-6,5 -3,6 0,9 M9,9 C6,5 3,6 0,9 M0,-15 L0,-3 M0,9 L0,18';

/**
 * Light developmental-groove hint for premolars (Palmer 4–5): central fissure
 * split around the label, plus short mesial/distal grooves — same family as the
 * molar fissures, drawn lighter/shorter so the number stays readable.
 */
export const TOOTH_GROOVE_PATH_PREMOLAR =
    'M0,-14 L0,-5 M0,7 L0,14 M-11,0 C-7,-2 -4,-2 -2,-1 M11,0 C7,-2 4,-2 2,-1';

/**
 * Light cusp-ridge hint for the canine (Palmer 3): central vertical ridge split
 * around the label plus short mesial/distal grooves, matching the premolar feel.
 */
export const TOOTH_GROOVE_PATH_CANINE =
    'M0,-17 L0,-6 M0,6 L0,16 M-9,-2 C-6,-4 -3,-4 -1,-3 M9,-2 C6,-4 3,-4 1,-3';

/** Professional lab UI label stack (client: more professional than rounded display). */
export const TOOTH_LABEL_FONT =
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

export function toothBodyPath(fdi: number): string {
    const palmer = palmerLabel(fdi);

    if (palmer === 1) {
        return TOOTH_PATH_INCISOR;
    }

    if (palmer === 2) {
        return TOOTH_PATH_INCISOR_LATERAL;
    }

    if (palmer === 3) {
        return TOOTH_PATH_CANINE;
    }

    if (palmer <= 5) {
        return TOOTH_PATH_PREMOLAR;
    }

    return TOOTH_PATH_MOLAR;
}

/**
 * Groove overlay: none on incisors (chart reference is outline-only),
 * canine ridge for 3, premolar fissure for 4–5, molar fissure for 6–8.
 */
export function toothGroovePath(fdi: number): string {
    const palmer = palmerLabel(fdi);

    if (palmer >= 6) {
        return TOOTH_GROOVE_PATH;
    }

    if (palmer >= 4) {
        return TOOTH_GROOVE_PATH_PREMOLAR;
    }

    return TOOTH_GROOVE_PATH_CANINE;
}

export function toothShowsGrooves(fdi: number): boolean {
    return palmerLabel(fdi) >= 3;
}

/**
 * Lower Palmer 1–2 guitar-picks must flip vertically so the tip points toward
 * the arch center (uppers already point tip-down; lowers need tip-up).
 */
export function toothNeedsVerticalFlip(fdi: number): boolean {
    const isLower = fdi >= 31 && fdi <= 48;

    return isLower && palmerLabel(fdi) <= 2;
}

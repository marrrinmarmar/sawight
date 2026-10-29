/**
 * PalmQual-AI - Core Classification & Allocation Engine (TypeScript port)
 * Supports:
 * - Option A: Google Gemini (gemini-3.8-flash) with Structured JSON Output
 * - Option B: Scientific Rule-Based Threshold Classifier
 */

export type PalmParams = {
  batch_id?: string;
  tanggal_panen?: string;
  lama_penyimpanan_jam?: number;
  warna?: string;
  viskositas_mPa_s?: number;
  pH?: number;
  kadar_ffa_percent?: number;
  moisture_percent?: number;
  berat_ton?: number;
  lokasi_kebun?: string;
};

export type PalmEvaluation = {
  batch_id: string;
  track_type: "DEFAULT" | "FLEX";
  primary_recommendation: string;
  category: "CPO_DEFAULT" | "BIO_ECO_FRIENDLY" | "OTHER_PRODUCTS";
  confidence_score: number;
  alternate_recommendation: string;
  ai_explanation: string;
  action_steps: string[];
  details: {
    tanggal_panen: string;
    lama_penyimpanan_jam: number;
    warna: string;
    viskositas_mPa_s: number;
    pH: number;
    kadar_ffa_percent: number;
    moisture_percent: number;
    berat_ton: number;
    lokasi_kebun: string;
    estimated_value_idr: number;
    co2_reduction_kg: number;
    active_flow_paths: string[];
    evaluated_at: string;
    engine_version: string;
    engine_mode?: string;
  };
};

export const PALM_THRESHOLDS = {
  DEFAULT_MAX_HOLD_TIME: 24, // Hours
  DEFAULT_MAX_FFA: 5.0, // % (Prompt standard)
  DEFAULT_MIN_PH: 5.5,
  DEFAULT_MAX_PH: 6.8,
  DEFAULT_MAX_MOISTURE: 0.3, // %
  DEFAULT_COLORS: ["Sangat Merah Kecoklatan", "Kuning Emas"],
} as const;

/** Option B: Scientific Rule-Based Classification Engine */
export function evaluateRuleBased(input: PalmParams): PalmEvaluation {
  const batch_id = input.batch_id || "LOT-" + Date.now();
  const tanggal_panen = input.tanggal_panen || new Date().toISOString();
  const lama_penyimpanan_jam = Number(input.lama_penyimpanan_jam) || 12;
  const warna = input.warna || "Sangat Merah Kecoklatan";
  const viskositas_mPa_s = Number(input.viskositas_mPa_s) || 45;
  const pH = Number(input.pH) || 6.2;
  const kadar_ffa_percent = Number(input.kadar_ffa_percent) || 2.1;
  const moisture_percent = Number(input.moisture_percent) || 0.2;
  const berat_ton = Number(input.berat_ton) || 25.0;
  const lokasi_kebun = input.lokasi_kebun || "PKS Sawit Makmur";

  // Step 1: Check Default Path (Minyak Sawit / CPO)
  const isDefault =
    lama_penyimpanan_jam <= PALM_THRESHOLDS.DEFAULT_MAX_HOLD_TIME &&
    kadar_ffa_percent <= PALM_THRESHOLDS.DEFAULT_MAX_FFA &&
    pH >= PALM_THRESHOLDS.DEFAULT_MIN_PH &&
    pH <= PALM_THRESHOLDS.DEFAULT_MAX_PH &&
    (PALM_THRESHOLDS.DEFAULT_COLORS as readonly string[]).includes(warna);

  let track_type: PalmEvaluation["track_type"];
  let primary_recommendation = "";
  let alternate_recommendation = "";
  let confidence_score = 0;
  let ai_explanation = "";
  let action_steps: string[] = [];
  let active_flow_paths = ["path-1", "path-2", "path-3"];
  let estimated_value_idr = 0;
  let co2_reduction_kg = 0;
  let category: PalmEvaluation["category"];

  if (isDefault) {
    // ---------------- TAHAP 1: DEFAULT PATH (MINYAK SAWIT / CPO) ----------------
    track_type = "DEFAULT";
    category = "CPO_DEFAULT";
    active_flow_paths.push("path-default");

    if (kadar_ffa_percent <= 2.5 && lama_penyimpanan_jam <= 16) {
      primary_recommendation =
        "Minyak Sawit Konsumsi Super (Cooking Oil Grade A - SNI 7709)";
      alternate_recommendation = "Biofuel HVO Premium (Green Aviation Fuel Blend)";
      confidence_score = Math.min(
        99.0,
        Number((98.5 - kadar_ffa_percent * 1.5 - lama_penyimpanan_jam * 0.15).toFixed(1))
      );
      estimated_value_idr = Math.round(berat_ton * 14_800_000);
      co2_reduction_kg = Math.round(berat_ton * 620);
      ai_explanation = `Lot ${batch_id} dipanen segar dengan hold time ${lama_penyimpanan_jam} jam. Kadar FFA ${kadar_ffa_percent}% dan pH ${pH} berada pada mutu prima SNI 7709 (Cooking Oil Grade A). Integritas trigliserida optimal untuk fraksinasi olein minyak goreng konsumsi.`;
      action_steps = [
        "Lakukan sterilisasi TBS pada tekanan 3.0 bar selama 90 menit untuk inaktivasi enzim lipase.",
        "Ekstraksi minyak menggunakan screw press kemudian alirkan ke tangki klarifikasi.",
        "Arahkan CPO ke unit Refinery & Fraksinasi pangan untuk pemurnian Olein dan Stearin.",
      ];
    } else {
      primary_recommendation = "Produksi Minyak Sawit Standar (CPO Pangan / PORAM Standard)";
      alternate_recommendation = "Biofuel Biodiesel Mandat B35/B40";
      confidence_score = Math.min(
        96.0,
        Number((95.0 - kadar_ffa_percent * 1.8 - lama_penyimpanan_jam * 0.25).toFixed(1))
      );
      estimated_value_idr = Math.round(berat_ton * 13_500_000);
      co2_reduction_kg = Math.round(berat_ton * 580);
      ai_explanation = `Lot ${batch_id} memenuhi seluruh spesifikasi CPO standar pangan (FFA ${kadar_ffa_percent}% <= 5%, Hold Time ${lama_penyimpanan_jam} jam <= 24 jam). Trigliserida stabil dengan laju peroksida terkendali.`;
      action_steps = [
        "Sterilisasi cepat TBS untuk mencegah kenaikan FFA lebih lanjut.",
        "Lakukan pemurnian centrifuge dan vakum drying untuk menjaga kadar air <= 0.25%.",
        "Kirim ke tangki timbun CPO untuk pengapalan ekspor atau refinery domestik.",
      ];
    }
  } else {
    // ---------------- TAHAP 2: FLEX PATH (AI DEEP ANALYSIS) ----------------
    track_type = "FLEX";
    active_flow_paths.push("path-flex");

    // Evaluasi: Bio / Eco-Friendly vs Produk Lain
    const isBioEcoFriendly = kadar_ffa_percent <= 15.0 && pH >= 4.9 && lama_penyimpanan_jam <= 65;

    if (isBioEcoFriendly) {
      // ===== YES -> PRODUK BIO / ECO-FRIENDLY =====
      category = "BIO_ECO_FRIENDLY";
      active_flow_paths.push("path-bio-yes", "path-diolah");

      if (kadar_ffa_percent <= 6.0 && pH >= 5.6 && moisture_percent <= 0.4) {
        // Renewable Diesel (HVO / Green Diesel)
        primary_recommendation = "Renewable Diesel (HVO / Green Diesel) & Bio-Aviation SAF";
        alternate_recommendation = "Biodiesel FAME Mandat B35/B40";
        confidence_score = Math.min(
          97.0,
          Number((96.0 - kadar_ffa_percent * 1.2 - moisture_percent * 5).toFixed(1))
        );
        estimated_value_idr = Math.round(berat_ton * 15_200_000);
        co2_reduction_kg = Math.round(berat_ton * 1850);
        ai_explanation = `Meskipun penyimpanan ${lama_penyimpanan_jam} jam melampaui batas minyak makan, profil FFA (${kadar_ffa_percent}%) dan kelembaban (${moisture_percent}%) sangat ideal untuk proses hydrotreated vegetable oil (HVO) tanpa meracuni katalis Ni-Mo/Al2O3.`;
        action_steps = [
          "Pre-treatment deep degumming untuk memangkas kandungan fosfor (P < 5 ppm) dan logam alkali.",
          "Arahkan ke reaktor hydrodeoxygenation (HDO) katalitik suhu 320-380°C pada tekanan 60 bar.",
          "Lakukan hydroisomerization untuk menghasilkan Green Diesel berangka setana > 70.",
        ];
      } else if (
        viskositas_mPa_s >= 65 ||
        warna === "Teroksidasi Gelap" ||
        (kadar_ffa_percent > 10.0 && viskositas_mPa_s >= 60)
      ) {
        // Bioplastik / Bio-material
        primary_recommendation = "Bioplastik & Polimer Alami (PHA / Polyhydroxyalkanoates)";
        alternate_recommendation = "Biofuel Biodiesel FAME B35 / Bio-Pellet";
        confidence_score = Math.min(
          94.0,
          Number((91.0 - Math.abs(viskositas_mPa_s - 75) * 0.15).toFixed(1))
        );
        estimated_value_idr = Math.round(berat_ton * 11_800_000);
        co2_reduction_kg = Math.round(berat_ton * 1250);
        ai_explanation = `Viskositas tinggi (${viskositas_mPa_s} mPa.s) dengan fraksi asam lemak bebas (${kadar_ffa_percent}%) menjadikan batch ini substrat karbon ideal bagi kultur mikroba Ralstonia eutropha / Cupriavidus necator untuk sintesis bioplastik terurai 100%.`;
        action_steps = [
          "Emulsifikasi bahan baku dengan homogenizer tekanan tinggi menjadi media cair mineral.",
          "Inokulasi ke dalam bioreaktor fermentasi kultur bakteri PHA selama 48 jam.",
          "Lisis sel mikroba secara enzimatik ramah lingkungan dan cetak butiran resin bioplastik.",
        ];
      } else {
        // Biofuel (FAME/Biodiesel)
        primary_recommendation =
          "Biofuel Biodiesel FAME (Fatty Acid Methyl Ester) Mandat B35/B40";
        alternate_recommendation = "Sabun Organik Ramah Lingkungan / Bio-Surfactant";
        confidence_score = Math.min(
          95.0,
          Number((93.5 - kadar_ffa_percent * 0.8).toFixed(1))
        );
        estimated_value_idr = Math.round(berat_ton * 13_000_000);
        co2_reduction_kg = Math.round(berat_ton * 1480);
        ai_explanation = `Kandungan FFA sebesar ${kadar_ffa_percent}% dan waktu simpan ${lama_penyimpanan_jam} jam telah melebihi standar CPO konsumsi, namun sangat ideal untuk reaksi transesterifikasi biodiesel FAME (SNI 7182).`;
        action_steps = [
          kadar_ffa_percent > 6.0
            ? "Lakukan pra-pengolahan esterifikasi asam (metanol + H2SO4) untuk mereduksi FFA hingga < 1%."
            : "Lewati pra-esterifikasi dan langsung proses ke reaktor transesterifikasi basa.",
          "Transesterifikasi menggunakan Sodium Metoksida (CH3ONa) pada suhu 65°C.",
          "Sentrifugasi pemisahan fase metil ester atas dan fase gliserol mentah bawah.",
          "Dry washing dengan adsorben ion-exchange resin untuk mencapai standar kemurnian B35/B40.",
        ];
      }
    } else {
      // ===== NO -> PRODUK LAIN (OLEOKIMIA / PAKAN / PUPUK) =====
      category = "OTHER_PRODUCTS";
      active_flow_paths.push("path-bio-no");

      if (kadar_ffa_percent <= 18.0 && pH >= 4.6) {
        // Oleokimia Industri
        primary_recommendation =
          "Oleokimia Industri Non-Biofuel (Fatty Acids & Glycerol Splitting)";
        alternate_recommendation = "Pakan Ternak Formula Kalsium (Bypass Fat)";
        confidence_score = Math.min(
          93.0,
          Number((91.5 - kadar_ffa_percent * 0.5).toFixed(1))
        );
        estimated_value_idr = Math.round(berat_ton * 10_200_000);
        co2_reduction_kg = Math.round(berat_ton * 460);
        ai_explanation = `Tingkat hidrolisis lanjutan (FFA ${kadar_ffa_percent}%, hold time ${lama_penyimpanan_jam} jam) tidak lagi efisien untuk biofuel, namun bernilai tinggi untuk splitting termal asam lemak murni (asam palmitat, stearat, dan oleat).`;
        action_steps = [
          "Kirim bahan baku ke unit Thermal Fat Splitting (Colgate-Emery) suhu 250°C, 50 bar.",
          "Ekstraksi sweet water untuk evaporasi menjadi gliserin teknis.",
          "Distilasi fraksional vakum asam lemak untuk pelumas industri dan lilin sintetis.",
        ];
      } else if (kadar_ffa_percent <= 22.0 && pH >= 4.3) {
        // Pakan Ternak
        primary_recommendation = "Pakan Ternak Tinggi Energi (Palm Calcium Soap / Bypass Fat)";
        alternate_recommendation = "Pupuk Kompos Biologis & Biogas Metana";
        confidence_score = Math.min(
          92.0,
          Number((89.0 - kadar_ffa_percent * 0.4).toFixed(1))
        );
        estimated_value_idr = Math.round(berat_ton * 8_200_000);
        co2_reduction_kg = Math.round(berat_ton * 340);
        ai_explanation = `Batch dengan FFA tinggi (${kadar_ffa_percent}%) dan pH ${pH} menyimpan densitas kalori brutto ~9.000 kkal/kg yang dapat diproteksi menjadi sabun kalsium rumen-bypass untuk pakan sapi perah dan unggas.`;
        action_steps = [
          "Penyaringan mekanis dan pasteurisasi pada suhu 85°C untuk mematikan mikroba patogen.",
          "Reaksikan asam lemak bebas dengan Kalsium Oksida (CaO) membentuk garam kalsium kationik.",
          "Prilling dan granulasi menjadi butiran pakan padat kering.",
        ];
      } else {
        // Pupuk Kompos / Biogas
        primary_recommendation = "Pupuk Kompos Biologis & Pembangkit Biogas Metana";
        alternate_recommendation = "Pembuangan Residu Terkontrol (Safe Bio-Incineration)";
        confidence_score = 95.0;
        estimated_value_idr = Math.round(berat_ton * 4_800_000);
        co2_reduction_kg = Math.round(berat_ton * 890);
        ai_explanation = `Batch mengalami degradasi biologis berat (FFA ${kadar_ffa_percent}%, pH asam ${pH}, hold time ${lama_penyimpanan_jam} jam). Sangat efektif dialirkan ke biodigester anaerobik untuk gas metana dan kompos kaya N-P-K.`;
        action_steps = [
          "Alirkan substrat ke dalam CSTR Anaerobic Biodigester untuk penangkapan gas metana listrik.",
          "Campurkan bio-slurry hasil digestasi dengan cacahan tandan kosong kelapa sawit (EFB).",
          "Lakukan windrow composting aerobik selama 35 hari hingga matang sempurna untuk kebun.",
        ];
      }
    }
  }

  return {
    batch_id,
    track_type,
    primary_recommendation,
    category,
    confidence_score,
    alternate_recommendation,
    ai_explanation,
    action_steps,
    details: {
      tanggal_panen,
      lama_penyimpanan_jam,
      warna,
      viskositas_mPa_s,
      pH,
      kadar_ffa_percent,
      moisture_percent,
      berat_ton,
      lokasi_kebun,
      estimated_value_idr,
      co2_reduction_kg,
      active_flow_paths,
      evaluated_at: new Date().toISOString(),
      engine_version: "PalmQual-AI v2.4 (Rule & Gemini Hybrid)",
    },
  };
}

/**
 * Option A: Gemini API Structured JSON Evaluator
 * Falls back to Rule-Based if API fails or no key.
 */
export async function evaluateWithGemini(
  params: PalmParams,
  apiKey?: string
): Promise<PalmEvaluation> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  const ruleBased = evaluateRuleBased(params);

  if (!effectiveKey) {
    return ruleBased;
  }

  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `
Anda adalah Lead Process Engineer & AI Classification Specialist di Pabrik Kelapa Sawit (PKS) dan Bio-Refinery Nasional PalmQual-AI.
Evaluasi sampel lot panen kelapa sawit berikut:
- Batch ID: ${params.batch_id || "LOT-20261029-01"}
- Tanggal Panen: ${params.tanggal_panen || new Date().toISOString()}
- Lama Penyimpanan (Hold Time): ${params.lama_penyimpanan_jam} jam
- Warna: ${params.warna}
- Viskositas: ${params.viskositas_mPa_s} mPa.s
- pH: ${params.pH}
- Kadar FFA: ${params.kadar_ffa_percent} %
- Kadar Air (Moisture): ${params.moisture_percent} %

Aturan Bisnis:
1. TAHAP 1 (Pemilahan Kualitas):
   - Default Path: Jika lama_penyimpanan_jam <= 24, kadar_ffa_percent <= 5%, pH 5.5 - 6.8, dan warna stabil ('Sangat Merah Kecoklatan' atau 'Kuning Emas').
   - Flex Path: Jika ada deviasi parameter di atas.
2. TAHAP 2 (AI Deep Analysis Flex Path):
   - YES -> BIO_ECO_FRIENDLY: Biofuel (FAME/Biodiesel) jika FFA 5%-15% & pH 5.0-6.5; Renewable Diesel HVO jika FFA < 10% & viskositas sedang; Bioplastik jika viskositas tinggi (>65 mPa.s).
   - NO -> OTHER_PRODUCTS: Oleokimia Industri / Pakan / Pupuk jika FFA > 15-20%, pH < 4.8, atau simpan > 72 jam.

Kembalikan respon JSON dengan properti yang valid.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            batch_id: { type: Type.STRING },
            track_type: { type: Type.STRING, enum: ["DEFAULT", "FLEX"] },
            primary_recommendation: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ["CPO_DEFAULT", "BIO_ECO_FRIENDLY", "OTHER_PRODUCTS"],
            },
            confidence_score: { type: Type.NUMBER },
            alternate_recommendation: { type: Type.STRING },
            ai_explanation: { type: Type.STRING },
            action_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "batch_id",
            "track_type",
            "primary_recommendation",
            "category",
            "confidence_score",
            "alternate_recommendation",
            "ai_explanation",
            "action_steps",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? "{}") as PalmEvaluation;
    // Enrich with calculated telemetry
    parsed.details = {
      ...ruleBased.details,
      engine_mode: "Gemini 3.8 Flash (Structured Output JSON)",
      evaluated_at: new Date().toISOString(),
    };
    return {
      ...parsed,
      batch_id: parsed.batch_id || ruleBased.batch_id,
      track_type: parsed.track_type || ruleBased.track_type,
      category: parsed.category || ruleBased.category,
    };
  } catch (error) {
    console.warn(
      "[Gemini Engine Warning] Falling back to deterministic rule-based classifier:",
      error
    );
    const result = evaluateRuleBased(params);
    result.details.engine_mode = `Rule-Based Engine (Fallback)`;
    return result;
  }
}

/** Format Indonesian Rupiah */
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

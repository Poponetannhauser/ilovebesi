// ==============================
// CORE TYPES FOR QS BESI APP
// ==============================

export type DiameterBesi = 6 | 8 | 10 | 12 | 13 | 16 | 19 | 22 | 25 | 32;

export type ShapeCode = "Lurus" | "L" | "U" | "Sengkang";

export interface ShapeValues {
	a?: number;
	b?: number;
	c?: number;
	d?: number;
}

export type TypePekerjaan =
	| "Pondasi"
	| "Kolom"
	| "Balok"
	| "Pelat"
	| "Tangga"
	| "Dinding"
	| "Lainnya";

export type TypeBesi = "U24" | "U32" | "U39";

export interface ItemBesi {
	id: string;
	// Identifikasi pekerjaan
	kodePekerjaan: string; // Misal: "B1", "K1"
	namaPekerjaan: string; // Misal: "Balok Utama Lt.1"
	typePekerjaan: TypePekerjaan;
	zona?: string; // Optional: "Lt.1", "Zona A"

	// Detail besi
	diameter: DiameterBesi;
	typeBesi: TypeBesi;
	detail: string; // Deskripsi: "Tulangan Utama Atas"

	// Dimensi & Perhitungan
	shapeCode?: ShapeCode;
	shapeValues?: ShapeValues;
	panjangPotongan: number; // meter per batang
	jumlahPotongan: number; // jumlah batang per elemen
	jumlahElemen: number; // jumlah elemen (misal jumlah kolom)
	totalPanjang: number; // computed: panjangPotongan * jumlahPotongan * jumlahElemen
	beratPerMeter: number; // kg/m berdasarkan diameter
	totalBerat: number; // computed: totalPanjang * beratPerMeter

    // Toleransi / Faktor Jaga-jaga
    wastePercent?: number; // misalnya 10 untuk 10%
    jumlahSambungan?: number; // jumlah titik sambungan/overlap per elemen
    totalBeratWaste: number; // computed: totalBerat + waste

	// Metadata
	catatan?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Proyek {
	id: string;
	namaProyek: string;
	lokasiProyek: string;
	namaKonsultan?: string;
	kontraktor?: string;
	tanggalHitung: string;
	dibuat: string;
	items: ItemBesi[];
}

export interface RekapDiameter {
	diameter: DiameterBesi;
	totalPanjang: number;
	totalBerat: number;
	jumlahBatang: number; // asumsi 1 batang = 12m
}

export interface RekapPekerjaan {
	typePekerjaan: TypePekerjaan;
	totalBerat: number;
	items: ItemBesi[];
}

// ==============================
// CONSTANTS
// ==============================

// Berat besi per meter (kg/m) - standar SNI
export const BERAT_PER_METER: Record<DiameterBesi, number> = {
	6: 0.222,
	8: 0.395,
	10: 0.617,
	12: 0.888,
	13: 1.042,
	16: 1.578,
	19: 2.226,
	22: 2.984,
	25: 3.853,
	32: 6.313,
};

export const PANJANG_STANDAR_BATANG = 12; // meter

export const DIAMETER_OPTIONS: DiameterBesi[] = [
	6, 8, 10, 12, 13, 16, 19, 22, 25, 32,
];

export const SHAPE_CODE_OPTIONS: ShapeCode[] = ["Lurus", "L", "U", "Sengkang"];

export const TYPE_PEKERJAAN_OPTIONS: TypePekerjaan[] = [
	"Pondasi",
	"Kolom",
	"Balok",
	"Pelat",
	"Tangga",
	"Dinding",
	"Lainnya",
];

export const TYPE_BESI_OPTIONS: TypeBesi[] = ["U24", "U32", "U39"];

export const PEKERJAAN_COLORS: Record<TypePekerjaan, string> = {
	Pondasi: "#f97316",
	Kolom: "#0b8af0",
	Balok: "#6366f1",
	Pelat: "#10b981",
	Tangga: "#f59e0b",
	Dinding: "#8b5cf6",
	Lainnya: "#64748b",
};

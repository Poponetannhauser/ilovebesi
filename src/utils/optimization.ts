import type { ItemBesi, DiameterBesi } from '../types';
import { PANJANG_STANDAR_BATANG } from '../types';

export interface CutPiece {
  panjang: number;
  kodePekerjaan: string;
  detail: string;
}

export interface StandardBar {
  barIndex: number;
  pieces: CutPiece[];
  sisa: number; 
}

export interface OptimizationResult {
  diameter: DiameterBesi;
  bars: StandardBar[];
  totalBatang: number;
  totalPanjangDipotong: number;
  wasteMeter: number;
  wastePercentage: number;
}

/**
 * 1D Bin Packing Algorithm (First Fit Decreasing) 
 * for Steel Bar Cutting Optimization.
 */
export function calculateCuttingOptimization(items: ItemBesi[]): OptimizationResult[] {
  // 1. Group required pieces by their diameter
  const grouped: Record<number, CutPiece[]> = {};

  items.forEach(item => {
    const { diameter, panjangPotongan, jumlahPotongan, jumlahElemen, kodePekerjaan, detail } = item;
    if (!grouped[diameter]) {
      grouped[diameter] = [];
    }
    const totalPieces = jumlahPotongan * jumlahElemen;
    for (let i = 0; i < totalPieces; i++) {
      grouped[diameter].push({
        panjang: panjangPotongan,
        kodePekerjaan,
        detail
      });
    }
  });

  const results: OptimizationResult[] = [];

  for (const [diaStr, pieces] of Object.entries(grouped)) {
    const diameter = Number(diaStr) as DiameterBesi;
    
    // Sort required pieces descending by length (FFD algorithm requirement)
    pieces.sort((a, b) => b.panjang - a.panjang);

    const bars: StandardBar[] = [];

    for (const piece of pieces) {
      if (piece.panjang > PANJANG_STANDAR_BATANG) {
         // Cannot fit without splicing (sambungan). Allocate standalone bar.
         bars.push({
           barIndex: bars.length + 1,
           pieces: [piece], 
           sisa: PANJANG_STANDAR_BATANG - piece.panjang 
         });
         continue;
      }

      // Try to fit in existing bars
      let placed = false;
      for (const bar of bars) {
        // use small epsilon 0.001 to prevent floating point issues like 12.000000001
        if (bar.sisa + 0.0001 >= piece.panjang) {
          bar.pieces.push(piece);
          bar.sisa -= piece.panjang;
          placed = true;
          break;
        }
      }

      // Need a new bar
      if (!placed) {
        bars.push({
          barIndex: bars.length + 1,
          pieces: [piece],
          sisa: PANJANG_STANDAR_BATANG - piece.panjang
        });
      }
    }

    const totalBatang = bars.length;
    let totalPanjangDipotong = 0;
    pieces.forEach(p => totalPanjangDipotong += p.panjang);
    
    const wasteMeter = (totalBatang * PANJANG_STANDAR_BATANG) - totalPanjangDipotong;
    const wastePercentage = totalBatang > 0 ? (wasteMeter / (totalBatang * PANJANG_STANDAR_BATANG)) * 100 : 0;

    results.push({
      diameter,
      bars,
      totalBatang,
      totalPanjangDipotong,
      wasteMeter,
      wastePercentage
    });
  }

  // Sort by diameter ascending
  return results.sort((a, b) => a.diameter - b.diameter);
}

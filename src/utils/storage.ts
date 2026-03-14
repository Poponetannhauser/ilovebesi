import type { ItemBesi, Proyek, DiameterBesi } from '../types';
import { BERAT_PER_METER, PANJANG_STANDAR_BATANG } from '../types';

const STORAGE_KEY = 'besi_qs_proyek';

// ==============================
// PROYEK CRUD
// ==============================
export function getAllProyek(): Proyek[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data || data === '[]') {
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getProyekById(id: string): Proyek | null {
  const all = getAllProyek();
  return all.find(p => p.id === id) || null;
}

export function saveProyek(proyek: Proyek): void {
  const all = getAllProyek();
  const idx = all.findIndex(p => p.id === proyek.id);
  if (idx >= 0) {
    all[idx] = proyek;
  } else {
    all.push(proyek);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteProyek(id: string): void {
  const all = getAllProyek().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function createNewProyek(
  namaProyek: string,
  lokasiProyek: string,
  namaKonsultan?: string,
  kontraktor?: string,
): Proyek {
  return {
    id: generateId(),
    namaProyek,
    lokasiProyek,
    namaKonsultan,
    kontraktor,
    tanggalHitung: new Date().toISOString().split('T')[0],
    dibuat: new Date().toISOString(),
    items: [],
  };
}

// ==============================
// ITEM BESI CRUD
// ==============================
export function addItemToProyek(proyekId: string, item: Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'createdAt' | 'updatedAt'>): Proyek | null {
  const proyek = getProyekById(proyekId);
  if (!proyek) return null;

  const beratPerMeter = BERAT_PER_METER[item.diameter];
  const totalPanjang = item.panjangPotongan * item.jumlahPotongan * item.jumlahElemen;
  const totalBerat = totalPanjang * beratPerMeter;

  const newItem: ItemBesi = {
    ...item,
    id: generateId(),
    beratPerMeter,
    totalPanjang,
    totalBerat,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  proyek.items.push(newItem);
  saveProyek(proyek);
  return proyek;
}

export function updateItemInProyek(proyekId: string, itemId: string, updates: Partial<Omit<ItemBesi, 'id' | 'createdAt'>>): Proyek | null {
  const proyek = getProyekById(proyekId);
  if (!proyek) return null;

  proyek.items = proyek.items.map(item => {
    if (item.id !== itemId) return item;
    const merged = { ...item, ...updates };
    const beratPerMeter = BERAT_PER_METER[merged.diameter];
    const totalPanjang = merged.panjangPotongan * merged.jumlahPotongan * merged.jumlahElemen;
    const totalBerat = totalPanjang * beratPerMeter;
    return {
      ...merged,
      beratPerMeter,
      totalPanjang,
      totalBerat,
      updatedAt: new Date().toISOString(),
    };
  });

  saveProyek(proyek);
  return proyek;
}

export function deleteItemFromProyek(proyekId: string, itemId: string): Proyek | null {
  const proyek = getProyekById(proyekId);
  if (!proyek) return null;
  proyek.items = proyek.items.filter(i => i.id !== itemId);
  saveProyek(proyek);
  return proyek;
}

// ==============================
// KALKULASI REKAP
// ==============================
export function hitungJumlahBatang(totalPanjang: number): number {
  return Math.ceil(totalPanjang / PANJANG_STANDAR_BATANG);
}

export function getRekapDiameter(items: ItemBesi[]) {
  const map = new Map<DiameterBesi, { totalPanjang: number; totalBerat: number }>();

  items.forEach(item => {
    const existing = map.get(item.diameter) || { totalPanjang: 0, totalBerat: 0 };
    map.set(item.diameter, {
      totalPanjang: existing.totalPanjang + item.totalPanjang,
      totalBerat: existing.totalBerat + item.totalBerat,
    });
  });

  return Array.from(map.entries())
    .map(([diameter, data]) => ({
      diameter,
      ...data,
      jumlahBatang: hitungJumlahBatang(data.totalPanjang),
    }))
    .sort((a, b) => a.diameter - b.diameter);
}

export function getTotalBerat(items: ItemBesi[]): number {
  return items.reduce((sum, item) => sum + item.totalBerat, 0);
}

// ==============================
// UTILS
// ==============================
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatBerat(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(3)} ton`;
  }
  return `${kg.toFixed(2)} kg`;
}

export function formatNumber(n: number, decimal = 2): string {
  return n.toFixed(decimal).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

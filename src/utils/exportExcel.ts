import * as XLSX from 'xlsx';
import type { Proyek, DiameterBesi } from '../types';
import { BERAT_PER_METER, PANJANG_STANDAR_BATANG } from '../types';
import { getRekapDiameter, getTotalBerat } from './storage';

// ==============================
// EXPORT EXCEL
// ==============================
export function exportToExcel(proyek: Proyek): void {
  const wb = XLSX.utils.book_new();

  // ---- Sheet 1: Detail Perhitungan ----
  const detailData: (string | number)[][] = [
    // Header besar
    [`DAFTAR PERHITUNGAN KEBUTUHAN BESI TULANGAN`],
    [`Proyek: ${proyek.namaProyek}`],
    [`Lokasi: ${proyek.lokasiProyek}`],
    proyek.namaKonsultan ? [`Konsultan: ${proyek.namaKonsultan}`] : [],
    proyek.kontraktor ? [`Kontraktor: ${proyek.kontraktor}`] : [],
    [`Tanggal Hitung: ${proyek.tanggalHitung}`],
    [],
    // Header kolom
    [
      'No',
      'Kode Pekerjaan',
      'Nama Pekerjaan',
      'Type Pekerjaan',
      'Zona',
      'Diameter (mm)',
      'Type Besi',
      'Detail / Uraian',
      'Bentuk',
      'Dimensi Bentuk',
      'Panjang Potongan (m)',
      'Jml Potongan',
      'Jml Elemen',
      'Total Panjang (m)',
      'Berat/Meter (kg/m)',
      'Total Berat (kg)',
      'Catatan',
    ],
  ].filter(row => row.length > 0);

  // Data rows
  proyek.items.forEach((item, idx) => {
    detailData.push([
      idx + 1,
      item.kodePekerjaan,
      item.namaPekerjaan,
      item.typePekerjaan,
      item.zona || '-',
      `D${item.diameter}`,
      item.typeBesi,
      item.detail,
      item.shapeCode || 'Lurus',
      item.shapeValues ? `A:${item.shapeValues.a || 0} B:${item.shapeValues.b || 0} C:${item.shapeValues.c || 0} Kait:${item.shapeValues.d || 0}` : '-',
      item.panjangPotongan,
      item.jumlahPotongan,
      item.jumlahElemen,
      item.totalPanjang,
      item.beratPerMeter,
      item.totalBerat,
      item.catatan || '-',
    ] as (string | number)[]);
  });

  // Total row
  const totalBerat = getTotalBerat(proyek.items);
  const totalPanjang = proyek.items.reduce((s, i) => s + i.totalPanjang, 0);
  detailData.push([
    '', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL',
    totalPanjang.toFixed(2),
    '',
    totalBerat.toFixed(2),
    '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(detailData);

  // Column widths
  ws1['!cols'] = [
    { wch: 5 },   // No
    { wch: 14 },  // Kode
    { wch: 25 },  // Nama
    { wch: 14 },  // Type
    { wch: 10 },  // Zona
    { wch: 12 },  // Diameter
    { wch: 10 },  // Type Besi
    { wch: 30 },  // Detail
    { wch: 12 },  // Bentuk
    { wch: 25 },  // Dimensi Bentuk
    { wch: 18 },  // Panjang
    { wch: 13 },  // Jml Potongan
    { wch: 13 },  // Jml Elemen
    { wch: 16 },  // Total Panjang
    { wch: 16 },  // Berat/m
    { wch: 14 },  // Total Berat
    { wch: 22 },  // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Detail Perhitungan');

  // ---- Sheet 2: Rekap Per Diameter ----
  const rekapDiameter = getRekapDiameter(proyek.items);

  const rekapData: (string | number)[][] = [
    [`REKAPITULASI KEBUTUHAN BESI PER DIAMETER`],
    [`Proyek: ${proyek.namaProyek}`],
    [],
    ['Diameter', 'Berat/Meter (kg/m)', 'Total Panjang (m)', 'Total Berat (kg)', 'Total Berat (ton)', `Jumlah Batang (@ ${PANJANG_STANDAR_BATANG}m)`],
  ];

  rekapDiameter.forEach(r => {
    rekapData.push([
      `D${r.diameter}`,
      BERAT_PER_METER[r.diameter as DiameterBesi],
      r.totalPanjang.toFixed(2),
      r.totalBerat.toFixed(2),
      (r.totalBerat / 1000).toFixed(3),
      r.jumlahBatang,
    ]);
  });

  rekapData.push([
    'TOTAL', '',
    rekapDiameter.reduce((s, r) => s + r.totalPanjang, 0).toFixed(2),
    rekapDiameter.reduce((s, r) => s + r.totalBerat, 0).toFixed(2),
    (rekapDiameter.reduce((s, r) => s + r.totalBerat, 0) / 1000).toFixed(3),
    rekapDiameter.reduce((s, r) => s + r.jumlahBatang, 0),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(rekapData);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Per Diameter');

  // ---- Sheet 3: Rekap Per Pekerjaan ----
  const rekapPekerjaanMap = new Map<string, { totalBerat: number; totalPanjang: number }>();
  proyek.items.forEach(item => {
    const key = item.typePekerjaan;
    const existing = rekapPekerjaanMap.get(key) || { totalBerat: 0, totalPanjang: 0 };
    rekapPekerjaanMap.set(key, {
      totalBerat: existing.totalBerat + item.totalBerat,
      totalPanjang: existing.totalPanjang + item.totalPanjang,
    });
  });

  const rekapPekerjaanData: (string | number)[][] = [
    [`REKAPITULASI KEBUTUHAN BESI PER JENIS PEKERJAAN`],
    [`Proyek: ${proyek.namaProyek}`],
    [],
    ['Jenis Pekerjaan', 'Total Panjang (m)', 'Total Berat (kg)', 'Total Berat (ton)', 'Persentase (%)'],
  ];

  const totalBeratAll = getTotalBerat(proyek.items);
  Array.from(rekapPekerjaanMap.entries()).forEach(([pekerjaan, data]) => {
    rekapPekerjaanData.push([
      pekerjaan,
      data.totalPanjang.toFixed(2),
      data.totalBerat.toFixed(2),
      (data.totalBerat / 1000).toFixed(3),
      totalBeratAll > 0 ? ((data.totalBerat / totalBeratAll) * 100).toFixed(1) + '%' : '0%',
    ]);
  });

  rekapPekerjaanData.push([
    'TOTAL',
    proyek.items.reduce((s, i) => s + i.totalPanjang, 0).toFixed(2),
    totalBeratAll.toFixed(2),
    (totalBeratAll / 1000).toFixed(3),
    '100%',
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(rekapPekerjaanData);
  ws3['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Rekap Per Pekerjaan');

  // Save file
  const fileName = `ILoveBesi_${proyek.namaProyek.replace(/\s+/g, '_')}_${proyek.tanggalHitung}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

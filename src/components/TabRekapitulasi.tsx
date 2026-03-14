import React from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ItemBesi, DiameterBesi, TypePekerjaan } from "../types";
import {
	PEKERJAAN_COLORS,
	BERAT_PER_METER,
	PANJANG_STANDAR_BATANG,
} from "../types";
import {
	getRekapDiameter,
	formatNumber,
	getTotalBerat,
} from "../utils/storage";

interface Props {
	items: ItemBesi[];
}

interface RekapDiameterRow {
	diameter: DiameterBesi;
	beratPerMeter: number;
	totalPanjang: number;
	totalBerat: number;
	totalBeratTon: number;
	jumlahBatang: number;
}

interface RekapPekerjaanRow {
	typePekerjaan: TypePekerjaan;
	totalPanjang: number;
	totalBerat: number;
	totalBeratTon: number;
	persen: number;
}

export const TabRekapitulasi: React.FC<Props> = ({ items }) => {
	const rekapDiameter = getRekapDiameter(items);
	const totalBerat = getTotalBerat(items);
	const totalPanjang = items.reduce((s, i) => s + i.totalPanjang, 0);

	// Rekap per pekerjaan
	const pekerjaanMap = new Map<
		TypePekerjaan,
		{ totalBerat: number; totalPanjang: number }
	>();
	items.forEach((item) => {
		const existing = pekerjaanMap.get(item.typePekerjaan) || {
			totalBerat: 0,
			totalPanjang: 0,
		};
		pekerjaanMap.set(item.typePekerjaan, {
			totalBerat: existing.totalBerat + item.totalBerat,
			totalPanjang: existing.totalPanjang + item.totalPanjang,
		});
	});

	const rekapPekerjaan: RekapPekerjaanRow[] = Array.from(pekerjaanMap.entries())
		.map(([tp, d]) => ({
			typePekerjaan: tp,
			totalPanjang: d.totalPanjang,
			totalBerat: d.totalBerat,
			totalBeratTon: d.totalBerat / 1000,
			persen: totalBerat > 0 ? (d.totalBerat / totalBerat) * 100 : 0,
		}))
		.sort((a, b) => b.totalBerat - a.totalBerat);

	const diameterRows: RekapDiameterRow[] = rekapDiameter.map((r) => ({
		diameter: r.diameter as DiameterBesi,
		beratPerMeter: BERAT_PER_METER[r.diameter as DiameterBesi],
		totalPanjang: r.totalPanjang,
		totalBerat: r.totalBerat,
		totalBeratTon: r.totalBerat / 1000,
		jumlahBatang: r.jumlahBatang,
	}));

	const colsDiameter: ColumnsType<RekapDiameterRow> = [
		{
			title: "Diameter",
			dataIndex: "diameter",
			key: "diameter",
			render: (val: DiameterBesi) => (
				<span className="font-bold text-orange-400 font-mono text-sm">
					D{val}
				</span>
			),
		},
		{
			title: "Berat/m (kg/m)",
			dataIndex: "beratPerMeter",
			key: "beratPerMeter",
			align: "right",
			render: (val: number) => (
				<span className="font-mono text-slate-500">{val}</span>
			),
		},
		{
			title: "Total Panjang (m)",
			dataIndex: "totalPanjang",
			key: "totalPanjang",
			align: "right",
			sorter: (a, b) => a.totalPanjang - b.totalPanjang,
			render: (val: number) => (
				<span className="font-mono text-sky-600">{formatNumber(val, 2)}</span>
			),
		},
		{
			title: "Total Berat (kg)",
			dataIndex: "totalBerat",
			key: "totalBerat",
			align: "right",
			sorter: (a, b) => a.totalBerat - b.totalBerat,
			render: (val: number) => (
				<span className="font-mono font-semibold text-emerald-600">
					{formatNumber(val, 2)}
				</span>
			),
		},
		{
			title: "Total Berat (ton)",
			dataIndex: "totalBeratTon",
			key: "totalBeratTon",
			align: "right",
			render: (val: number) => (
				<span className="font-mono font-bold text-emerald-500">
					{val.toFixed(3)}
				</span>
			),
		},
		{
			title: `Jml Batang (@${PANJANG_STANDAR_BATANG}m)`,
			dataIndex: "jumlahBatang",
			key: "jumlahBatang",
			align: "right",
			sorter: (a, b) => a.jumlahBatang - b.jumlahBatang,
			render: (val: number) => (
				<span className="font-mono font-bold text-purple-400">{val}</span>
			),
		},
	];

	const colsPekerjaan: ColumnsType<RekapPekerjaanRow> = [
		{
			title: "Jenis Pekerjaan",
			dataIndex: "typePekerjaan",
			key: "typePekerjaan",
			render: (val: TypePekerjaan) => (
				<Tag color={PEKERJAAN_COLORS[val]} style={{ fontWeight: 600 }}>
					{val}
				</Tag>
			),
		},
		{
			title: "Total Panjang (m)",
			dataIndex: "totalPanjang",
			key: "totalPanjang",
			align: "right",
			render: (val: number) => (
				<span className="font-mono text-sky-600">{formatNumber(val, 2)}</span>
			),
		},
		{
			title: "Total Berat (kg)",
			dataIndex: "totalBerat",
			key: "totalBerat",
			align: "right",
			render: (val: number) => (
				<span className="font-mono font-semibold text-emerald-600">
					{formatNumber(val, 2)}
				</span>
			),
		},
		{
			title: "Total Berat (ton)",
			dataIndex: "totalBeratTon",
			key: "totalBeratTon",
			align: "right",
			render: (val: number) => (
				<span className="font-mono font-bold text-emerald-500">
					{val.toFixed(3)}
				</span>
			),
		},
		{
			title: "Persentase",
			dataIndex: "persen",
			key: "persen",
			align: "right",
			render: (val: number) => (
				<div className="flex items-center gap-2 justify-end">
					<div className="w-20 bg-slate-100 rounded-full h-1.5">
						<div
							className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
							style={{ width: `${Math.min(val, 100)}%` }}
						/>
					</div>
					<span className="font-mono text-slate-300 text-xs w-12 text-right">
						{val.toFixed(1)}%
					</span>
				</div>
			),
		},
	];

	if (items.length === 0) {
		return (
			<div className="text-center py-16 text-slate-500">
				<p className="text-lg">Belum ada data untuk direkap.</p>
				<p className="text-sm mt-1">Tambahkan item besi terlebih dahulu.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[
					{
						label: "Total Item",
						value: items.length.toString(),
						color: "text-blue-400",
						unit: "item",
					},
					{
						label: "Total Panjang",
						value: formatNumber(totalPanjang, 2),
						color: "text-sky-600",
						unit: "m",
					},
					{
						label: "Total Berat",
						value: formatNumber(totalBerat, 2),
						color: "text-emerald-600",
						unit: "kg",
					},
					{
						label: "Total Berat",
						value: (totalBerat / 1000).toFixed(3),
						color: "text-emerald-500",
						unit: "ton",
					},
				].map((card, i) => (
					<div
						key={i}
						className="glass-card p-4 text-center animate-fade-in-up"
						style={{ animationDelay: `${i * 0.05}s` }}
					>
						<p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
							{card.label}
						</p>
						<p className={`text-2xl font-bold mt-2 font-mono ${card.color}`}>
							{card.value}
						</p>
						<p className="text-xs text-slate-500 mt-1">{card.unit}</p>
					</div>
				))}
			</div>

			{/* Rekap per Diameter */}
			<div className="glass-card p-4 overflow-hidden">
				<h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
					<span className="w-1 h-4 bg-orange-400 rounded-full inline-block" />
					Rekap per Diameter
				</h3>
				<Table
					columns={colsDiameter}
					dataSource={diameterRows}
					rowKey="diameter"
					size="small"
					pagination={false}
					scroll={{ x: 'max-content' }}
					summary={() => (
						<Table.Summary>
							<Table.Summary.Row>
								<Table.Summary.Cell index={0}>
									<span className="font-bold text-slate-800">TOTAL</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={1} />
								<Table.Summary.Cell index={2} align="right">
									<span className="font-mono font-bold text-sky-600">
										{formatNumber(totalPanjang, 2)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={3} align="right">
									<span className="font-mono font-bold text-emerald-600">
										{formatNumber(totalBerat, 2)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={4} align="right">
									<span className="font-mono font-bold text-emerald-500">
										{(totalBerat / 1000).toFixed(3)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={5} align="right">
									<span className="font-mono font-bold text-purple-400">
										{diameterRows.reduce((s, r) => s + r.jumlahBatang, 0)}
									</span>
								</Table.Summary.Cell>
							</Table.Summary.Row>
						</Table.Summary>
					)}
				/>
			</div>

			{/* Rekap per Pekerjaan */}
			<div className="glass-card p-4 overflow-hidden">
				<h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
					<span className="w-1 h-4 bg-sky-500 rounded-full inline-block" />
					Rekap per Jenis Pekerjaan
				</h3>
				<Table
					columns={colsPekerjaan}
					dataSource={rekapPekerjaan}
					rowKey="typePekerjaan"
					size="small"
					pagination={false}
					scroll={{ x: 'max-content' }}
					summary={() => (
						<Table.Summary>
							<Table.Summary.Row>
								<Table.Summary.Cell index={0}>
									<span className="font-bold text-slate-800">TOTAL</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={1} align="right">
									<span className="font-mono font-bold text-sky-600">
										{formatNumber(totalPanjang, 2)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={2} align="right">
									<span className="font-mono font-bold text-emerald-600">
										{formatNumber(totalBerat, 2)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={3} align="right">
									<span className="font-mono font-bold text-emerald-500">
										{(totalBerat / 1000).toFixed(3)}
									</span>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={4} align="right">
									<span className="text-slate-400 text-xs">100%</span>
								</Table.Summary.Cell>
							</Table.Summary.Row>
						</Table.Summary>
					)}
				/>
			</div>
		</div>
	);
};

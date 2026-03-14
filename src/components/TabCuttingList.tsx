import React, { useMemo } from 'react';
import { Table, Tag, Collapse, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { NumberOutlined, ScissorOutlined, FallOutlined, BarChartOutlined } from '@ant-design/icons';
import type { ItemBesi } from '../types';
import { calculateCuttingOptimization } from '../utils/optimization';
import { formatNumber } from '../utils/storage';

const { Panel } = Collapse;

interface Props {
  items: ItemBesi[];
}

export const TabCuttingList: React.FC<Props> = ({ items }) => {
  const optimizationResults = useMemo(() => calculateCuttingOptimization(items), [items]);

  if (items.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-slate-500">Belum ada item besi. Tambahkan data besi untuk melihat Optimas Potongan (Cutting List).</p>
      </div>
    );
  }

  const grandTotalBatang = optimizationResults.reduce((sum, r) => sum + r.totalBatang, 0);
  const grandTotalWaste = optimizationResults.reduce((sum, r) => sum + r.wasteMeter, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Alert Header */}
      <Alert
        message="Cutting Optimization (Waste Management)"
        description="Sistem menggunakan algoritma 1D Bin Packing (First Fit Decreasing) untuk menyusun potongan baja tulangan ke dalam batang standar (12 meter), dirancang untuk meminimalkan material terbuang (waste)."
        type="info"
        showIcon
        icon={<ScissorOutlined />}
        className="bg-sky-50 border-sky-200"
      />

      {/* Summary Metrik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-indigo-500">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
            <NumberOutlined />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Pembelian Batang</p>
            <p className="text-3xl font-bold text-slate-800">{grandTotalBatang} <span className="text-sm font-normal text-slate-500">batang (12m)</span></p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-red-500">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl">
            <FallOutlined />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Sisa Terbuang</p>
            <p className="text-3xl font-bold text-red-600">{formatNumber(grandTotalWaste, 2)} <span className="text-sm font-normal text-red-500">meter (Waste)</span></p>
          </div>
        </div>
      </div>

      <Collapse defaultActiveKey={['0']} className="bg-white" expandIconPosition="end">
        {optimizationResults.map((result, index) => {
          // Columns for the tables
          const columns: ColumnsType<any> = [
            {
              title: 'Batang Ke-',
              dataIndex: 'barIndex',
              width: 100,
              render: (val) => <span className="font-bold text-slate-700">Batang {val}</span>,
            },
            {
              title: 'Diagram Pemotongan',
              key: 'diagram',
              render: (_, record) => (
                <div className="w-full">
                  {/* Progress bar representasi 12 meter */}
                  <div className="flex w-full h-6 rounded bg-slate-100 overflow-hidden outline outline-1 outline-slate-300">
                    {record.pieces.map((piece: any, i: number) => {
                      const widthPercent = (piece.panjang / 12) * 100;
                      // Alternate colors for cuts
                      const colors = ['#0284c7', '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc'];
                      const bgColor = colors[i % colors.length];
                      return (
                        <div
                          key={i}
                          style={{ width: `${widthPercent}%`, backgroundColor: bgColor }}
                          className="h-full border-r border-white/50 flex items-center justify-center text-[10px] text-white font-bold px-1 overflow-hidden"
                          title={`${piece.panjang}m - ${piece.kodePekerjaan} (${piece.detail})`}
                        >
                          {piece.panjang}m
                        </div>
                      );
                    })}
                    {/* Sisa portion */}
                    {record.sisa > 0 && (
                      <div
                        style={{ width: `${(record.sisa / 12) * 100}%` }}
                        className="h-full flex items-center justify-center text-[10px] text-red-500 bg-red-50 font-semibold striped-bg"
                        title={`Sisa/Waste: ${record.sisa.toFixed(2)}m`}
                      >
                        Sisa {record.sisa.toFixed(2)}m
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              title: 'Detail Potongan',
              key: 'detail',
              width: 280,
              render: (_, record) => (
                <div className="flex flex-wrap gap-1">
                  {record.pieces.map((p: any, i: number) => (
                    <Tag key={i} color="blue" style={{ fontSize: 10, margin: 2, border: 0 }}>
                      {p.panjang}m {p.kodePekerjaan ? `(${p.kodePekerjaan})` : ''}
                    </Tag>
                  ))}
                  <Tag color="error" style={{ fontSize: 10, margin: 2, border: 0 }}>
                    Sisa {record.sisa.toFixed(2)}m
                  </Tag>
                </div>
              ),
            },
          ];

          return (
            <Panel
              key={index.toString()}
              header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2 md:gap-0">
                  <div className="flex items-center gap-3">
                    <Tag color="orange" className="font-mono text-sm border-0 font-bold px-3 py-1">D{result.diameter}</Tag>
                    <span className="font-semibold text-slate-800">
                      Butuh {result.totalBatang} Batang
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-medium md:mr-4">
                    <span className="text-slate-500">Panjang Dipotong: <b className="text-blue-600">{formatNumber(result.totalPanjangDipotong, 2)}m</b></span>
                    <span className="text-slate-500">Waste: <b className="text-red-500">{formatNumber(result.wasteMeter, 2)}m</b></span>
                    <Tag color={result.wastePercentage > 15 ? 'red' : result.wastePercentage > 5 ? 'warning' : 'success'} className="border-0 font-bold ml-2">
                      <BarChartOutlined className="mr-1" />
                      {formatNumber(result.wastePercentage, 1)}%
                    </Tag>
                  </div>
                </div>
              }
              className="bg-white outline-slate-200"
            >
              <Table
                dataSource={result.bars}
                columns={columns}
                rowKey="barIndex"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                className="cutting-list-table"
              />
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

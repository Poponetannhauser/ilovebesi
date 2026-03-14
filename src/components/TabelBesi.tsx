import React, { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Input, Select, Tooltip } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ItemBesi, TypePekerjaan, DiameterBesi } from '../types';
import { PEKERJAAN_COLORS, DIAMETER_OPTIONS, TYPE_PEKERJAAN_OPTIONS } from '../types';
import { formatNumber } from '../utils/storage';

const { Search } = Input;
const { Option } = Select;

interface Props {
  items: ItemBesi[];
  onEdit: (item: ItemBesi) => void;
  onDelete: (itemId: string) => void;
}

export const TabelBesi: React.FC<Props> = ({ items, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState('');
  const [filterDiameter, setFilterDiameter] = useState<DiameterBesi | null>(null);
  const [filterPekerjaan, setFilterPekerjaan] = useState<TypePekerjaan | null>(null);

  const filteredItems = items.filter(item => {
    const matchSearch = !searchText ||
      item.namaPekerjaan.toLowerCase().includes(searchText.toLowerCase()) ||
      item.kodePekerjaan.toLowerCase().includes(searchText.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.zona || '').toLowerCase().includes(searchText.toLowerCase());
    const matchDiameter = !filterDiameter || item.diameter === filterDiameter;
    const matchPekerjaan = !filterPekerjaan || item.typePekerjaan === filterPekerjaan;
    return matchSearch && matchDiameter && matchPekerjaan;
  });

  const totalBerat = filteredItems.reduce((s, i) => s + i.totalBerat, 0);
  const totalPanjang = filteredItems.reduce((s, i) => s + i.totalPanjang, 0);

  const columns: ColumnsType<ItemBesi> = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      fixed: 'left',
      render: (_: unknown, __: ItemBesi, idx: number) => (
        <span className="text-slate-500 text-xs">{idx + 1}</span>
      ),
    },
    {
      title: 'Kode',
      dataIndex: 'kodePekerjaan',
      key: 'kodePekerjaan',
      width: 80,
      render: (val: string) => (
        <span className="font-mono font-bold text-blue-400 text-xs">{val}</span>
      ),
    },
    {
      title: 'Nama Pekerjaan',
      key: 'nama',
      width: 200,
      render: (_: unknown, record: ItemBesi) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{record.namaPekerjaan}</p>
          {record.zona && <p className="text-xs text-slate-500">{record.zona}</p>}
        </div>
      ),
    },
    {
      title: 'Jenis',
      dataIndex: 'typePekerjaan',
      key: 'typePekerjaan',
      width: 100,
      render: (val: TypePekerjaan) => (
        <Tag color={PEKERJAAN_COLORS[val]} style={{ fontSize: 11, fontWeight: 600 }}>{val}</Tag>
      ),
    },
    {
      title: 'Detail & Bentuk',
      dataIndex: 'detail',
      key: 'detail',
      width: 180,
      render: (val: string, record: ItemBesi) => (
        <div>
          <span className="text-slate-500 text-xs block">{val}</span>
          {record.shapeCode && (
            <Tag color="#0f766e" style={{ fontSize: 10, marginTop: 4, border: 0, color: '#ccfbf1' }}>
              {record.shapeCode} 
              {record.shapeValues?.a ? ` (A:${record.shapeValues.a})` : ''}
              {record.shapeValues?.b ? ` (B:${record.shapeValues.b})` : ''}
              {record.shapeValues?.c ? ` (C:${record.shapeValues.c})` : ''}
              {record.shapeValues?.d ? ` (Kait:${record.shapeValues.d})` : ''}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Ø (mm)',
      dataIndex: 'diameter',
      key: 'diameter',
      width: 80,
      sorter: (a: ItemBesi, b: ItemBesi) => a.diameter - b.diameter,
      render: (val: DiameterBesi) => (
        <span className="font-bold text-orange-400 font-mono">D{val}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'typeBesi',
      key: 'typeBesi',
      width: 70,
      render: (val: string) => <span className="text-slate-500 text-xs">{val}</span>,
    },
    {
      title: 'P. Pot (m)',
      dataIndex: 'panjangPotongan',
      key: 'panjangPotongan',
      width: 90,
      align: 'right',
      render: (val: number) => <span className="font-mono text-xs">{formatNumber(val, 2)}</span>,
    },
    {
      title: 'Jml Pot',
      dataIndex: 'jumlahPotongan',
      key: 'jumlahPotongan',
      width: 75,
      align: 'right',
      render: (val: number) => <span className="font-mono text-xs">{val}</span>,
    },
    {
      title: 'Jml Elm',
      dataIndex: 'jumlahElemen',
      key: 'jumlahElemen',
      width: 75,
      align: 'right',
      render: (val: number) => <span className="font-mono text-xs">{val}</span>,
    },
    {
      title: 'Total Panjang (m)',
      dataIndex: 'totalPanjang',
      key: 'totalPanjang',
      width: 130,
      align: 'right',
      sorter: (a: ItemBesi, b: ItemBesi) => a.totalPanjang - b.totalPanjang,
      render: (val: number) => (
        <span className="font-mono font-semibold text-sky-600 text-sm">{formatNumber(val, 2)}</span>
      ),
    },
    {
      title: 'Total Berat (kg)',
      dataIndex: 'totalBerat',
      key: 'totalBerat',
      width: 130,
      align: 'right',
      sorter: (a: ItemBesi, b: ItemBesi) => a.totalBerat - b.totalBerat,
      render: (val: number) => (
        <span className="font-mono font-bold text-green-400 text-sm">{formatNumber(val, 2)}</span>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: ItemBesi) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              id={`btn-edit-${record.id}`}
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              style={{ color: '#0b8af0' }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Popconfirm
              title="Hapus item ini?"
              description="Data tidak bisa dikembalikan setelah dihapus."
              onConfirm={() => onDelete(record.id)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                id={`btn-delete-${record.id}`}
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: '#ef4444' }}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tableProps: TableProps<ItemBesi> = {
    columns,
    dataSource: filteredItems,
    rowKey: 'id',
    scroll: { x: 1400 },
    size: 'small',
    pagination: {
      pageSize: 20,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (total: number) => `${total} item`,
    },
    summary: () => (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={10} align="right">
            <span className="text-slate-500 font-semibold text-xs uppercase">Total ({filteredItems.length} item)</span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={10} align="right">
            <span className="font-mono font-bold text-sky-600">{formatNumber(totalPanjang, 2)}</span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={11} align="right">
            <span className="font-mono font-bold text-green-400">{formatNumber(totalBerat, 2)}</span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={12} />
        </Table.Summary.Row>
      </Table.Summary>
    ),
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <Search
          id="search-besi"
          placeholder="Cari kode, nama, detail..."
          allowClear
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 260, background: '#1e293b' }}
          prefix={<SearchOutlined style={{ color: '#475569' }} />}
        />
        <div className="flex items-center gap-2">
          <FilterOutlined style={{ color: '#475569' }} />
          <Select
            id="filter-diameter"
            placeholder="Filter Diameter"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => setFilterDiameter(val as DiameterBesi | null)}
          >
            {DIAMETER_OPTIONS.map(d => <Option key={d} value={d}>D{d}</Option>)}
          </Select>
          <Select
            id="filter-pekerjaan"
            placeholder="Filter Pekerjaan"
            allowClear
            style={{ width: 160 }}
            onChange={(val) => setFilterPekerjaan(val as TypePekerjaan | null)}
          >
            {TYPE_PEKERJAAN_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </div>
        {(searchText || filterDiameter || filterPekerjaan) && (
          <span className="text-xs text-slate-500">
            Menampilkan {filteredItems.length} dari {items.length} item
          </span>
        )}
      </div>

      <Table {...tableProps} />
    </div>
  );
};

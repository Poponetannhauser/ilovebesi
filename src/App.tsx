import React, { useState, useEffect } from 'react';
import { Button, Tabs, message, Popconfirm, Dropdown, Badge, Tag, Empty } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, FolderOpenOutlined, DownOutlined,
  AppstoreOutlined, TableOutlined, BarChartOutlined, FileExcelOutlined, DeleteOutlined,
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, ScissorOutlined
} from '@ant-design/icons';
import type { Proyek, ItemBesi } from './types';
import {
  getAllProyek, getProyekById, createNewProyek, saveProyek,
  addItemToProyek, updateItemInProyek, deleteItemFromProyek,
  deleteProyek, getTotalBerat, formatNumber
} from './utils/storage';
import { exportToExcel } from './utils/exportExcel';
import { FormProyek } from './components/FormProyek';
import { FormInputBesi } from './components/FormInputBesi';
import { TabelBesi } from './components/TabelBesi';
import { TabRekapitulasi } from './components/TabRekapitulasi';
import { TabCuttingList } from './components/TabCuttingList';

type ActiveTab = 'detail' | 'rekap' | 'cutting';

const App: React.FC = () => {
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [activeProyekId, setActiveProyekId] = useState<string | null>(null);
  const [activeProyek, setActiveProyek] = useState<Proyek | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('detail');

  const [showFormProyek, setShowFormProyek] = useState(false);
  const [showFormBesi, setShowFormBesi] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemBesi | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  // Load all proyek on mount
  useEffect(() => {
    const all = getAllProyek();
    setProyekList(all);
    if (all.length > 0 && !activeProyekId) {
      setActiveProyekId(all[all.length - 1].id);
    }
  }, []);

  // Load active proyek when ID changes
  useEffect(() => {
    if (activeProyekId) {
      const p = getProyekById(activeProyekId);
      setActiveProyek(p);
    } else {
      setActiveProyek(null);
    }
  }, [activeProyekId]);

  const refreshProyek = () => {
    const all = getAllProyek();
    setProyekList(all);
    if (activeProyekId) {
      setActiveProyek(getProyekById(activeProyekId));
    }
  };

  // ===== PROYEK HANDLERS =====
  const handleCreateProyek = (values: { namaProyek: string; lokasiProyek: string; namaKonsultan?: string; kontraktor?: string }) => {
    const newP = createNewProyek(values.namaProyek, values.lokasiProyek, values.namaKonsultan, values.kontraktor);
    saveProyek(newP);
    setShowFormProyek(false);
    setActiveProyekId(newP.id);
    const all = getAllProyek();
    setProyekList(all);
    messageApi.success(`Proyek "${newP.namaProyek}" berhasil dibuat!`);
  };

  const handleDeleteProyek = (proyekId: string) => {
    deleteProyek(proyekId);
    const all = getAllProyek();
    setProyekList(all);
    if (activeProyekId === proyekId) {
      setActiveProyekId(all.length > 0 ? all[all.length - 1].id : null);
    }
    messageApi.success('Proyek dihapus.');
  };

  // ===== BESI HANDLERS =====
  const handleAddBesi = (values: Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'createdAt' | 'updatedAt'>) => {
    if (!activeProyekId) return;
    if (editingItem) {
      updateItemInProyek(activeProyekId, editingItem.id, values);
      messageApi.success('Item berhasil diupdate!');
    } else {
      addItemToProyek(activeProyekId, values);
      messageApi.success('Item besi ditambahkan!');
    }
    setShowFormBesi(false);
    setEditingItem(null);
    refreshProyek();
  };

  const handleEditBesi = (item: ItemBesi) => {
    setEditingItem(item);
    setShowFormBesi(true);
  };

  const handleDeleteBesi = (itemId: string) => {
    if (!activeProyekId) return;
    deleteItemFromProyek(activeProyekId, itemId);
    messageApi.success('Item dihapus.');
    refreshProyek();
  };

  const handleExport = () => {
    if (!activeProyek || activeProyek.items.length === 0) {
      messageApi.warning('Tidak ada data untuk diekspor. Tambahkan item besi terlebih dahulu.');
      return;
    }
    try {
      exportToExcel(activeProyek);
      messageApi.success('File Excel berhasil diekspor!');
    } catch (e) {
      messageApi.error('Gagal mengekspor file. Coba lagi.');
    }
  };

  // Proyek switcher menu
  const proyekMenuItems: MenuProps['items'] = [
    ...proyekList.map(p => ({
      key: p.id,
      label: (
        <div className="flex items-center justify-between gap-4 min-w-48">
          <div>
            <p className="font-semibold text-slate-200 text-sm">{p.namaProyek}</p>
            <p className="text-xs text-slate-500">{p.items.length} item</p>
          </div>
          {p.id === activeProyekId && <span className="text-blue-400 text-xs">● Aktif</span>}
        </div>
      ),
      onClick: () => setActiveProyekId(p.id),
    })),
    { type: 'divider' as const },
    {
      key: 'new',
      icon: <PlusOutlined />,
      label: 'Buat Proyek Baru',
      onClick: () => setShowFormProyek(true),
    },
  ];

  const totalBerat = activeProyek ? getTotalBerat(activeProyek.items) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {contextHolder}

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-sky-700 flex items-center justify-center">
              <span className="text-white font-black text-sm">QS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">ILoveBesi <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-1">v1.0</span></h1>
              <p className="text-xs text-slate-500 leading-none">Estimator Kebutuhan Besi Tulangan</p>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="w-full md:flex-1 md:max-w-md order-3 md:order-2">
            {proyekList.length > 0 ? (
              <Dropdown menu={{ items: proyekMenuItems }} trigger={['click']}>
                <button
                  id="btn-switch-proyek"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 hover:border-sky-500 transition-colors bg-white w-full text-left"
                >
                  <FolderOpenOutlined className="text-sky-600" />
                  <span className="flex-1 text-slate-700 text-sm font-medium truncate">
                    {activeProyek?.namaProyek || 'Pilih Proyek...'}
                  </span>
                  <DownOutlined className="text-slate-400 text-xs" />
                </button>
              </Dropdown>
            ) : (
              <button
                id="btn-start"
                onClick={() => setShowFormProyek(true)}
                className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-slate-300 hover:border-sky-500 transition-colors w-full text-left text-slate-500 hover:text-sky-600 text-sm"
              >
                <PlusOutlined />
                <span>Buat Proyek Baru...</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 order-2 md:order-3">
            {activeProyek && (
              <>
                <Button
                  id="btn-tambah-besi"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => { setEditingItem(null); setShowFormBesi(true); }}
                  className="bg-sky-600 hover:bg-sky-500"
                >
                  Tambah Item
                </Button>
                <Button
                  id="btn-export-excel"
                  icon={<FileExcelOutlined />}
                  onClick={handleExport}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  Export Excel
                </Button>
                <Popconfirm
                  title="Hapus proyek ini?"
                  description={`"${activeProyek.namaProyek}" dan semua datanya akan dihapus permanen.`}
                  onConfirm={() => handleDeleteProyek(activeProyek.id)}
                  okText="Hapus"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    id="btn-hapus-proyek"
                    icon={<DeleteOutlined />}
                    danger
                  />
                </Popconfirm>
              </>
            )}
            {proyekList.length === 0 && (
              <Button
                id="btn-buat-proyek-header"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowFormProyek(true)}
              >
                Buat Proyek
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">

        {/* No project state */}
        {!activeProyek && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
            <div className="glass-card p-12 text-center max-w-lg animate-fade-in-up">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0b8af0, #6366f1)' }}>
                <AppstoreOutlined style={{ fontSize: 36, color: 'white' }} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Selamat Datang di ILoveBesi</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Aplikasi kalkulator besi tulangan untuk Quantity Surveyor. Hitung kebutuhan besi, buat rekapitulasi, dan ekspor ke Excel dengan mudah.
              </p>
              <Button
                id="btn-mulai"
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setShowFormProyek(true)}
                style={{ background: 'linear-gradient(135deg, #0b8af0, #6366f1)', border: 'none', height: 48 }}
              >
                Buat Proyek Pertama
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4">
              {[
                { icon: <TableOutlined />, title: 'Input Detail', desc: 'Input data besi dengan live preview perhitungan', color: '#0369a1' },
                { icon: <BarChartOutlined />, title: 'Rekapitulasi', desc: 'Rekap otomatis per diameter & jenis pekerjaan', color: '#0f766e' },
                { icon: <FileExcelOutlined />, title: 'Export Excel', desc: 'Export ke .xlsx dengan 3 sheet terformulasi', color: '#059669' },
              ].map((f, i) => (
                <div key={i} className="glass-card p-4 text-center">
                  <div className="text-2xl mb-2" style={{ color: f.color }}>{f.icon}</div>
                  <p className="font-semibold text-slate-700 text-sm">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active project view */}
        {activeProyek && (
          <div>
            {/* Project info bar */}
            <div className="glass-card mb-4 flex flex-col md:flex-row md:items-center gap-4 justify-between" style={{ borderLeft: '4px solid #0369a1', padding: '12px 16px' }}>
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{activeProyek.namaProyek}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <EnvironmentOutlined /> {activeProyek.lokasiProyek}
                    </span>
                    {activeProyek.namaKonsultan && (
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <TeamOutlined /> {activeProyek.namaKonsultan}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <CalendarOutlined /> {activeProyek.tanggalHitung}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 md:ml-4 md:border-l border-slate-200 md:pl-4 py-1">
                  <Tag color="geekblue" style={{ fontSize: 12, padding: '2px 8px' }}>{activeProyek.items.length} Item Form</Tag>
                  <Tag color="success" style={{ fontSize: 12, padding: '2px 8px' }}>
                    {totalBerat >= 1000
                      ? `${(totalBerat / 1000).toFixed(3)} Ton`
                      : `${formatNumber(totalBerat, 2)} kg`}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as ActiveTab)}
              items={[
                {
                  key: 'detail',
                  label: (
                    <span className="flex items-center gap-1.5">
                      <TableOutlined />
                      <span>Detail Perhitungan</span>
                      <Badge count={activeProyek.items.length} size="small" style={{ background: '#1d4ed8' }} />
                    </span>
                  ),
                  children: (
                    <div className="glass-card p-4">
                      {activeProyek.items.length === 0 ? (
                        <Empty
                          description={<span className="text-slate-500">Belum ada item besi. Klik "Tambah Item" untuk memulai.</span>}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => { setEditingItem(null); setShowFormBesi(true); }}
                            className="bg-sky-600 hover:bg-sky-500 mt-4"
                          >
                            Tambah Item Pertama
                          </Button>
                        </Empty>
                      ) : (
                        <TabelBesi
                          items={activeProyek.items}
                          onEdit={handleEditBesi}
                          onDelete={handleDeleteBesi}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'rekap',
                  label: (
                    <span className="flex items-center gap-1.5">
                      <BarChartOutlined />
                      <span>Rekapitulasi</span>
                    </span>
                  ),
                  children: <TabRekapitulasi items={activeProyek.items} />,
                },
                {
                  key: 'cutting',
                  label: (
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-sky-600 transition-colors">
                      <ScissorOutlined />
                      <span>Optimas Potongan</span>
                    </span>
                  ),
                  children: <TabCuttingList items={activeProyek.items} />,
                },
              ]}
              tabBarStyle={{
                color: '#64748b',
                marginBottom: 16,
              }}
            />
          </div>
        )}
      </main>

      {/* ===== MODALS ===== */}
      <FormProyek
        open={showFormProyek}
        onSubmit={handleCreateProyek}
        onCancel={() => setShowFormProyek(false)}
      />
      <FormInputBesi
        open={showFormBesi}
        proyekId={activeProyekId || ''}
        editItem={editingItem}
        onSubmit={handleAddBesi}
        onCancel={() => { setShowFormBesi(false); setEditingItem(null); }}
      />
    </div>
  );
};

export default App;

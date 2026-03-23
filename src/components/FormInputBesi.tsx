import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { DiameterBesi, ItemBesi, ShapeCode } from '../types';
import { DIAMETER_OPTIONS, TYPE_PEKERJAAN_OPTIONS, TYPE_BESI_OPTIONS, BERAT_PER_METER, PANJANG_STANDAR_BATANG } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  open: boolean;
  editItem?: ItemBesi | null;
  onSubmit: (values: Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'totalBeratWaste' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const FormInputBesi: React.FC<Props> = ({ open, editItem, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState({ totalPanjang: 0, totalPanjangDenganOverlap: 0, overlapPerSambungan: 0, totalBerat: 0, totalBeratWaste: 0, jumlahBatang: 0, estimasiBiaya: 0 });
  const [currentShape, setCurrentShape] = useState<ShapeCode>('Lurus');

  React.useEffect(() => {
    if (open) {
      if (editItem) {
        form.setFieldsValue(editItem);
        setCurrentShape(editItem.shapeCode || 'Lurus');
        recalcPreview(editItem.panjangPotongan, editItem.jumlahPotongan, editItem.jumlahElemen, editItem.diameter, editItem.wastePercent || 0, editItem.jumlahSambungan || 0, editItem.hargaPerKg || 0);
      } else {
        form.resetFields();
        form.setFieldsValue({
          typeBesi: 'U32',
          diameter: 12,
          jumlahElemen: 1,
          jumlahPotongan: 1,
          shapeCode: 'Lurus',
          wastePercent: 10,
          jumlahSambungan: 0,
          hargaPerKg: 0,
        });
        setCurrentShape('Lurus');
        setPreview({ totalPanjang: 0, totalPanjangDenganOverlap: 0, overlapPerSambungan: 0, totalBerat: 0, totalBeratWaste: 0, jumlahBatang: 0, estimasiBiaya: 0 });
      }
    }
  }, [open, editItem, form]);

  const recalcPreview = (panjang: number, jmlPotongan: number, jmlElemen: number, diameter: DiameterBesi, wastePercent: number = 0, jumlahSambungan: number = 0, hargaPerKg: number = 0) => {
    if (panjang && jmlPotongan && jmlElemen && diameter) {
      const totalPanjang = panjang * jmlPotongan * jmlElemen;
      const overlapPerSambungan = 40 * (diameter / 1000);
      const totalPanjangOverlap = overlapPerSambungan * jumlahSambungan * jmlElemen;
      const totalPanjangDenganOverlap = totalPanjang + totalPanjangOverlap;
      const beratPerMeter = BERAT_PER_METER[diameter] || 0;
      const totalBerat = totalPanjangDenganOverlap * beratPerMeter;
      const totalBeratWaste = totalBerat * (1 + wastePercent / 100);
      const jumlahBatang = Math.ceil(totalPanjangDenganOverlap / PANJANG_STANDAR_BATANG);
      const estimasiBiaya = hargaPerKg > 0 ? totalBeratWaste * hargaPerKg : 0;
      setPreview({ totalPanjang, totalPanjangDenganOverlap, overlapPerSambungan, totalBerat, totalBeratWaste, jumlahBatang, estimasiBiaya });
    }
  };

  const onValuesChange = (changed: any, all: any) => {
    if (changed.shapeCode) {
      setCurrentShape(changed.shapeCode);
    }

    let autoPanjang = Number(all.panjangPotongan) || 0;
    let autoJumlah = Number(all.jumlahPotongan) || 0;

    // Auto-compute panjangPotongan if shape or dimensions changed
    if (changed.shapeValues || changed.shapeCode) {
      const vals = all.shapeValues || {};
      const a = Number(vals.a) || 0;
      const b = Number(vals.b) || 0;
      const c = Number(vals.c) || 0;
      const d = Number(vals.d) || 0;

      const shape = all.shapeCode || 'Lurus';
      if (shape === 'Lurus') autoPanjang = a;
      else if (shape === 'L') autoPanjang = a + b;
      else if (shape === 'U') autoPanjang = a + b + c;
      else if (shape === 'Z') autoPanjang = a + b + c;
      else if (shape === 'Sengkang') autoPanjang = 2 * (a + b) + d;
      else if (shape === 'Lingkaran') autoPanjang = Math.PI * a + d; // π × Diameter + kait

      form.setFieldsValue({ panjangPotongan: autoPanjang });
    }

    // Auto-compute jumlahPotongan if tinggiKolom or jarakSengkang changes
    if (changed.tinggiKolom !== undefined || changed.jarakSengkang !== undefined || changed.shapeCode) {
      if (all.shapeCode === 'Sengkang') {
        const tinggi = Number(all.tinggiKolom) || 0;
        const jarak = Number(all.jarakSengkang) || 0;
        if (tinggi > 0 && jarak > 0) {
          autoJumlah = Math.ceil(tinggi / jarak) + 1;
          form.setFieldsValue({ jumlahPotongan: autoJumlah });
        }
      }
    }

    recalcPreview(
      autoPanjang,
      autoJumlah,
      Number(all.jumlahElemen) || 0,
      (all.diameter as DiameterBesi) || 12,
      Number(all.wastePercent) || 0,
      Number(all.jumlahSambungan) || 0,
      Number(all.hargaPerKg) || 0,
    );
  };

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      onSubmit(vals as Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'totalBeratWaste' | 'estimasiBiaya' | 'createdAt' | 'updatedAt'>);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <span>{editItem ? 'Edit Item Besi' : 'Tambah Item Besi'}</span>
        </div>
      }
      onCancel={onCancel}
      width={780}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        className="mt-4"
      >
        <Divider orientation="left" style={{ color: '#64748b', fontSize: 12, borderColor: '#334155' }}>
          IDENTIFIKASI PEKERJAAN
        </Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="kodePekerjaan" label="Kode Pekerjaan" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input id="kodePekerjaan" placeholder="B1, K2, P3..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item name="namaPekerjaan" label="Nama Pekerjaan" rules={[{ required: true }]}>
              <Input placeholder="Contoh: Kolom Utama Lt.1" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="zona" label="Zona/Lantai" rules={[{ required: true }]}>
              <Input placeholder="Contoh: Lt. 1" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="typePekerjaan" label="Jenis Pekerjaan" rules={[{ required: true }]}>
              <Select id="typePekerjaan" placeholder="Pilih jenis...">
                {TYPE_PEKERJAAN_OPTIONS.map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="detail" label="Detail / Uraian" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input id="detail" placeholder="Tulangan Utama Atas, Sengkang, Susut..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ color: '#64748b', fontSize: 12, borderColor: '#334155' }}>
          SPESIFIKASI BESI
        </Divider>
        <Row gutter={[16, 0]}>
          <Col xs={12} sm={10}>
            <Form.Item name="diameter" label="Diameter" rules={[{ required: true }]}>
              <Select id="diameter" placeholder="Pilih diameter...">
                {DIAMETER_OPTIONS.map(d => (
                  <Option key={d} value={d}>
                    D{d} — {BERAT_PER_METER[d]} kg/m
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} sm={14}>
            <Form.Item name="typeBesi" label="Grade" rules={[{ required: true }]}>
              <Select id="typeBesi">
                {TYPE_BESI_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ color: '#64748b', fontSize: 12, borderColor: '#334155' }}>
          DIMENSI &amp; KUANTITAS (SHAPE CODE)
        </Divider>
        
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Form.Item name="shapeCode" label="Bentuk Dasar (Shape)" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <Select id="shapeCode">
                {[
                  { value: 'Lurus',     desc: 'Batang lurus (tiang, sloof, plat)' },
                  { value: 'L',         desc: 'Kait satu ujung (starter bar, angkur)' },
                  { value: 'U',         desc: 'Kait dua ujung (hairpin)' },
                  { value: 'Z',         desc: 'Batang diagonal (dowel, sambungan)' },
                  { value: 'Sengkang',  desc: 'Sengkang persegi (kolom/balok kotak)' },
                  { value: 'Lingkaran', desc: 'Sengkang kolom bulat / spiral' },
                ].map(s => (
                  <Option key={s.value} value={s.value}>
                    <span className="font-semibold">{s.value}</span>
                    <span className="text-slate-400 text-xs ml-2">{s.desc}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Row gutter={[8, 8]}>
                <Col xs={12} sm={6}>
                  <Form.Item name={['shapeValues', 'a']} label="A (m)" tooltip="Panjang Sisi A" style={{ marginBottom: 0 }}>
                    <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                  </Form.Item>
                </Col>
                {['L', 'U', 'Sengkang', 'Z'].includes(currentShape) && (
                  <Col xs={12} sm={6}>
                    <Form.Item name={['shapeValues', 'b']} label="B (m)" tooltip="Panjang Sisi B" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
                {['U', 'Z'].includes(currentShape) && (
                  <Col xs={12} sm={6}>
                    <Form.Item name={['shapeValues', 'c']} label="C (m)" tooltip="Panjang Sisi C" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
                {['Sengkang', 'Lingkaran'].includes(currentShape) && (
                  <Col xs={12} sm={6}>
                    <Form.Item name={['shapeValues', 'd']} label="Kait (m)" tooltip="Panjang total kait (Contoh: 0.15)" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.01} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
              </Row>
              
              {/* Kalkulator Sengkang Persegi */}
              {['Sengkang'].includes(currentShape) && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Hitung Otomatis Jumlah Sengkang Persegi</p>
                  <Row gutter={[8, 8]}>
                    <Col xs={12}>
                      <Form.Item name="tinggiKolom" label="Tinggi Kolom/Balok (m)" tooltip="Panjang total elemen yang akan diisi sengkang" style={{ marginBottom: 0 }}>
                        <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="jarakSengkang" label="Jarak Sengkang (m)" tooltip="Jarak antar sengkang, misalnya 0.15 (15cm)" style={{ marginBottom: 0 }}>
                        <InputNumber className="w-full" step={0.01} min={0} placeholder="0.00" precision={2} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
              {/* Info Lingkaran */}
              {['Lingkaran'].includes(currentShape) && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">🔵 Sengkang Kolom Bulat / Spiral</p>
                  <p className="text-xs text-slate-400">Isi <strong>A</strong> = Diameter lingkaran dalam meter (misal: 0.5 untuk kolom Ø500). Sistem otomatis hitung: <em>π × A + Kait</em>.</p>
                  <Row gutter={[8, 8]} className="mt-2">
                    <Col xs={12}>
                      <Form.Item name="tinggiKolom" label="Tinggi Kolom (m)" tooltip="Untuk hitung otomatis jumlah sengkang spiral" style={{ marginBottom: 0 }}>
                        <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="jarakSengkang" label="Jarak Sengkang (m)" tooltip="Jarak antar sengkang spiral" style={{ marginBottom: 0 }}>
                        <InputNumber className="w-full" step={0.01} min={0} placeholder="0.00" precision={2} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
              {/* Info Z-Shape */}
              {['Z'].includes(currentShape) && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-400">⚡ Shape Z: Isi <strong>A</strong> = sisi pertama, <strong>B</strong> = sisi tengah diagonal, <strong>C</strong> = sisi akhir. Total = A + B + C.</p>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Baris 1: Data Kuantitas Utama */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="panjangPotongan"
              label="P. Potongan (m)"
              rules={[{ required: true, type: 'number', min: 0.01 }]}
              tooltip="Panjang 1 potongan besi dalam meter"
            >
              <InputNumber
                id="panjangPotongan"
                className="w-full"
                placeholder="0.00"
                step={0.1}
                precision={2}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              name="jumlahPotongan"
              label="Jml. Potong (batang/elemen)"
              rules={[{ required: true, type: 'number', min: 1 }]}
              tooltip="Jumlah batang besi dalam 1 elemen (misal: 1 kolom punya 10 batang)"
            >
              <InputNumber id="jumlahPotongan" className="w-full" placeholder="1" min={1} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              name="jumlahElemen"
              label="Jml. Elemen (Kolom/Balok)"
              rules={[{ required: true, type: 'number', min: 1 }]}
              tooltip="Jumlah total kolom/balok yang identik"
            >
              <InputNumber id="jumlahElemen" className="w-full" placeholder="1" min={1} precision={0} />
            </Form.Item>
          </Col>
        </Row>

        {/* Baris 2: Faktor Koreksi */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Faktor Koreksi &amp; Harga</p>
          <Row gutter={[16, 0]}>
            <Col xs={12} sm={8}>
              <Form.Item
                name="wastePercent"
                label="Waste / Susut"
                tooltip="Persentase tambahan besi untuk antisipasi buangan/sisa potong (standar lapangan 10-15%)"
                style={{ marginBottom: 0 }}
              >
                <InputNumber id="wastePercent" className="w-full" placeholder="10" min={0} precision={1} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                name="jumlahSambungan"
                label="Jml. Sambungan (Overlap)"
                tooltip={`Berapa kali besi disambung dalam 1 elemen? Contoh: pilar tinggi 15m butuh 2 batang = 1 sambungan. Sistem otomatis tambah 40×Diameter meter per sambungan.`}
                style={{ marginBottom: 0 }}
              >
                <InputNumber id="jumlahSambungan" className="w-full" placeholder="0" min={0} precision={0} addonAfter="titik" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="hargaPerKg"
                label="Harga Besi (Rp/kg)"
                tooltip="Harga beli besi per kilogram dari supplier. Opsional — untuk estimasi biaya pengadaan (procurement)."
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  id="hargaPerKg"
                  className="w-full"
                  placeholder="0"
                  min={0}
                  precision={0}
                  formatter={value => value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                  parser={(value) => (Number((value || '').replace(/Rp\s?|\./g, '')) as 0)}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Live Preview */}
        {(preview.totalPanjang > 0) && (
          <div className="glass-card p-4 mb-4 animate-fade-in-up border-l-4 border-sky-500">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Penjabaran Logika Hitung (Sesuai Lapangan)</p>
            
            <div className="bg-slate-50 rounded p-3 mb-4 font-mono text-sm text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-1 mb-1">
                <span>1. Total Panjang Kebutuhan:</span>
                <span className="font-semibold">{preview.totalPanjang.toFixed(2)} meter</span>
              </div>
              {preview.overlapPerSambungan > 0 && (
                <div className="flex justify-between border-b border-slate-200 pb-1 mb-1 text-orange-600">
                  <span>+ Tambahan Overlap ({(form.getFieldValue('jumlahSambungan') || 0)} sambungan × {preview.overlapPerSambungan.toFixed(2)}m):</span>
                  <span className="font-semibold">+{(preview.totalPanjangDenganOverlap - preview.totalPanjang).toFixed(2)} meter</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200 pb-1 mb-1 text-sky-700">
                <span>2. Total Panjang + Overlap:</span>
                <span className="font-semibold">{preview.totalPanjangDenganOverlap.toFixed(2)} meter → {(preview.totalPanjangDenganOverlap / PANJANG_STANDAR_BATANG).toFixed(2)} batang</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1 mb-1">
                <span>3. Berat 1 Batang Besi ({PANJANG_STANDAR_BATANG}m):</span>
                <span className="font-semibold">{(BERAT_PER_METER[form.getFieldValue('diameter') as DiameterBesi] * PANJANG_STANDAR_BATANG || 0).toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1 mb-1">
                <span>4. Berat Asli (Langkah 2 × Berat/m):</span>
                <span className="font-semibold">{preview.totalBerat.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between">
                <span>5. Ditambah Waste ({(form.getFieldValue('wastePercent') || 0)}%):</span>
                <span className="font-bold text-emerald-600">{preview.totalBeratWaste.toFixed(2)} Kg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-sky-600">{preview.totalPanjangDenganOverlap.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total Panjang + Overlap (m)</p>
              </div>
              <div className="text-center md:border-l border-slate-200">
                <p className="text-xl font-bold text-slate-600">{preview.totalBerat.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Berat Murni (kg)</p>
              </div>
              <div className="text-center md:border-l border-slate-200">
                <p className="text-2xl font-bold text-emerald-600">{preview.totalBeratWaste.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total + Waste (kg)</p>
              </div>
              <div className="text-center md:border-l border-slate-200">
                <p className="text-2xl font-bold text-indigo-600">{preview.jumlahBatang}</p>
                <p className="text-xs text-slate-500 mt-1">Jml Batang (@12m)</p>
              </div>
            </div>
            {preview.estimasiBiaya > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">💰 Estimasi Biaya Pengadaan:</span>
                <span className="text-lg font-bold text-amber-600">
                  Rp {preview.estimasiBiaya.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
        )}

        <Form.Item name="catatan" label="Catatan (opsional)">
          <TextArea id="catatan" rows={2} placeholder="Keterangan tambahan..." />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-2">
          <Button onClick={onCancel} id="btn-cancel-item" style={{ background: '#1e293b', borderColor: '#334155', color: '#94a3b8' }}>
            Batal
          </Button>
          <Button type="primary" onClick={handleOk} id="btn-save-item" icon={<PlusOutlined />}
            style={{ background: 'linear-gradient(135deg, #0b8af0, #6366f1)' }}>
            {editItem ? 'Update Item' : 'Tambah Item'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

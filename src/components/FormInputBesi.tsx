import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { DiameterBesi, ItemBesi, ShapeCode } from '../types';
import { DIAMETER_OPTIONS, TYPE_PEKERJAAN_OPTIONS, TYPE_BESI_OPTIONS, BERAT_PER_METER, PANJANG_STANDAR_BATANG, SHAPE_CODE_OPTIONS } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  open: boolean;
  proyekId: string;
  editItem?: ItemBesi | null;
  onSubmit: (values: Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const FormInputBesi: React.FC<Props> = ({ open, editItem, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState({ totalPanjang: 0, totalBerat: 0, jumlahBatang: 0 });
  const [currentShape, setCurrentShape] = useState<ShapeCode>('Lurus');

  React.useEffect(() => {
    if (open) {
      if (editItem) {
        form.setFieldsValue(editItem);
        setCurrentShape(editItem.shapeCode || 'Lurus');
        recalcPreview(editItem.panjangPotongan, editItem.jumlahPotongan, editItem.jumlahElemen, editItem.diameter);
      } else {
        form.resetFields();
        form.setFieldsValue({
          typeBesi: 'U32',
          diameter: 12,
          jumlahElemen: 1,
          jumlahPotongan: 1,
          shapeCode: 'Lurus',
        });
        setCurrentShape('Lurus');
        setPreview({ totalPanjang: 0, totalBerat: 0, jumlahBatang: 0 });
      }
    }
  }, [open, editItem, form]);

  const recalcPreview = (panjang: number, jmlPotongan: number, jmlElemen: number, diameter: DiameterBesi) => {
    if (panjang && jmlPotongan && jmlElemen && diameter) {
      const totalPanjang = panjang * jmlPotongan * jmlElemen;
      const beratPerMeter = BERAT_PER_METER[diameter] || 0;
      const totalBerat = totalPanjang * beratPerMeter;
      const jumlahBatang = Math.ceil(totalPanjang / PANJANG_STANDAR_BATANG);
      setPreview({ totalPanjang, totalBerat, jumlahBatang });
    }
  };

  const onValuesChange = (changed: any, all: any) => {
    if (changed.shapeCode) {
      setCurrentShape(changed.shapeCode);
    }

    let autoPanjang = Number(all.panjangPotongan) || 0;

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
      else if (shape === 'Sengkang') autoPanjang = 2 * (a + b) + d;

      form.setFieldsValue({ panjangPotongan: autoPanjang });
    }

    recalcPreview(
      autoPanjang,
      Number(all.jumlahPotongan) || 0,
      Number(all.jumlahElemen) || 0,
      (all.diameter as DiameterBesi) || 12,
    );
  };

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      onSubmit(vals as Omit<ItemBesi, 'id' | 'totalPanjang' | 'beratPerMeter' | 'totalBerat' | 'createdAt' | 'updatedAt'>);
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
          <Col span={10}>
            <Form.Item name="namaPekerjaan" label="Nama Pekerjaan" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input id="namaPekerjaan" placeholder="Balok Utama Lt.1..." />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="zona" label="Zona / Lantai">
              <Input id="zona" placeholder="Lt.1, Zona A..." />
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
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="diameter" label="Diameter (mm)" rules={[{ required: true }]}>
              <Select id="diameter" placeholder="Pilih diameter...">
                {DIAMETER_OPTIONS.map(d => (
                  <Option key={d} value={d}>
                    D{d} — {BERAT_PER_METER[d]} kg/m
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="typeBesi" label="Type Besi" rules={[{ required: true }]}>
              <Select id="typeBesi">
                {TYPE_BESI_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ color: '#64748b', fontSize: 12, borderColor: '#334155' }}>
          DIMENSI &amp; KUANTITAS (SHAPE CODE)
        </Divider>
        
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Form.Item name="shapeCode" label="Bentuk Dasar (Shape)" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <Select id="shapeCode">
                {SHAPE_CODE_OPTIONS.map(s => <Option key={s} value={s}>{s}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Row gutter={8}>
                <Col span={6}>
                  <Form.Item name={['shapeValues', 'a']} label="A (m)" tooltip="Panjang Sisi A" style={{ marginBottom: 0 }}>
                    <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                  </Form.Item>
                </Col>
                {['L', 'U', 'Sengkang'].includes(currentShape) && (
                  <Col span={6}>
                    <Form.Item name={['shapeValues', 'b']} label="B (m)" tooltip="Panjang Sisi B" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
                {['U'].includes(currentShape) && (
                  <Col span={6}>
                    <Form.Item name={['shapeValues', 'c']} label="C (m)" tooltip="Panjang Sisi C" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.1} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
                {['Sengkang'].includes(currentShape) && (
                  <Col span={6}>
                    <Form.Item name={['shapeValues', 'd']} label="Kait (m)" tooltip="Panjang total kait (Contoh: 0.15)" style={{ marginBottom: 0 }}>
                      <InputNumber className="w-full" step={0.01} min={0} placeholder="0.00" precision={2} />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="panjangPotongan"
              label="P. Potongan (Manual)"
              rules={[{ required: true, type: 'number', min: 0.01 }]}
              tooltip="Bisa diedit manual atau dihitung otomatis berdasar Shape."
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
          <Col span={8}>
            <Form.Item
              name="jumlahPotongan"
              label="Jumlah Potongan / Elemen"
              rules={[{ required: true, type: 'number', min: 1 }]}
            >
              <InputNumber id="jumlahPotongan" className="w-full" placeholder="1" min={1} precision={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="jumlahElemen"
              label="Jumlah Elemen"
              rules={[{ required: true, type: 'number', min: 1 }]}
            >
              <InputNumber id="jumlahElemen" className="w-full" placeholder="1" min={1} precision={0} />
            </Form.Item>
          </Col>
        </Row>

        {/* Live Preview */}
        {(preview.totalPanjang > 0) && (
          <div className="glass-card p-4 mb-4 animate-fade-in-up">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Preview Hasil Perhitungan</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{preview.totalPanjang.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total Panjang (m)</p>
              </div>
              <div className="text-center border-x border-slate-700">
                <p className="text-2xl font-bold text-orange-400">{preview.totalBerat.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total Berat (kg)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{preview.jumlahBatang}</p>
                <p className="text-xs text-slate-500 mt-1">Jumlah Batang (@12m)</p>
              </div>
            </div>
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

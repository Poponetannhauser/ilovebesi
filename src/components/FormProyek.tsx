import React from 'react';
import { Modal, Form, Input, Button, Row, Col } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

interface FormValues {
  namaProyek: string;
  lokasiProyek: string;
  namaKonsultan?: string;
  kontraktor?: string;
}

interface Props {
  open: boolean;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export const FormProyek: React.FC<Props> = ({ open, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      onSubmit(vals as FormValues);
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
          <FolderOpenOutlined className="text-sky-600 text-xl" />
          <span className="text-slate-800 font-bold text-lg">Buat Proyek Baru</span>
        </div>
      }
      onCancel={onCancel}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="namaProyek"
          label="Nama Proyek"
          rules={[{ required: true, message: 'Nama proyek wajib diisi' }]}
        >
          <Input id="namaProyek" placeholder="Gedung Perkantoran ABC Lt.5..." />
        </Form.Item>
        <Form.Item
          name="lokasiProyek"
          label="Lokasi Proyek"
          rules={[{ required: true, message: 'Lokasi wajib diisi' }]}
        >
          <Input id="lokasiProyek" placeholder="Jl. Sudirman No.1, Jakarta..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="namaKonsultan" label="Konsultan (opsional)">
              <Input id="namaKonsultan" placeholder="PT. Konsultan ABC..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="kontraktor" label="Kontraktor (opsional)">
              <Input id="kontraktor" placeholder="PT. Kontraktor XYZ..." />
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end gap-3 mt-2">
          <Button onClick={onCancel} id="btn-cancel-proyek" className="border-slate-300 text-slate-500">
            Batal
          </Button>
          <Button type="primary" onClick={handleOk} id="btn-save-proyek" className="bg-sky-600 hover:bg-sky-500">
            Simpan Proyek
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

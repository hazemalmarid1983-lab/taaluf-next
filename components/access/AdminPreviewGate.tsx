'use client';

import AdminPreviewBar from '@/components/access/AdminPreviewBar';
import PermissionGate from '@/components/access/PermissionGate';

export default function AdminPreviewGate() {
  return (
    <PermissionGate permission="access_admin_panel">
      <AdminPreviewBar />
    </PermissionGate>
  );
}

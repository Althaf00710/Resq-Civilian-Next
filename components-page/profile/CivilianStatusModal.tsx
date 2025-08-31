// components/modals/CivilianStatusModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import CivilianStatusRequest from './CivilianStatusRequest';
import CivilianStatus from './CivilianStatus';

type Mode = 'request' | 'status';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Which modal to show first */
  initialMode?: Mode;
  /** localStorage key to read the civilianId from. Defaults to 'resq.civilian' */
  civilianIdKey?: string;
  /** Called when a request succeeds (message from server, if any) */
  onRequested?: (msg?: string) => void;
  /** If true, switch to status view after a successful request (default: true) */
  autoSwitchToStatus?: boolean;
};

export default function CivilianStatusModal({
  open,
  onClose,
  initialMode = 'request',
  civilianIdKey = 'resq_civilian',
  onRequested,
  autoSwitchToStatus = true,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);

  // Reset to initial mode whenever the modal is re-opened
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  return (
    <>
      {/* Request modal */}
      <CivilianStatusRequest
        open={open && mode === 'request'}
        onClose={onClose}
        civilianIdKey={civilianIdKey}
        onSuccess={(msg) => {
          onRequested?.(msg);
          if (autoSwitchToStatus) setMode('status');
        }}
      />

      {/* View statuses modal */}
      <CivilianStatus
        open={open && mode === 'status'}
        onClose={onClose}
        title="Civilian Status"
      />
    </>
  );
}

// app/(whatever)/request/page.tsx
'use client';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import Swal from 'sweetalert2'; // <-- add
import EmergencyRequestModal from '@/components-page/request/EmergencyRequestModal';
import RequestStatusModal from '@/components-page/request/RequestStatusModal';
import { GET_EMERGENCY_WITH_SUB } from '@/graphql/Queries/emergencyCategoryQueries';
import type { GetEmergencyCategoriesData } from '@/graphql/types/emergencyCategory';
import { CREATE_RESCUE_VEHICLE_REQUEST } from '@/graphql/mutations/vehicleRequestMutations';
import { VEHICLE_REQUEST_STATUS_SUB } from '@/graphql/subscriptions/vehicleRequestSubscription';
import { VEHICLE_LOCATION_SHARE_SUB } from '@/graphql/subscriptions/vehicleLocationSubscription';
import { GET_ACTIVE_VEHICLE_REQUEST } from '@/graphql/Queries/vehicleRequestQueries';
import { CANCEL_RESCUE_VEHICLE_REQUEST } from '@/graphql/mutations/rescueVehicleRequestMutation'; // <-- you already had this
import { loadSession } from '@/lib/auth';

const Map = dynamic(() => import('@/components-page/request/Map'), { ssr: false });

export default function Page() {
  const { data: catsData } = useQuery<GetEmergencyCategoriesData>(GET_EMERGENCY_WITH_SUB);
  const [createRequest] = useMutation(CREATE_RESCUE_VEHICLE_REQUEST);

  const [requestId, setRequestId] = useState<string | number | null>(null);
  const [status, setStatus] = useState<string>('Searching');
  const [createdAt, setCreatedAt] = useState<string | Date | undefined>(undefined);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [vehicleMarker, setVehicleMarker] = useState<{ id: number; lat: number; lng: number; label?: string } | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lng: number; address?: string | null } | null>(null);
  const [showReqModal, setShowReqModal] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const reopenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReopen = useCallback(() => {
    if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
    reopenTimerRef.current = setTimeout(() => {
      // reset view back to the request flow
      setShowStatusModal(false);
      setShowReqModal(true);

      // optional: clear request-specific state
      setRequestId(null);
      setVehicleId(null);
      setVehicleMarker(null);
      setPicked(null);
      setCreatedAt(undefined);
      setStatus('Searching');
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof status === 'string' && status.toLowerCase().includes('cancel')) {
      scheduleReopen();
    }
  }, [status, scheduleReopen]);

  // Recover active request on refresh
  const { civilian } = useMemo(() => loadSession(), []);
  const civilianIdNum = useMemo(
    () => (civilian?.id != null && Number.isFinite(Number(civilian.id)) ? Number(civilian.id) : null),
    [civilian]
  );

  const { data } = useQuery(GET_ACTIVE_VEHICLE_REQUEST, {
    variables: { civilianId: civilianIdNum! },
    fetchPolicy: 'network-only',
    skip: civilianIdNum == null,
  });

  useEffect(() => {
    const list = (data?.vehicleRequestPaging ?? []) as Array<{
      id: string | number;
      status: string;
      createdAt: string;
      rescueVehicleAssignments?: Array<{ rescueVehicleId?: number }>;
    }>;
    if (!list.length) return;

    const active = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    setRequestId(active.id);
    setStatus(active.status);
    setCreatedAt(active.createdAt);
    setShowReqModal(false);
    setShowStatusModal(true);

    const rvId = active.rescueVehicleAssignments?.[0]?.rescueVehicleId;
    if (rvId) setVehicleId(rvId);
  }, [data]);

  // Live status subscription
  useSubscription(VEHICLE_REQUEST_STATUS_SUB, {
    onData: ({ data }) => {
      const ev = data.data?.onRescueVehicleRequestStatusChanged;
      if (!ev || !requestId || String(ev.id) !== String(requestId)) return;
      setStatus(ev.status);
      setCreatedAt(ev.createdAt);
      const rvId = ev.rescueVehicleAssignments?.[0]?.rescueVehicleId;
      if (rvId && !vehicleId) setVehicleId(rvId);
    },
  });

  // Live location share
  useSubscription(VEHICLE_LOCATION_SHARE_SUB, {
    onData: ({ data }) => {
      const loc = data.data?.onVehicleLocationShare;
      if (!loc || !vehicleId || Number(loc.rescueVehicleId) !== Number(vehicleId)) return;
      const label = loc?.rescueVehicle?.code ?? undefined;
      setVehicleMarker({ id: Number(loc.rescueVehicleId), lat: loc.latitude, lng: loc.longitude, label });
    },
  });

  // --- Cancel flow ---
  const [cancelMutation] = useMutation(CANCEL_RESCUE_VEHICLE_REQUEST);

  const handleCancelRequest = async () => {
    if (!requestId) return;

    const { isConfirmed } = await Swal.fire({
      title: 'Cancel this request?',
      text: 'This will stop searching and notify responders.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep waiting',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    try {
      await cancelMutation({
        variables: { id: Number(requestId), status: "Cancelled"}, // adjust if your mutation needs different vars
        optimisticResponse: {
          cancelRescueVehicleRequest: {
            __typename: 'CancelRescueVehicleRequestPayload',
            success: true,
            message: 'Cancelled',
            rescueVehicleRequest: {
              __typename: 'RescueVehicleRequest',
              id: requestId,
              status: 'Cancelled',
            },
          },
        },
      });
      setStatus('Cancelled');
      await Swal.fire({ title: 'Cancelled', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (e: any) {
      await Swal.fire({
        title: 'Failed to cancel',
        text: e?.message || 'Something went wrong.',
        icon: 'error',
      });
    }
  };

  return (
    <>
      <Map onChange={(pos) => setPicked(pos)} vehicleMarker={vehicleMarker} />

      {/* Emergency Request */}
      {showReqModal && (
        <EmergencyRequestModal
          categories={catsData?.emergencyCategories ?? []}
          onSubmit={async (payload) => {
            if (!picked) {
              alert('Please move the map to select a location first.');
              return;
            }
            const subIdNum = Number(payload.emergencySubCategoryId);
            if (!Number.isFinite(subIdNum)) {
              alert('Invalid subcategory selection.');
              return;
            }

            try {
              const { data: mData } = await createRequest({
                variables: {
                  input: {
                    civilianId: civilianIdNum,
                    description: payload.description || null,
                    emergencySubCategoryId: subIdNum,
                    latitude: picked.lat,
                    longitude: picked.lng,
                    address: picked.address ?? null,
                  },
                  proofImage: payload.proofImage ?? null,
                },
              });

              const res = mData?.createRescueVehicleRequest;
              if (!res?.success || !res.rescueVehicleRequest?.id) throw new Error(res?.message || 'Failed to create request');

              setRequestId(res.rescueVehicleRequest.id);
              setStatus(res.rescueVehicleRequest.status);
              setCreatedAt(res.rescueVehicleRequest.createdAt);
              setShowReqModal(false);
              setShowStatusModal(true);
            } catch (e: any) {
              console.error(e);
              alert(e?.message || 'Something went wrong.');
            }
          }}
        />
      )}

      {/* Live Request Status */}
      {showStatusModal && requestId && (
        <RequestStatusModal
          isOpen
          data={{ id: requestId, status, createdAt }}
          allowClose
          onClose={() => setShowStatusModal(false)}
          cancelRequest={handleCancelRequest} 
        />
      )}
    </>
  );
}

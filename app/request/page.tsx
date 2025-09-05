'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import Swal from 'sweetalert2';

import EmergencyRequestModal from '@/components-page/request/EmergencyRequestModal';
import RequestStatusModal from '@/components-page/request/RequestStatusModal';

import { GET_EMERGENCY_WITH_SUB } from '@/graphql/Queries/emergencyCategoryQueries';
import type { GetEmergencyCategoriesData } from '@/graphql/types/emergencyCategory';

import { CREATE_RESCUE_VEHICLE_REQUEST } from '@/graphql/mutations/vehicleRequestMutations';
import { CANCEL_RESCUE_VEHICLE_REQUEST } from '@/graphql/mutations/rescueVehicleRequestMutation';

import { VEHICLE_REQUEST_STATUS_SUB } from '@/graphql/subscriptions/vehicleRequestSubscription';
import { VEHICLE_LOCATION_SHARE_SUB } from '@/graphql/subscriptions/vehicleLocationSubscription';

import type { OnRescueVehicleRequestStatusChangedPayload } from '@/graphql/types/rescueVehicleRequest';
import { loadSession } from '@/lib/auth';

// Map (client-only)
const Map = dynamic(() => import('@/components-page/request/Map'), { ssr: false });

export default function Page() {
  // --- GraphQL: categories ---
  const { data: catsData } = useQuery<GetEmergencyCategoriesData>(GET_EMERGENCY_WITH_SUB);

  // --- Mutations ---
  const [createRequest] = useMutation(CREATE_RESCUE_VEHICLE_REQUEST);
  const [cancelMutation] = useMutation(CANCEL_RESCUE_VEHICLE_REQUEST);

  // --- UI / State ---
  const [requestId, setRequestId] = useState<string | number | null>(null);
  const [status, setStatus] = useState<string>('Searching');
  const [createdAt, setCreatedAt] = useState<string | Date | undefined>(undefined);

  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [vehicleMarker, setVehicleMarker] = useState<{
    id: number;
    lat: number;
    lng: number;
    label?: string;
    iconify?: string;
  } | null>(null);

  // NEW: details for the status modal
  const [vehicleCode, setVehicleCode] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState<string | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lng: number; address?: string | null } | null>(null);
  const [showReqModal, setShowReqModal] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // --- Reopen request UI after cancel ---
  const reopenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReopen = useCallback(() => {
    if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current);
    reopenTimerRef.current = setTimeout(() => {
      setShowStatusModal(false);
      setShowReqModal(true);
      setRequestId(null);
      setVehicleId(null);
      setVehicleMarker(null);
      setVehicleCode(null);
      setPlateNumber(null);
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
    if ((status ?? '').toLowerCase().includes('cancel')) scheduleReopen();
  }, [status, scheduleReopen]);

  // --- Session / Civilian ---
  const [civilianIdNum, setCivilianIdNum] = useState<number | null>(null);
  useEffect(() => {
    const { civilian } = loadSession();
    setCivilianIdNum(civilian?.id != null && Number.isFinite(Number(civilian.id)) ? Number(civilian.id) : null);
  }, []);

  // 1) Get active request ID(s)
  const { data: activeIdData } = useQuery(GET_ACTIVE_VEHICLE_REQUEST, {
    variables: civilianIdNum != null ? { civilianId: civilianIdNum } : undefined,
    fetchPolicy: 'network-only',
    skip: civilianIdNum == null,
  });
  const activeId = activeIdData?.vehicleRequestPaging?.[0]?.id ?? null;

  // 2) Fetch full request by ID
  const { data: rescueData } = useQuery(GET_RESCUE_REQUEST_BY_ID, {
    variables: activeId ? { id: Number(activeId) } : undefined,
    skip: !activeId,
    fetchPolicy: 'network-only',
  });

  // Bootstrap state once from full request
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    const r = rescueData?.rescueVehicleRequestById;
    if (!r) return;

    bootstrappedRef.current = true;

    setRequestId(r.id);
    setStatus(r.status);
    setCreatedAt(r.createdAt);

    if (r.latitude != null && r.longitude != null) {
      setPicked({ lat: Number(r.latitude), lng: Number(r.longitude) });
    }

    setShowReqModal(false);
    setShowStatusModal(true);

    const assignment = r.rescueVehicleAssignments?.[0];
    if (assignment?.rescueVehicleId) setVehicleId(assignment.rescueVehicleId);

    // Fill code & plate
    setVehicleCode(assignment?.rescueVehicle?.code ?? null);
    setPlateNumber(assignment?.rescueVehicle?.plateNumber ?? null);

    const locs = assignment?.rescueVehicle?.rescueVehicleLocations ?? [];
    const latest = locs[0];
    if (latest && assignment?.rescueVehicleId) {
      setVehicleMarker({
        id: assignment.rescueVehicleId,
        lat: Number(latest.latitude),
        lng: Number(latest.longitude),
        label: assignment?.rescueVehicle?.code,
        iconify:
          assignment?.rescueVehicle?.rescueVehicleCategory?.name === 'Ambulance'
            ? 'fluent-emoji-flat:ambulance'
            : undefined,
      });
    }
  }, [rescueData]);

  // Helpers to read sub payload shapes
  function extractVehicleId(ev: any): number | null {
    const a = ev?.rescueVehicleAssignments;
    if (!a) return null;
    return Array.isArray(a) ? a[0]?.rescueVehicleId ?? null : a.rescueVehicleId ?? null;
  }
  function extractVehicleObj(ev: any) {
    const a = ev?.rescueVehicleAssignments;
    if (!a) return null;
    const node = Array.isArray(a) ? a[0] : a;
    return node?.rescueVehicle ?? null;
  }

  // --- Status subscription (scoped by requestId) ---
  const statusEvtCount = useRef(0);
  const { data: statusData, error: statusSubErr } =
    useSubscription<{ onRescueVehicleRequestStatusChanged: OnRescueVehicleRequestStatusChangedPayload }>(
      VEHICLE_REQUEST_STATUS_SUB,
      {
        variables: requestId ? { requestId: Number(requestId) } : undefined,
        skip: !requestId,
        fetchPolicy: 'no-cache',
        shouldResubscribe: true,
        onData: ({ data }) => {
          const ev = data?.data?.onRescueVehicleRequestStatusChanged;
          console.log('[SUB][status] #', ++statusEvtCount.current, ev);
          if (!ev) return;

          setRequestId(ev.id);
          setStatus(ev.status);
          setCreatedAt(ev.createdAt);

          const rvId = extractVehicleId(ev);
          if (rvId != null) setVehicleId((v) => (v == null ? Number(rvId) : v));

          // backfill code/plate
          const rv = extractVehicleObj(ev);
          if (rv?.code) setVehicleCode((prev) => prev ?? rv.code);
          if (rv?.plateNumber) setPlateNumber((prev) => prev ?? rv.plateNumber);

          setShowStatusModal(true);
          setShowReqModal(false);
        },
      }
    );
  useEffect(() => {
    if (statusData) console.log('[SUB][status] snapshot:', statusData);
    if (statusSubErr) console.error('[SUB][status] error:', statusSubErr);
  }, [statusData, statusSubErr]);

  // --- Location subscription (starts when not Searching & not terminal) ---
  const isSearching  = /search/i.test(status || '');
  const isCompleted  = /(complete|done)/i.test(status || '');   // Completed/Done
  const isActiveLeg  = /dispatch|arriv/i.test(status || '');    // Dispatched or Arrived
  const shouldTrack  = !!vehicleId && isActiveLeg && !isSearching && !isCompleted;

  // On Completed → fully reset to "create request" view
  useEffect(() => {
    if (!isCompleted) return;

    setVehicleMarker(null);
    setVehicleId(null);
    setVehicleCode(null);
    setPlateNumber(null);
    setRequestId(null);
    setPicked(null);
    setCreatedAt(undefined);
    setStatus('Searching');

    setShowStatusModal(false);
    setShowReqModal(true);

    console.log('[FLOW] Completed → reset UI and stop tracking');
  }, [isCompleted]);

  // helpful debug: when tracking flips on/off
  useEffect(() => {
    console.log('[SUB][loc] tracking state →', { shouldTrack, vehicleId, status });
  }, [shouldTrack, vehicleId, status]);

  // event counter for pretty logs
  const locEvtCount = useRef(0);

  const { data: locData, error: locSubErr } = useSubscription(VEHICLE_LOCATION_SHARE_SUB, {
    variables: shouldTrack ? { rescueVehicleId: Number(vehicleId) } : undefined,
    skip: !shouldTrack,
    fetchPolicy: 'no-cache',
    shouldResubscribe: true,
    onData: ({ data }) => {
      const loc = (data as any)?.data?.onVehicleLocationShareByVehicle;

      console.log(
        `[SUB][loc] #${++locEvtCount.current}`,
        loc
          ? {
              rescueVehicleId: loc.rescueVehicleId,
              active: loc.active,
              lat: loc.latitude,
              lng: loc.longitude,
              lastActive: loc.lastActive,
              code: loc?.rescueVehicle?.code,
            }
          : '(no payload)'
      );

      if (!loc) return;
      if (Number(loc.rescueVehicleId) !== Number(vehicleId)) return;

      // fill in code/plate if we didn't have it yet
      if (loc?.rescueVehicle?.code && !vehicleCode) setVehicleCode(loc.rescueVehicle.code);
      if (loc?.rescueVehicle?.plateNumber && !plateNumber) setPlateNumber(loc.rescueVehicle.plateNumber);

      setVehicleMarker({
        id: Number(loc.rescueVehicleId),
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        label: loc?.rescueVehicle?.code ?? vehicleCode ?? undefined,
        iconify:
          loc?.rescueVehicle?.rescueVehicleCategory?.emergencyToVehicles?.[0]?.emergencyCategory?.icon ?? undefined,
      });
    },
  });

  useEffect(() => {
    if (locData) console.log('[SUB][loc] hook snapshot:', JSON.parse(JSON.stringify(locData)));
  }, [locData]);
  useEffect(() => {
    if (locSubErr) {
      console.error('[SUB][loc] error:', {
        message: locSubErr.message,
        graphQLErrors: locSubErr.graphQLErrors?.map((e) => ({ msg: e.message, path: e.path, extensions: e.extensions })),
        networkError: (locSubErr.networkError as any)?.result ?? locSubErr.networkError,
      });
    }
  }, [locSubErr]);

  // --- Cancel flow ---
  const handleCancelRequest = useCallback(async () => {
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
        variables: { id: Number(requestId), status: 'Cancelled' },
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
  }, [cancelMutation, requestId]);

  // --- Map selected change ---
  const handleMapChange = useCallback((pos: { lat: number; lng: number; address?: string | null }) => {
    setPicked(pos);
  }, []);

  return (
    <>
      <Map
        key={`map-${requestId ?? 'new'}`}
        onChange={handleMapChange}
        initialCenter={picked ? { lat: picked.lat, lng: picked.lng } : undefined}
        vehicleMarker={
          vehicleMarker
            ? {
                id: vehicleMarker.id,
                lat: vehicleMarker.lat,
                lng: vehicleMarker.lng,
                label: vehicleMarker.label,
                iconUrl: '/vehicle.png', // fallback image
              }
            : null
        }
        requestedLocation={picked ? { lat: picked.lat, lng: picked.lng } : null}
        status={status}
        allowPicking={showReqModal} // only before request is created
      />

      {showReqModal && (
        <EmergencyRequestModal
          categories={catsData?.emergencyCategories ?? []}
          onSubmit={async (payload) => {
            if (!picked) return alert('Please move the map to select a location first.');
            const subIdNum = Number(payload.emergencySubCategoryId);
            if (!Number.isFinite(subIdNum)) return alert('Invalid subcategory selection.');

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
              if (!res?.success || !res.rescueVehicleRequest?.id) {
                throw new Error(res?.message || 'Failed to create request');
              }

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

      {showStatusModal && requestId && (
        <RequestStatusModal
          isOpen
          data={{ id: requestId, status, createdAt }}
          // 👇 pass vehicle details for the modal to display
          vehicle={{ code: vehicleCode ?? undefined, plateNumber: plateNumber ?? undefined, iconUrl: '/vehicle.png' }}
          allowClose
          onClose={() => setShowStatusModal(false)}
          cancelRequest={handleCancelRequest}
        />
      )}
    </>
  );
}

/* ------------------ GraphQL ------------------ */

// 1) Get only active request IDs
export const GET_ACTIVE_VEHICLE_REQUEST = gql`
  query GetActiveVehicleRequest($civilianId: Int!) {
    vehicleRequestPaging(
      where: {
        civilianId: { eq: $civilianId }
        status: { in: ["Searching", "Dispatched", "Arrived"] }
      }
    ) {
      id
    }
  }
`;

// 2) Fetch full request by ID
export const GET_RESCUE_REQUEST_BY_ID = gql`
  query GetRescueRequestById($id: Int!) {
    rescueVehicleRequestById(id: $id) {
      id
      isActive
      status
      createdAt
      longitude
      latitude
      rescueVehicleAssignments {
        id
        rescueVehicleId
        rescueVehicle {
          id
          plateNumber
          code
          rescueVehicleCategory { name }
          rescueVehicleLocations {
            id
            latitude
            longitude
          }
        }
      }
    }
  }
`;

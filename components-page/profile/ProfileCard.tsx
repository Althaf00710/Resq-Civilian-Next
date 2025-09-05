'use client';

import React from 'react';
import Image from 'next/image';
import { Mail, Phone, IdCard, Calendar, Shield, User } from 'lucide-react';

export type Civilian = {
  name: string;
  email: string;
  phoneNumber: string;
  nicNumber: string;
  joinedDate: string | Date;
  civilianStatus: { role: string };
  /** Optional avatar image URL (from /public or remote) */
  avatarUrl?: string;
};

type ProfileCardProps = {
  civilian: Civilian;
  className?: string;
};

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function ProfileCard({ civilian, className = '' }: ProfileCardProps) {
  const { name, email, phoneNumber, nicNumber, joinedDate, civilianStatus, avatarUrl } = civilian;

  return (
    <section
      className={[
        'relative w-full max-w-3xl rounded-3xl bg-white shadow-xl ring-1 ring-black/5',
        'px-6 py-6 md:px-8 md:py-7',
        'isolate',
        className,
      ].join(' ')}
      aria-label={`Profile card for ${name}`}
    >
      {/* subtle background pill to mimic reference look */}
      <div className="pointer-events-none absolute -inset-x-1 -inset-y-1 -z-10 rounded-[2rem] bg-gradient-to-b from-gray-100 to-gray-500/50" />

      <div className="grid grid-cols-[auto,1fr] gap-5 md:gap-7 items-start">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-full ring-1 ring-black/10 shadow-md bg-gradient-to-br from-indigo-600 to-pink-300 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${name} avatar`}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <User aria-hidden className="h-10 w-10 text-white" />
            )}
          </div>
        </div>

        {/* Right side content */}
        <div className="min-w-0">
          {/* Header: Name & role */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-3">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 truncate">
                {name}
              </h2>
              <p className="text-sm md:text-[15px] text-gray-500 truncate">
                {civilianStatus?.role || '—'}
              </p>
            </div>

            {/* Joined badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Joined {formatDate(joinedDate)}
            </div>
          </div>

          {/* Details grid */}
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-gray-100 p-2 ring-1 ring-inset ring-gray-200">
                <Mail className="h-4 w-4 text-gray-700" aria-hidden />
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] uppercase tracking-wide text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900 truncate">
                  <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                </dd>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-gray-100 p-2 ring-1 ring-inset ring-gray-200">
                <Phone className="h-4 w-4 text-gray-700" aria-hidden />
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] uppercase tracking-wide text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">
                  <a href={`tel:${phoneNumber}`} className="hover:underline">{phoneNumber}</a>
                </dd>
              </div>
            </div>

            {/* NIC */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-gray-100 p-2 ring-1 ring-inset ring-gray-200">
                <IdCard className="h-4 w-4 text-gray-700" aria-hidden />
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] uppercase tracking-wide text-gray-500">NIC Number</dt>
                <dd className="text-sm font-medium text-gray-900 break-all">{nicNumber}</dd>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-gray-100 p-2 ring-1 ring-inset ring-gray-200">
                <Shield className="h-4 w-4 text-gray-700" aria-hidden />
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] uppercase tracking-wide text-gray-500">Status</dt>
                <dd className="text-sm font-medium text-gray-900">{civilianStatus?.role || '—'}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}


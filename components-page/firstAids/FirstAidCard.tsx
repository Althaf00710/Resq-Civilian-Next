import React, { useState } from "react";
import { FirstAidDetail } from "@/graphql/types/firstAidDetail";

export type FirstAidCardProps = {
  detail: FirstAidDetail;
  className?: string;
  variant?: "stack" | "grid";
};

export default function FirstAidCard({
  detail,
  className,
  variant = "stack",
}: FirstAidCardProps) {
  const [imgOk, setImgOk] = useState(true);

  const number = Number.isFinite(detail?.displayOrder)
    ? detail.displayOrder
    : undefined;

  const fallbackSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#f1f5f9'/>
          <stop offset='100%' stop-color='#e2e8f0'/>
        </linearGradient>
      </defs>
      <rect width='800' height='450' fill='url(#g)'/>
      <text x='50%' y='50%' fill='#94a3b8' font-size='24' font-family='Inter, system-ui, sans-serif' text-anchor='middle' dominant-baseline='middle'>No image</text>
    </svg>`
  );

  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  const resolveImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
    if (!BASE_URL) return url;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  };

  const imgSrc =
    imgOk && detail?.imageUrl
      ? resolveImageUrl(detail.imageUrl)
      : `data:image/svg+xml;utf8,${fallbackSvg}`;

  const categoryName = detail?.emergencySubCategory?.name || "";

  return (
    <div
      className={[
        "group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className || "",
      ].join(" ")}
    >
      {/* Image area with top-right overlay */}
      <div className="relative w-full pt-[56%] bg-gray-100">
        <img
          src={imgSrc}
          alt={`${categoryName ? categoryName + " - " : ""}First aid illustration #${number ?? "?"}`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgOk(false)}
          loading="lazy"
        />

        {/* Overlay: stack -> subcategory pill; grid -> action buttons */}
        {variant === "stack" ? (
          categoryName && (
            <span className="absolute right-3 top-3 max-w-[72%] truncate rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
              {categoryName}
            </span>
          )
        ) : (
          <div className="absolute right-3 top-3 flex items-center gap-2">
          </div>
        )}
      </div>

      {/* Numbered point */}
      <div className="flex items-start gap-3 p-4 bg-gray-100">
        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
          {Number.isFinite(number) ? number : "?"}
        </div>
        <p className="text-sm leading-6 text-gray-700">{detail?.point}</p>
      </div>
    </div>
  );
}

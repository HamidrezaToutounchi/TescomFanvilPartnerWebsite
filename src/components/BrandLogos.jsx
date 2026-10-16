import React, { useState } from 'react';

export function FanvilLogo({ className = "h-8", variant = "default" }) {
  const [imgError, setImgError] = useState(false);
  const fill = variant === "white" ? "#FFFFFF" : "#E60012";

  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {!imgError && variant !== "white" ? (
        <img
          src="/fanvil-official-logo.png"
          alt="Fanvil Official Logo"
          onError={() => setImgError(true)}
          className="h-full w-auto object-contain"
        />
      ) : (
        /* Exact Vector SVG of Official Fanvil Logo (Curved F + 6 Segmented Top Bars over anvil) */
        <svg
          viewBox="0 0 240 62"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto"
          aria-label="Fanvil Official Logo"
        >
          {/* F with curved top-left */}
          <path
            d="M4 54V26C4 14.5 11.5 8 23 8H48V18H23C17.5 18 15 20.5 15 26V28H46V37.5H15V54H4Z"
            fill={fill}
          />
          {/* 6 Segmented Top Bars above 'anvil' */}
          <rect x="53" y="8" width="38" height="10" fill={fill} />
          <rect x="96" y="8" width="32" height="10" fill={fill} />
          <rect x="133" y="8" width="25" height="10" fill={fill} />
          <rect x="163" y="8" width="20" height="10" fill={fill} />
          <rect x="188" y="8" width="14" height="10" fill={fill} />
          <rect x="207" y="8" width="11" height="10" fill={fill} />
          {/* 'a' */}
          <path
            d="M54 24H78C86.5 24 91 28 91 35.5V54H80V50C77.2 52.8 73 54.5 67 54.5C57.5 54.5 51.5 49.8 51.5 43C51.5 35.8 57.8 32 69 32H80V31C80 28.2 77.8 26.8 73 26.8H54V24ZM69.5 47.5C75.8 47.5 80 44.8 80 40.5V38.5H70C64 38.5 61.5 40.2 61.5 43C61.5 45.8 64.2 47.5 69.5 47.5Z"
            fill={fill}
          />
          {/* 'n' */}
          <path
            d="M100 24H111V28.5C114 25.3 118.5 23.5 124.5 23.5C133.5 23.5 139 28.5 139 37V54H128V38.5C128 33.2 125.2 30.8 120.2 30.8C114.8 30.8 111 33.8 111 39V54H100V24Z"
            fill={fill}
          />
          {/* 'v' */}
          <path
            d="M144 24H155.5L165.5 44.5L175.5 24H186.5L170.5 54H160.5L144 24Z"
            fill={fill}
          />
          {/* 'i' */}
          <rect x="193" y="24" width="11" height="30" fill={fill} />
          {/* 'l' */}
          <rect x="213" y="8" width="11" height="46" fill={fill} />
        </svg>
      )}
    </div>
  );
}

export function FanvilGoldPartnerBadge({ size = "md", variant = "light" }) {
  if (size === "sm") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 whitespace-nowrap transition-all ${
          variant === "dark"
            ? "bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-amber-400/40 text-amber-200"
            : "bg-gradient-to-r from-amber-50 via-yellow-50/90 to-amber-100/80 border-amber-300/80 text-slate-900 shadow-sm"
        }`}
        title="Fanvil Resmi Gold Partner Yetkili Çözüm Merkezi"
      >
        <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="none">
          <defs>
            <linearGradient id="goldGradSm" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <path
            d="M16 2L28 7V15.5C28 22.8 22.8 28.9 16 30.5C9.2 28.9 4 22.8 4 15.5V7L16 2Z"
            fill="url(#goldGradSm)"
            stroke="#FEF08A"
            strokeWidth="1.5"
          />
          <path
            d="M16 5.5L24.5 9.2V15.3C24.5 20.8 20.9 25.4 16 26.8C11.1 25.4 7.5 20.8 7.5 15.3V9.2L16 5.5Z"
            fill="#0F172A"
          />
          <path
            d="M16 9.5L17.9 13.4L22.2 14L19.1 17L19.8 21.3L16 19.3L12.2 21.3L12.9 17L9.8 14L14.1 13.4L16 9.5Z"
            fill="url(#goldGradSm)"
          />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700">
            FANVIL AUTHORIZED
          </span>
          <span className="text-[11px] font-extrabold tracking-tight">
            GOLD PARTNER
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3.5 p-3 pr-5 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-amber-400/50 shadow-gold text-white">
      <div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-0.5 shadow-md shrink-0">
        <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex flex-col items-center justify-center relative overflow-hidden">
          <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none">
            <defs>
              <linearGradient id="goldShield" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <path
              d="M24 4L40 10.5V22.5C40 33.2 33.1 41.6 24 44C14.9 41.6 8 33.2 8 22.5V10.5L24 4Z"
              fill="url(#goldShield)"
            />
            <path
              d="M24 7.5L36.5 12.7V22.2C36.5 30.8 31.1 37.8 24 39.9C16.9 37.8 11.5 30.8 11.5 22.2V12.7L24 7.5Z"
              fill="#0F172A"
            />
            <path d="M15 29H33L31 33H17L15 29Z" fill="#E60012" />
            <path
              d="M24 12L26.6 17.3L32.5 18.1L28.2 22.3L29.2 28.1L24 25.4L18.8 28.1L19.8 22.3L15.5 18.1L21.4 17.3L24 12Z"
              fill="url(#goldShield)"
            />
          </svg>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#E60012] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            Resmi Yetkili Sertifikalı
          </span>
        </div>
        <div className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
          FANVIL GOLD PARTNER
        </div>
        <span className="text-[11px] text-slate-300 font-medium">
          Türkiye Kurumsal Proje &amp; Dağıtım Merkezi
        </span>
      </div>
    </div>
  );
}

export function LinkvilLogo({ className = "h-6" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-extrabold tracking-tight text-[#0284C7] whitespace-nowrap ${className}`}
    >
      <span className="px-2 py-0.5 rounded bg-[#0284C7]/10 border border-[#0284C7]/25 text-xs uppercase tracking-wider">
        LINKVIL
      </span>
      <span className="text-[11px] font-medium text-slate-500">by Fanvil</span>
    </span>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  PhoneCall,
  ChevronDown,
  Menu,
  X,
  ShoppingBag,
  GitCompare,
  FileText,
  Sparkles,
  Wifi,
  ShieldCheck,
  Building2,
  Volume2,
  Phone,
  ArrowRight,
  Award,
  Home
} from 'lucide-react';
import { FanvilLogo, FanvilGoldPartnerBadge } from './BrandLogos';

const MEGA_MENU_COLUMNS = [
  {
    title: "Kurumsal SIP Telefonlar",
    categoryKey: "Kurumsal SIP Telefonlar",
    icon: Phone,
    accent: "text-[#E60012] bg-red-50",
    items: [
      { label: "V Serisi Prime İş Telefonları (V67, V66 Pro, V66, V65, V64, V63, V62, V61, V60, V50)", query: "V Serisi" },
      { label: "A Serisi Dokunmatik Android Konsol (A330i, A320i, A32i, A308i)", query: "A Serisi Konsol" },
      { label: "X & XU Serisi Kurumsal / Çağrı Merkezi (X210, X7A, X6U, X5U, X4U, X3U, X306, X305, X2P)", query: "X/XU Serisi" },
      { label: "X300 Serisi Fiyat/Performans (X303P, X303W, X303G, X301P, X301W, X301G)", query: "X300 Serisi" }
    ]
  },
  {
    title: "Otel & 2-Wire Çözümleri",
    categoryKey: "Otel & 2-Wire Çözümleri",
    icon: Building2,
    accent: "text-amber-600 bg-amber-50",
    items: [
      { label: "H600 & H Serisi Otel Telefonları (H603W, H602W, H601W, H6W, H5W, H4W, H3W, H2U, H1)", query: "H Serisi" },
      { label: "2-Wire PoE Switch & Dönüştürücüler (PN24, PN8, PN1)", query: "2-Wire Serisi" },
      { label: "2-Wire IP Telefonlar (X303-2Wire, H1-2Wire, H2U-2Wire)", query: "2-Wire Serisi" }
    ]
  },
  {
    title: "LINKVIL Kablosuz UC & Kulaklık",
    categoryKey: "LINKVIL Kablosuz UC",
    icon: Wifi,
    accent: "text-[#0284C7] bg-sky-50",
    items: [
      { label: "Taşınabilir Wi-Fi Telefonlar (W626W, W620W, W611W, W610W)", query: "LINKVIL" },
      { label: "DECT & Multi-Cell Sistemler (W710D, W710P, W620D, W620P, W620H)", query: "LINKVIL" },
      { label: "Kablosuz Konferans & Speakerphone (CA400, CA200, CS40, CS20, CP20)", query: "LINKVIL" },
      { label: "W712 RoIP Gateway, A710 SBC & Profesyonel Kulaklıklar (DH602D, DH301D, HT301)", query: "Kulaklık & UC" }
    ]
  },
  {
    title: "SIP Güvenlik, İnterkom & Sağlık",
    categoryKey: "SIP Güvenlik, İnterkom & Sağlık",
    icon: ShieldCheck,
    accent: "text-emerald-600 bg-emerald-50",
    items: [
      { label: "i6 Serisi Yüz Tanımalı & Görüntülü Kapı İnterkomları (i68, i67, i66, i64, i63, i62, i61, i60K, i60)", query: "i6 Kapı İnterkom" },
      { label: "i500 & i50 Serisi İç Ortam Dokunmatik Paneller (i566W, i556W, i507W, i506W, i505W, i504W, i501W)", query: "i500 İç İstasyon" },
      { label: "Y501 & FNCS Hastane Hemşire Çağrı Sistemleri (Y501, Y501-Y, A320i Hemşire Konsolu)", query: "Sağlık / Konsol" },
      { label: "Endüstriyel & Mini SIP İnterkomlar (A12V, A11V, A10, H501, i16SV, i10SV)", query: "SIP İnterkom" }
    ]
  },
  {
    title: "SIP Hoparlör, Paging & Gateway",
    categoryKey: "SIP Hoparlör, Paging & Gateway",
    icon: Volume2,
    accent: "text-purple-600 bg-purple-50",
    items: [
      { label: "SIP Anons Hoparlörleri (A513W Kameralı, A233 Horn, A212 Duvar, A201 & FH-S01 Tavan)", query: "SIP Hoparlör/PA" },
      { label: "Paging & Anons Gateway (PA3, PA2S)", query: "SIP Hoparlör/PA" },
      { label: "VoIP FXS/FXO/Dijital Gateway (GA200, GA100 FXS/FXO, GA10 ATA)", query: "2-Wire/Gateway" },
      { label: "Bulut & Yazılım Platformları (FDMS, FCMS, FNCS, Fanvil Link App)", query: "Bulut & Aksesuar" }
    ]
  }
];

export default function Navbar({
  currentPage,
  onNavigatePage,
  totalProductCount,
  cartCount,
  compareCount,
  onSelectCategory,
  onNavigateToForm
}) {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  const openMegaMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMegaMenuOpen(true);
  };

  const scheduleCloseMegaMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 240);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMegaItemSelect = (categoryKey, seriesQuery) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
    onSelectCategory(categoryKey, seriesQuery);
  };

  const navLinkClass = (pageId) =>
    `px-3 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-colors whitespace-nowrap ${
      currentPage === pageId
        ? 'text-[#E60012] bg-red-50/80'
        : 'text-slate-700 hover:text-[#E60012] hover:bg-slate-50'
    }`;

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
      onMouseLeave={scheduleCloseMegaMenu}
    >
      {/* Top Corporate Bar */}
      <div className="bg-[#0F172A] text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300 truncate">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Fanvil Türkiye Yetkili Gold Partner &amp; Kurumsal Proje Merkezi</span>
            </span>
            <span className="hidden xl:inline text-slate-600">|</span>
            <span className="hidden xl:inline text-slate-400 whitespace-nowrap">
              3CX • PortSIP • Microsoft Teams • Zoom • Asterisk Tam Uyumlu
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <a
              href="tel:+908508501881"
              className="inline-flex items-center gap-1.5 text-white font-semibold hover:text-amber-300 transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#E60012]" />
              <span>0850 850 18 81</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - Strictly Single Line, Non-Wrapping */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 xl:gap-4">
          {/* Left: Official Fanvil Logo + Gold Partner Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(false);
                onNavigatePage('home');
              }}
              className="flex items-center focus:outline-none shrink-0"
              aria-label="Fanvil Partner Ana Sayfa"
            >
              <FanvilLogo className="h-7 sm:h-8 md:h-9" />
            </button>
            <div className="hidden sm:block h-7 w-[1px] bg-slate-200 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(false);
                onNavigatePage('gold-partner');
              }}
              className="hidden sm:block shrink-0 text-left"
            >
              <FanvilGoldPartnerBadge size="sm" />
            </button>
          </div>

          {/* Center: Desktop Navigation Links (Multi-Page + Hover-Safe Mega Menu) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0 h-full">
            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(false)}
              onClick={() => onNavigatePage('home')}
              className={navLinkClass('home')}
            >
              Ana Sayfa
            </button>

            {/* Mega Menu Trigger wraps full height of navbar so there is zero dead gap */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={openMegaMenu}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                onClick={() => {
                  setMegaMenuOpen(false);
                  onSelectCategory('Tümü', 'Tümü');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-colors whitespace-nowrap ${
                  currentPage === 'urunler' || megaMenuOpen
                    ? 'text-[#E60012] bg-red-50/80'
                    : 'text-slate-700 hover:text-[#E60012] hover:bg-slate-50'
                }`}
              >
                <span>Ürün Kataloğu ({totalProductCount})</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    megaMenuOpen ? 'rotate-180 text-[#E60012]' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(false)}
              onClick={() => onNavigatePage('cozumler')}
              className={navLinkClass('cozumler')}
            >
              Sektörel Çözümler
            </button>

            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(false)}
              onClick={() => onNavigatePage('gold-partner')}
              className={navLinkClass('gold-partner')}
            >
              Gold Partner
            </button>

            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(false)}
              onClick={() => onNavigatePage('iletisim')}
              className={navLinkClass('iletisim')}
            >
              Bilgi &amp; İletişim
            </button>
          </nav>

          {/* Right: Action Buttons (Dedicated Pages for Compare, Quote Cart, Inquiry Form) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Compare Page Button */}
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(false);
                onNavigatePage('karsilastir');
              }}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 ${
                currentPage === 'karsilastir'
                  ? 'border-[#0284C7] bg-sky-50 text-[#0284C7]'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Ürün Karşılaştırma Sayfası"
            >
              <GitCompare className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span className="hidden md:inline">Karşılaştır</span>
              {compareCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-extrabold bg-[#0284C7] text-white rounded-full shrink-0">
                  {compareCount}
                </span>
              )}
            </button>

            {/* B2B Quote Cart Page Button */}
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(false);
                onNavigatePage('teklif-sepeti');
              }}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs xl:text-[13px] font-bold transition-all whitespace-nowrap shrink-0 ${
                currentPage === 'teklif-sepeti'
                  ? 'border-[#E60012] bg-red-50 text-[#E60012]'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Proje Teklif Sepeti Sayfası"
            >
              <ShoppingBag className="w-4 h-4 text-[#E60012] shrink-0" />
              <span className="hidden md:inline">Teklif Sepeti</span>
              {cartCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-extrabold bg-[#E60012] text-white rounded-full shrink-0">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Primary CTA: Ürün Bilgi Al Formu */}
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(false);
                onNavigateToForm('bilgi');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs xl:text-[13px] font-extrabold shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Bilgi &amp; Teklif Al</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0"
              aria-label="Menüyü Aç/Kapat"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop 5-Column Mega Menu Dropdown - Hover Bridge + Timeout prevents premature closing */}
      {megaMenuOpen && (
        <div
          onMouseEnter={openMegaMenu}
          onMouseLeave={scheduleCloseMegaMenu}
          className="hidden lg:block absolute left-0 top-full w-full bg-white border-b border-slate-200 shadow-hover z-50 animate-fadeIn"
        >
          <div className="max-w-7xl mx-auto px-6 py-7">
            <div className="grid grid-cols-5 gap-6">
              {MEGA_MENU_COLUMNS.map((col) => {
                const Icon = col.icon;
                return (
                  <div key={col.title} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleMegaItemSelect(col.categoryKey, 'Tümü')}
                      className="flex items-center gap-2.5 text-left group mb-3 pb-2.5 border-b border-slate-100 cursor-pointer"
                    >
                      <span className={`p-2 rounded-lg shrink-0 ${col.accent}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#E60012] transition-colors leading-snug">
                        {col.title}
                      </span>
                    </button>
                    <ul className="space-y-2 flex-1">
                      {col.items.map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleMegaItemSelect(col.categoryKey, item.query)}
                            className="text-left text-xs text-slate-600 hover:text-[#E60012] hover:bg-red-50/50 px-2 py-1.5 -mx-2 rounded-lg transition-all leading-relaxed block w-full cursor-pointer"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Bottom Mega Menu Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-3">
                <FanvilGoldPartnerBadge size="sm" />
                <span className="text-xs text-slate-600">
                  Toplam <strong>{totalProductCount}</strong> resmi Fanvil &amp; LINKVIL ürün grubunda (120+ model) <strong>Gold Partner</strong> garantisi.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleMegaItemSelect('Tümü', 'Tümü')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#E60012] whitespace-nowrap"
                >
                  <span>Tüm Kataloğu Gör</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMegaMenuOpen(false);
                    onNavigateToForm('bilgi');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E60012] hover:underline whitespace-nowrap"
                >
                  <span>Ürün Hakkında Bilgi İste</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 sm:hidden">
            <FanvilGoldPartnerBadge size="sm" />
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToForm('bilgi');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#E60012] text-white text-xs font-bold whitespace-nowrap"
            >
              Bilgi &amp; Teklif Al
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigatePage('home');
              }}
              className={`w-full flex items-center gap-2 text-left px-3.5 py-3 rounded-xl text-sm font-bold ${
                currentPage === 'home' ? 'bg-red-50 text-[#E60012]' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Ana Sayfa</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm"
            >
              <span>Ürün Kategorileri ({totalProductCount} Ürün Grubu)</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileSubmenuOpen ? 'rotate-180 text-[#E60012]' : ''
                }`}
              />
            </button>

            {mobileSubmenuOpen && (
              <div className="pl-1 pr-1 py-2 space-y-2.5">
                {MEGA_MENU_COLUMNS.map((col) => (
                  <div key={col.title} className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => handleMegaItemSelect(col.categoryKey, 'Tümü')}
                      className="font-bold text-xs text-[#E60012] mb-1.5 block text-left"
                    >
                      {col.title}
                    </button>
                    <div className="space-y-1.5">
                      {col.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleMegaItemSelect(col.categoryKey, item.query)}
                          className="block w-full text-left text-xs text-slate-600 py-1 hover:text-slate-900"
                        >
                          • {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleMegaItemSelect('Tümü', 'Tümü')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold ${
                currentPage === 'urunler' ? 'bg-red-50 text-[#E60012] font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tüm Ürün Kataloğu Sayfası
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigatePage('cozumler');
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold ${
                currentPage === 'cozumler' ? 'bg-red-50 text-[#E60012] font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Sektörel Çözümler Sayfası
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigatePage('gold-partner');
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold ${
                currentPage === 'gold-partner' ? 'bg-red-50 text-[#E60012] font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Fanvil Gold Partner Sayfası
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigatePage('karsilastir');
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold ${
                currentPage === 'karsilastir' ? 'bg-sky-50 text-[#0284C7] font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Model Karşılaştırma ({compareCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigatePage('teklif-sepeti');
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold ${
                currentPage === 'teklif-sepeti' ? 'bg-red-50 text-[#E60012] font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              B2B Proje Teklif Sepeti ({cartCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToForm('bilgi');
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold text-[#E60012] bg-red-50/70"
            >
              Ürün Bilgi &amp; Teklif Formu Sayfası
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

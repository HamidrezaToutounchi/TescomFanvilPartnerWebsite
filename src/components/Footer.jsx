import React, { useState } from 'react';
import {
  PhoneCall,
  FileText,
  ShoppingBag,
  Layers,
  ExternalLink,
  Home,
  MessageSquare,
  Phone,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { FanvilLogo, FanvilGoldPartnerBadge } from './BrandLogos';

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.494 5.462 5.601-1.469c1.911 1.24 4.187 1.974 6.609 1.974 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
    </svg>
  );
}

export default function Footer({
  currentPage,
  onNavigatePage,
  onSelectCategory,
  onNavigateToForm,
  cartCount
}) {
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const phone = "0850 850 18 81";
  const whatsappUrl = `https://wa.me/908508501881?text=${encodeURIComponent(
    "Merhaba, Fanvil & LINKVIL kurumsal çözümleri hakkında bilgi ve fiyat teklifi almak istiyorum."
  )}`;
  return (
    <>
      <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-24 sm:pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            {/* Brand & Gold Partner Identity (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              <FanvilLogo variant="white" className="h-9" />
              <div>
                <FanvilGoldPartnerBadge size="sm" variant="dark" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                <strong>fanvilpartner.com</strong> — Türkiye ve bölgedeki sistem entegratörleri, telekom operatörleri, otel/hastane projeleri ve kurumsal işletmeler için Fanvil &amp; LINKVIL A&amp;V-IoT Yetkili Gold Partner Çözüm Merkezi.
              </p>
            </div>

            {/* Product Categories (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Ürün Kategorileri
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('Kurumsal SIP Telefonlar', 'Tümü')}
                    className="hover:text-white transition-colors text-left"
                  >
                    V, A, X/XU &amp; X300 Masaüstü IP Telefonlar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('Otel & 2-Wire Çözümleri', 'Tümü')}
                    className="hover:text-white transition-colors text-left"
                  >
                    H600 / H Serisi Otel &amp; 2-Wire Dönüşüm
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('LINKVIL Kablosuz UC', 'Tümü')}
                    className="hover:text-white transition-colors text-left"
                  >
                    LINKVIL Wi-Fi Telefon, DECT, Konferans &amp; Kulaklık
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('SIP Güvenlik, İnterkom & Sağlık', 'Tümü')}
                    className="hover:text-white transition-colors text-left"
                  >
                    i6 Kapı İnterkomu, i500 Panel &amp; Y501 Sağlık
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('SIP Hoparlör, Paging & Gateway', 'Tümü')}
                    className="hover:text-white transition-colors text-left"
                  >
                    SIP Anons Hoparlörleri, PA2S/PA3 &amp; GA Gateway
                  </button>
                </li>
              </ul>
            </div>

            {/* Site Pages & Solutions (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Kurumsal Sayfalar
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('home')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Ana Sayfa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('urunler')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Ürün Kataloğu
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('cozumler')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Sektörel Çözümler
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('gold-partner')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Gold Partner
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('karsilastir')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Model Karşılaştırma
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('teklif-sepeti')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Proje Teklif Sepeti
                  </button>
                </li>
                <li>
                  <a
                    href="https://www.fanvil.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <span>Fanvil Global</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Direct Contact (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Gold Partner İletişim Merkezi
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-[#E60012] shrink-0" />
                  <a
                    href="tel:+908508501881"
                    className="hover:text-white font-semibold text-left"
                  >
                    Sabit Hat: 0850 850 18 81
                  </a>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <a
                  href="https://wa.me/908508501881"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.494 5.462 5.601-1.469c1.911 1.24 4.187 1.974 6.609 1.974 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                  </svg>
                  <span>WhatsApp Hattı (0850 850 18 81)</span>
                </a>
                <button
                  type="button"
                  onClick={() => onNavigateToForm('bilgi')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold transition-colors"
                >
                  Hemen Ürün Bilgisi İste
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} <strong>fanvilpartner.com</strong> — Fanvil &amp; LINKVIL Türkiye Yetkili Gold Partner Portalı. Tüm hakları saklıdır.
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/kvkk"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigatePage('kvkk');
                }}
                className="hover:text-white transition-colors"
              >
                KVKK Aydınlatma Metni
              </a>
              <span>•</span>
              <span>Garanti &amp; RMA Koşulları</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar for Multi-Page Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-hover grid grid-cols-5 gap-1">
        <button
          type="button"
          onClick={() => onNavigatePage('home')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold ${
            currentPage === 'home' ? 'bg-red-50 text-[#E60012]' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Ana Sayfa</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigatePage('urunler')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold ${
            currentPage === 'urunler' ? 'bg-red-50 text-[#E60012]' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>Katalog</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigatePage('teklif-sepeti')}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold ${
            currentPage === 'teklif-sepeti' ? 'bg-red-50 text-[#E60012]' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Sepet ({cartCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileContactOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200"
        >
          <MessageSquare className="w-4 h-4 mb-0.5 text-amber-600" />
          <span>İletişim</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateToForm('bilgi')}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-[#E60012] text-white text-[10px] font-bold"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>Bilgi Al</span>
        </button>
      </div>

      {/* Slide-Up Mobile Contact Drawer */}
      {mobileContactOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="flex-1" onClick={() => setMobileContactOpen(false)} />

          <div className="bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#E60012] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Fanvil Gold Partner İletişim</h3>
                  <p className="text-[11px] text-slate-500">Mühendislik &amp; Kurumsal Teklif Masası</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileContactOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:+908508501881"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Telefonla Doğrudan Ara</div>
                    <div className="text-[11px] font-semibold text-[#E60012]">{phone}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">WhatsApp&apos;tan İletişime Geç</div>
                    <div className="text-[11px] text-emerald-700">Anında Mesajlaşma &amp; Hızlı Fiyat</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setMobileContactOpen(false);
                  onNavigateToForm('bilgi');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-red-50/70 hover:bg-red-50 border border-red-200 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E60012] text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Kurumsal Teklif &amp; Bilgi Formu</div>
                    <div className="text-[11px] text-red-700">30 Dakika İçinde Yanıt Masası</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#E60012] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

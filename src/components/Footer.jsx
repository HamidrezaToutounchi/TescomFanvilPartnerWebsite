import React from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  Layers,
  ExternalLink,
  Home
} from 'lucide-react';
import { FanvilLogo, FanvilGoldPartnerBadge } from './BrandLogos';

export default function Footer({
  currentPage,
  onNavigatePage,
  onSelectCategory,
  onNavigateToForm,
  cartCount
}) {
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
                    Gold Partner &amp; FPRS
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
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                  <span>Kurumsal Çözüm &amp; Dağıtım Merkezi — İstanbul / Türkiye</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-[#E60012] shrink-0" />
                  <a
                    href="tel:+908508501881"
                    className="hover:text-white font-semibold text-left"
                  >
                    Sabit Hat: 0850 850 18 81 (+90 850 850 18 81)
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#E60012] shrink-0" />
                  <a href="mailto:proje@fanvilpartner.com" className="hover:text-white">
                    proje@fanvilpartner.com
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2.5 py-2 shadow-hover grid grid-cols-4 gap-1.5">
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
          onClick={() => onNavigateToForm('bilgi')}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-[#E60012] text-white text-[10px] font-bold"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>Bilgi Al</span>
        </button>
      </div>
    </>
  );
}

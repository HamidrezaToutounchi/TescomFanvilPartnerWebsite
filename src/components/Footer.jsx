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
                  <button
                    type="button"
                    onClick={() => onNavigateToForm('bilgi')}
                    className="hover:text-white font-semibold text-left"
                  >
                    Kurumsal Proje &amp; Satış Hattı
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#E60012] shrink-0" />
                  <a href="mailto:proje@fanvilpartner.com" className="hover:text-white">
                    proje@fanvilpartner.com
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToForm('bilgi')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold transition-colors mt-2"
              >
                Hemen Ürün Bilgisi İste
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} <strong>fanvilpartner.com</strong> — Fanvil &amp; LINKVIL Türkiye Yetkili Gold Partner Portalı. Tüm hakları saklıdır.
            </div>
            <div className="flex items-center gap-4">
              <span>KVKK Aydınlatma Metni</span>
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

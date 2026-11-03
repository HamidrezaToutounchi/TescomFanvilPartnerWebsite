import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  Layers,
  Award
} from 'lucide-react';
import { FanvilGoldPartnerBadge, LinkvilLogo } from './BrandLogos';
import ProductImage from './ProductImage';

const HERO_SHOWCASE = [
  {
    id: 'fanvil-v67',
    tag: 'V Serisi Amiral Gemisi',
    title: 'Fanvil V67 Akıllı Görüntülü IP Telefon',
    subtitle: '7" ayarlanabilir dokunmatik ekran, 5MP HD kamera, Android OS ve TÜV sertifikalı antibakteriyel yüzey.',
    specs: ['20 SIP Hattı & 112 DSS', '5MP 1080p Kamera', '2.4G/5G Wi-Fi & BT 5.0'],
    imageUrl: 'https://www.fanvil.com/upload/images/20230714/105326626f.png',
    category: 'Kurumsal SIP Telefonlar'
  },
  {
    id: 'fanvil-i67',
    tag: 'SIP Güvenlik & İnterkom',
    title: 'Fanvil i67 Yüz Tanımalı Kapı İnterkomu',
    subtitle: 'Canlılık algılamalı (anti-spoofing) yüz tanıma, 7" IPS dokunmatik ekran, QR Kod, BLE ve IP66/IK07 koruma.',
    specs: ['10.000 Canlı Yüz Tanıma', 'IP66 & IK07 Dayanım', 'ONVIF & Wiegand'],
    imageUrl: 'https://fanvil.com/upload/images/20240423/17082tl8v8.png',
    category: 'SIP Güvenlik, İnterkom & Sağlık'
  },
  {
    id: 'linkvil-ca400',
    tag: 'LINKVIL Kablosuz UC',
    title: 'LINKVIL CA400 & W626W Kablosuz Ekosistem',
    subtitle: '4K kablosuz konferans sistemleri ve IP67 su/toz/düşme korumalı taşınabilir endüstriyel Wi-Fi IP telefonlar.',
    specs: ['IP67 Su & 1.8m Düşme', '4K Kablosuz Konferans', 'Wi-Fi 6 Hızlı Roaming'],
    imageUrl: 'https://fanvil.com/linkvilresource/Uploads/product/20240228/65ded7b2026e0.png',
    category: 'LINKVIL Kablosuz UC'
  }
];

const PBX_PLATFORMS = [
  { name: '3CX', desc: 'Tam Destekli & Sertifikalı' },
  { name: 'Microsoft Teams', desc: 'SIP Gateway Uyumlu' },
  { name: 'Zoom Phone', desc: 'Sertifikalı Donanım' },
  { name: 'PortSIP', desc: 'Zero-Touch Provisioning' },
  { name: 'Asterisk / FreePBX', desc: '%100 SIP Uyumluluğu' },
  { name: 'Broadsoft', desc: 'Operatör Sınıfı Uyum' },
  { name: 'Grandstream UCM', desc: 'Tak-Çalıştır Entegrasyon' }
];

export default function HeroSection({ onNavigatePage, onNavigateToForm, onInquireProduct }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentItem = HERO_SHOWCASE[activeSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-slate-100/70 pt-8 pb-14 lg:pt-14 lg:pb-20 border-b border-slate-200/80">
      {/* Subtle decorative radial lights */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-red-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-24 w-96 h-96 rounded-full bg-sky-500/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Brand Value Proposition & Gold Partner Identity */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <FanvilGoldPartnerBadge size="md" />
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-[#E60012] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>A&amp;V-IoT Kurumsal Ses ve Görüntü İletişim Ekosistemi</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                Fanvil &amp; <span className="text-[#0284C7]">LINKVIL</span> Türkiye Kurumsal Çözüm ve{' '}
                <span className="text-[#E60012]">Gold Partner</span> Merkezi
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Masaüstü kurumsal IP telefonlardan <strong>2-Wire (kablo değiştirmeden) otel dönüşümüne</strong>, yüz tanımalı kapı interkomlarından hastane hemşire çağrı ve <strong>LINKVIL</strong> kablosuz UC çözümlerine kadar tüm projelerinizde yetkili Gold Partner güvencesi.
              </p>
            </div>

            {/* Primary CTA Buttons (Navigate to Dedicated Pages) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigatePage('urunler')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Ürün Kataloğunu İncele</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToForm('bilgi')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white font-bold text-sm shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Ürün Hakkında Bilgi &amp; Teklif Al</span>
              </button>
            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Resmi Gold Partner</div>
                  <div className="text-[11px] text-slate-500">%100 orijinal distribütör garantisi</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Ücretsiz Topoloji Danışmanlığı</div>
                  <div className="text-[11px] text-slate-500">Proje öncesi mühendislik danışmanlığı</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Flagship Product Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft p-5 sm:p-6 relative">
              {/* Showcase Selector Tabs */}
              <div className="flex items-center justify-between gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-5">
                {HERO_SHOWCASE.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all truncate ${
                      activeSlide === index
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {index === 0 ? 'V67 Video' : index === 1 ? 'i67 İnterkom' : 'LINKVIL UC'}
                  </button>
                ))}
              </div>

              {/* Active Product Display */}
              <div className="relative bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-[#E60012]">
                    {currentItem.tag}
                  </span>
                  <LinkvilLogo className="scale-90 origin-right" />
                </div>

                <div className="my-3 h-48 sm:h-52 w-full flex items-center justify-center">
                  <ProductImage
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    model={currentItem.title}
                    category={currentItem.category}
                    className="max-h-48 w-auto object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                  {currentItem.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2">
                  {currentItem.subtitle}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                  {currentItem.specs.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="w-full mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onInquireProduct(currentItem.title)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold transition-colors"
                  >
                    <span>Bu Ürün Hakkında Bilgi Al</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PBX & Platform Compatibility Matrix Band */}
        <div className="mt-12 pt-8 border-t border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#E60012]">
                %100 Küresel Ekosistem Uyumluluğu
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Santral &amp; Birleşik İletişim (UC) Platform Uyumluluk Matrisi
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              FDMS / FCMS Bulut Yönetim &amp; Zero-Touch Provisioning Desteği
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {PBX_PLATFORMS.map((pbx) => (
              <div
                key={pbx.name}
                className="bg-white rounded-xl px-3.5 py-3 border border-slate-200/80 hover:border-slate-300 shadow-sm flex flex-col justify-center transition-all"
              >
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">{pbx.name}</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">{pbx.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

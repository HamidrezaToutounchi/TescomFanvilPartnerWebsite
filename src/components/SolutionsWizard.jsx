import React, { useState } from 'react';
import {
  Building2,
  HeartPulse,
  Shield,
  Factory,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Sparkles
} from 'lucide-react';

const SOLUTIONS = [
  {
    id: 'hotel-2wire',
    title: 'Otel & 2-Wire IP Dönüşüm',
    subtitle: 'Eski Kabloyu Değiştirmeden %100 IP Telefona Geçiş',
    icon: Building2,
    badge: '%80 Kablolama Tasarrufu',
    description:
      'Mevcut otel veya tesisinizdeki eski 2 telli (RJ11) analog telefon kablolarını kırmadan ve değiştirmeden, Fanvil PN24 2-Wire PoE Switch ve H2U/X303 2-Wire IP telefonlarla tek günde modern IP haberleşmeye geçin.',
    benefits: [
      'Tadilat, kırma-dökme ve yeniden Cat6 çekme maliyetini sıfırlar',
      '300 metreye kadar 2 telli kablo üzerinden hem IP veri hem PoE güç iletir',
      'Oda içi H5/H3W Wi-Fi telefonlar ve banyo tipi H2U su korumalı üniteler',
      'PMS (Otel Yönetim Yazılımı) ve tüm IP santrallerle tam entegrasyon'
    ],
    recommendedModels: [
      { code: 'PN24 / PN8', role: '24/8 Port 2-Wire PoE Switch' },
      { code: 'H2U-2Wire & H5', role: 'Oda & Banyo Otel IP Telefonu' },
      { code: 'X303-2Wire', role: 'İdari Ofis 2-Telli IP Telefon' },
      { code: 'Fanvil V67 / X210', role: 'Resepsiyon & Ön Büro Konsolu' }
    ]
  },
  {
    id: 'hospital-healthcare',
    title: 'Sağlık & Hastane Çözümü',
    subtitle: 'SIP Hemşire Çağrı, Konsol & Antibakteriyel İletişim',
    icon: HeartPulse,
    badge: 'TÜV Antibakteriyel & IP67',
    description:
      'Hastaneler, klinikler ve yaşlı bakım merkezleri için yatak başı ve banyo kordonlu Y501 SIP hemşire çağrı üniteleri, A32i 10.1" dokunmatik hemşire bankosu konsolu ve dezenfektana dayanıklı W626W Wi-Fi telefonlar.',
    benefits: [
      'TÜV sertifikalı antibakteriyel malzeme ile enfeksiyon kontrolü',
      'Yatak başı ve WC çekme kordonlu acil çağrı + eller serbest HD görüşme',
      'A32i 10.1" Android konsol ile tüm hasta odalarını tek ekrandan izleme',
      'LINKVIL W626W/W611W IP67 telefonlarla nöbetçi doktor/hemşire mobilitesi'
    ],
    recommendedModels: [
      { code: 'Fanvil Y501 / Y501W', role: 'Yatak Başı & Banyo Hemşire Çağrı' },
      { code: 'Fanvil A32i', role: '10.1" Dokunmatik Hemşire Bankosu Konsolu' },
      { code: 'LINKVIL W626W', role: 'IP67 Steril Taşınabilir Wi-Fi Telefon' },
      { code: 'Fanvil V66 Pro', role: 'Başhekim & Poliklinik IP Telefonu' }
    ]
  },
  {
    id: 'smart-building',
    title: 'Akıllı Bina & Rezidans',
    subtitle: 'Yüz Tanımalı Kapı İnterkomu & Daire İçi Dokunmatik Panel',
    icon: Shield,
    badge: 'Canlı Yüz Tanıma & ONVIF',
    description:
      'İş merkezleri, plazalar ve lüks konut projeleri için sahtecilik önlemeli (anti-spoofing) i67 yüz tanımalı kapı interkomları, i507W 10.1" daire içi dokunmatik paneller ve güvenlik konsolları.',
    benefits: [
      'Canlı yüz tanıma, QR kod, BLE, RFID kart ve PIN ile temassız geçiş',
      'Daire içi i507W/i505W ekranlardan kapı ve ortak alan kameralarını izleme',
      '8 adet kablolu alarm sensörü (duman, gaz, manyetik kontak) girişi',
      'IP66 su/toz ve IK07/IK10 darbe dayanımlı alüminyum dış gövde'
    ],
    recommendedModels: [
      { code: 'Fanvil i67 / i66', role: '7" Yüz Tanımalı Blok Giriş İnterkomu' },
      { code: 'Fanvil i64 / i62', role: 'IP66/IK07 Dış Kapı & Otopark İnterkomu' },
      { code: 'Fanvil i507W / i504W', role: 'Daire & Ofis İçi Dokunmatik İstasyon' },
      { code: 'Fanvil X210', role: 'Site Güvenlik & Resepsiyon Konsolu' }
    ]
  },
  {
    id: 'campus-industrial',
    title: 'Okul, Fabrika & Otoyol',
    subtitle: 'SIP Multicast Anons, Telsiz Köprüsü & SOS Acil Çağrı',
    icon: Factory,
    badge: 'IP Anons + RoIP Telsiz',
    description:
      'Üretim tesisleri, üniversite kampüsleri, okullar ve otoyollar için PoE beslemeli SIP anons hoparlörleri, mevcut analog amfileri IP’ye çeviren PA2S gateway ve W712 telsiz-santral ağ geçidi.',
    benefits: [
      'Ayrı anons kablosu çekmeden mevcut ağ (PoE) üzerinden bölgesel sesli anons',
      'Okul zil saatleri, acil tahliye anonsları ve arka plan müzik yayını',
      'LINKVIL W712 RoIP ile saha el telsizlerini doğrudan IP santrale bağlama',
      'IK10 vandalizm korumalı i16SV ile otopark/otoyol SOS acil yardım noktaları'
    ],
    recommendedModels: [
      { code: 'FH-S01 & A233 Horn', role: 'Tavan & Dış Ortam SIP Hoparlör' },
      { code: 'Fanvil PA2S / PA3', role: 'Analog Amfi SIP Paging Gateway' },
      { code: 'LINKVIL W712 RoIP', role: 'UHF/DMR Telsiz - VoIP Ağ Geçidi' },
      { code: 'Fanvil i16SV', role: 'IP65/IK10 Kameralı SOS Acil İnterkom' }
    ]
  }
];

export default function SolutionsWizard({ onInquireSolution }) {
  const [activeTab, setActiveTab] = useState(0);
  const current = SOLUTIONS[activeTab];

  return (
    <section id="cozumler" className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284C7] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>İnteraktif Sektörel Çözüm Sihirbazı</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sektörünüze Özel Anahtar Teslim Fanvil Mimarisini Seçin
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Otel renovasyonundan hastane hemşire çağrı sistemlerine kadar hazır uçtan uca çözüm paketlerimizi inceleyin ve projenize özel bilgi alın.
          </p>
        </div>

        {/* Interactive Scenario Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SOLUTIONS.map((sol, idx) => {
            const Icon = sol.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={sol.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-800 border-slate-200/80'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isSelected ? 'bg-[#E60012] text-white' : 'bg-white text-[#E60012] shadow-sm'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{sol.title}</div>
                  <div
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {sol.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Solution Detail Card */}
        <div className="bg-gradient-to-br from-[#F8FAFC] via-white to-slate-50 rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 Cols: Solution Details & Benefits */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <span>{current.badge}</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {current.title} — {current.subtitle}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
                  {current.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {current.benefits.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200/70"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-slate-700 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Recommended Hardware Topology Box */}
            <div className="lg:col-span-5 bg-[#0F172A] text-white rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                    Önerilen Donanım Paketi
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Çözüm Mimarisi Bileşenleri
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                  4 Ana Modül
                </span>
              </div>

              <div className="space-y-2.5">
                {current.recommendedModels.map((mod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-800/70 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-700/70 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-300">{mod.code}</div>
                      <div className="text-xs text-slate-300">{mod.role}</div>
                    </div>
                    <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  onInquireSolution(
                    `${current.title} (${current.recommendedModels.map((m) => m.code).join(', ')})`
                  )
                }
                className="w-full py-3.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Bu Çözüm Paketi Hakkında Bilgi &amp; Teklif Al</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

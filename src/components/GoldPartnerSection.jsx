import React from 'react';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Headphones,
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import { FanvilGoldPartnerBadge } from './BrandLogos';

const PARTNER_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'FPRS Proje Kayıt & Koruma Sistemi',
    description:
      'Kamu, otel, hastane ve kurumsal ihalelerinizde projenizi resmi Fanvil FPRS sistemine kaydederek size özel proje fiyat koruması sağlıyoruz.'
  },
  {
    icon: Award,
    title: '%100 Orijinal Gold Partner Garantisi',
    description:
      'Tüm Fanvil ve LINKVIL ürünleri resmi distribütör ve Gold Partner garantisi altında, güncel Türkçe donanım yazılımı (firmware) ile teslim edilir.'
  },
  {
    icon: Headphones,
    title: 'Ücretsiz Topoloji, PoC & Santral Testi',
    description:
      '3CX, PortSIP, Microsoft Teams, Zoom ve Asterisk santrallerinizle kurulum öncesi ücretsiz teknik danışmanlık, demo cihaz ve FDMS bulut yönetimi.'
  },
  {
    icon: TrendingUp,
    title: 'Alt Bayi & Sistem Entegratörü Özel İskontosu',
    description:
      'Telekom operatörleri, zayıf akım firmaları ve bilgi işlem entegratörleri için stoktan hızlı sevk ve yüksek kârlı partner fiyatlandırması.'
  }
];

export default function GoldPartnerSection({ onScrollToForm }) {
  return (
    <section id="gold-partner" className="py-16 lg:py-20 bg-[#0F172A] text-white relative overflow-hidden">
      {/* Subtle Gold & Red Glow */}
      <div className="pointer-events-none absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#E60012]/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left 5 Columns: Official Gold Partner Certificate Card */}
          <div className="lg:col-span-5 space-y-6">
            <FanvilGoldPartnerBadge size="md" />

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Neden Yetkili{' '}
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Fanvil Gold Partner
              </span>{' '}
              İle Çalışmalısınız?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              <strong>fanvilpartner.com</strong> olarak Türkiye genelindeki sistem entegratörlerine, otel/hastane yatırımcılarına ve kurumsal işletmelere doğrudan yetkili Gold Partner statüsüyle donanım tedariği, 2-Wire dönüşüm mühendisliği ve proje koruma avantajı sunuyoruz.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => onScrollToForm('proje')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs sm:text-sm font-bold transition-all"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>FPRS Proje Kaydı Oluştur</span>
              </button>

              <button
                type="button"
                onClick={() => onScrollToForm('bayi')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs sm:text-sm font-bold transition-all"
              >
                <span>Alt Bayilik Başvurusu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right 7 Columns: 4 Gold Partner Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PARTNER_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-3 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/20 to-[#E60012]/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

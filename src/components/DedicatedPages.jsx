import React, { useState } from 'react';
import {
  ChevronRight,
  Home,
  ArrowRight,
  GitCompare,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  FileText,
  Phone,
  Building2,
  Wifi,
  ShieldCheck,
  Volume2,
  Check,
  Sparkles,
  Award,
  CheckCircle2,
  Layers
} from 'lucide-react';
import ProductImage from './ProductImage';
import { FanvilGoldPartnerBadge } from './BrandLogos';

export function PageBanner({ title, subtitle, badge, onGoHome }) {
  return (
    <div className="bg-[#0F172A] text-white py-10 sm:py-12 border-b border-slate-800 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 right-10 w-80 h-80 rounded-full bg-[#E60012]/10 blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ana Sayfa</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-300 font-semibold">{title}</span>
        </nav>

        {badge && (
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-red-300 text-xs font-bold mb-2">
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

const HOME_CATEGORY_CARDS = [
  {
    title: 'Kurumsal SIP Telefonlar',
    desc: 'V Serisi, A Serisi Android Konsol, X/XU ve X300 Serisi IP Telefonlar',
    count: '17 Ürün Grubu',
    icon: Phone,
    color: 'from-red-500/10 to-red-600/5 border-red-200/70 text-[#E60012]'
  },
  {
    title: 'Otel & 2-Wire Çözümleri',
    desc: 'H600/H Serisi Otel Telefonları & Kablo Değiştirmeden 2-Wire IP Switchler',
    count: '6 Ürün Grubu',
    icon: Building2,
    color: 'from-amber-500/10 to-amber-600/5 border-amber-200/70 text-amber-600'
  },
  {
    title: 'LINKVIL Kablosuz UC',
    desc: 'IP67 Wi-Fi Telefonlar, DECT Multi-Cell, 4K Konferans, RoIP & Kulaklıklar',
    count: '8 Ürün Grubu',
    icon: Wifi,
    color: 'from-sky-500/10 to-sky-600/5 border-sky-200/70 text-[#0284C7]'
  },
  {
    title: 'SIP Güvenlik, İnterkom & Sağlık',
    desc: 'i6 Yüz Tanımalı Kapı İnterkomları, i500 İç Paneller & Y501 Hemşire Çağrı',
    count: '8 Ürün Grubu',
    icon: ShieldCheck,
    color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/70 text-emerald-600'
  },
  {
    title: 'SIP Hoparlör, Paging & Gateway',
    desc: 'SIP Anons Hoparlörleri, PA2S/PA3 Gateway, FXS/FXO/E1 Gateway & FDMS Bulut',
    count: '5 Ürün Grubu',
    icon: Volume2,
    color: 'from-purple-500/10 to-purple-600/5 border-purple-200/70 text-purple-600'
  }
];

export function HomeOverviewSection({
  products,
  cartItems,
  compareIds,
  onAddToCart,
  onToggleCompare,
  onInquireProduct,
  onSelectCategory,
  onNavigatePage
}) {
  // Spotlight 6 flagship products on Home Page
  const featuredIds = [
    'fanvil-v67',
    'fanvil-a320i',
    'fanvil-x303p',
    'fanvil-pn24-pn8',
    'linkvil-w626w',
    'fanvil-i68-i67-i66'
  ];
  const featuredProducts = products.filter((p) => featuredIds.includes(p.id)).slice(0, 6);
  const isInCart = (id) => cartItems.some((item) => item.product.id === id);

  return (
    <div className="space-y-16 py-16 bg-[#F8FAFC]">
      {/* 1. 5 Main Category Portals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E60012]">
              5 Ana Ürün Ekosistemi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Fanvil &amp; LINKVIL Ürün Kategorilerini Keşfedin
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory('Tümü', 'Tümü')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E60012] hover:underline"
          >
            <span>Tüm Ürün Kataloğu Sayfasına Git ({products.length} Grup)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {HOME_CATEGORY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => onSelectCategory(card.title, 'Tümü')}
                className="text-left bg-white hover:bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 hover:border-[#E60012]/40 shadow-sm hover:shadow-soft transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br border ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {card.count}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#E60012] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E60012]">
                  <span>Kategoriyi Aç</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Featured Flagship Products Vitrine */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0284C7]">
              Vitrin Modelleri
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Kurumsal Projelerde En Çok Tercih Edilen Modeller
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory('Tümü', 'Tümü')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Tüm Ürünleri Gör (120+ Model)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => {
            const inCart = isInCart(product.id);
            const inCompare = compareIds.includes(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-soft transition-all flex flex-col overflow-hidden group"
              >
                <div className="p-4 pb-0 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#E60012] text-[11px] font-bold">
                    {product.badge || product.series}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCompare(product.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      inCompare
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>{inCompare ? 'Seçildi' : 'Karşılaştır'}</span>
                  </button>
                </div>

                <div
                  onClick={() => onSelectCategory(product.category, product.series)}
                  className="p-5 flex items-center justify-center h-44 cursor-pointer"
                >
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.model}
                    model={product.model}
                    category={product.category}
                    className="max-h-36 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="px-5 pb-5 flex-1 flex flex-col">
                  <div className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wide truncate">
                    {product.subcategory}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {product.model}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {product.shortDescription}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onInquireProduct(product.model)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Bilgi Al</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        inCart
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sepette</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Teklif Sepeti</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Multi-Page Quick Navigation Cards (Solutions, Gold Partner, Inquiry) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-soft flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0284C7] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Otel • Hastane • Akıllı Bina • Kampüs</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                İnteraktif Sektörel Çözüm Sihirbazı &amp; 2-Wire Dönüşüm
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Eski 2 telli analog kabloları sökmeden %100 IP telefona geçiş sağlayan 2-Wire otel çözümlerini, Y501 hastane hemşire çağrı sistemlerini ve i68 yüz tanımalı bina interkom paketlerini inceleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigatePage('cozumler')}
              className="self-start inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all"
            >
              <span>Sektörel Çözümler Sayfasına Git</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-slate-900 text-white rounded-3xl p-7 sm:p-8 border border-slate-800 shadow-soft flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <FanvilGoldPartnerBadge size="sm" variant="dark" />
              <h3 className="text-xl sm:text-2xl font-extrabold">
                FPRS Proje Kaydı, Bayilik &amp; Gold Partner Avantajları
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                İhale ve kurumsal projeleriniz için FPRS proje fiyat koruması, alt bayilik (sistem entegratörü) özel iskontoları ve FDMS bulut yönetim desteğimiz hakkında detaylı bilgi alın.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigatePage('gold-partner')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-extrabold transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Gold Partner Sayfasını İncele</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigatePage('iletisim')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs sm:text-sm font-bold transition-all"
              >
                <span>Bilgi &amp; Teklif Formuna Git</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ComparePage({
  allProducts,
  compareProducts,
  onToggleCompare,
  onClearCompare,
  onInquireProduct,
  onNavigatePage
}) {
  const [selectedToAdd, setSelectedToAdd] = useState('');

  const SPEC_ROWS = [
    { key: 'screen', label: 'Ekran Yapısı' },
    { key: 'sipLines', label: 'SIP Hat Sayısı' },
    { key: 'dssKeys', label: 'DSS / Programlanabilir Tuş' },
    { key: 'connectivity', label: 'Ağ & Kablosuz Bağlantı' },
    { key: 'poe', label: 'PoE / Güç Beslemesi' },
    { key: 'protection', label: 'Koruma Sınıfı / Gövde' },
    { key: 'audioVideo', label: 'Ses & Video Özellikleri' }
  ];

  const handleQuickAdd = () => {
    if (!selectedToAdd) return;
    onToggleCompare(selectedToAdd);
    setSelectedToAdd('');
  };

  const availableToAdd = allProducts.filter(
    (p) => !compareProducts.some((cp) => cp.id === p.id)
  );

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Control Bar: Quick Add Product to Compare */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Karşılaştırma Listesi ({compareProducts.length} / 4 Model)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aşağıdaki kutudan model seçerek veya Ürün Kataloğundan "Karşılaştır" butonuna tıklayarak en fazla 4 modeli kıyaslayabilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              disabled={compareProducts.length >= 4}
              className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0284C7]"
            >
              <option value="">
                {compareProducts.length >= 4
                  ? 'Maksimum 4 model seçildi'
                  : '+ Karşılaştırmaya Model Ekle...'}
              </option>
              {availableToAdd.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.model} ({p.series})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={!selectedToAdd || compareProducts.length >= 4}
              className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-sky-700 disabled:opacity-40 text-white text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Listeye Ekle</span>
            </button>

            {compareProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearCompare}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#E60012] text-xs font-bold whitespace-nowrap inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State (Default on initial load as requested!) */}
        {compareProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center mx-auto">
              <GitCompare className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Henüz Karşılaştırma İçin Ürün Seçilmedi
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Yukarıdaki açılır listeden dilediğiniz Fanvil / LINKVIL modelini ekleyebilir veya ürün kataloğu sayfasından modelleri seçebilirsiniz.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigatePage('urunler')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all"
              >
                <span>Ürün Kataloğuna Git</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md): Stacked Spec Cards with 2-Column Model Grid */}
            <div className="md:hidden space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {compareProducts.map((p) => (
                  <div
                    key={p.id}
                    className="relative bg-white rounded-2xl p-3.5 border border-slate-200/90 flex flex-col items-center text-center shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleCompare(p.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-100 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-20 flex items-center justify-center my-1">
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.model}
                        model={p.model}
                        category={p.category}
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs line-clamp-1">
                      {p.model}
                    </div>
                    <div className="text-[10px] text-[#0284C7] font-bold">
                      {p.series}
                    </div>
                    <button
                      type="button"
                      onClick={() => onInquireProduct(p.model)}
                      className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-[#E60012] text-white font-bold text-[11px]"
                    >
                      Bilgi Al
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {SPEC_ROWS.map((row) => (
                  <div
                    key={row.key}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                  >
                    <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-extrabold">
                      {row.label}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {compareProducts.map((p) => (
                        <div
                          key={p.id}
                          className="px-4 py-3 flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="font-bold text-slate-900 shrink-0">
                            {p.model}:
                          </span>
                          <span className="text-slate-600 text-right font-medium">
                            {p.compareSpecs?.[row.key] || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP VIEW (>= md): Side-by-Side Comparison Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-4 px-4 w-48 text-slate-500 font-bold uppercase tracking-wider">
                      Model &amp; Görsel
                    </th>
                    {compareProducts.map((p) => (
                      <th key={p.id} className="py-4 px-4 align-top">
                        <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleCompare(p.id)}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white text-slate-400 hover:text-red-600 shadow-sm"
                            title="Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="h-28 flex items-center justify-center mb-3">
                            <ProductImage
                              src={p.imageUrl}
                              alt={p.model}
                              model={p.model}
                              category={p.category}
                              className="max-h-24 w-auto object-contain"
                            />
                          </div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {p.model}
                          </div>
                          <div className="text-[11px] text-[#0284C7] font-semibold mt-0.5">
                            {p.series}
                          </div>
                          <button
                            type="button"
                            onClick={() => onInquireProduct(p.model)}
                            className="mt-3 w-full py-2 px-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white font-bold text-xs transition-colors"
                          >
                            Bilgi Al
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {SPEC_ROWS.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/80">
                      <td className="py-4 px-4 font-bold text-slate-900 bg-slate-50/50">
                        {row.label}
                      </td>
                      {compareProducts.map((p) => (
                        <td key={p.id} className="py-4 px-4 text-slate-700 font-medium">
                          {p.compareSpecs?.[row.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function QuoteCartPage({
  allProducts,
  cartItems,
  onAddToCart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToForm,
  onNavigatePage
}) {
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const totalUnits = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleQuickAdd = () => {
    if (!selectedToAdd) return;
    const prod = allProducts.find((p) => p.id === selectedToAdd);
    if (prod) onAddToCart(prod);
    setSelectedToAdd('');
  };

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Add Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Proje Teklif Sepeti ({cartItems.length} Model • Toplam {totalUnits} Adet)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Projeniz için ürünleri adetleriyle birlikte ekleyip tek tıkla kurumsal fiyat teklifi talep edebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#E60012]"
            >
              <option value="">+ Sepete Hızlı Ürün Ekle...</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.model} ({p.series})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={!selectedToAdd}
              className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Sepete Ekle</span>
            </button>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E60012] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Proje Teklif Sepetiniz Boş
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Ürün kataloğundan veya yukarıdaki hızlı seçim kutusundan ilgilendiğiniz Fanvil &amp; LINKVIL modellerini sepetinize ekleyebilirsiniz.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigatePage('urunler')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs sm:text-sm font-bold transition-all"
              >
                <span>Ürün Kataloğuna Git</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="divide-y divide-slate-200">
              {cartItems.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 border border-slate-200/70 flex items-center justify-center shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.model}
                        model={product.model}
                        category={product.category}
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#0284C7] uppercase">
                        {product.subcategory}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {product.model}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, Math.max(1, qty - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) =>
                          onUpdateQty(product.id, Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 text-center text-xs sm:text-sm font-bold py-1.5 rounded-lg border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, qty + 10)}
                        className="px-2.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                      >
                        +10
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                      title="Ürünü Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs font-bold text-slate-500 hover:text-red-600"
              >
                Tüm Sepeti Temizle
              </button>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onNavigatePage('urunler')}
                  className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold"
                >
                  + Ürün Eklemeye Devam Et
                </button>
                <button
                  type="button"
                  onClick={onProceedToForm}
                  className="flex-1 sm:flex-initial py-3.5 px-6 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Teklif Formuna Aktar &amp; Gönder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

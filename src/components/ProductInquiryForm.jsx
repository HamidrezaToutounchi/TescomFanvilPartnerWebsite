import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  Building,
  User,
  Mail,
  Phone,
  Package,
  MessageSquare,
  Sparkles,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { FanvilGoldPartnerBadge } from './BrandLogos';
import { KVKK_VERSION } from '../content/kvkk';

const REQUEST_TYPES = [
  { id: 'bilgi', label: 'Ürün Hakkında Bilgi & Fiyat Al' },
  { id: 'proje', label: 'FPRS Proje Kaydı & Özel İskonto' },
  { id: 'bayi', label: 'Alt Bayilik / Partner Başvurusu' },
  { id: 'demo', label: '2-Wire / Teknik Demo Talebi' }
];

const PBX_OPTIONS = [
  'Belirsiz / Santral Önerisi İstiyorum',
  '3CX IP Santral',
  'PortSIP UC',
  'Microsoft Teams / Zoom Phone',
  'Asterisk / FreePBX / Issabel',
  'Grandstream / Yeastar / Diğer IP PBX',
  'Mevcut Analog Santral (2-Wire / Gateway Dönüşüm)'
];

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

export default function ProductInquiryForm({
  products,
  activeFormTab,
  selectedProductForInquiry,
  formHighlightPulse,
  cartItems,
  onUpdateCartQty,
  onRemoveCartItem
}) {
  const [requestType, setRequestType] = useState('bilgi');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1 - 10 Adet');
  const [pbxSystem, setPbxSystem] = useState(PBX_OPTIONS[0]);
  const [projectName, setProjectName] = useState('');
  const [message, setMessage] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot field
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Cloudflare Turnstile state (fail-open after 10s if script/challenge is unreachable)
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileBypass, setTurnstileBypass] = useState(!TURNSTILE_SITE_KEY);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || submittedData) {
      setTurnstileBypass(true);
      return undefined;
    }

    let isMounted = true;
    setTurnstileToken('');
    setTurnstileBypass(false);

    // 10-second fail-open timer: if Cloudflare script or token doesn't load in 10s,
    // allow submission without token so a real customer lead is NEVER lost.
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setTurnstileBypass(true);
      }
    }, 10000);

    const renderWidget = () => {
      if (!isMounted || !turnstileContainerRef.current || !window.turnstile) return;
      try {
        if (turnstileWidgetIdRef.current !== null) {
          window.turnstile.remove(turnstileWidgetIdRef.current);
          turnstileWidgetIdRef.current = null;
        }
        turnstileWidgetIdRef.current = window.turnstile.render(
          turnstileContainerRef.current,
          {
            sitekey: TURNSTILE_SITE_KEY,
            action: 'lead_form',
            appearance: 'interaction-only',
            language: 'tr',
            callback: (token) => {
              if (!isMounted) return;
              clearTimeout(fallbackTimer);
              setTurnstileToken(token || '');
            },
            'expired-callback': () => {
              if (!isMounted) return;
              setTurnstileToken('');
            },
            'error-callback': () => {
              if (!isMounted) return;
              clearTimeout(fallbackTimer);
              setTurnstileToken('');
              setTurnstileBypass(true);
            }
          }
        );
      } catch (_err) {
        if (isMounted) {
          setTurnstileBypass(true);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let scriptEl = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.src = TURNSTILE_SCRIPT_SRC;
        scriptEl.async = true;
        scriptEl.defer = true;
        document.head.appendChild(scriptEl);
      }
      const onLoad = () => renderWidget();
      const onError = () => {
        if (isMounted) {
          clearTimeout(fallbackTimer);
          setTurnstileBypass(true);
        }
      };
      scriptEl.addEventListener('load', onLoad);
      scriptEl.addEventListener('error', onError);

      return () => {
        isMounted = false;
        clearTimeout(fallbackTimer);
        scriptEl.removeEventListener('load', onLoad);
        scriptEl.removeEventListener('error', onError);
        if (turnstileWidgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(turnstileWidgetIdRef.current);
          } catch (_e) {
            // ignore
          }
          turnstileWidgetIdRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch (_e) {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [submittedData]);

  useEffect(() => {
    if (activeFormTab) {
      setRequestType(activeFormTab);
    }
  }, [activeFormTab]);

  useEffect(() => {
    if (selectedProductForInquiry) {
      setSelectedProduct(selectedProductForInquiry);
      setRequestType('bilgi');
      setSubmittedData(null);
      setSubmitError('');
    }
  }, [selectedProductForInquiry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    const sanitizedCartSnapshot = cartItems.slice(0, 50).map(({ product, qty }) => ({
      model: String(product?.model || '').trim().slice(0, 100),
      qty: Math.min(10000, Math.max(1, Math.trunc(Number(qty) || 1)))
    }));

    const resolvedProduct =
      (selectedProduct && selectedProduct.trim()) || 'Genel Fanvil & LINKVIL Ürün Ailesi';

    const payload = {
      requestType,
      fullName: fullName.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      selectedProduct: resolvedProduct.slice(0, 200),
      quantity: String(quantity || '').slice(0, 200),
      pbxSystem: String(pbxSystem || '').slice(0, 200),
      projectName: projectName.trim().slice(0, 200),
      message: message.trim().slice(0, 3000),
      cartSnapshot: sanitizedCartSnapshot,
      kvkkAccepted: Boolean(kvkkAccepted),
      marketingConsent: Boolean(marketingConsent),
      kvkkVersion: KVKK_VERSION,
      website,
      ...(turnstileToken ? { turnstileToken } : {})
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseErr) {
        data = null;
      }

      if (response.status === 429) {
        setSubmitError(
          data?.error ||
            'Çok fazla talep gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
        );
        return;
      }

      if (!response.ok || !data || data.ok !== true || !data.refCode) {
        setSubmitError(
          data?.error ||
            'Talebiniz gönderilirken bir hata oluştu. Lütfen alanları kontrol edip tekrar deneyin.'
        );
        return;
      }

      setSubmittedData({
        refCode: data.refCode,
        requestType: REQUEST_TYPES.find((r) => r.id === requestType)?.label || requestType,
        fullName: payload.fullName,
        company: payload.company,
        email: payload.email,
        phone: payload.phone,
        selectedProduct: payload.selectedProduct,
        quantity: payload.quantity,
        pbxSystem: payload.pbxSystem,
        projectName: payload.projectName,
        message: payload.message,
        cartSnapshot: sanitizedCartSnapshot,
        createdAt: new Date().toLocaleString('tr-TR')
      });
    } catch (_err) {
      setSubmitError(
        'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'
      );
    } finally {
      setIsSubmitting(false);
      // Turnstile token is single-use; always reset after submission attempt
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        try {
          setTurnstileToken('');
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch (_e) {
          // ignore
        }
      }
    }
  };

  return (
    <section
      id="bilgi-formu"
      className="py-14 lg:py-24 bg-gradient-to-b from-white to-[#F8FAFC] border-t border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Form Card - Ordered FIRST on Mobile so clicking 'Bilgi Al' immediately shows the form! */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div
              id="bilgi-formu-karti"
              className={`bg-white rounded-3xl border shadow-soft p-5 sm:p-8 lg:p-10 scroll-mt-28 transition-all duration-500 ${
                formHighlightPulse
                  ? 'border-[#E60012] ring-4 ring-[#E60012]/20'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Form Header */}
              <div className="mb-6 pb-4 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#E60012] text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resmi Gold Partner Bilgi &amp; Teklif Masası</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Ürün Bilgi, Fiyat Teklifi &amp; Proje Başvuru Formu
                </h2>
                {selectedProduct && !submittedData && (
                  <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Seçilen Ürün/Çözüm: <strong className="font-extrabold">{selectedProduct}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct('')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                    >
                      Değiştir
                    </button>
                  </div>
                )}
              </div>

              {submittedData ? (
                <div className="space-y-6 py-4 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Talebiniz Başarıyla Alındı — Referans: {submittedData.refCode}</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">
                      Teşekkür Ederiz, {submittedData.fullName}!
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Fanvil Gold Partner proje ekibimiz talebinizi inceleyerek en kısa sürede{' '}
                      <strong>{submittedData.email}</strong> ve{' '}
                      <strong>{submittedData.phone}</strong> üzerinden sizinle iletişime geçecektir.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm text-left">
                    <div className="flex justify-between border-b border-slate-200/70 pb-2 gap-2">
                      <span className="text-slate-500">Talep Türü:</span>
                      <span className="font-bold text-slate-900 text-right">{submittedData.requestType}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/70 pb-2 gap-2">
                      <span className="text-slate-500">Firma / Kurum:</span>
                      <span className="font-bold text-slate-900 text-right">{submittedData.company}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/70 pb-2 gap-2">
                      <span className="text-slate-500">İlgilenilen Ürün / Çözüm:</span>
                      <span className="font-bold text-[#E60012] text-right">
                        {submittedData.selectedProduct}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/70 pb-2 gap-2">
                      <span className="text-slate-500">Tahmini Adet &amp; Santral:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {submittedData.quantity} • {submittedData.pbxSystem}
                      </span>
                    </div>
                    {submittedData.cartSnapshot.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-500 block mb-1.5">
                          Proje Teklif Sepeti Kalemleri:
                        </span>
                        <div className="space-y-1">
                          {submittedData.cartSnapshot.map((item, idx) => (
                            <div
                              key={`${item.model}-${idx}`}
                              className="flex justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                            >
                              <span className="font-semibold text-slate-800">{item.model}</span>
                              <span className="font-bold text-[#E60012]">{item.qty} Adet</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      Talep Özeti PDF / Yazdır
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedData(null);
                        setSubmitError('');
                        setKvkkAccepted(false);
                        setMarketingConsent(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Yeni Bilgi Talebi Oluştur
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot Input (Hidden from real users, traps bots) */}
                  <div
                    className="hidden"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  >
                    <label htmlFor="website-hp">Website</label>
                    <input
                      id="website-hp"
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Request Type Selector Tabs */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      1. İşlem / Başvuru Türünü Seçin
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {REQUEST_TYPES.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setRequestType(tab.id)}
                          className={`py-2.5 px-3.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between ${
                            requestType === tab.id
                              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {requestType === tab.id && (
                            <span className="w-2 h-2 rounded-full bg-[#E60012] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Selection Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Bilgi Almak İstediğiniz Ürün veya Çözüm Paketi
                      </label>
                      <div className="relative">
                        <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          list="fanvil-models-list"
                          maxLength={200}
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          placeholder="Ürün seçin veya yazın (örn. Fanvil V67, i68, X303P)..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                        <datalist id="fanvil-models-list">
                          <option value="Tüm Fanvil & LINKVIL Ürün Kataloğu" />
                          <option value="Otel 2-Wire (2 Telli) Kablo Değiştirmeden IP Dönüşüm" />
                          <option value="Hastane Y501 Hemşire Çağrı & A320i/A32i Konsol Sistemi" />
                          <option value="Akıllı Bina i68/i67 Yüz Tanımalı İnterkom & i566W/i507W Panel" />
                          {products.map((p) => (
                            <option key={p.id} value={p.model} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tahmini Adet / Ölçek
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                      >
                        <option value="1 - 10 Adet">1 - 10 Adet</option>
                        <option value="10 - 50 Adet">10 - 50 Adet</option>
                        <option value="50 - 250 Adet (Proje)">50 - 250 Adet (Proje)</option>
                        <option value="250+ Adet (Kurumsal İhale)">250+ Adet (Kurumsal İhale)</option>
                        <option value="Sürekli Bayi Alımı">Sürekli Bayi Alımı</option>
                      </select>
                    </div>
                  </div>

                  {/* Personal & Company Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Adınız Soyadınız *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ad Soyad"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Firma / Kurum Adı *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Firma veya Kurum Ünvanı"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kurumsal E-Posta Adresi *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          maxLength={254}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@firma.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Telefon Numarası *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          minLength={7}
                          maxLength={20}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05XX XXX XX XX"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PBX Compatibility & Optional Project Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mevcut / Planlanan Santral Altyapısı
                      </label>
                      <select
                        value={pbxSystem}
                        onChange={(e) => setPbxSystem(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                      >
                        {PBX_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Şehir / Proje Adı (FPRS İçin Opsiyonel)
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Örn: İstanbul - 120 Odalı Otel Projesi"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  {/* Message / Inquiry Details */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ürün Hakkında Sorunuz veya Proje Notunuz
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        rows="3"
                        maxLength={3000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ürün teknik özellikleri, stok durumu, 2-Wire dönüşüm veya toplu fiyat teklifi hakkındaki sorunuzu buraya yazabilirsiniz..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#E60012]"
                      />
                    </div>
                  </div>

                  {/* KVKK Aydınlatma Onayı & İsteğe Bağlı Ticari İleti Onayı */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-2.5">
                      <input
                        id="kvkk-check"
                        type="checkbox"
                        checked={kvkkAccepted}
                        onChange={(e) => setKvkkAccepted(e.target.checked)}
                        required
                        className="mt-1 rounded border-slate-300 text-[#E60012] focus:ring-[#E60012]"
                      />
                      <label htmlFor="kvkk-check" className="text-xs text-slate-600 leading-relaxed">
                        <a
                          href="/kvkk"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E60012] font-bold underline hover:text-[#B9000E]"
                        >
                          KVKK Aydınlatma Metni
                        </a>
                        &apos;ni okudum ve anladım. *
                      </label>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <input
                        id="marketing-consent-check"
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-1 rounded border-slate-300 text-[#E60012] focus:ring-[#E60012]"
                      />
                      <label
                        htmlFor="marketing-consent-check"
                        className="text-xs text-slate-500 leading-relaxed"
                      >
                        Fanvil ürünleri, kampanyalar ve duyurular hakkında e-posta, SMS ve telefon
                        yoluyla ticari elektronik ileti almayı kabul ediyorum. (İsteğe bağlı)
                      </label>
                    </div>
                  </div>

                  {/* Cloudflare Turnstile Widget Container (interaction-only) */}
                  {TURNSTILE_SITE_KEY && (
                    <div ref={turnstileContainerRef} className="min-h-[2px]" />
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !kvkkAccepted || (!turnstileToken && !turnstileBypass)}
                    className="w-full py-4 px-6 rounded-xl bg-[#E60012] hover:bg-[#B9000E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-sm hover:shadow inline-flex items-center justify-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Gönderiliyor...'
                        : !turnstileToken && !turnstileBypass
                          ? 'Güvenlik Doğrulaması Hazırlanıyor...'
                          : 'Bilgi & Teklif Talebini Gönder'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info Column - Ordered SECOND on Mobile so it never pushes the form down! */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Yetkili Gold Partner Proje ve Teknik Destek Masası
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                İlgilendiğiniz tüm Fanvil IP telefonlar, LINKVIL kablosuz sistemler, kapı interkomları ve 2-Wire dönüşüm çözümleri için doğrudan yetkili Gold Partner mühendislik ekibimizden bilgi alabilirsiniz.
              </p>
            </div>

            <FanvilGoldPartnerBadge size="md" />

            {/* Direct Advantages Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Gold Partner Destek Sürecimiz
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
                  <span>
                    <strong>30 Dakikada Dönüş:</strong> Ürün uyumluluk, stok ve teknik sorularınıza uzman satış mühendislerimiz hızla yanıt verir.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                  <span>
                    <strong>Özel Proje Fiyatlandırması (FPRS):</strong> Toplu alımlarınızda ve ihale projelerinizde özel Gold Partner iskontosu uygulanır.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ücretsiz Keşif &amp; Şartname Desteği:</strong> Kamu ve özel sektör projeleriniz için teknik şartname ve topoloji hazırlığı.
                  </span>
                </li>
              </ul>
            </div>

            {/* If Quote Cart has items, display quick summary box */}
            {cartItems.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border-2 border-[#E60012]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#E60012]">
                    Teklif Sepetinizdeki Ürünler ({cartItems.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Forma otomatik eklendi</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map(({ product, qty }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl text-xs"
                    >
                      <span className="font-bold text-slate-800 truncate">{product.model}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) =>
                            onUpdateCartQty(product.id, Math.max(1, Number(e.target.value)))
                          }
                          className="w-14 px-2 py-1 rounded border border-slate-300 text-center font-bold text-slate-900"
                        />
                        <span className="text-slate-500">Adet</span>
                        <button
                          type="button"
                          onClick={() => onRemoveCartItem(product.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

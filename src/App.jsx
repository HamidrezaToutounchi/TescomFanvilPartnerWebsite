import React, { useState, useEffect } from 'react';
import { GitCompare, ShoppingBag, ArrowRight } from 'lucide-react';
import productsData from './data/fanvil_products.json';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SolutionsWizard from './components/SolutionsWizard';
import ProductCatalog from './components/ProductCatalog';
import GoldPartnerSection from './components/GoldPartnerSection';
import ProductInquiryForm from './components/ProductInquiryForm';
import {
  PageBanner,
  HomeOverviewSection,
  ComparePage,
  QuoteCartPage,
  KvkkPage
} from './components/DedicatedPages';
import Footer from './components/Footer';

const VALID_PAGES = [
  'home',
  'urunler',
  'cozumler',
  'gold-partner',
  'karsilastir',
  'teklif-sepeti',
  'iletisim',
  'kvkk'
];

function resolvePageFromLocation() {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  if (pathname === '/kvkk') {
    return 'kvkk';
  }
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(resolvePageFromLocation);

  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSeries, setSelectedSeries] = useState('Tümü');
  const [cartItems, setCartItems] = useState([]);
  // Empty by default when the website opens (no default comparison products)
  const [compareIds, setCompareIds] = useState([]);
  const [activeFormTab, setActiveFormTab] = useState('bilgi');
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState('');
  const [formHighlightPulse, setFormHighlightPulse] = useState(false);

  // Sync browser back/forward buttons with currentPage
  useEffect(() => {
    const syncLocation = () => {
      setCurrentPage(resolvePageFromLocation());
    };
    window.addEventListener('hashchange', syncLocation);
    window.addEventListener('popstate', syncLocation);
    return () => {
      window.removeEventListener('hashchange', syncLocation);
      window.removeEventListener('popstate', syncLocation);
    };
  }, []);

  // Update document.title dynamically for /kvkk vs main pages
  useEffect(() => {
    if (currentPage === 'kvkk') {
      document.title = 'KVKK Aydınlatma Metni | Fanvil Partner Türkiye';
    } else {
      document.title =
        'Fanvil Partner Türkiye | Resmi Gold Partner & Kurumsal A&V-IoT Çözüm Merkezi';
    }
  }, [currentPage]);

  // Navigate between dedicated pages & scroll to top
  const handleNavigatePage = (pageId) => {
    const target = VALID_PAGES.includes(pageId) ? pageId : 'home';
    setCurrentPage(target);
    if (target === 'kvkk') {
      window.history.pushState(null, '', '/kvkk');
    } else {
      window.history.pushState(null, '', target === 'home' ? '/#/' : `/#/${target}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to B2B Quote Cart
  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 10 }];
    });
  };

  const handleUpdateCartQty = (productId, qty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, qty } : item))
    );
  };

  const handleRemoveCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Toggle Compare (up to 4 products)
  const handleToggleCompare = (productId) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), productId];
      }
      return [...prev, productId];
    });
  };

  // Navigate to Contact / Form Page and select specific tab
  const handleNavigateToForm = (tab = 'bilgi') => {
    setActiveFormTab(tab);
    setFormHighlightPulse(true);
    handleNavigatePage('iletisim');
    setTimeout(() => setFormHighlightPulse(false), 1800);
  };

  // Inquire about a specific product or solution package -> goes to Form Page
  const handleInquireProduct = (productOrSolutionTitle) => {
    setSelectedProductForInquiry(productOrSolutionTitle);
    setActiveFormTab('bilgi');
    setFormHighlightPulse(true);
    handleNavigatePage('iletisim');
    setTimeout(() => setFormHighlightPulse(false), 1800);
  };

  // Select category/series from Mega Menu or Home cards -> goes to Products Page
  const handleSelectCategoryFromMenu = (category, series = 'Tümü') => {
    setSelectedCategory(category);
    setSelectedSeries(series);
    handleNavigatePage('urunler');
  };

  const compareProducts = productsData.filter((p) => compareIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Sticky Header & Mega Menu */}
      <Navbar
        currentPage={currentPage}
        onNavigatePage={handleNavigatePage}
        totalProductCount={productsData.length}
        cartCount={cartItems.length}
        compareCount={compareIds.length}
        onSelectCategory={handleSelectCategoryFromMenu}
        onNavigateToForm={handleNavigateToForm}
      />

      {/* Multi-Page Router View */}
      <main className="flex-1">
        {/* 1. ANA SAYFA (HOME) */}
        {currentPage === 'home' && (
          <>
            <HeroSection
              onNavigatePage={handleNavigatePage}
              onNavigateToForm={handleNavigateToForm}
              onInquireProduct={handleInquireProduct}
            />
            <HomeOverviewSection
              products={productsData}
              cartItems={cartItems}
              compareIds={compareIds}
              onAddToCart={handleAddToCart}
              onToggleCompare={handleToggleCompare}
              onInquireProduct={handleInquireProduct}
              onSelectCategory={handleSelectCategoryFromMenu}
              onNavigatePage={handleNavigatePage}
            />
          </>
        )}

        {/* 2. ÜRÜN KATALOĞU SAYFASI (URUNLER) */}
        {currentPage === 'urunler' && (
          <>
            <PageBanner
              badge="Resmi Fanvil & LINKVIL Kataloğu"
              title="Tüm Ürün Kataloğu & Seriler"
              subtitle="Kurumsal SIP telefonlar, 2-Wire otel çözümleri, LINKVIL kablosuz iletişim, yüz tanımalı kapı interkomları, hemşire çağrı ve SIP anons sistemleri."
              onGoHome={() => handleNavigatePage('home')}
            />
            <ProductCatalog
              products={productsData}
              selectedCategory={selectedCategory}
              selectedSeries={selectedSeries}
              onChangeCategory={setSelectedCategory}
              onChangeSeries={setSelectedSeries}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onInquireProduct={handleInquireProduct}
            />
          </>
        )}

        {/* 3. SEKTÖREL ÇÖZÜMLER SAYFASI (COZUMLER) */}
        {currentPage === 'cozumler' && (
          <>
            <PageBanner
              badge="Uçtan Uca Sektörel Mimari"
              title="Sektörel Çözüm Sihirbazı"
              subtitle="Otel, hastane, akıllı bina, kurumsal ofis, eğitim kampüsü ve endüstriyel tesisler için anahtar teslim Fanvil & LINKVIL donanım paketleri."
              onGoHome={() => handleNavigatePage('home')}
            />
            <SolutionsWizard onInquireSolution={handleInquireProduct} />
          </>
        )}

        {/* 4. GOLD PARTNER & FPRS SAYFASI (GOLD-PARTNER) */}
        {currentPage === 'gold-partner' && (
          <>
            <PageBanner
              badge="Fanvil Gold Partner Türkiye"
              title="Gold Partner Güvencesi & FPRS Proje Kaydı"
              subtitle="Resmi distribütör garantisi, FPRS ihale/proje koruma ayrıcalıkları, alt bayilik programı ve ücretsiz santral uyumluluk desteği."
              onGoHome={() => handleNavigatePage('home')}
            />
            <GoldPartnerSection onScrollToForm={handleNavigateToForm} />
          </>
        )}

        {/* 5. MODEL KARŞILAŞTIRMA SAYFASI (KARSILASTIR) */}
        {currentPage === 'karsilastir' && (
          <>
            <PageBanner
              badge="Teknik Karşılaştırma Matrisi"
              title="Model Karşılaştırma Sayfası"
              subtitle="Seçtiğiniz Fanvil ve LINKVIL modellerinin ekran, SIP hattı, PoE, koruma sınıfı ve ses/video özelliklerini yan yana kıyaslayın."
              onGoHome={() => handleNavigatePage('home')}
            />
            <ComparePage
              allProducts={productsData}
              compareProducts={compareProducts}
              onToggleCompare={handleToggleCompare}
              onClearCompare={() => setCompareIds([])}
              onInquireProduct={handleInquireProduct}
              onNavigatePage={handleNavigatePage}
            />
          </>
        )}

        {/* 6. PROJE TEKLİF SEPETİ SAYFASI (TEKLIF-SEPETI) */}
        {currentPage === 'teklif-sepeti' && (
          <>
            <PageBanner
              badge="B2B Kurumsal Satınalma"
              title="Proje Teklif Sepeti"
              subtitle="Projeniz için seçtiğiniz ürünleri ve adetlerini düzenleyin, tek tıkla kurumsal teklif formuna aktarın."
              onGoHome={() => handleNavigatePage('home')}
            />
            <QuoteCartPage
              allProducts={productsData}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onUpdateQty={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={() => setCartItems([])}
              onProceedToForm={() => handleNavigateToForm('bilgi')}
              onNavigatePage={handleNavigatePage}
            />
          </>
        )}

        {/* 7. İLETİŞİM, ÜRÜN BİLGİ & FPRS BAŞVURU SAYFASI (ILETISIM) */}
        {currentPage === 'iletisim' && (
          <>
            <PageBanner
              badge="Kurumsal İletişim & Destek"
              title="Ürün Bilgi, Proje Teklifi & FPRS Kayıt Formu"
              subtitle="Ürünler hakkında detaylı bilgi alın, proje teklif sepetinizi gönderin veya FPRS proje koruma / alt bayilik başvurusu yapın."
              onGoHome={() => handleNavigatePage('home')}
            />
            <ProductInquiryForm
              products={productsData}
              activeFormTab={activeFormTab}
              selectedProductForInquiry={selectedProductForInquiry}
              formHighlightPulse={formHighlightPulse}
              cartItems={cartItems}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveCartItem={handleRemoveCartItem}
            />
          </>
        )}

        {/* 8. KVKK AYDINLATMA METNİ SAYFASI (/kvkk) */}
        {currentPage === 'kvkk' && (
          <>
            <PageBanner
              badge="6698 Sayılı KVKK"
              title="KVKK Aydınlatma Metni"
              subtitle="Kişisel verilerinizin işlenmesine, korunmasına ve Kanun'un 11. maddesi kapsamındaki haklarınıza ilişkin bilgilendirme."
              onGoHome={() => handleNavigatePage('home')}
            />
            <KvkkPage />
          </>
        )}
      </main>

      {/* Floating WhatsApp Direct Support Button */}
      <a
        href="https://wa.me/908508501881"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Destek Hattı (0850 850 18 81)"
        className="fixed bottom-16 sm:bottom-5 left-4 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-extrabold shadow-lg transition-all"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.494 5.462 5.601-1.469c1.911 1.24 4.187 1.974 6.609 1.974 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
        </svg>
        <span>WhatsApp Hattı</span>
      </a>

      {/* Floating Quick Bar when user selects products on Catalog/Home */}
      {(compareIds.length > 0 || cartItems.length > 0) &&
        currentPage !== 'karsilastir' &&
        currentPage !== 'teklif-sepeti' && (
          <div className="fixed bottom-16 sm:bottom-5 right-4 z-30 flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => handleNavigatePage('karsilastir')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-sky-700 text-white text-xs font-extrabold shadow-lg transition-all"
              >
                <GitCompare className="w-4 h-4" />
                <span>Karşılaştır ({compareIds.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => handleNavigatePage('teklif-sepeti')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold shadow-lg border border-slate-700 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Teklif Sepetine Git ({cartItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      {/* Corporate Footer & Mobile Sticky Bottom Bar */}
      <Footer
        currentPage={currentPage}
        onNavigatePage={handleNavigatePage}
        onSelectCategory={handleSelectCategoryFromMenu}
        onNavigateToForm={handleNavigateToForm}
        cartCount={cartItems.length}
      />
    </div>
  );
}

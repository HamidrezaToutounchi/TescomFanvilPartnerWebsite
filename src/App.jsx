import React, { useState } from 'react';
import productsData from './data/fanvil_products.json';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SolutionsWizard from './components/SolutionsWizard';
import ProductCatalog from './components/ProductCatalog';
import GoldPartnerSection from './components/GoldPartnerSection';
import ProductInquiryForm from './components/ProductInquiryForm';
import { QuoteCartDrawer, CompareModal } from './components/CartAndCompareModals';
import Footer from './components/Footer';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSeries, setSelectedSeries] = useState('Tümü');
  const [cartItems, setCartItems] = useState([]);
  const [compareIds, setCompareIds] = useState(['fanvil-v67', 'fanvil-v65', 'fanvil-x303p']);
  const [cartOpen, setCartOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('bilgi');
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState('');
  const [formHighlightPulse, setFormHighlightPulse] = useState(false);

  // Smooth & accurate scroll helper for both desktop and mobile
  const scrollToElementById = (elementId) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        const headerOffset = 92;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementPosition - headerOffset),
          behavior: 'smooth'
        });
      }
    }, 60);
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

  // Scroll to form card directly and pulse border
  const handleScrollToForm = (tab = 'bilgi') => {
    setActiveFormTab(tab);
    setFormHighlightPulse(true);
    scrollToElementById('bilgi-formu-karti');
    setTimeout(() => setFormHighlightPulse(false), 1800);
  };

  // Inquire about a specific product or solution package
  const handleInquireProduct = (productOrSolutionTitle) => {
    setSelectedProductForInquiry(productOrSolutionTitle);
    setActiveFormTab('bilgi');
    setFormHighlightPulse(true);
    scrollToElementById('bilgi-formu-karti');
    setTimeout(() => setFormHighlightPulse(false), 1800);
  };

  const handleSelectCategoryFromMenu = (category, series = 'Tümü') => {
    setSelectedCategory(category);
    setSelectedSeries(series);
    scrollToElementById('katalog');
  };

  const compareProducts = productsData.filter((p) => compareIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Sticky Header & Mega Menu */}
      <Navbar
        totalProductCount={productsData.length}
        cartCount={cartItems.length}
        compareCount={compareIds.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenCompare={() => setCompareOpen(true)}
        onSelectCategory={handleSelectCategoryFromMenu}
        onScrollToSection={scrollToElementById}
        onScrollToForm={handleScrollToForm}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero & PBX Compatibility */}
        <HeroSection
          onScrollToForm={handleScrollToForm}
          onInquireProduct={handleInquireProduct}
        />

        {/* Interactive Sectoral Solution Wizard */}
        <SolutionsWizard onInquireSolution={handleInquireProduct} />

        {/* Dynamic Product Catalog & Filter Engine */}
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

        {/* Fanvil Gold Partner Assurance Section */}
        <GoldPartnerSection onScrollToForm={handleScrollToForm} />

        {/* Product Info, Quote & FPRS Registration Form */}
        <ProductInquiryForm
          products={productsData}
          activeFormTab={activeFormTab}
          selectedProductForInquiry={selectedProductForInquiry}
          formHighlightPulse={formHighlightPulse}
          cartItems={cartItems}
          onUpdateCartQty={handleUpdateCartQty}
          onRemoveCartItem={handleRemoveCartItem}
        />
      </main>

      {/* B2B Quote Cart Drawer */}
      <QuoteCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        onProceedToForm={() => {
          setCartOpen(false);
          handleScrollToForm('bilgi');
        }}
      />

      {/* Side-by-Side Model Comparison Modal */}
      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        compareProducts={compareProducts}
        onRemoveCompare={handleToggleCompare}
        onClearCompare={() => setCompareIds([])}
        onInquireProduct={handleInquireProduct}
      />

      {/* Corporate Footer & Mobile Sticky Bottom Bar */}
      <Footer
        onSelectCategory={handleSelectCategoryFromMenu}
        onScrollToSection={scrollToElementById}
        onScrollToForm={handleScrollToForm}
        cartCount={cartItems.length}
        onOpenCart={() => setCartOpen(true)}
      />
    </div>
  );
}

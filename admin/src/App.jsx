import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  LogOut,
  Inbox,
  Mail,
  Users,
  Globe,
  UserCog,
  History,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Lock,
  KeyRound,
  Eye
} from 'lucide-react';

const REQUEST_TYPE_LABELS = {
  bilgi: 'Ürün Bilgi & Fiyat',
  proje: 'FPRS Proje Kaydı',
  bayi: 'Alt Bayilik Başvurusu',
  demo: '2-Wire / Teknik Demo'
};

const STATUS_META = {
  new: { label: 'Yeni', cls: 'bg-red-50 text-[#E60012] border-red-200' },
  contacted: { label: 'İletişime Geçildi', cls: 'bg-sky-50 text-[#0284C7] border-sky-200' },
  quoted: { label: 'Teklif Verildi', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  won: { label: 'Kazanıldı (Won)', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost: { label: 'Kaybedildi (Lost)', cls: 'bg-slate-100 text-slate-600 border-slate-300' }
};

const MAIL_STATUS_META = {
  pending: { label: 'Kuyrukta (Pending)', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Gönderiliyor...', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  sent: { label: 'Gönderildi ✓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Hata (Failed)', cls: 'bg-red-50 text-red-700 border-red-200' },
  skipped: { label: 'Atlandı (Ayar/Alıcı Yok)', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
};

const CAPTCHA_META = {
  passed: { label: 'Doğrulandı', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unverified: { label: 'Doğrulanmadı', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  disabled: { label: 'Kapalı', cls: 'bg-slate-100 text-slate-500 border-slate-200' }
};

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }
  return { res, data };
}

function formatDateTR(val) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      dateStyle: 'short',
      timeStyle: 'short'
    });
  } catch (_e) {
    return String(val);
  }
}

export default function App() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [clientIp, setClientIp] = useState('');

  // Navigation tab: 'leads' | 'mail' | 'recipients' | 'ips' | 'users' | 'audit'
  const [activeTab, setActiveTab] = useState('leads');
  const [selectedLeadId, setSelectedLeadId] = useState(() => {
    const m = window.location.pathname.match(/\/admin\/leads\/([a-fA-F0-9]{24})/);
    return m ? m[1] : null;
  });

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const checkSession = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const { res, data } = await apiFetch('/api/admin/me');
      if (res.ok && data?.ok) {
        setClientIp(data.clientIp || '');
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (_err) {
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginBusy) return;
    setLoginBusy(true);
    setLoginError('');
    try {
      const { res, data } = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (!res.ok || !data?.ok) {
        setLoginError(data?.error || 'Giriş başarısız.');
        return;
      }
      setUser(data.user);
      setClientIp(data.clientIp || clientIp);
      setLoginPassword('');
    } catch (_err) {
      setLoginError('Sunucu bağlantı hatası.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/admin/logout', { method: 'POST' });
    setUser(null);
    setSelectedLeadId(null);
    window.history.replaceState(null, '', '/admin/');
  };

  const openLeadDetail = (id) => {
    setSelectedLeadId(id);
    setActiveTab('leads');
    window.history.pushState(null, '', `/admin/leads/${id}`);
  };

  const closeLeadDetail = () => {
    setSelectedLeadId(null);
    window.history.pushState(null, '', '/admin/');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-[#E60012]" />
          <span>Yönetim Paneli Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 1. LOGIN SCREEN
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0F172A] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#E60012] text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4" />
              <span>Fanvil Gold Partner Türkiye</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Kurumsal Yönetim Paneli
            </h1>
            <p className="text-xs text-slate-500">
              İzinli IP doğrulandı ({clientIp || 'VPN'}) • Yetkili hesabınızla giriş yapın
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:outline-none focus:border-[#E60012]"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:outline-none focus:border-[#E60012]"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginBusy}
              className="w-full py-3.5 px-5 rounded-xl bg-[#E60012] hover:bg-[#B9000E] disabled:opacity-60 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loginBusy ? 'Doğrulanıyor...' : 'Panele Giriş Yap'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  // -------------------------------------------------------------------------
  // AUTHENTICATED SHELL
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navigation Header */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#E60012] text-white text-xs font-extrabold tracking-wide">
              FANVIL ADMIN
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              IP: <strong className="text-slate-200">{clientIp}</strong>
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                closeLeadDetail();
                setActiveTab('leads');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeTab === 'leads'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Lead'ler</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    closeLeadDetail();
                    setActiveTab('mail');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeTab === 'mail'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Mail Ayarları</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeLeadDetail();
                    setActiveTab('recipients');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeTab === 'recipients'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Alıcılar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeLeadDetail();
                    setActiveTab('ips');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeTab === 'ips'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>İzinli IP'ler</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeLeadDetail();
                    setActiveTab('users');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeTab === 'users'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Kullanıcılar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeLeadDetail();
                    setActiveTab('audit');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeTab === 'audit'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>İşlem Kaydı</span>
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white">{user.username}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                {user.role === 'admin' ? 'Yönetici (Admin)' : 'İzleyici (Viewer)'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leads' &&
          (selectedLeadId ? (
            <LeadDetailView
              leadId={selectedLeadId}
              isAdmin={isAdmin}
              onBack={closeLeadDetail}
            />
          ) : (
            <LeadsListView
              onSelectLead={openLeadDetail}
              onUnauthorized={() => setUser(null)}
            />
          ))}

        {isAdmin && activeTab === 'mail' && <MailSettingsView />}
        {isAdmin && activeTab === 'recipients' && <RecipientsView />}
        {isAdmin && activeTab === 'ips' && <AllowedIpsView currentIp={clientIp} />}
        {isAdmin && activeTab === 'users' && <AdminUsersView currentUser={user} />}
        {isAdmin && activeTab === 'audit' && <AuditLogsView />}
      </main>
    </div>
  );
}

// ===========================================================================
// SCREEN 2 & 4: LEADS LIST + FILTERS + SERVER PAGINATION + CSV EXPORT
// ===========================================================================
function LeadsListView({ onSelectLead, onUnauthorized }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [q, setQ] = useState('');
  const [requestType, setRequestType] = useState('');
  const [status, setStatus] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState('');
  const [marketingConsent, setMarketingConsent] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const buildQueryString = useCallback(
    (targetPage = page) => {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      if (q.trim()) params.set('q', q.trim());
      if (requestType) params.set('requestType', requestType);
      if (status) params.set('status', status);
      if (captchaStatus) params.set('captchaStatus', captchaStatus);
      if (marketingConsent) params.set('marketingConsent', marketingConsent);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return params.toString();
    },
    [page, q, requestType, status, captchaStatus, marketingConsent, from, to]
  );

  const loadLeads = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      setListError('');
      try {
        const qs = buildQueryString(targetPage);
        const { res, data } = await apiFetch(`/api/admin/leads?${qs}`);
        if (res.status === 401) {
          if (onUnauthorized) onUnauthorized();
          return;
        }
        if (res.ok && data?.ok) {
          setItems(data.items || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setUnreadCount(data.unreadCount || 0);
          setPage(data.page || targetPage);
        } else {
          setListError(data?.error || `Lead listesi alınamadı (HTTP ${res.status}).`);
        }
      } catch (_err) {
        setListError('Sunucu bağlantısı sırasında hata oluştu.');
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString, page, onUnauthorized]
  );

  useEffect(() => {
    loadLeads(page);
  }, [loadLeads, page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLeads(1);
  };

  const handleExportCsv = () => {
    const qs = buildQueryString(1);
    window.location.href = `/api/admin/leads/export.csv?${qs}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Gelen Form Talepleri (Lead'ler)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Toplam <strong>{total}</strong> kayıt •{' '}
            <strong className="text-[#E60012]">{unreadCount} okunmamış</strong> talep
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadLeads(page)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>CSV Dışa Aktar (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3"
      >
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, firma, e-posta, tel veya FVL-... ara"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:bg-white focus:outline-none focus:border-[#E60012]"
          />
        </div>

        <select
          value={requestType}
          onChange={(e) => {
            setRequestType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
        >
          <option value="">Tüm Talep Tipleri</option>
          <option value="bilgi">Ürün Bilgi &amp; Fiyat</option>
          <option value="proje">FPRS Proje Kaydı</option>
          <option value="bayi">Alt Bayilik Başvurusu</option>
          <option value="demo">2-Wire / Teknik Demo</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
        >
          <option value="">Tüm Durumlar</option>
          <option value="new">Yeni (New)</option>
          <option value="contacted">İletişime Geçildi</option>
          <option value="quoted">Teklif Verildi</option>
          <option value="won">Kazanıldı (Won)</option>
          <option value="lost">Kaybedildi (Lost)</option>
        </select>

        <select
          value={captchaStatus}
          onChange={(e) => {
            setCaptchaStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
        >
          <option value="">Tüm Bot Koruması</option>
          <option value="passed">Doğrulandı (passed)</option>
          <option value="unverified">Doğrulanmadı (unverified)</option>
          <option value="disabled">Kapalı (disabled)</option>
        </select>

        <select
          value={marketingConsent}
          onChange={(e) => {
            setMarketingConsent(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          title="Ticari İleti Onayı"
        >
          <option value="">Ticari İleti Onayı: Tümü</option>
          <option value="true">Ticari ileti onayı: Evet</option>
          <option value="false">Ticari ileti onayı: Hayır</option>
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          title="Başlangıç Tarihi"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
            title="Bitiş Tarihi"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#E60012] text-white text-xs font-bold shrink-0"
          >
            Filtrele
          </button>
        </div>
      </form>

      {/* Table */}
      {listError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{listError}</span>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <th className="py-3.5 px-4">Ref / Tarih</th>
              <th className="py-3.5 px-4">Ad Soyad &amp; Firma</th>
              <th className="py-3.5 px-4">İletişim</th>
              <th className="py-3.5 px-4">Talep &amp; Ürün</th>
              <th className="py-3.5 px-4">Durum</th>
              <th className="py-3.5 px-4">Mail</th>
              <th className="py-3.5 px-4 text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  {loading ? 'Yükleniyor...' : 'Kriterlere uygun lead kaydı bulunamadı.'}
                </td>
              </tr>
            ) : (
              items.map((lead) => {
                const st = STATUS_META[lead.status] || STATUS_META.new;
                const cp =
                  CAPTCHA_META[lead.captchaStatus] || CAPTCHA_META.disabled;
                const ms = lead.mailStatus
                  ? MAIL_STATUS_META[lead.mailStatus.status]
                  : null;
                return (
                  <tr
                    key={lead._id}
                    onClick={() => onSelectLead(lead._id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      !lead.isRead ? 'bg-red-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!lead.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#E60012] shrink-0"
                            title="Okunmadı"
                          />
                        )}
                        <span className="font-extrabold text-slate-900">{lead.refCode}</span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${cp.cls}`}
                          title={`Turnstile: ${lead.captchaStatus || 'disabled'}`}
                        >
                          {cp.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateTR(lead.createdAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.fullName}</div>
                      <div className="text-slate-600">{lead.company}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{lead.email}</div>
                      <div className="text-slate-500">{lead.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold mb-1">
                        {REQUEST_TYPE_LABELS[lead.requestType] || lead.requestType}
                      </span>
                      <div className="text-slate-800 truncate">{lead.selectedProduct}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ms ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${ms.cls}`}
                        >
                          {ms.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>İncele</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs">
          <span>
            Sayfa <strong>{page}</strong> / <strong>{totalPages}</strong> (25 kayıt/sayfa)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 font-bold"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 font-bold"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// SCREEN 3: LEAD DETAIL + STATUS + INTERNAL NOTES + MAIL RESEND
// ===========================================================================
function LeadDetailView({ leadId, isAdmin, onBack }) {
  const [lead, setLead] = useState(null);
  const [mailJob, setMailJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { res, data } = await apiFetch(`/api/admin/leads/${leadId}`);
      if (res.ok && data?.ok) {
        setLead(data.lead);
        setMailJob(data.mailJob);
      }
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin || busy) return;
    setBusy(true);
    setFeedback('');
    try {
      const { res, data } = await apiFetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok && data?.ok) {
        setLead(data.lead);
        setFeedback('Durum güncellendi.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!isAdmin || !noteText.trim() || busy) return;
    setBusy(true);
    setFeedback('');
    try {
      const { res, data } = await apiFetch(`/api/admin/leads/${leadId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text: noteText.trim() })
      });
      if (res.ok && data?.ok) {
        setLead(data.lead);
        setNoteText('');
        setFeedback('İç not eklendi.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResendMail = async () => {
    if (!isAdmin || busy) return;
    setBusy(true);
    setFeedback('');
    try {
      const { res, data } = await apiFetch(`/api/admin/leads/${leadId}/resend-mail`, {
        method: 'POST'
      });
      if (res.ok && data?.ok) {
        setMailJob(data.mailJob);
        setFeedback('Bildirim maili yeniden kuyruğa alındı (Outbox).');
        setTimeout(() => loadDetail(), 2500);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Yükleniyor...</div>;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Listeye Dön</span>
        </button>
        <div className="p-8 bg-white rounded-2xl border text-center text-sm">
          Lead bulunamadı.
        </div>
      </div>
    );
  }

  const st = STATUS_META[lead.status] || STATUS_META.new;
  const cp = CAPTCHA_META[lead.captchaStatus] || CAPTCHA_META.disabled;
  const ms = mailJob ? MAIL_STATUS_META[mailJob.status] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lead Listesine Dön</span>
        </button>

        {feedback && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {feedback}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Full Lead Data */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#E60012] uppercase tracking-wider">
                  {REQUEST_TYPE_LABELS[lead.requestType] || lead.requestType}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {lead.refCode} — {lead.company}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Oluşturulma: {formatDateTR(lead.createdAt)} (Europe/Istanbul)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full border text-xs font-bold ${cp.cls}`}
                  title={`Bot Koruması (Turnstile): ${lead.captchaStatus || 'disabled'}`}
                >
                  Bot Koruması: {cp.label}
                </span>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${st.cls}`}>
                  {st.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">Ad Soyad</div>
                <div className="font-bold text-slate-900 mt-0.5">{lead.fullName}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">Firma / Kurum</div>
                <div className="font-bold text-slate-900 mt-0.5">{lead.company}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">E-Posta</div>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-bold text-[#E60012] hover:underline mt-0.5 block"
                >
                  {lead.email}
                </a>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">Telefon</div>
                <a
                  href={`tel:${lead.phone}`}
                  className="font-bold text-slate-900 hover:underline mt-0.5 block"
                >
                  {lead.phone}
                </a>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">İlgilenilen Ürün / Çözüm</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {lead.selectedProduct || '-'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">Tahmini Adet &amp; Santral</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {lead.quantity || '-'} • {lead.pbxSystem || '-'}
                </div>
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs">Şehir / Proje Adı (FPRS)</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {lead.projectName || '-'}
                </div>
              </div>
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-slate-500 text-xs mb-1">Müşteri Mesajı / Notu</div>
                <div className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {lead.message || '-'}
                </div>
              </div>
            </div>

            {/* Cart Snapshot */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Proje Teklif Sepeti ({lead.cartSnapshot?.length || 0} Kalem)
              </h3>
              {Array.isArray(lead.cartSnapshot) && lead.cartSnapshot.length > 0 ? (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {lead.cartSnapshot.map((item, idx) => (
                    <div
                      key={`${item.model}-${idx}`}
                      className="px-4 py-2.5 bg-white flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">{item.model}</span>
                      <span className="font-extrabold text-[#E60012]">{item.qty} Adet</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Sepet boş</div>
              )}
            </div>

            {/* KVKK & Ticari İleti Onay Bilgileri */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                KVKK &amp; Ticari İleti Onay Kayıtları
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">KVKK Aydınlatma Tarihi</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {lead.kvkkAcceptedAt ? formatDateTR(lead.kvkkAcceptedAt) : formatDateTR(lead.createdAt)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">KVKK Metin Sürümü</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {lead.kvkkVersion || lead.kvkkTextVersion || 'v1'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">Ticari İleti Onayı</div>
                  <div className="mt-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${
                        lead.marketingConsent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {lead.marketingConsent ? 'Evet (Onaylandı)' : 'Hayır'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-500 text-[11px]">Ticari İleti Onay Tarihi</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {lead.marketingConsent && lead.marketingConsentAt
                      ? formatDateTR(lead.marketingConsentAt)
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Metadata (IP & User-Agent) */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-500">
              <div>
                <strong>İstemci IP:</strong> {lead.ip || '-'}
              </div>
              <div className="truncate" title={lead.userAgent}>
                <strong>User-Agent:</strong> {lead.userAgent || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Status Change, Mail Status & Resend, Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Control */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Lead Durumu
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  disabled={!isAdmin || busy}
                  onClick={() => handleStatusChange(key)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                    lead.status === key
                      ? `${meta.cls} ring-2 ring-offset-1 ring-slate-400`
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span>{meta.label}</span>
                  {lead.status === key && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mail Notification Outbox Status */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Bildirim Mail Durumu
              </h3>
              <button
                type="button"
                onClick={loadDetail}
                className="text-xs text-slate-500 hover:text-slate-900"
                title="Durumu Yenile"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {mailJob ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full border font-bold ${
                      ms?.cls || ''
                    }`}
                  >
                    {ms?.label || mailJob.status}
                  </span>
                </div>
                <div className="text-slate-600">
                  Deneme Sayısı: <strong>{mailJob.attempts} / 5</strong>
                </div>
                {mailJob.sentAt && (
                  <div className="text-slate-600">
                    Gönderim: <strong>{formatDateTR(mailJob.sentAt)}</strong>
                  </div>
                )}
                {mailJob.lastError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
                    {mailJob.lastError}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Mail kaydı bulunmuyor.</div>
            )}

            {isAdmin && (
              <button
                type="button"
                disabled={busy}
                onClick={handleResendMail}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Maili Yeniden Gönder</span>
              </button>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              İç Notlar ({lead.notes?.length || 0})
            </h3>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {Array.isArray(lead.notes) && lead.notes.length > 0 ? (
                lead.notes.map((n, idx) => (
                  <div
                    key={n._id || idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <strong className="text-slate-800">{n.by}</strong>
                      <span>{formatDateTR(n.at)}</span>
                    </div>
                    <div className="text-slate-800 whitespace-pre-wrap">{n.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">Henüz not eklenmemiş.</div>
              )}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Bu lead hakkında ekip içi not ekleyin..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:bg-white focus:outline-none focus:border-[#E60012]"
                />
                <button
                  type="submit"
                  disabled={busy || !noteText.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] disabled:opacity-50 text-white text-xs font-bold"
                >
                  Not Ekle
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 5: DOĞRU MAİL (HOSTED EXCHANGE) SMTP SETTINGS & TEST EMAIL
// ===========================================================================
const SMTP_PROVIDERS = [
  { id: 'dogrumail', label: 'Doğru Mail', host: 'mail.dogrumail.com', port: 587 },
  { id: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: 587 },
  { id: 'office365', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587 },
  { id: 'yandex', label: 'Yandex', host: 'smtp.yandex.com.tr', port: 465 }
];

function MailSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [testToEmail, setTestToEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);

  const [smtpFromAddress, setSmtpFromAddress] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Tescom Fanvil Partner');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [smtpHost, setSmtpHost] = useState('mail.dogrumail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpSecurity, setSmtpSecurity] = useState('starttls');

  const loadMailSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { res, data } = await apiFetch('/api/admin/mail-settings');
      if (res.ok && data?.ok && data.settings) {
        const s = data.settings;
        setSmtpHost(s.smtpHost || 'mail.dogrumail.com');
        setSmtpPort(s.smtpPort || 587);
        setSmtpSecurity(s.smtpSecurity || 'starttls');
        setSmtpFromAddress(s.smtpFromAddress || '');
        setSmtpUser(s.smtpUser || s.smtpFromAddress || '');
        setHasSmtpPassword(Boolean(s.hasSmtpPassword));
        setSmtpFromName(s.smtpFromName || 'Tescom Fanvil Partner');
        setRecentAttempts(Array.isArray(data.recentAttempts) ? data.recentAttempts : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMailSettings();
  }, [loadMailSettings]);

  const numericPort = Number(smtpPort) || 587;
  const isAutoPort = numericPort === 465 || numericPort === 587 || numericPort === 25;
  const effectiveSecurity =
    numericPort === 465
      ? 'tls'
      : numericPort === 587 || numericPort === 25
        ? 'starttls'
        : smtpSecurity;

  const handleFromAddressChange = (val) => {
    const prevFrom = smtpFromAddress;
    setSmtpFromAddress(val);
    if (!smtpUser || smtpUser === prevFrom) {
      setSmtpUser(val);
    }
  };

  const handlePortChange = (val) => {
    setSmtpPort(val);
    const p = Number(val);
    if (p === 465) setSmtpSecurity('tls');
    else if (p === 587 || p === 25) setSmtpSecurity('starttls');
  };

  const handleSelectProvider = (provider) => {
    setSmtpHost(provider.host);
    setSmtpPort(provider.port);
    setSmtpSecurity(provider.port === 465 ? 'tls' : 'starttls');
  };

  const buildCurrentFormPayload = () => ({
    smtpHost: smtpHost.trim() || 'mail.dogrumail.com',
    smtpPort: numericPort,
    smtpSecurity: effectiveSecurity,
    smtpUser: (smtpUser || smtpFromAddress).trim(),
    smtpPassword,
    smtpFromAddress: smtpFromAddress.trim(),
    smtpFromName: smtpFromName.trim() || 'Tescom Fanvil Partner'
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { res, data } = await apiFetch('/api/admin/mail-settings', {
        method: 'PUT',
        body: JSON.stringify(buildCurrentFormPayload())
      });
      if (!res.ok || !data?.ok) {
        setMessage({ type: 'error', text: data?.error || 'Ayarlar kaydedilemedi.' });
        return;
      }
      setHasSmtpPassword(Boolean(data.hasSmtpPassword));
      setSmtpPassword('');
      setMessage({ type: 'ok', text: 'SMTP mail ayarları AES-256-GCM ile şifrelenerek kaydedildi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyConnection = async () => {
    if (verifying) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { res, data } = await apiFetch('/api/admin/mail-settings/verify', {
        method: 'POST',
        body: JSON.stringify(buildCurrentFormPayload())
      });
      if (res.ok && data?.ok) {
        setVerifyResult({ type: 'ok', text: data.message || 'Bağlantı doğrulandı ✓' });
      } else {
        setVerifyResult({
          type: 'error',
          text: data?.error || 'SMTP bağlantısı doğrulanamadı.'
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testToEmail.trim() || testing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const { res, data } = await apiFetch('/api/admin/mail-settings/test', {
        method: 'POST',
        body: JSON.stringify({
          ...buildCurrentFormPayload(),
          toEmail: testToEmail.trim()
        })
      });
      if (Array.isArray(data?.recentAttempts)) {
        setRecentAttempts(data.recentAttempts);
      }
      if (res.ok && data?.ok) {
        setTestResult({ type: 'ok', text: data.message || 'Test maili gönderildi.' });
      } else {
        setTestResult({ type: 'error', text: data?.error || 'Test maili gönderilemedi.' });
      }
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Mail Ayarları (Doğru Mail Hosted Exchange SMTP)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Şifre veritabanında AES-256-GCM ile şifreli saklanır ve API cevabında asla geri dönmez.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Quick Provider Buttons (only fills host & port) */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Sağlayıcı Seç (Hızlı Doldur: Sadece Sunucu ve Port)
          </label>
          <div className="flex flex-wrap gap-2">
            {SMTP_PROVIDERS.map((p) => {
              const active =
                smtpHost.trim().toLowerCase() === p.host && Number(smtpPort) === p.port;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label} ({p.host}:{p.port})
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* Sender Email & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-posta Adresi (Gönderen) *
              </label>
              <input
                type="email"
                required
                value={smtpFromAddress}
                onChange={(e) => handleFromAddressChange(e.target.value)}
                placeholder="support@tescom.com.tr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Görünen Ad
              </label>
              <input
                type="text"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
                placeholder="Tescom Fanvil Partner"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kullanıcı Adı (Varsayılan: E-posta adresiyle aynı)
              </label>
              <input
                type="text"
                required
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder={smtpFromAddress || 'support@tescom.com.tr'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Şifre {hasSmtpPassword ? '(Değiştirmek istemiyorsanız boş bırakın)' : '*'}
                </label>
                {hasSmtpPassword && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    •••••••• (kayıtlı)
                  </span>
                )}
              </div>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={hasSmtpPassword ? '••••••••' : 'SMTP şifresini girin'}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* SMTP Server, Port & Auto Security */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMTP Sunucu *
              </label>
              <input
                type="text"
                required
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="mail.dogrumail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Port *
              </label>
              <input
                type="number"
                required
                value={smtpPort}
                onChange={(e) => handlePortChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Güvenlik {isAutoPort ? '(Port\'a Göre Otomatik)' : '(Manuel Seçim)'}
              </label>
              {isAutoPort ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[#0284C7] text-xs font-bold">
                  {numericPort === 465
                    ? '465 → SSL/TLS (secure: true)'
                    : `${numericPort} → STARTTLS (secure: false, requireTLS: true)`}
                </div>
              ) : (
                <select
                  value={smtpSecurity}
                  onChange={(e) => setSmtpSecurity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                >
                  <option value="starttls">STARTTLS (secure: false, requireTLS: true)</option>
                  <option value="tls">SSL/TLS (secure: true)</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {verifyResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold ${
              verifyResult.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {verifyResult.text}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] disabled:opacity-60 text-white text-xs font-extrabold"
          >
            {saving ? 'Kaydediliyor...' : 'Mail Ayarlarını Kaydet'}
          </button>

          <button
            type="button"
            disabled={verifying}
            onClick={handleVerifyConnection}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
          >
            {verifying ? 'Test Ediliyor...' : 'Bağlantıyı Test Et (verify)'}
          </button>
        </div>
      </form>

      {/* Test Mail Card (works with unsaved form values too) */}
      <form
        onSubmit={handleSendTest}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
      >
        <h3 className="text-base font-extrabold text-slate-900">
          Test Maili Gönder
        </h3>
        <p className="text-xs text-slate-500">
          Formdaki değerlerle (Kaydet yapmadan da test edebilirsiniz; şifre alanı boşsa kayıtlı şifre kullanılır) girilen adrese gerçek test maili gönderir.
        </p>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold ${
              testResult.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {testResult.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={testToEmail}
            onChange={(e) => setTestToEmail(e.target.value)}
            placeholder="Test alıcı e-posta adresini girin"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <button
            type="submit"
            disabled={testing}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? 'Gönderiliyor...' : 'Test Maili Gönder'}</span>
          </button>
        </div>
      </form>

      {/* Last 20 Delivery Attempts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Son 20 Gönderim Denemesi
            </h3>
            <p className="text-[11px] text-slate-500">
              Outbox ve test gönderimlerinin zaman, alıcı, sonuç ve hata kodu geçmişi
            </p>
          </div>
          <button
            type="button"
            onClick={loadMailSettings}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-3 px-4">Zaman</th>
                <th className="py-3 px-4">Alıcı</th>
                <th className="py-3 px-4">Sonuç</th>
                <th className="py-3 px-4">Hata Kodu / Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Henüz gönderim denemesi kaydı bulunmuyor.
                  </td>
                </tr>
              ) : (
                recentAttempts.map((a) => (
                  <tr key={a._id}>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {formatDateTR(a.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {a.recipient}
                      {a.refCode && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                          {a.refCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          a.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {a.status === 'sent' ? 'Başarılı ✓' : 'Hata'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-mono font-bold text-[11px] mr-1.5">
                        [{a.errorCode || '-'}]
                      </span>
                      <span>{a.errorMessage || ''}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 6: RECIPIENTS MANAGEMENT
// ===========================================================================
function RecipientsView() {
  const [items, setItems] = useState([]);
  const [senderAddress, setSenderAddress] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestTypes, setRequestTypes] = useState([]);
  const [error, setError] = useState('');

  const loadRecipients = useCallback(async () => {
    const { res, data } = await apiFetch('/api/admin/recipients');
    if (res.ok && data?.ok) {
      setItems(data.items || []);
      if (data.senderAddress) {
        setSenderAddress(String(data.senderAddress).toLowerCase());
      }
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const toggleType = (t) => {
    setRequestTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const candidateEmail = email.trim().toLowerCase();

    if (
      candidateEmail.startsWith('support@') ||
      (senderAddress && candidateEmail === senderAddress)
    ) {
      setError('Bu adres ticket sistemi tarafından okunuyor; her lead için ticket açılır.');
      return;
    }

    const { res, data } = await apiFetch('/api/admin/recipients', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        active: true,
        requestTypes
      })
    });
    if (!res.ok || !data?.ok) {
      setError(data?.error || 'Alıcı eklenemedi.');
      return;
    }
    setName('');
    setEmail('');
    setRequestTypes([]);
    loadRecipients();
  };

  const handleToggleActive = async (item) => {
    await apiFetch(`/api/admin/recipients/${item._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !item.active })
    });
    loadRecipients();
  };

  const handleDelete = async (id) => {
    await apiFetch(`/api/admin/recipients/${id}`, { method: 'DELETE' });
    loadRecipients();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Lead Bildirim Alıcıları
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Yeni lead geldiğinde bildirim e-postası alacak kişileri ve hangi talep tiplerini alacaklarını yönetin.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
      >
        <h3 className="text-sm font-extrabold text-slate-900">Yeni Alıcı Ekle</h3>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad / Departman (Örn: Satış Ekibi)"
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@tescom.com.tr"
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">
            Hangi Talep Tiplerinde Mail Alsın? (Hiçbiri seçilmezse TÜMÜNÜ alır)
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REQUEST_TYPE_LABELS).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleType(id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                  requestTypes.includes(id)
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#E60012] text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Alıcıyı Ekle</span>
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <th className="py-3 px-4">Ad / E-Posta</th>
              <th className="py-3 px-4">Filtre</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Henüz alıcı eklenmemiş.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-slate-500">{item.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {!item.requestTypes || item.requestTypes.length === 0
                      ? 'Tüm Talepler'
                      : item.requestTypes
                          .map((t) => REQUEST_TYPE_LABELS[t] || t)
                          .join(', ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        item.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.active ? 'Aktif ✓' : 'Pasif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 7: ALLOWED IPS MANAGEMENT
// ===========================================================================
function AllowedIpsView({ currentIp }) {
  const [items, setItems] = useState([]);
  const [detectedIp, setDetectedIp] = useState(currentIp);
  const [ipInput, setIpInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [error, setError] = useState('');

  const loadIps = useCallback(async () => {
    const { res, data } = await apiFetch('/api/admin/allowed-ips');
    if (res.ok && data?.ok) {
      setItems(data.items || []);
      if (data.currentIp) setDetectedIp(data.currentIp);
    }
  }, []);

  useEffect(() => {
    loadIps();
  }, [loadIps]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const { res, data } = await apiFetch('/api/admin/allowed-ips', {
      method: 'POST',
      body: JSON.stringify({ ip: ipInput.trim(), note: noteInput.trim() })
    });
    if (!res.ok || !data?.ok) {
      setError(data?.error || 'IP eklenemedi.');
      return;
    }
    setIpInput('');
    setNoteInput('');
    loadIps();
  };

  const handleDelete = async (id) => {
    await apiFetch(`/api/admin/allowed-ips/${id}`, { method: 'DELETE' });
    loadIps();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            İzinli IP Listesi (Allowlist)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bu listede olmayan IP'lere <code>/admin</code> ve <code>/api/admin/*</code> yolları 404 döner.
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-bold text-[#0284C7]">
          Şu anki IP'm: <strong>{detectedIp}</strong>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
      >
        <h3 className="text-sm font-extrabold text-slate-900">
          Yeni İzinli IP veya CIDR Ekle
        </h3>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="IPv4, IPv6 veya CIDR (Örn: 195.175.x.x veya 10.0.0.0/24)"
            className="sm:col-span-5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Açıklama (Örn: Merkez Ofis Statik IP)"
            className="sm:col-span-5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <button
            type="submit"
            className="sm:col-span-2 py-2.5 px-4 rounded-xl bg-[#E60012] text-white text-xs font-bold"
          >
            IP Ekle
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <th className="py-3 px-4">IP / CIDR</th>
              <th className="py-3 px-4">Açıklama</th>
              <th className="py-3 px-4">Ekleyen</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item._id}>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  {item.ip}
                </td>
                <td className="py-3.5 px-4">
                  {item.isSystem ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                      sistem IP'si (silinemez)
                    </span>
                  ) : (
                    item.note || '-'
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-500">{item.createdBy}</td>
                <td className="py-3.5 px-4 text-right">
                  {!item.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 8: ADMIN USERS & PASSWORD CHANGE
// ===========================================================================
function AdminUsersView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [userError, setUserError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState(null);

  const loadUsers = useCallback(async () => {
    const { res, data } = await apiFetch('/api/admin/users');
    if (res.ok && data?.ok) {
      setUsers(data.items || []);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    const { res, data } = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password, role })
    });
    if (!res.ok || !data?.ok) {
      setUserError(data?.error || 'Kullanıcı eklenemedi.');
      return;
    }
    setUsername('');
    setPassword('');
    loadUsers();
  };

  const handleDeleteUser = async (id) => {
    setUserError('');
    const { res, data } = await apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok || !data?.ok) {
      setUserError(data?.error || 'Kullanıcı silinemedi.');
      return;
    }
    loadUsers();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    const { res, data } = await apiFetch('/api/admin/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok || !data?.ok) {
      setPwMsg({ type: 'error', text: data?.error || 'Şifre güncellenemedi.' });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPwMsg({ type: 'ok', text: data.message || 'Şifreniz güncellendi.' });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Panel Kullanıcıları &amp; Şifre Yönetimi
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Şifreler en az 12 karakter olmalı ve bcrypt (cost 12) ile hashlenir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New User */}
        <form
          onSubmit={handleCreateUser}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-extrabold text-slate-900">
            Yeni Panel Kullanıcısı Ekle
          </h3>
          {userError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {userError}
            </div>
          )}
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adı"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <input
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre (en az 12 karakter)"
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          >
            <option value="admin">Yönetici (admin - tüm yetkiler)</option>
            <option value="viewer">İzleyici (viewer - sadece lead görüntüleme)</option>
          </select>
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#E60012] text-white text-xs font-bold"
          >
            Kullanıcı Oluştur
          </button>
        </form>

        {/* Change Own Password */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-[#E60012]" />
            <span>Kendi Şifremi Değiştir ({currentUser.username})</span>
          </h3>
          {pwMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                pwMsg.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {pwMsg.text}
            </div>
          )}
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mevcut şifreniz"
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <input
            type="password"
            required
            minLength={12}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifreniz (en az 12 karakter)"
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
          >
            Şifremi Güncelle
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <th className="py-3 px-4">Kullanıcı Adı</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Son Giriş</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {u.username}{' '}
                  {String(u._id) === String(currentUser.id) && (
                    <span className="text-[10px] text-emerald-600">(Siz)</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-red-50 text-[#E60012]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {u.lastLoginAt
                    ? `${formatDateTR(u.lastLoginAt)} (${u.lastLoginIp || '-'})`
                    : 'Henüz giriş yapmadı'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {String(u._id) !== String(currentUser.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Kullanıcıyı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// SCREEN 9: AUDIT LOGS VIEW
// ===========================================================================
function AuditLogsView() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async (targetPage = page) => {
    const { res, data } = await apiFetch(`/api/admin/audit-logs?page=${targetPage}`);
    if (res.ok && data?.ok) {
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || targetPage);
    }
  }, [page]);

  useEffect(() => {
    loadLogs(page);
  }, [loadLogs, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Güvenlik ve İşlem Kayıtları (Audit Logs)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Giriş denemeleri, IP değişiklikleri, mail ayarları, kullanıcı işlemleri ve CSV dışa aktarmaları.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <th className="py-3 px-4">Zaman</th>
              <th className="py-3 px-4">Kullanıcı</th>
              <th className="py-3 px-4">İşlem</th>
              <th className="py-3 px-4">Detay</th>
              <th className="py-3 px-4">IP Adresi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((log) => (
              <tr key={log._id}>
                <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                  {formatDateTR(log.createdAt)}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{log.actor}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">{log.details}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40 font-bold"
          >
            Önceki
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40 font-bold"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}

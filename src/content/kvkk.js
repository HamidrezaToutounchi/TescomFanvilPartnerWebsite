export const KVKK_VERSION = 'v1';
export const KVKK_UPDATED = '03.11.2026';
export const MERSIS = '';

export const LEAD_RETENTION_PERIOD = '2 (iki) yıl';
export const SECURITY_LOG_RETENTION_PERIOD = '1 (bir) yıl';

export const COMPANY = {
  title: 'TESCOM TELEKOMÜNİKASYON VE İLETİŞİM HİZ. SAN. TİC. LTD. ŞTİ.',
  legalName:
    'Tescom Telekomünikasyon ve İletişim Hizmetleri Sanayi Ticaret Limited Şirketi ("Tescom")',
  address:
    'Barbaros Hayrettin Paşa Mah. Şehitler Cad. Gümüş Residence No: 8 Daire: 323 Esenyurt / İSTANBUL',
  phones: [
    { display: '0850 850 18 81 (+90 850 850 18 81)', href: 'tel:+908508501881' }
  ],
  kep: 'tescomtelekom@hs03.kep.tr',
  email: 'destek@tescom.com.tr',
  mersis: MERSIS
};

export const KVKK_CONTENT = {
  heading: 'KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ',
  metaLine: `Son güncelleme: ${KVKK_UPDATED} – Sürüm ${KVKK_VERSION}`,
  sections: [
    {
      id: 1,
      title: '1. Veri Sorumlusu',
      intro: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") uyarınca, fanvilpartner.com internet sitesi üzerinden toplanan kişisel verileriniz, veri sorumlusu sıfatıyla ${COMPANY.legalName} tarafından aşağıda açıklanan kapsamda işlenmektedir.`,
      isDataControllerSection: true
    },
    {
      id: 2,
      title: '2. İşlenen Kişisel Veriler',
      bullets: [
        'Kimlik ve iletişim: ad soyad, kurumsal e-posta adresi, telefon numarası',
        'Kurum bilgisi: firma / kurum adı',
        'Talep bilgisi: talep türü, ilgilenilen ürün ve adetler, santral (PBX) bilgisi, proje adı, mesaj içeriği',
        'İşlem güvenliği: IP adresi, tarayıcı bilgisi (user-agent), işlem tarihi ve saati, bot doğrulama sonucu',
        'Onay kayıtları: aydınlatma metninin görüntülendiği ve varsa ticari ileti onayının verildiği tarih ve sürüm bilgisi'
      ]
    },
    {
      id: 3,
      title: '3. Kişisel Verilerin İşlenme Amaçları',
      bullets: [
        'Bilgi, fiyat teklifi, proje kaydı, bayilik ve demo taleplerinizin alınması, değerlendirilmesi ve size dönüş yapılması',
        'Satış öncesi ve satış sonrası teknik destek süreçlerinin yürütülmesi',
        'Talep ve teklif süreçlerinin kayıt altına alınması ve takibi',
        'İnternet sitesinin ve form altyapısının güvenliğinin sağlanması, otomatik (bot) ve kötü niyetli kullanımın engellenmesi',
        'Hukuki yükümlülüklerin yerine getirilmesi ve olası uyuşmazlıklarda delil olarak kullanılması',
        'Yalnızca ayrıca onay vermeniz halinde: ürün, kampanya ve duyurular hakkında ticari elektronik ileti gönderilmesi'
      ]
    },
    {
      id: 4,
      title: '4. Toplama Yöntemi ve Hukuki Sebepler',
      intro:
        "Kişisel verileriniz, internet sitemizdeki talep formu aracılığıyla elektronik ortamda, otomatik yollarla toplanmaktadır. Verileriniz Kanun'un 5. maddesinin 2. fıkrasında yer alan;",
      bullets: [
        '(c) bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması kaydıyla sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması,',
        '(ç) veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması,',
        '(e) bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması,',
        '(f) ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması'
      ],
      outro:
        'hukuki sebeplerine dayanılarak işlenmektedir. Ticari elektronik ileti gönderimi ise yalnızca 6563 sayılı Kanun kapsamında vereceğiniz onaya dayanır ve bu onay isteğe bağlıdır.'
    },
    {
      id: 5,
      title: '5. Kişisel Verilerin Aktarılması',
      intro: 'Kişisel verileriniz yukarıdaki amaçlarla sınırlı olarak;',
      bullets: [
        'talebinizin karşılanması için Tescom bünyesindeki yetkili satış ve teknik destek çalışanlarına,',
        'hizmet aldığımız e-posta altyapı sağlayıcısına (yurt içi),',
        "form güvenliği ve bot koruması amacıyla Cloudflare, Inc.'e (ABD) yalnızca teknik doğrulama verisi (IP adresi, tarayıcı bilgisi),",
        'talep halinde yetkili kamu kurum ve kuruluşlarına'
      ],
      outro:
        "aktarılabilecektir. Yurt dışına yapılan aktarımlar Kanun'un 9. maddesinde öngörülen usul ve güvencelere uygun olarak gerçekleştirilir."
      // [HUKUK BİRİMİ KARARI: Lead bilgileri Fanvil üreticisi veya distribütörü ile paylaşılıyorsa buraya eklenmeli; paylaşılmıyorsa bu satır silinmeli.]
    },
    {
      id: 6,
      title: '6. Saklama Süresi',
      intro: `Form aracılığıyla iletilen veriler, talebinizin sonuçlanmasından itibaren ${LEAD_RETENTION_PERIOD}; ticari ilişki kurulması halinde ilgili mevzuatta öngörülen süreler boyunca saklanır. IP adresi ve tarayıcı bilgisi gibi işlem güvenliği verileri ${SECURITY_LOG_RETENTION_PERIOD} süreyle saklanır. Süre sonunda verileriniz silinir, yok edilir veya anonim hale getirilir. Verileriniz Tescom'un Türkiye'de bulunan sunucularında, erişimi yetkili personelle sınırlandırılmış şekilde tutulur.`
    },
    {
      id: 7,
      title: '7. Çerezler',
      intro:
        'fanvilpartner.com ziyaretçi takibi veya reklam amaçlı çerez kullanmaz. Form güvenliği için Cloudflare Turnstile doğrulaması çalıştırılır; bu doğrulama yalnızca bot tespiti amacıyla kullanılır.'
    },
    {
      id: 8,
      title: "8. Kanun'un 11. Maddesi Kapsamındaki Haklarınız",
      intro: 'Veri sahibi olarak;',
      customList: [
        'a) kişisel verilerinizin işlenip işlenmediğini öğrenme,',
        'b) işlenmişse buna ilişkin bilgi talep etme,',
        'c) işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,',
        'ç) yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
        'd) eksik veya yanlış işlenmişse düzeltilmesini isteme,',
        "e) Kanun'un 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme,",
        'f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,',
        'g) işlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,',
        'ğ) kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme'
      ],
      outro: 'haklarına sahipsiniz.'
    },
    {
      id: 9,
      title: '9. Başvuru Yöntemi',
      intro:
        "Taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak;",
      isApplicationMethodSection: true,
      outro:
        'iletebilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu tarafından belirlenen tarife uygulanabilir.'
    }
  ]
};

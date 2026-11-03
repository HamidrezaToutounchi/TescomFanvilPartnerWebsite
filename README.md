# Fanvil Gold Partner Kurumsal Portal & Yönetim Paneli (`fanvilpartner.com`)

Vite + React ön yüz (`tescom-fanvil-web`), Node 20 + Express + Mongoose + Zod backend API & Admin Paneli (`fanvil-api`) ve izole MongoDB 7 (`fanvil-mongo`) mimarisi.

---

## 1. Ağ ve Doğrudan IP Erişimi Güvenlik Notları

- **8090 Portu ve Doğrudan IP Erişimi:** `8090` portu host üzerinde `0.0.0.0`'a açık kalmamalıdır (`127.0.0.1:8090:80` yapılmalı ya da `tescom-nginx` container adıyla bağlanıyorsa `ports` tamamen kaldırılmalıdır). Bu projede `tescom-nginx`, `tescom-network` üzerinden doğrudan `tescom-fanvil-web:80` adresine ulaştığı için `docker-compose.yml` içinden `ports:` bloğu tamamen kaldırılmıştır.
- **`tescom-nginx` Yapılandırması:** `tescom-nginx`'teki `fanvilpartner.com` server bloğunda `proxy_pass http://tescom-fanvil-web:80;` olmalı; ayrıca `proxy_set_header Host $host;` ve `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` satırları bulunmalıdır.
- **Beklenen Davranış:** Deploy sonrası `http://188.124.10.4:8090` bağlantıyı reddetmeli (Connection refused), yalnızca `https://fanvilpartner.com` açılmalıdır.

---

## 2. Kurulum ve `.env` Ayarları

### Adım 1: `.env` Dosyasını Güncelleyin
`SETTINGS_ENC_KEY` (32 byte = 64 hex karakter) ve `SESSION_SECRET` değerlerini üretmek için `openssl rand -hex 32` komutunu kullanın:

```bash
openssl rand -hex 32
```

Mevcut `.env` dosyanıza yeni değişkenleri (mevcut Mongo şifrelerinize dokunmadan) eklemek için:

```bash
cat << EOF >> ~/TescomFanvilPartnerWebsite/.env

ADMIN_BOOTSTRAP_IPS=188.124.10.58
SESSION_SECRET=$(openssl rand -hex 32)
SETTINGS_ENC_KEY=$(openssl rand -hex 32)
PUBLIC_BASE_URL=https://fanvilpartner.com
EOF
```

### Adım 2: Servisleri Build Edin ve Başlatın
Sadece bu projeyi etkileyecek şekilde repo klasöründe çalıştırın:

```bash
cd ~/TescomFanvilPartnerWebsite
docker compose up -d --build
docker exec tescom-nginx nginx -s reload
```

### Adım 3: İlk Admin Kullanıcısını Oluşturun (CLI)
Admin panelinde dışarıya açık kayıt ekranı yoktur. İlk yöneticiyi terminalden oluşturmak için (şifre ekranda görünmez, en az 12 karakter olmalıdır):

```bash
docker exec -it fanvil-api node scripts/create-admin.js admin
```

---

## 3. Azure App Registration Kurulumu (Microsoft 365 – Graph API Mail Gönderimi)

Exchange Online'da SMTP Basic Auth kapatıldığı için önerilen ve varsayılan gönderim yöntemi **Microsoft 365 – Graph API** modudur. Kurulum adımları:

1. **Entra ID'de App Registration Oluşturun:**
   - Microsoft Entra Admin Center (`entra.microsoft.com`) > **Identity** > **Applications** > **App registrations** > **New registration** adımına gidin.
   - Uygulamaya bir ad verin (örn. `Fanvil-Portal-Mailer`), *Supported account types* olarak **Accounts in this organizational directory only (Single tenant)** seçip kaydedin.
   - Genel bakış (Overview) ekranından **Application (client) ID** ve **Directory (tenant) ID** değerlerini not edin.

2. **Microsoft Graph `Mail.Send` Uygulama İznini Ekleyin:**
   - **API permissions** > **Add a permission** > **Microsoft Graph** > **Application permissions** seçin.
   - Arama kutusuna `Mail.Send` yazıp seçin ve **Add permissions** butonuna tıklayın.

3. **Admin Consent Verin:**
   - API permissions sayfasında **Grant admin consent for [Organizasyon Adı]** butonuna tıklayıp onaylayın (`Status` sütununda yeşil onay işareti görünmelidir).

4. **Client Secret Oluşturun ve Son Kullanma Tarihini Not Edin:**
   - **Certificates & secrets** > **Client secrets** > **New client secret** adımına tıklayın.
   - Açıklama ve süre seçip oluşturun. Oluşan **Value** değerini (Secret ID değil!) ve **Expires** (son kullanma) tarihini hemen kopyalayıp Admin Paneli > **Mail Ayarları** ekranına girin.

5. **ÖNEMLİ — Gönderim Yetkisini Sadece İlgili Mailbox İle Kısıtlayın (Exchange Online PowerShell):**
   - Kısıtlanmazsa `Mail.Send` uygulama izni organizasyondaki tüm şirket mailbox'ları adına gönderim yetkisi verir. Uygulamanın yalnızca gönderici adresiniz (örn. `support@...`) adına mail gönderebilmesi için Exchange Online PowerShell'de şu komutlarla kısıtlayın:
   ```powershell
   Connect-ExchangeOnline

   # 1. Yalnızca ilgili gönderici posta kutusunu içeren bir Mail-Enabled Security Group oluşturun (veya mevcut grubu kullanın)
   # 2. Uygulamayı yalnızca bu gruba kısıtlayın:
   New-ApplicationAccessPolicy `
     -AccessRight RestrictAccess `
     -PolicyScopeGroupId "<sadece-gonderici-mailbox-iceren-security-group-adresi>" `
     -AppId "<Application-Client-ID>" `
     -Description "Fanvil Portal sadece ilgili destek mailbox adina mail gonderebilir"

   # 3. Kısıtlamayı doğrulayın (Gönderici mailbox için 'Granted', diğer mailbox'lar için 'Denied' dönmelidir):
   Test-ApplicationAccessPolicy -Identity "<gonderici-mailbox-adresi>" -AppId "<Application-Client-ID>"
   Test-ApplicationAccessPolicy -Identity "<baska-bir-kullanici-adresi>" -AppId "<Application-Client-ID>"
   ```

---

## 4. Test ve Doğrulama Adımları

1. **Doğrudan IP:8090 Erişiminin Kapandığını Doğrulama:**
   ```bash
   curl -m 5 http://188.124.10.4:8090
   ```
   *(Beklenen: Bağlantı kurulamamalı / `Connection refused`)*

2. **Tanımsız Host Başlığının Engellendiğini Doğrulama (İç Ağdan 444):**
   ```bash
   docker exec tescom-fanvil-web wget -S -O- --header="Host: baska.com" http://127.0.0.1:80/
   ```
   *(Beklenen: Nginx `444` ile bağlantıyı anında kapatır)*

3. **Sahte `X-Forwarded-For` İle Admin Paneline Erişilemediğini Doğrulama (VPN Dışından):**
   ```bash
   curl -i -H "X-Forwarded-For: 188.124.10.58" https://fanvilpartner.com/admin
   curl -i -H "X-Forwarded-For: 188.124.10.58" https://fanvilpartner.com/api/admin/me
   ```
   *(Beklenen: `HTTP/2 404` — sahte başlık yok sayılır ve panelin varlığı gizlenir)*

4. **İzinli IP'den (VPN `188.124.10.58`) Admin Paneline Erişim:**
   - Tarayıcıdan `https://fanvilpartner.com/admin` adresine gidin, CLI ile oluşturduğunuz kullanıcı adı ve şifreyle giriş yapın.

---

## 5. MongoDB Sorgulama ve Otomatik Yedekleme

### Lead'leri Terminalden Görüntüleme (`mongosh`)
```bash
docker exec -it fanvil-mongo mongosh \
  -u fanvil_admin \
  -p 'MONGO_ROOT_PASSWORD_DEGERINIZ' \
  --authenticationDatabase admin \
  fanvil \
  --eval 'db.leads.find().sort({createdAt:-1}).limit(20)'
```

### Gece 03:00 Otomatik Yedekleme (`crontab`) ve Geri Yükleme (`mongorestore`)
`crontab -e` içine eklenecek satır:
```cron
0 3 * * * /home/tescom/TescomFanvilPartnerWebsite/scripts/backup_mongo.sh >> /home/tescom/TescomFanvilPartnerWebsite/backups/backup.log 2>&1
```

Yedekten geri yükleme komutu:
```bash
docker exec -i fanvil-mongo mongorestore \
  --username "fanvil_app" \
  --password "MONGO_APP_PASSWORD_DEGERINIZ" \
  --authenticationDatabase "fanvil" \
  --nsInclude="fanvil.*" \
  --archive \
  --gzip < ./backups/fanvil-YYYY-MM-DD.gz
```

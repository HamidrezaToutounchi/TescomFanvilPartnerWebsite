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

## 3. Mail Gönderim Notları (Doğru Mail SMTP)

- E-posta bildirimleri Admin Paneli > **Mail Ayarları** ekranından yapılandırılan **Doğru Mail SMTP** (`mail.dogrumail.com`, port `587` STARTTLS veya `465` SSL/TLS, `TLSv1.2+`, sertifika doğrulaması aktif) üzerinden gönderilir.
- Kullanıcı adı, şifre ve gönderen adres bilgileri yalnızca yönetim panelinden girilir ve parola veritabanında **AES-256-GCM** ile şifrelenerek saklanır.
- Gönderen adresin kendisi (ticket sistemi tarafından okunan adres) **Alıcılar** listesine eklenemez; her lead için döngüsel ticket açılmasını önlemek amacıyla panelde ve backend'de engellenmiştir.
- **Önemli DNS / Teslimat Notu:** Mailler spama düşer veya bounce olursa `tescom.com.tr` için SPF kaydında Doğru Mail sunucusunun, DKIM'in ve PTR kaydının tanımlı olduğunu kontrol et.

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

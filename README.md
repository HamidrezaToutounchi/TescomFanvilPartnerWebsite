# Fanvil Gold Partner Kurumsal Portal (`fanvilpartner.com`)

Vite + React ön yüz (`tescom-fanvil-web`), Node 20 + Express + Mongoose + Zod backend API (`fanvil-api`) ve izole MongoDB 7 (`fanvil-mongo`) mimarisi.

---

## 1. Kurulum ve Ayağa Kaldırma

### Adım 1: `.env` Dosyasını Oluşturun
Repo kök dizininde `.env.example` dosyasını `.env` olarak kopyalayın ve güçlü parolalar belirleyin (özel karakter kullanacaksanız URL-safe alfanümerik şifreler tercih edin):

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Örnek `.env` içeriği:
```env
MONGO_ROOT_USER=fanvil_admin
MONGO_ROOT_PASSWORD=CokGucluRootSifresi2026
MONGO_APP_USER=fanvil_app
MONGO_APP_PASSWORD=CokGucluAppSifresi2026
MONGO_URI=mongodb://fanvil_app:CokGucluAppSifresi2026@fanvil-mongo:27017/fanvil?authSource=fanvil
```

### Adım 2: Servisleri İnşa Edin ve Başlatın
Sadece bu projeyi etkileyecek şekilde repo klasöründe şu komutu çalıştırın:

```bash
docker compose up -d --build
```

> **Not:** Eğer `tescom-fanvil-web` container'ı yeniden oluşturulduğunda `tescom-nginx` upstream önbelleğini yenilemek gerekirse `docker exec tescom-nginx nginx -s reload` çalıştırabilirsiniz.

---

## 2. Doğrulama ve `curl` ile Test

### Sağlık Kontrolü (`/api/health`)
```bash
curl -i https://fanvilpartner.com/api/health
```
Beklenen çıktı:
```json
{"ok":true,"mongo":"connected"}
```

### Örnek Lead Gönderimi (`POST /api/leads`)
```bash
curl -i -X POST https://fanvilpartner.com/api/leads \
  -H "Content-Type: application/json" \
  -H "Origin: https://fanvilpartner.com" \
  -d '{
    "requestType": "bilgi",
    "fullName": "Ahmet Yılmaz",
    "company": "Örnek Teknoloji A.Ş.",
    "email": "ahmet@ornekteknoloji.com",
    "phone": "+90 532 000 00 00",
    "selectedProduct": "Fanvil V67",
    "quantity": "10 - 50 Adet",
    "pbxSystem": "3CX IP Santral",
    "projectName": "İstanbul Merkez Ofis",
    "message": "Kurumsal fiyat teklifi rica ederiz.",
    "cartSnapshot": [{"model": "Fanvil V67", "qty": 25}],
    "kvkkAccepted": true,
    "website": ""
  }'
```

---

## 3. MongoDB Üzerinden Lead'leri Görüntüleme

Güvenlik gereği dışarıya açık herhangi bir listeleme endpoint'i yoktur. Kaydedilen form taleplerini doğrudan sunucu üzerinden görmek için:

```bash
docker exec -it fanvil-mongo mongosh \
  -u fanvil_admin \
  -p 'MONGO_ROOT_PASSWORD_DEGERINIZ' \
  --authenticationDatabase admin \
  fanvil \
  --eval 'db.leads.find().sort({createdAt:-1}).limit(20)'
```

Uygulama kullanıcısı (`MONGO_APP_USER`) ile sorgulamak isterseniz:
```bash
docker exec -it fanvil-mongo mongosh \
  -u fanvil_app \
  -p 'MONGO_APP_PASSWORD_DEGERINIZ' \
  --authenticationDatabase fanvil \
  fanvil \
  --eval 'db.leads.find().sort({createdAt:-1}).limit(20)'
```

---

## 4. Otomatik Yedekleme (Backup) ve Geri Yükleme (Restore)

### Manuel Yedek Alma
```bash
chmod +x ./scripts/backup_mongo.sh
./scripts/backup_mongo.sh
```
Yedekler `./backups/fanvil-YYYY-MM-DD.gz` olarak kaydedilir ve 14 günden eski yedekler otomatik silinir.

### Her Gece 03:00 İçin Crontab Tanımı
`crontab -e` komutunu çalıştırıp en alta şu satırı ekleyin:
```cron
0 3 * * * /home/tescom/TescomFanvilPartnerWebsite/scripts/backup_mongo.sh >> /home/tescom/TescomFanvilPartnerWebsite/backups/backup.log 2>&1
```

### Yedekten Geri Yükleme (`mongorestore`)
Alınan bir `.gz` yedeğini geri yüklemek için:
```bash
docker exec -i fanvil-mongo mongorestore \
  --username "fanvil_app" \
  --password "MONGO_APP_PASSWORD_DEGERINIZ" \
  --authenticationDatabase "fanvil" \
  --nsInclude="fanvil.*" \
  --archive \
  --gzip < ./backups/fanvil-YYYY-MM-DD.gz
```

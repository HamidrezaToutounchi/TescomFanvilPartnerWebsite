#!/usr/bin/env python3
"""
Fanvil & LINKVIL Resmi Ürün, Görsel ve Datasheet Senkronizasyon Aracı
(fanvilpartner.com - Prompt 3 Otomasyon Scripti)
"""

import json
import os
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "src" / "data" / "fanvil_products.json"
IMAGES_DIR = BASE_DIR / "public" / "images" / "fanvil"


def sync_catalog_images():
    """
    src/data/fanvil_products.json içindeki resmi Fanvil CDN görsellerini
    public/images/fanvil/{id}.png dizinine indirir ve yedekler.
    """
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    if not DATA_FILE.exists():
        print(f"[HATA] {DATA_FILE} bulunamadı.")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"[BİLGİ] Toplam {len(products)} Fanvil/LINKVIL ürün grubu kontrol ediliyor...")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FanvilPartnerSync/1.0"
    }

    for item in products:
        prod_id = item.get("id")
        img_url = item.get("imageUrl")
        if not prod_id or not img_url:
            continue

        ext = os.path.splitext(img_url)[1] or ".png"
        local_path = IMAGES_DIR / f"{prod_id}{ext}"

        try:
            req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(local_path, "wb") as out:
                    out.write(resp.read())
            print(f"[OK] {item['model']} görseli indirildi -> {local_path.name}")
        except Exception as e:
            print(f"[UYARI] {item['model']} ({img_url}) indirilemedi, CDN URL yedek olarak kullanılacak: {e}")

    print("[TAMAMLANDI] Fanvil ürün kataloğu senkronizasyonu tamamlandı.")


if __name__ == "__main__":
    sync_catalog_images()

#!/usr/bin/env bash
set -euo pipefail

# Proje kök dizinini bul
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
BACKUP_DIR="${PROJECT_ROOT}/backups"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[ERROR] .env dosyası bulunamadı: ${ENV_FILE}" >&2
  exit 1
fi

# .env içinden MONGO_APP_USER ve MONGO_APP_PASSWORD değişkenlerini güvenli şekilde oku
MONGO_APP_USER="$(grep -E '^MONGO_APP_USER=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d '\r"'"'")"
MONGO_APP_PASSWORD="$(grep -E '^MONGO_APP_PASSWORD=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d '\r"'"'")"

if [[ -z "${MONGO_APP_USER}" || -z "${MONGO_APP_PASSWORD}" ]]; then
  echo "[ERROR] MONGO_APP_USER veya MONGO_APP_PASSWORD .env içinde tanımlı değil." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

DATE_STAMP="$(date +%F)"
ARCHIVE_PATH="${BACKUP_DIR}/fanvil-${DATE_STAMP}.gz"

docker exec fanvil-mongo mongodump \
  --username "${MONGO_APP_USER}" \
  --password "${MONGO_APP_PASSWORD}" \
  --authenticationDatabase "fanvil" \
  --db "fanvil" \
  --archive \
  --gzip > "${ARCHIVE_PATH}"

chmod 600 "${ARCHIVE_PATH}"
echo "[OK] Yedek alındı: ${ARCHIVE_PATH}"

# 14 günden eski yedekleri temizle
find "${BACKUP_DIR}" -maxdepth 1 -name "fanvil-*.gz" -type f -mtime +14 -delete
echo "[OK] 14 günden eski yedekler temizlendi."

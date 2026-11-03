#!/usr/bin/env node
'use strict';

const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');

const usernameArg = (process.argv[2] || '').trim().toLowerCase();

if (!usernameArg || !/^[a-zA-Z0-9._-]{3,60}$/.test(usernameArg)) {
  console.error(
    'Kullanım: docker exec -it fanvil-api node scripts/create-admin.js <kullanici_adi>'
  );
  console.error('Kullanıcı adı 3-60 karakter olmalı ve sadece harf, rakam, ., _, - içermelidir.');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[HATA] MONGO_URI ortam değişkeni tanımlı değil.');
  process.exit(1);
}

function promptHiddenPassword(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    process.stdout.write(promptText);

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (stringToWrite === '\r\n' || stringToWrite === '\n' || stringToWrite === '\r') {
        rl.output.write(stringToWrite);
      }
    };

    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const password = await promptHiddenPassword(
    `'${usernameArg}' için yeni admin şifresi girin (en az 12 karakter, ekranda görünmez): `
  );

  if (!password || password.length < 12) {
    console.error('[HATA] Şifre en az 12 karakter uzunluğunda olmalıdır.');
    process.exit(1);
  }

  const confirmPassword = await promptHiddenPassword('Şifreyi tekrar girin: ');
  if (password !== confirmPassword) {
    console.error('[HATA] Girilen şifreler eşleşmiyor.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000
  });

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await AdminUser.findOne({ username: usernameArg });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.failedAttempts = 0;
    existing.lockedUntil = null;
    await existing.save();
    console.log(`[BAŞARILI] Mevcut '${usernameArg}' kullanıcısının şifresi güncellendi ve kilidi açıldı (rol: admin).`);
  } else {
    await AdminUser.create({
      username: usernameArg,
      passwordHash,
      role: 'admin',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date()
    });
    console.log(`[BAŞARILI] '${usernameArg}' yönetici (admin) kullanıcısı oluşturuldu.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('[HATA] Admin oluşturulamadı:', err.message);
  process.exit(1);
});

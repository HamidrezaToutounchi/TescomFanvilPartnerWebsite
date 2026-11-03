#!/usr/bin/env node
'use strict';

const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');

const usernameArg = (process.argv[2] || '').trim().toLowerCase();
const passwordArg = process.argv[3] || '';

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

function askTwoHiddenPasswords(firstPrompt, secondPrompt) {
  return new Promise((resolve) => {
    process.stdin.resume();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    let muted = false;
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (!muted) {
        rl.output.write(stringToWrite);
      } else if (
        stringToWrite === '\r\n' ||
        stringToWrite === '\n' ||
        stringToWrite === '\r'
      ) {
        rl.output.write('\n');
      }
    };

    process.stdout.write(firstPrompt);
    muted = true;

    rl.question('', (firstAnswer) => {
      muted = false;
      process.stdout.write(secondPrompt);
      muted = true;

      rl.question('', (secondAnswer) => {
        muted = false;
        rl.close();
        resolve([firstAnswer.trim(), secondAnswer.trim()]);
      });
    });
  });
}

async function main() {
  let password = passwordArg;

  if (!password) {
    const [first, second] = await askTwoHiddenPasswords(
      `'${usernameArg}' için yeni admin şifresi girin (en az 12 karakter, ekranda görünmez): `,
      'Şifreyi tekrar girin: '
    );

    if (!first || first.length < 12) {
      console.error('[HATA] Şifre en az 12 karakter uzunluğunda olmalıdır.');
      process.exit(1);
    }

    if (first !== second) {
      console.error('[HATA] Girilen şifreler eşleşmiyor.');
      process.exit(1);
    }

    password = first;
  } else if (password.length < 12) {
    console.error('[HATA] Şifre en az 12 karakter uzunluğunda olmalıdır.');
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
    existing.passwordChangedAt = new Date();
    await existing.save();
    console.log(
      `[BAŞARILI] Mevcut '${usernameArg}' kullanıcısının şifresi güncellendi ve kilidi açıldı (rol: admin).`
    );
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

#!/usr/bin/env node
// ==========================================================================
// build-www.mjs — Monta a pasta www/ (webDir do Capacitor).
//
// SEM bundler (proibido pelo CLAUDE.md): isto é apenas uma CÓPIA de arquivos
// estáticos (fs.cpSync). Os originais na raiz continuam intactos para o deploy
// do GitHub Pages. Rode antes de `npx cap copy` / `npx cap sync`.
//
// Como os itens mantêm a MESMA estrutura relativa da raiz, os caminhos
// relativos do index.html / manifest.json / sw.js continuam resolvendo.
// ==========================================================================
import { existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

// Itens copiados para www/ (na mesma posição relativa).
const ITEMS = ['index.html', '1.core', '2.assets', 'sw.js', 'manifest.json'];

// Limpa www/ para não deixar arquivos órfãos de builds anteriores.
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

let copied = 0;
for (const item of ITEMS) {
  const src = join(root, item);
  if (!existsSync(src)) {
    console.error(`[build:www] AVISO: "${item}" não encontrado na raiz — pulando.`);
    continue;
  }
  cpSync(src, join(www, item), { recursive: true });
  console.log(`[build:www] copiado: ${item}`);
  copied++;
}

console.log(`[build:www] OK — ${copied} item(ns) copiado(s) para ${www}`);

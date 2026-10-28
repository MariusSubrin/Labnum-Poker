#!/usr/bin/env node
/**
 * Script de vérification automatique des secrets avant commit ou déploiement.
 * Recherche les motifs de clés API sensibles (Supabase service_role, JWT, clés privées, etc.)
 */
import fs from 'fs';
import path from 'path';

const FORBIDDEN_PATTERNS = [
  {
    name: 'Supabase Service Role Key',
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  },
  {
    name: 'Clé privée RSA / OpenSSH',
    regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g
  },
  {
    name: 'Chaîne secrète potentielle Supabase service_role',
    regex: /service_role[a-zA-Z0-9_\-\.]{20,}/gi
  },
  {
    name: 'Fichier .env avec secret réel détecté',
    regex: /VITE_SUPABASE_ANON_KEY=eyJ[A-Za-z0-9_-]{30,}/g
  }
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.supabase',
  'test-results',
  'playwright-report'
]);

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Ignorer certains fichiers binaires ou d'exemple
      if (entry.name.endsWith('.png') || entry.name.endsWith('.ico') || entry.name === '.env.example') {
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.regex.test(content)) {
            violations.push({
              file: fullPath,
              rule: pattern.name
            });
          }
        }
      } catch {
        // Ignorer les fichiers non lisibles en UTF-8
      }
    }
  }
}

console.log('🔍 [Contrôle de sécurité] Analyse des fichiers pour détecter d’éventuels secrets...');
scanDirectory(process.cwd());

if (violations.length > 0) {
  console.error('\n❌ ÉCHEC DU CONTRÔLE DE SÉCURITÉ : Un ou plusieurs secrets potentiels ont été détectés !');
  violations.forEach((v) => {
    console.error(`  - Fichier : ${v.file}`);
    console.error(`    Motif détecté : ${v.rule}`);
  });
  console.error('\n⚠️ Procédure de remédiation :');
  console.error('1. Supprimez immédiatement le secret du fichier concerné.');
  console.error('2. Si ce secret a déjà été commité ou partagé, révoquez-le et renouvelez-le depuis le tableau de bord Supabase.');
  console.error('3. Placez les variables sensibles uniquement dans un fichier .env local non suivi par Git.\n');
  process.exit(1);
} else {
  console.log('✅ [Contrôle de sécurité] Aucun secret exposé détecté. Le dépôt est sain.\n');
  process.exit(0);
}

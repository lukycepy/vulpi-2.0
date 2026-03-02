
import fs from 'fs';
import path from 'path';

interface Feature {
  section: string;
  name: string;
  description: string;
  implementationPercentage: number;
  foundInFiles: string[];
  status: string;
  notes: string;
}

const PROJECT_ROOT = process.cwd();
const FUNKCE_MD_PATH = path.join(PROJECT_ROOT, 'Funkce.md');
const SRC_PATH = path.join(PROJECT_ROOT, 'src');

async function main() {
  console.log('Starting audit...');

  // Clean up old audits
  if (fs.existsSync(path.join(PROJECT_ROOT, 'feature_audit.csv'))) fs.unlinkSync(path.join(PROJECT_ROOT, 'feature_audit.csv'));
  if (fs.existsSync(path.join(PROJECT_ROOT, 'feature_audit_v2.csv'))) fs.unlinkSync(path.join(PROJECT_ROOT, 'feature_audit_v2.csv'));

  // 1. Read and parse Funkce.md
  const features = parseFunkceMd(FUNKCE_MD_PATH);
  console.log(`Found ${features.length} features.`);

  // 2. Scan codebase
  const sourceFiles = await getSourceFiles();
  console.log(`Scanning ${sourceFiles.length} source files...`);

  // 3. Analyze implementation
  for (const feature of features) {
    await analyzeFeature(feature, sourceFiles);
  }

  // 4. Generate CSV
  generateCsv(features);
}

function parseFunkceMd(filePath: string): Feature[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const features: Feature[] = [];
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect section headers (e.g., "**1. Vizuální identita**" or "17. Projektové řízení")
    if ((trimmed.startsWith('**') && trimmed.includes('.')) || /^\d+\./.test(trimmed)) {
      currentSection = trimmed.replace(/\*\*/g, '').trim();
      continue;
    }

  // Detect features (starting with -)
    if (trimmed.startsWith('-')) {
      // Handle cases without colon (e.g. "- Proforma faktura.")
      const firstColonIndex = trimmed.indexOf(':');
      let name, description;

      if (firstColonIndex !== -1) {
        name = trimmed.substring(1, firstColonIndex).trim();
        description = trimmed.substring(firstColonIndex + 1).trim();
      } else {
        name = trimmed.substring(1).trim();
        // Remove trailing dot if present
        if (name.endsWith('.')) {
          name = name.slice(0, -1);
        }
        description = ""; // No description provided
      }
      
      if (name) {
        features.push({
          section: currentSection,
          name,
          description,
          implementationPercentage: 0,
          foundInFiles: [],
          status: 'Neznámý',
          notes: ''
        });
      }
    }
    
    // Detect table rows as features (for Roles table)
    if (trimmed.startsWith('|') && !trimmed.startsWith('| ---') && !trimmed.startsWith('| **Role**')) {
        const parts = trimmed.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 1) {
             // Treat role definition as a feature
             const name = `Role: ${parts[0].replace(/\*\*/g, '')}`; // Remove bold markdown
             const description = parts.length > 2 ? parts[2] : (parts[1] || "");
             
             features.push({
                section: currentSection,
                name,
                description,
                implementationPercentage: 0,
                foundInFiles: [],
                status: 'Neznámý',
                notes: ''
              });
        }
    }
  }
  return features;
}

async function getSourceFiles(): Promise<string[]> {
  // Using glob to find all ts, tsx, js, jsx files in src
  // We need to implement a simple glob since 'glob' package might not be available or we can use the tool?
  // Wait, I am writing a script to run in the environment. I should assume 'glob' is not installed or I should use fs.readdirRecursive.
  // Actually, I can use a simple recursive file search.
  
  const files: string[] = [];
  
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?|css)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }

  scanDir(SRC_PATH);
  return files;
}

async function analyzeFeature(feature: Feature, sourceFiles: string[]) {
  // Heuristic:
  // 1. Search for the exact feature name (case insensitive)
  // 2. Search for keywords from the feature name
  // 3. Search for English translations of common terms
  
  const translations: {[key: string]: string} = {
    'faktura': 'invoice',
    'klient': 'client',
    'uživatel': 'user',
    'nastavení': 'settings',
    'nástěnka': 'dashboard',
    'položka': 'item',
    'sklad': 'inventory',
    'výdaj': 'expense',
    'projekt': 'project',
    'banka': 'bank',
    'dokument': 'document',
    'email': 'email',
    'šablona': 'template',
    'role': 'role',
    'oprávnění': 'permission',
    'přihlášení': 'login',
    'registrace': 'register',
    'heslo': 'password',
    'pdf': 'pdf',
    'logo': 'logo',
    'barva': 'color',
    'téma': 'theme',
    'jazyk': 'language',
    'měna': 'currency',
    'graf': 'chart',
    'export': 'export',
    'import': 'import',
    'slev': 'discount',
    'daň': 'tax',
    'dph': 'vat',
    'účet': 'account',
    'pohyb': 'movement',
    'kategorie': 'category',
    'zisk': 'profit',
    'ztráta': 'loss',
    'příjem': 'revenue',
    'náklad': 'cost',
    'úkol': 'task',
    'čas': 'time',
    'timer': 'timer',
    'stopky': 'stopwatch',
    'kalendář': 'calendar',
    'poznámka': 'note',
    'adresa': 'address',
    'telefon': 'phone',
    'web': 'web',
    'mobil': 'mobile',
    'aplikace': 'app',
    'oznámení': 'notification',
    'notifikace': 'notification_alt', // distinct key needed if dup
    'tisk': 'print',
    'hledání': 'search',
    'filtr': 'filter',
    'řazení': 'sort',
    'stránkování': 'pagination',
    'záloha': 'backup',
    'obnova': 'restore',
    'api': 'api',
    'webhook': 'webhook',
    'integrace': 'integration',
    'zabezpečení': 'security',
    'šifrování': 'encryption',
    'gdpr': 'gdpr',
    'smazat': 'delete',
    'upravit': 'edit',
    'vytvořit': 'create',
    'detail': 'detail',
    'seznam': 'list',
    'tabulka': 'table',
    'grafika': 'graphic',
    'vzhled': 'design',
    'styl': 'style',
    'css': 'css',
    'html': 'html',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'react': 'react',
    'next': 'next',
    'node': 'node',
    'databáze': 'database',
    'server': 'server',
    'cloud': 'cloud',
    'docker': 'docker',
    'test': 'test',
    'chyba': 'error',
    'log': 'log',
    'monitor': 'monitor',
    'analýza': 'analysis',
    'statistika': 'statistic',
    'report': 'report',
    'přehled': 'overview',
    'admin': 'admin',
    'superadmin': 'superadmin',
    'manažer': 'manager',
    'účetní': 'accountant',
    'fakturant': 'invoicer',
    'skladník': 'warehouseman',
    'obchodník': 'salesman',
    'zákazník': 'customer',
    'dodavatel': 'supplier',
    'partner': 'partner',
    'zaměstnanec': 'employee',
    'osoba': 'person',
    'firma': 'company',
    'organizace': 'organization',
    'tým': 'team',
    'skupina': 'group',
    'člen': 'member',
    'úhrada': 'payment',
    'platba': 'payment_alt',
    'splatnost': 'due_date',
    'variabilní': 'variable',
    'symbol': 'symbol',
    'konstantní': 'constant',
    'specifický': 'specific',
    'bankovní': 'bank_alt',
    'účetnictví': 'accounting',
    'pokladna': 'cash_register',
    'hotovost': 'cash',
    'karta': 'card',
    'převod': 'transfer',
    'dobírka': 'cod',
    'zálohový': 'proforma',
    'dobropis': 'credit_note',
    'dodací': 'delivery_note',
    'nabídka': 'offer',
    'objednávka': 'order',
    'smlouva': 'contract',
    'licence': 'license',
    'verze': 'version',
    'aktualizace': 'update',
    'novinka': 'news',
    'pomoc': 'help',
    'podpora': 'support',
    'kontakt': 'contact',
    'faq': 'faq',
    'manuál': 'manual',
    'tutorial': 'tutorial',
    'video': 'video',
    'obrázek': 'image',
    'soubor': 'file',
    'příloha': 'attachment',
    'galerie': 'gallery',
    'avatar': 'avatar',
    'profil': 'profile',
    'odhlásit': 'logout',
    'přihlásit': 'login_alt',
    'registrovat': 'register_alt',
    'zapomenuté': 'forgotten',
    'reset': 'reset',
    'změna': 'change',
    'ověření': 'verification',
    'autorizace': 'authorization',
    'autentizace': 'authentication',
    'token': 'token',
    'session': 'session',
    'cookie': 'cookie',
    'localstorage': 'localstorage',
    'cache': 'cache',
    'výkon': 'performance',
    'rychlost': 'speed',
    'optimalizace': 'optimization',
    'seo': 'seo',
    'meta': 'meta',
    'robots': 'robots',
    'sitemap': 'sitemap',
    'analytics': 'analytics',
    'pixel': 'pixel',
    'tracker': 'tracker',
    'konverze': 'conversion',
    'cíl': 'goal',
    'kampaň': 'campaign',
    'reklama': 'ad',
    'marketing': 'marketing',
    'mailing': 'mailing',
    'newsletter': 'newsletter',
    'sms': 'sms',
    'chat': 'chat',
    'zpráva': 'message',
    'komentář': 'comment',
    'hodnocení': 'rating',
    'recenze': 'review',
    'hvězdičky': 'stars',
    'like': 'like',
    'sdílet': 'share',
    'sociální': 'social',
    'sítě': 'networks',
    'facebook': 'facebook',
    'twitter': 'twitter',
    'linkedin': 'linkedin',
    'instagram': 'instagram',
    'youtube': 'youtube',
    'google': 'google',
    'apple': 'apple',
    'microsoft': 'microsoft',
    'android': 'android',
    'ios': 'ios',
    'windows': 'windows',
    'linux': 'linux',
    'macos': 'macos',
    'chrome': 'chrome',
    'firefox': 'firefox',
    'safari': 'safari',
    'edge': 'edge',
    'opera': 'opera',
    'brave': 'brave',
    'internet': 'internet',
    'explorer': 'explorer',
    'mobilní': 'mobile_alt',
    'desktop': 'desktop',
    'tablet': 'tablet',
    'responzivní': 'responsive',
    'pwa': 'pwa',
    'offline': 'offline',
    'online': 'online',
    'synchronizace': 'sync',
    'historie': 'history',
    'změny': 'changes',
    'changelog': 'changelog',
    'roadmap': 'roadmap',
    'plán': 'plan',
    'budoucnost': 'future',
    'vize': 'vision',
    'mise': 'mission',
    'hodnoty': 'values',
    'kultura': 'culture',
    'lidé': 'people',
    'kariéra': 'career',
    'práce': 'job',
    'volná': 'vacant',
    'místa': 'positions',
    'nábor': 'hiring',
    'pohovor': 'interview',
    'mzda': 'salary',
    'benefity': 'benefits',
    'kancelář': 'office',
    'remote': 'remote',
    'homeoffice': 'homeoffice',
    'spolupráce': 'collaboration',
    'partnerství': 'partnership',
    'investice': 'investment',
    'financování': 'funding',
    'rozpočet': 'budget',
    'náklady': 'costs',
    'výnosy': 'revenues',
    'marže': 'margin',
    'obrat': 'turnover',
    'cashflow': 'cashflow',
    'likvidita': 'liquidity',
    'solventnost': 'solvency',
    'rentabilita': 'profitability',
    'produktivita': 'productivity',
    'efektivita': 'efficiency',
    'kvalita': 'quality',
    'kvantita': 'quantity',
    'termín': 'deadline',
    'datum': 'date',
    'plánovač': 'scheduler',
    'diář': 'diary',
    'poznámky': 'notes',
    'úkoly': 'tasks',
    'projekty': 'projects',
    'týmy': 'teams',
    'klienti': 'clients',
    'dodavatelé': 'suppliers',
    'partneři': 'partners',
    'konkurence': 'competitors',
    'trh': 'market',
    'branže': 'industry',
    'sektor': 'sector',
    'segment': 'segment',
    'cílovka': 'target',
    'persona': 'persona',
    'návštěvník': 'visitor',
    'fanoušek': 'fan',
    'odběratel': 'subscriber',
    'sledující': 'follower',
    'čtenář': 'reader',
    'divák': 'viewer',
    'posluchač': 'listener',
    'hráč': 'player',
    'student': 'student',
    'učitel': 'teacher',
    'lektor': 'lecturer',
    'mentor': 'mentor',
    'kouč': 'coach',
    'poradce': 'advisor',
    'konzultant': 'consultant',
    'expert': 'expert',
    'specialista': 'specialist',
    'profesionál': 'professional',
    'amatér': 'amateur',
    'začátečník': 'beginner',
    'pokročilý': 'advanced',
    'zkušený': 'experienced',
    'mistr': 'master',
    'guru': 'guru',
    'legenda': 'legend',
    'ikona': 'icon',
    'hvězda': 'star',
    'celebrita': 'celebrity',
    'vzor': 'role_model',
    'autorita': 'authority',
    'lídr': 'leader',
    'ředitel': 'director',
    'prezident': 'president',
    'předseda': 'chairman',
    'zakladatel': 'founder',
    'majitel': 'owner',
    'investor': 'investor',
    'akcionář': 'shareholder',
    'společník': 'partner_alt',
    'kolega': 'colleague',
    'spolupracovník': 'collaborator',
    'podřízený': 'subordinate',
    'nadřízený': 'superior',
    'šéf': 'boss',
    'vedoucí': 'head',
    'garant': 'guarantor',
    'koordinátor': 'coordinator',
    'organizátor': 'organizer',
    'moderátor': 'moderator',
    'administrátor': 'administrator',
    'správce': 'admin_alt',
    'operator': 'operator',
    'servis': 'service',
    'údržba': 'maintenance',
    'oprava': 'repair',
    'reklamace': 'complaint',
    'vrácení': 'return',
    'výměna': 'exchange',
    'náhrada': 'compensation',
    'odškodnění': 'indemnity',
    'pokuta': 'fine',
    'penále': 'penalty',
    'úrok': 'interest',
    'poplatek': 'fee',
    'provize': 'commission',
    'odměna': 'reward',
    'bonus': 'bonus',
    'prémie': 'premium',
    'sleva': 'discount_alt',
    'akce': 'action',
    'výprodej': 'sale',
    'poptávka': 'demand',
    'cena': 'price',
    'hodnota': 'value',
    'clo': 'duty',
    'pojištění': 'insurance',
    'doprava': 'transport',
    'poštovné': 'postage',
    'balné': 'packing',
    'skladné': 'storage',
    'montáž': 'assembly',
    'instalace': 'installation',
    'zaškolení': 'training',
    'konzultace': 'consultation',
    'návrh': 'proposal',
    'realizace': 'implementation',
    'testování': 'testing',
    'spuštění': 'launch',
    'provoz': 'operation',
    'rozvoj': 'development',
    'inovace': 'innovation',
    'zlepšení': 'improvement',
    'automatizace': 'automation',
    'digitalizace': 'digitalization',
    'transformace': 'transformation',
    'revoluce': 'revolution',
    'evoluce': 'evolution',
    'pokrok': 'progress',
    'růst': 'growth',
    'expanze': 'expansion',
    'stabilizace': 'stabilization',
    'konsolidace': 'consolidation',
    'restrukturalizace': 'restructuring',
    'sanace': 'rehabilitation',
    'likvidace': 'liquidation',
    'konkurz': 'bankruptcy',
    'insolvence': 'insolvency',
    'bankrot': 'bankruptcy_alt',
    'krach': 'crash',
    'krize': 'crisis',
    'recese': 'recession',
    'deprese': 'depression',
    'inflace': 'inflation',
    'deflace': 'deflation',
    'stagnace': 'stagnation',
    'boom': 'boom',
    'bublina': 'bubble',
    'cyklus': 'cycle',
    'trend': 'trend',
    'vývoj': 'development_alt',
    'předpověď': 'forecast',
    'odhad': 'estimate',
    'strategie': 'strategy',
    'taktika': 'tactics',
    'metodika': 'methodology',
    'proces': 'process',
    'postup': 'procedure',
    'pravidlo': 'rule',
    'zákon': 'law',
    'vyhláška': 'decree',
    'směrnice': 'directive',
    'norma': 'standard',
    'standard': 'standard_alt',
    'certifikát': 'certificate',
    'osvědčení': 'certificate_alt',
    'povolení': 'permit',
    'souhlas': 'consent',
    'dohoda': 'agreement',
    'dodatek': 'addendum',
    'protokol': 'protocol',
    'zápis': 'record',
    'hro': 'hero',
    'patička': 'footer',
    'hlavička': 'header',
    'menu': 'menu',
    'navigace': 'navigation',
    'tlačítko': 'button',
    'formulář': 'form',
    'input': 'input',
    'pole': 'field',
    'checkbox': 'checkbox',
    'radio': 'radio',
    'select': 'select',
    'dropdown': 'dropdown',
    'modal': 'modal',
    'popup': 'popup',
    'tooltip': 'tooltip',
    'alert': 'alert',
    'toast': 'toast',
    'loader': 'loader',
    'spinner': 'spinner',
    'progress': 'progress',
    'slider': 'slider',
    'range': 'range',
    'color': 'color_alt',
    'file': 'file_alt',
    'audio': 'audio',
    'mapa': 'map',
    'panel': 'panel',
    'widget': 'widget',
    'home': 'home',
    'about': 'about',
    'terms': 'terms',
    'privacy': 'privacy',
    'cookies': 'cookies',
    'blog': 'blog',
    'events': 'events',
    'jobs': 'jobs',
    'references': 'references',
    'testimonials': 'testimonials',
    'portfolio': 'portfolio',
    'services': 'services',
    'products': 'products',
    'pricing': 'pricing',
    'checkout': 'checkout',
    'success': 'success',
    '404': '404',
    '500': '500'
  };

  const keywords = feature.name.split(' ').filter(w => w.length > 3); // Filter short words
  let matchCount = 0;
  
  // Helper for recursive check within source files
  const checkFileContentRecursive = (searchStr: string): boolean => {
      for (const file of sourceFiles) {
          try {
              const content = fs.readFileSync(file, 'utf-8');
              if (content.includes(searchStr)) return true;
          } catch (e) {}
      }
      return false;
  };

  // Special checks for specific features
  const specialChecks: {[key: string]: () => boolean} = {
    'Favicon': () => fs.existsSync(path.join(PROJECT_ROOT, 'public', 'favicon.ico')),
    'Web Manifest': () => fs.existsSync(path.join(PROJECT_ROOT, 'public', 'site.webmanifest')) || fs.existsSync(path.join(PROJECT_ROOT, 'public', 'manifest.json')),
    'Android Chrome Icon': () => fs.existsSync(path.join(PROJECT_ROOT, 'public', 'android-chrome-192x192.png')),
    'Dark Mode': () => checkPackageDependency('next-themes') || checkFileContent('src/app/layout.tsx', 'dark'),
    'Prisma': () => checkPackageDependency('@prisma/client'),
    'Docker': () => fs.existsSync(path.join(PROJECT_ROOT, 'Dockerfile')) || fs.existsSync(path.join(PROJECT_ROOT, 'docker-compose.yml')),
    'Redis': () => checkPackageDependency('redis') || checkPackageDependency('ioredis'),
    'PostgreSQL': () => checkFileContent('prisma/schema.prisma', 'provider = "postgresql"'),
    'SQLite': () => checkFileContent('prisma/schema.prisma', 'provider = "sqlite"'),
    'Sentry': () => checkPackageDependency('@sentry/nextjs'),
    'Fio Banka': () => checkFileContentRecursive('fio'),
    'Raiffeisenbank': () => checkFileContentRecursive('raiffeisen'),
    'AirBank': () => checkFileContentRecursive('airbank'),
    'SMTP': () => checkPackageDependency('nodemailer') || checkFileContentRecursive('smtp'),
    'Google Drive': () => checkPackageDependency('googleapis'),
    'Dropbox': () => checkPackageDependency('dropbox'),
    'OneDrive': () => checkPackageDependency('@microsoft/microsoft-graph-client'),
    'PDF': () => checkPackageDependency('@react-pdf/renderer') || checkPackageDependency('jspdf'),
    'Stripe': () => checkPackageDependency('stripe'),
    'GoPay': () => checkFileContentRecursive('gopay'),
    'QR Platba': () => checkPackageDependency('qr-code-styling') || checkPackageDependency('qrcode'),
    'Responzivní Design': () => checkFileContentRecursive('md:') || checkFileContentRecursive('lg:'),
    'Toast Notifications': () => checkPackageDependency('sonner') || checkPackageDependency('react-hot-toast'),
    'Modální okna': () => checkPackageDependency('@radix-ui/react-dialog'),
    'Tooltips': () => checkPackageDependency('@radix-ui/react-tooltip'),
    'Breadcrumbs': () => checkFileContentRecursive('breadcrumb'),
    'Sidebar': () => checkFileContentRecursive('sidebar'),
    'Bottom Navigation': () => checkFileContentRecursive('bottom-nav') || checkFileContentRecursive('mobile-nav'),
    'Loading Spinner': () => checkFileContentRecursive('spinner') || checkFileContentRecursive('loading'),
    'Error 404 Page': () => fs.existsSync(path.join(SRC_PATH, 'app', 'not-found.tsx')),
    'Superadmin': () => checkFileContentRecursive('superadmin') || checkFileContentRecursive('SUPERADMIN'),
  };

  if (specialChecks[feature.name]) {
    if (specialChecks[feature.name]()) {
      matchCount += 20; // High confidence for explicit check
      feature.foundInFiles.push('(System/Config Check)');
    }
  }

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase();
    const nameLower = feature.name.toLowerCase();
    
    // Check for exact name match (high confidence)
    if (content.includes(nameLower)) {
      matchCount += 5;
      feature.foundInFiles.push(path.basename(file));
    }
    
    // Check for keywords
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove punctuation
      if (lowerKeyword.length < 3) continue;

      if (content.includes(lowerKeyword)) {
        matchCount += 1;
      }
      
      // Check translation
      if (translations[lowerKeyword] && content.includes(translations[lowerKeyword])) {
        matchCount += 2; // Higher weight for translation match
        if (!feature.foundInFiles.includes(path.basename(file))) {
             // Only add file if it's a significant match (simplified here, just adding mostly to show presence)
             // feature.foundInFiles.push(path.basename(file));
        }
      }
    }
  }

  // Calculate percentage
  // Arbitrary logic: 
  // > 15 matches => 100%
  // > 8 matches => 80%
  // > 4 matches => 50%
  // > 0 matches => 20%
  // 0 matches => 0%
  
  if (matchCount > 15) feature.implementationPercentage = 100;
  else if (matchCount > 8) feature.implementationPercentage = 80;
  else if (matchCount > 4) feature.implementationPercentage = 50;
  else if (matchCount > 0) feature.implementationPercentage = 20;
  else feature.implementationPercentage = 0;

  // Determine status and notes
  if (feature.implementationPercentage === 100) {
    feature.status = 'Implementováno';
    feature.notes = 'Funkce nalezena v kódu s vysokou jistotou.';
  } else if (feature.implementationPercentage >= 50) {
    feature.status = 'Částečně implementováno';
    feature.notes = 'Nalezeny zmínky v kódu, ale možná chybí kompletní logika.';
  } else if (feature.implementationPercentage > 0) {
    feature.status = 'Rozpracováno / Zmíněno';
    feature.notes = 'Nalezeny pouze ojedinělé výskyty klíčových slov.';
  } else {
    feature.status = 'Nenalezeno';
    feature.notes = 'V kódu nebyly nalezeny žádné přímé reference ani klíčová slova.';
  }
}

function generateCsv(features: Feature[]) {
  const header = 'Sekce,Název funkce,Popis,Stav,Implementace (%),Poznámky,Nalezeno v souborech\n';
  const rows = features.map(f => {
    const cleanName = f.name.replace(/"/g, '""');
    const cleanDesc = f.description.replace(/"/g, '""');
    const cleanNotes = f.notes.replace(/"/g, '""');
    const cleanFiles = f.foundInFiles.slice(0, 5).join('; '); // Limit to 5 files
    return `"${f.section}","${cleanName}","${cleanDesc}","${f.status}",${f.implementationPercentage},"${cleanNotes}","${cleanFiles}"`;
  });
  
  const csvContent = header + rows.join('\n');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'feature_audit_final.csv'), csvContent);
  console.log('CSV generated: feature_audit_final.csv');
}

// Helper functions for special checks
function checkPackageDependency(depName: string): boolean {
  try {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return (pkg.dependencies && pkg.dependencies[depName]) || (pkg.devDependencies && pkg.devDependencies[depName]);
  } catch (e) {
    return false;
  }
}

function checkFileContent(relativePath: string, searchStr: string): boolean {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content.includes(searchStr);
  } catch (e) {
    return false;
  }
}

function checkFileContentRecursive(dirName: string, searchStr: string): boolean {
    // We can use the sourceFiles list but we need to pass it or access it.
    // Since this is called from within analyzeFeature where we have sourceFiles, 
    // let's change the signature or usage. 
    // But for simplicity, let's just use a simple synchronous walk or grep here?
    // No, that's slow.
    // Let's rely on the main loop for general keywords, but for specialChecks we want a boolean NOW.
    // So let's iterate sourceFiles. Ideally we should pass sourceFiles to this function.
    return false; // Placeholder, see below implementation in analyzeFeature
}

main().catch(console.error);

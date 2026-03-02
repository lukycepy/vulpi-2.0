**FUNKČNÍ SPECIFIKACE SYSTÉMU VULPI**

**1\. Vizuální identita a Web (Frontend & UX)**

- Hlavní logo: Implementace zaslaného loga lišky v hlavičce.
- Favicon: Ikona hlavy lišky pro karty prohlížeče.
- Android Chrome Icon: Ikona pro mobilní zařízení Android.
- Web Manifest: Definice PWA (Progressive Web App).
- Brand Barva 1: Oranžová z loga jako primární akční barva.
- Brand Barva 2: Tmavě modrá z loga pro navigaci a pozadí.
- Brand Barva 3: Světle modrá (oči lišky) pro linky a highlighty.
- Dark Mode: Kompletní tmavé téma systému.
- Light Mode: Standardní světlé téma.
- Systémové přepínání: Automatická změna režimu podle OS.
- Custom Font: Moderní bezpatkové písmo (např. Inter) pro čitelnost.
- Skeleton Loaders: Animované šedé bloky během načítání dat.
- Toast Notifications: Vyskakovací bubliny pro potvrzení akcí.
- Modální okna: Pop-upy pro rychlé zadávání dat bez reloadu.
- Tooltips: Nápovědy při najetí myší na odborné termíny.
- Breadcrumbs: Cesta uživatele (např. Nástěnka > Faktury > Detail).
- Responzivní Design: Plná podpora pro mobily a tablety.
- Sidebar: Výsuvné boční menu pro desktop.
- Bottom Navigation: Spodní lišta pro mobilní verzi.
- Empty States: Hezká grafika s liškou, když nejsou žádná data.
- Error 404 Page: Vlastní stránka s motivem "Liška nenašla cestu".
- Loading Spinner: Vlastní animace běžící lišky při dlouhých operacích.
- Hover efekty: Jemné animace na tlačítkách a kartách.
- Drag-and-drop: Možnost měnit pořadí položek na faktuře tažením.
- Infinite Scroll: Nekonečné scrollování v seznamech faktur.
- Sticky Header: Hlavička tabulky, která zůstává nahoře.
- Copy-to-clipboard: Tlačítko pro rychlé zkopírování IČO nebo VS.
- Print CSS: Speciální styly pro čistý tisk z prohlížeče.
- Animované grafy: Plynulé vykreslování finančních statistik.

**2\. Správa faktur (Jádro systému)**

- Generování PDF: Tvorba profesionálních dokumentů.
- Číslování faktur: Nastavitelná maska různých formátů (např. 2024001, F26-01 apod).
- Více číselných řad: Zvlášť pro různé činnosti/firmy.
- Datum vystavení: Automatické předvyplnění dnešního data.
- Datum splatnosti: Výpočet dle preferovaného počtu dní.
- DUZP: Datum uskutečnění zdanitelného plnění u platcu daní.
- Položkový systém: Přidávání nekonečného množství řádků.
- Jednotky: Kusy, hodiny, dny, metry, paušál.
- Cena za jednotku: Zadávání v libovolné měně.
- Výpočet celkem: Automatické sčítání položek v reálném čase.
- Slevy na položku: Možnost zadat % slevu u konkrétního řádku.
- Celková sleva: Procentuální sleva na celý doklad.
- QR Platba: Automatické generování kódu pro mobilní bankovnictví.
- Razítko a podpis: Nahrání obrázku pro automatické vložení.
- Poznámka pro odběratele: Volné pole pro doplňující text.
- Interní poznámka: Text viditelný pouze pro majitele systému.
- Jazyk faktury: Přepínání mezi Češtinou, Slovenštinou a Angličtinou.
- Měna dokladu: Podpora CZK, EUR, USD, GBP.
- Automatický kurz: Stahování kurzů z ČNB pro přepočet DPH.
- Stav faktury: Rozlišení: Rozpracovaná, Odeslaná, Uhrazená, Storno.
- Duplikace: Vytvoření nové faktury na základě staré.
- Hromadné akce: Označení více faktur jako uhrazené najednou.
- Vyhledávání: Fulltextové hledání v názvech a popisech.
- Filtrování: Podle data, částky, klienta nebo stavu.
- Export PDF: Stažení souboru do počítače.
- Náhled: Instantní zobrazení PDF v prohlížeči.
- Vodoznak: Možnost přidat nápis "NEUHRAZENO" na neplacené faktury.
- Práce s přílohami: Připojení souborů (zadání, protokoly) k faktuře.
- Editace po uložení: Možnost opravy u neuzamčených dokladů.
- Uzamčení dokladu: Ochrana proti nechtěné změně po odeslání.

**3\. Typy dokladů a Daně**

- Faktura - Daňový doklad.
- Proforma faktura.
- Zálohový list.
- Dobropis (Opravný daňový doklad).
- Dodací list.
- Cenová nabídka.
- Převod nabídky: Konverze nabídky na fakturu jedním klikem.
- Podpora neplátce DPH: Skrytí všech polí týkajících se daně.
- Podpora plátce DPH: Nastavení sazeb (21 %, 12 %, 0 %).
- Reverse Charge: Režim přenesené daňové povinnosti.
- OSS (One Stop Shop): Režim pro prodej koncovým uživatelům v EU.
- Členění DPH: Rozpis základu a daně do tabulky v patičce.
- Výpočet DPH zdola: Daň se přičítá k ceně.
- Výpočet DPH shora: Cena je již s daní.
- Identifikovaná osoba: Specifický režim pro nákupy ze zahraničí.
- Souhrnné hlášení: Podklady pro export.
- Kontrolní hlášení: Generování podkladů pro účetní.
- Přiznání k DPH: Pomocná kalkulačka pro kvartální/měsíční plátce.
- Výkaz příjmů: Pro účely paušální daně nebo daňové evidence.
- Roční uzávěrka: Souhrnný export všech dokladů za rok.

**4\. Adresář a CRM (Klienti)**

- Našeptávač IČO: Napojení na registr ARES (automatické vyplnění adresy).
- Validace DIČ: Kontrola platnosti v systému VIES.
- Databáze klientů: Seznam všech odběratelů.
- Historie plateb u klienta.
- Defaultní splatnost: Nastavení individuální splatnosti pro konkrétního klienta.
- Defaultní sleva: Procentuální sleva pro stálé zákazníky.
- Kontaktní osoby: Více e-mailů a telefonů u jedné firmy.
- Export kontaktů: Do formátu CSV.
- Import kontaktů: Nahrání seznamu z Excelu.
- Štítkování: Kategorizace (např. Stavebnictví, IT, Zahraničí).
- Rating klienta: Sledování platební morálky (zelená/oranžová/červená).
- Bankovní účty klienta: Uložení čísel účtů pro případné dobropisy.
- Poštovní adresa: Odlišení sídla firmy a korespondenční adresy.
- Poznámky ke kontaktu: Interní historie komunikace.
- Celkový obrat: Statistiky kolik daný klient u nás utratil.
- Počet neuhrazených faktur: Okamžitý přehled u každého kontaktu.
- Logotyp klienta: Nahrání loga odběratele pro interní přehled.
- GDPR export: Možnost vygenerovat všechna data o klientovi na vyžádání.
- Automatické mazání: Pravidla pro promazávání starých neaktivních kontaktů.

**5\. Automatizace a E-maily (<vulpi@lcepelak.cz>)**

- Odesílání z adresy: Integrace SMTP/API pro <vulpi@lcepelak.cz>.
- Šablona e-mailu: Profesionální HTML šablona s logem Vulpi.
- Dynamické tagy: Automatické vkládání jména klienta a částky do textu.
- Automatická příloha: PDF faktury se přiloží k mailu samo.
- Odkaz na stažení: Bezpečný odkaz v e-mailu pro stažení faktury online.
- Sledování doručení: Stav "Doručeno" u odeslaného mailu.
- Sledování přečtení: Notifikace, že klient fakturu otevřel.
- Automatické upomínky: Odeslání 1. upomínky den po splatnosti.
- Druhá upomínka: Odeslání po 7 dnech prodlení.
- Před-upomínka: Upozornění 2 dny před splatností (přátelské).
- Potvrzení o úhradě: Poděkování klientovi po zaplacení v PDF.
- Pravidelné faktury: Generování faktur automaticky každý měsíc.
- Notifikace pro majitele: E-mail tobě, že klient zaplatil.
- Log komunikace: Historie všech odeslaných mailů u každé faktury.
- Log souborů: Historie všech odeslaných souborů každému klientovi.
- BCC kopie: Skrytá kopie všech mailů na tvůj archivační mail.
- Podpis v mailu: Profesionální patička s tvými údaji.
- Více šablon: Různé texty pro různé typy dokladů.
- Testovací mail: Možnost poslat si náhled e-mailu na sebe.
- Hromadné rozesílání: Odeslání více faktur najednou.

**6\. Bankovnictví a Párování plateb**

- Napojení na Fio Banku: Automatické stahování pohybů. (API)
- Napojení na Raiffeisenbank: Přes Premium API.
- Napojení na AirBank / KB / ČS (mail (SMTP/IMAP integrace).
- Párování podle VS: Automatické označení "Uhrazeno" při shodě variabilního symbolu.
- Párování podle částky: Návrhy na spárování při chybějícím VS.
- Částečné úhrady: Evidence, že klient zaplatil jen polovinu.
- Přeplatky: Sledování peněz navíc od klienta.
- Manuální úhrada: Tlačítko pro ruční zadání platby (např. hotovost).
- Pokladní deník: Evidence příjmů a výdajů v hotovosti.
- Import výpisů: Podpora formátů GPC, XML, CSV.
- Notifikace o pohybu: Upozornění na novou příchozí platbu v aplikaci.
- Více bankovních účtů: Možnost volby, který účet se vytiskne na fakturu.

**7\. Náklady a Výdaje**

- Evidence přijatých faktur: Evidence toho, co musíte zaplatit vy.
- OCR vytěžování: Automatické čtení údajů z nahraných účtenek (AI).
- Kategorie výdajů: (Pohonné hmoty, Nájem, Software, Daně).
- Přikládání fotek: Nahrávání účtenek z mobilu.
- Sledování splatnosti výdajů: Aby se nezapomnělo na platbu dodavatelům.
- Export pro přiznání k dani z příjmů.
- Sledování DPH na vstupu: Pro odpočty u plátců.
- Kilometrovník: Evidence jízd pro daňové účely.
- Paušální výdaje: Kalkulačka pro výpočet 60% nebo 40% paušálu.
- Odpisy majetku: Základní evidence dlouhodobého majetku.

**8\. Nástěnka a Statistiky (Analytics)**

- Celkové příjmy za měsíc: Velké číslo v dashboardu.
- Graf cashflow: Porovnání příjmů a výdajů v čase.
- Seznam největších dlužníků.
- Koláčový graf: Podíl jednotlivých klientů na obratu.
- Predikce daní: Odhad, kolik budeš muset doplatit na daních (daň z příjmu, DPH).
- Sledování limitu DPH: Kolik zbývá do 2 miliónů Kč za 12 měsíců.
- Statistiky měn: Kolik peněz je v CZK a kolik v EUR.
- Export reportů: Generování PDF/Excel přehledů pro porady.
- Heatmapa prodejů: Kdy v roce nejvíce fakturuješ.
- Průměrná splatnost: Statistiky, za jak dlouho ti lidé reálně platí.

**9\. Backend a Infrastruktura**

- REST API: Pro propojení s tvými dalšími systémy.
- Webhooky: Notifikace o změnách (faktura uhrazena) pro externí aplikace.
- Docker: Kontejnerizace pro snadný vývoj na localhostu.
- PostgreSQL: Robustní databáze pro finanční data.
- Redis: Caching pro bleskové načítání dashboardu.
- Zálohování: Automatické denní zálohy do cloudu.
- Logování chyb: Sentry integrace pro okamžité hlášení bugů.
- Migrace DB: Verzování databázového schématu.
- Rate Limiting: Ochrana proti zneužití API a brute-force útokům.
- Validace dat: Přísná kontrola všech vstupů (IČO, částky).
- Sanitizace: Ochrana proti XSS a SQL Injection.
- PDF Engine: Stabilní knihovna pro renderování PDF (např. Puppeteer).
- Load Balancer: Připravenost na vysoký provoz.
- Monitoring: Sledování uptime serveru fakturace.lcepelak.cz.

**10\. Bezpečnost a Správa uživatelů**

- Registrace: Vytvoření nového účtu pomocí admina/superadmina.
- Login: Zabezpečené přihlášení.
- 2FA (Dvoufaktorové ověření): Přes Google Authenticator nebo Authy.
- Zapomenuté heslo: Proces obnovy přes e-mail.
- Role: Administrátor vs. Fakturant vs. Účetní (jen pro čtení).
- Audit Log: Záznam o tom, kdo a kdy smazal nebo upravil fakturu.
- Sezení (Sessions): Správa aktivních přihlášení.
- Timeout: Automatické odhlášení při nečinnosti.
- Šifrování: Citlivá data v DB (např. klíče k bankám) šifrovaná AES-256.
- GDPR modul: Možnost smazání celého účtu.

**11\. SaaS a Multi-tenancy (Pro další firmy)**

- Oddělení dat: Každá firma vidí jen své faktury..
- Support Chat: Integrace okna pro technickou podporu nebo komunikaci mezi klientem a firmou, popř mezi uživateli navzájem.

**12\. Dokumenty a Exporty**

- Export pro Pohodu (XML).
- Export pro Money S3.
- Export pro Altus Vario
- Export pro Abra Gen.
- Export do Excelu (XLSX).
- Export do CSV.
- Export do ISDOC (standard pro e-faktury).
- Hromadné stažení PDF v ZIP souboru.
- Roční rekapitulace pro daňové přiznání.
- Přehled pohledávek pro banku.

**13\. UX Detaily a Vychytávky**

- Našeptávání položek: Systém si pamatuje názvy prací, které píšeš často.
- Automatické doplňování ceny: Podle názvu položky.
- Kalkulačka přímo v poli ceny.
- Tlačítko "Zpět" s upozorněním na neuložená data.
- Sidebar s nedávno navštívenými fakturami.
- Widget s kurzem měn v záhlaví.
- Možnost "Přečteno" u notifikací.
- Personalizovaný pozdrav: "Dobré ráno, Lukáši, dnes ti zaplatili 3 klienti."
- Tutorial: Průvodce při prvním spuštění systému.

**14\. Mobilní aplikace / PWA**

- Rychlé skenování: Tlačítko fotoaparátu pro okamžité vyfocení účtenky.
- Sdílení faktury: Přes WhatsApp, Messenger nebo SMS přímo z mobilu.

**15\. Dalších 285 funkcí (Specifické detaily pro rozšíření)**

- Automatické ověření nespolehlivého plátce DPH.
- Podpora pro čárové kódy na produktech.
- Generování QR kódů pro slevové akce.
- Evidence skladových zásob (jednoduchá).
- Rezervační systém propojený s fakturací.
- Modul pro schvalování faktur (pokud má firma více lidí).
- Podpora pro holdingové struktury (více firem pod jedním mailem).
- API integrace na WooCommerce/Shopify.
- Kalkulátor čisté mzdy u OSVČ.
- Sledování nákladů na auto (kniha jízd).
- Možnost vložení vlastního CSS pro vzhled faktury.
- Generování děkovných dopisů pro klienty.

**16\. Pokročilá** správa **položek a Sklad**

- Skladové karty: Evidence zboží s popisem a fotkou.
- Skladové pohyby: Historie (příjemka/výdejka).
- Minimální stav: Upozornění, když zásoby klesnou pod limit.
- Varianty produktů: Velikost, barva, materiál.
- EAN kódy: Podpora skenování a generování čárových kódů.
- Marže: Výpočet zisku u každé položky na faktuře.
- Hmotnost položek: Automatický výpočet celkové váhy pro dopravu.
- Seskupování položek: Tvorba sad (např. "Balíček služeb").
- Synchronizace skladu: Propojení s e-shopem.
- Rezervace: Blokování zboží pro vystavenou cenovou nabídku.
- Sériová čísla: Evidence konkrétních kusů u elektroniky.
- Expirace: Sledování data spotřeby u zboží.
- Kategorie produktů: Stromová struktura pro lepší přehled.
- Dodavatelské ceny: Sledování, za kolik nakupujete vy.
- Inventura: Modul pro kontrolu fyzického stavu skladu.

17\. Projektové řízení a Výkazy (Time Tracking)

- Stopky (Timer): Měření času stráveného na úkolu přímo v liště.
- Hodinové sazby: Různé sazby pro různé typy prací.
- Projekty: Seskupování faktur a nákladů pod jeden projekt.
- Milníky: Fakturace po dokončení určité fáze projektu.
- Výkaz práce: Generování PDF přílohy k faktuře s rozpisem hodin.
- Rozpočet projektu: Sledování čerpání plánovaných financí.
- Úkoly: Jednoduchý To-Do list u každého projektu.
- Kanban nástěnka: Vizualizace stavu projektů.
- Externí spolupracovníci: Evidence nákladů na subdodavatele.
- Ziskovost projektu: Automatický výpočet marže po odečtení nákladů.

18\. Hloubková úprava PDF šablon

- Fonty: Výběr z 10+ profesionálních písem v PDF.
- Barva prvků: Možnost nastavit barvu linek a tabulek dle brandu.
- Pozice loga: Volba (vlevo, na střed, vpravo).
- Velikost písma: Nastavení pro hlavní text a drobný text v patičce.
- Tloušťka čar: Nastavení tloušťky ohraničení tabulek.
- Pozadí PDF: Možnost vložit vlastní "hlavičkový papír" jako podklad.
- Skrýt/Zobrazit: Volba, zda na PDF chcete sloupec "Sleva" nebo "MJ".
- QR kód pozice: Nastavení, kde přesně má být QR platba vytištěna.
- Text v patičce: Víceřádkové pole pro legislativní info o zápisu v registru.
- Stránkování: Automatické "Strana X z Y" u dlouhých faktur.
- Podpisový blok: Nastavitelný popisek pod místem pro podpis.
- Jazykové mutace: Vlastní překlady pro názvy polí (např. "Invoice" -> "Bill").
- Formát datumu: Výběr (DD.MM.YYYY nebo YYYY-MM-DD).
- Oddělovač tisíců: Nastavení (mezera, tečka, čárka).
- CSS editor: Pro experty možnost kompletního přestylování HTML šablony.

19\. AI Funkce a Inteligentní asistent (Liška Vulpi)

- AI Validace: Upozornění na podezřele vysoké nebo nízké částky.
- Predikce příjmů: Odhad obratu na příští kvartál na základě historie.
- Automatické tagování: AI zařadí výdaj do kategorie podle názvu firmy.
- Detekce duplicit: Upozornění na pravděpodobné dvojí vložení stejné faktury.
- Generování popisů: AI pomůže sepsat textaci položky služby.
- Sentiment analýza: Sledování tónu komunikace s klienty.
- Chatbot: Nápověda k ovládání systému integrovaná uvnitř.
- Smart Search: Hledání typu "Ukaž mi všechny nezaplacené faktury od Nováka".
- Anomálie: Detekce neobvyklých výkyvů v nákladech.
- Automatický překlad: AI překlad textů faktury do exotických jazyků.

20\. Klientův portál (Klientská zóna)

- Přihlášení pro klienta: Vlastní přístup k historii svých dokladů.
- Přehled plateb: Klient vidí, co dluží a co už zaplatil.
- Stažení v archivu: Možnost stáhnout všechny faktury nebo jiné soubory (dobropisy, smlouvy, potvrzení apod) za rok v ZIP.
- Aktualizace údajů: Klient může sám změnit svou adresu nebo DIČ.
- Tlačítko podpory: Přímý kontakt na vás z detailu faktury.
- Odmítnutí faktury: Možnost klienta rozporovat položku s komentářem.
- Podepisování online: Integrace jednoduchého digitálního podpisu.
- Tracking: Klient vidí stav zakázky (např. "Ve výrobě", "Odesláno").
- Up-selling widget: Zobrazení nabídky dalších služeb v klientské zóně.
- Branding zóny: Možnost nastavit barvy zóny dle vašeho loga.

21\. Legislativa a Compliance (Právo)

- Archivace dle zákona: Systém garantuje uložení dat po dobu 10 let.
- Protokol o smazání: Potvrzení pro GDPR při výmazu uživatele.
- Kontrola nespolehlivých plátců: Každodenní check v registru plátců DPH.
- Bankovní tajemství: Šifrování komunikace s bankovním API.
- Logování exportů: Kdo a kdy vyexportoval citlivá data.
- Podpora pro exekuce: Označení plateb, které podléhají specifickému režimu.
- Odvodové kalkulačky: Výpočet sociálního a zdravotního pojištění.
- Daňový kalendář: Upozornění na termíny podání přiznání.

22\. Integrace a Ekosystém

- Google Drive: Automatický upload každého PDF do složky.
- Dropbox: Zálohování dokladů do cloudu.
- OneDrive: Integrace pro uživatele Microsoftu.
- Discord Webhook: Pro komunitní projekty.
- Google Calendar: Zápis splatnosti faktur do kalendáře.

23\. E-commerce a Prodejní moduly

- Prodejní formulář: Jednoduchý kód pro vložení na web.
- Upsell po platbě: Přesměrování na děkovnou stránku s nabídkou.
- Omezení platnosti nabídky: Odpočet času v prodejním formuláři.

24\. Reporting a Management

- Porovnání období: Letošní březen vs. Loňský březen.
- Paretovo pravidlo: Analýza 20 % klientů, co dělají 80 % zisku.
- Sledování nákladů na zaměstnance.
- KPI Dashboard: Sledování cílů (např. "Chci tento měsíc fakturovat 100k").
- Export pro banku: Specifický formát pro žádost o úvěr.
- Přehled neuhrazených po splatnosti: "Seznam hanby".
- Statistiky podle regionů: Kde v ČR máte nejvíce zakázek.
- Výpočet čistého zisku: Po odečtení všech nákladů a odhadovaných daní.
- Sledování času stráveného fakturací.
- Generování grafů pro prezentace v PowerPointu.

25\. Administrace a Správa Vulpi

- Možnost zablokovat uživatele (pro SaaS verzi).
- Nastavení globálních oznámení (údržba systému).
- Správa databázových indexů pro zrychlení.
- Testování e-mailových šablon (Sandbox mode).
- Monitoring vytížení serveru v reálném čase.
- Správa API klíčů pro uživatele.
- Nastavení retenční politiky (jak dlouho držet smazaná data).
- Custom CSS pro přihlašovací stránku.
- Možnost "Impersonate": Admin se může podívat do účtu uživatele pro podporu.
- Správa jazykových balíčků pro celé rozhraní.

26\. Specifické funkce pro OSVČ

- Výpočet paušální daně: Je pro mě výhodná?
- Evidence majetku: Odpisy počítače, nábytku atd.
- Knihovna dokumentů a jejich generátor: Smlouvy, NDA, předávací protokoly u klienta.
- Upozornění na limit 2M: Registrace k DPH.
- Upozornění na limit 1M: Pro povinnost vést účetnictví.
- Přehled sociálního pojištění (ČSSZ).
- Přehled zdravotního pojištění (VZP atd.).
- Generování přehledů pro pojišťovny.
- Daňové přiznání (fyzické osoby): Předvyplnění XML.
- Sledování soukromých vs. firemních výdajů.

27\. Pokročilé zabezpečení

- Hardwarové klíče: Podpora Yubikey pro 2FA.
- Detekce útoku: Automatické zablokování po 5 špatných heslech (možnost změnění hesla přes zapomenuté heslo, nebo odblokuje admin/superadmin)
- Session Management: Možnost odhlásit se ze všech ostatních zařízení.
- Logování změn v nastavení bankovního účtu.
- Notifikace o novém přihlášení (z nového prohlížeče).
- Silná politika hesel: Vynucení symbolů a délky (krom hesel které nastaví admin/superadmin přímo v nastavení uživatele v aplikaci).
- Bezpečnostní audit: Export logů pro bezpečnostní kontrolu.

28\. Uživatelská přívětivost (UX)

- Kontextová nápověda
- Custom dashboard: Uživatel si vybere, které grafy uvidí.
- Náhledy obrázků a faktur: Při najetí na ikonu přílohy.
- Barevné štítky: Vizuální odlišení typů faktur.
- Animace přechodů: Plynulé listování mezi měsíci.
- Automatické ukládání (Drafts): Rozpracovaná faktura se neztratí.

29\. Mezinárodní obchod

- Podpora pro ne-evropské daně (Sales Tax v USA).
- Formáty adres: Přizpůsobení dle země (PSČ před/za městem).
- Podpora pro čínské znaky a azbuku v PDF.
- Automatická detekce časového pásma klienta.
- Přepočet na lokální měnu pro účetnictví (např. faktura v USD, ale DPH v CZK).
- Podpora pro IBAN a BIC (SWIFT).
- Nastavení korespondentských bank.
- Dokumentace pro celní správu.
- Podpora pro Incoterms (dodací podmínky).
- Validace poštovních směrovacích čísel (mezinárodně).

30\. Komunikace a Marketing

- Přání k narozeninám: Automatický mail klientovi.
- PF 202X: Hromadné rozesílání novoročenek.
- Newsletter modul: Rozesílání novinek o vašich službách.
- Referral program: "Doporuč nás a získej slevu".
- Sledování prokliku: Kolik lidí kliklo na odkaz v patičce faktury.
- Možnost vložit reklamu/banner do e-mailu s fakturou.

31\. Technické detaily (Development)

- Swagger UI pro API dokumentaci.
- SDK pro PHP/Node.js/Python.
- Verze API v hlavičce (v1, v2).
- GraphQL podpora pro komplexní dotazy.
- Sandbox prostředí pro testování integrací.
- SQL konzole pro admina (pouze pro čtení).
- Monitoring latence databáze.
- Automatické mazání logů starších 30 dnů.
- Podpora pro Microservices architekturu.

32\. Vlastnosti e-mailu (<vulpi@lcepelak.cz>)

- Podpora DKIM: Podpis e-mailu pro vyšší doručitelnost.
- Podpora SPF: Ochrana proti podvržení adresy.
- Vlastní SMTP server: Nezávislost na velkých poskytovatelích.
- Automatické odpovědi (Out of office).
- Filtrování spamu na příchozí adrese.
- Šifrování e-mailů (TLS).
- Unsubscribe link: Pro automatizované e-maily.
- Sledování bounce-rate (vrácených e-mailů).
- Možnost "Reply-to" nastavit jinou adresu než odesílací.

33\. Drobné "Liščí" vychytávky (The Fox Factor)

- Možnost nastavit "Mood" (náladu) faktury (formální vs. přátelská).
- Automatické generování názvů souborů (např. Faktura_Vulpi_Cislo_Klient.pdf).
- Tlačítko "Potřebuji kafe": Odkaz na pauzu/relaxační hudbu.
- Personalizované tipy: "Liška Vulpi radí: Nezapomeňte si odečíst náklady na internet."
- Gamifikace: Odznáčky za včasné placení daní.

34\. Hardware a Tisk

- Možnost tisknout etikety s adresou klienta.
- Tisk poštovních podacích archů (Česká pošta).
- Generování štítků pro Zásilkovnu/PPL.
- Nastavení duplexního tisku v PDF.

35\. Administrativní drobnosti

- Volba prvního dne týdne (Neděle vs. Pondělí).
- Nastavení formátu čísel (1.000,00 vs 1 000.00).
- Výběr časového formátu (12h vs 24h).
- Možnost skrýt nulu u haléřů.
- Nastavení defaultního textu e-mailu a dalších šablon.
- Hromadné nahrávání log klientů.
- Správa vlastních štítků (tagů).
- Export tabulek do PDF.
- Vyhledávání v PDF obsahu všech faktur.
- Možnost připnout (pin) důležité faktury nahoru.

36\. Rozšířená správa uživatelů

- Avatar uživatele
- Sledování poslední aktivity.
- Možnost vynutit změnu hesla každých 90 dní.
- Omezení přihlášení jen v pracovní době.
- Delegování účtu (např. v době dovolené).
- Nastavení notifikací (E-mail vs. Prohlížeč vs. Mobil).
- Podpora pro více profilů (OSVČ + s.r.o.) pod jedním loginem.
- Rychlé přepínání mezi firmami v horní liště.
- Historie přihlášení (IP, zařízení).
- Možnost "Smazat všechna testovací data" jedním klikem.

37\. Pokročilé finanční nástroje

- Kalkulačka DPH (samostatný widget).
- Převodník měn (aktuální i historické kurzy).
- Výpočet úroků z prodlení (automaticky dle zákona).
- Generování příkazů k úhradě pro tvou banku (formát ABO).
- Podpora pro fakturační splátkové kalendáře.
- Sledování "LTV" (Lifetime Value) zákazníka.
- Rozpouštění nákladů do více měsíců.

38\. Uživatelská podpora Vulpi

- Ticketovací systém uvnitř aplikace.
- Znalostní báze (Wiki) s návody.
- Sekce "Často kladené dotazy" (FAQ).
- Logování chyb nahlášených uživatelem.
- Tlačítko "Napište Lukášovi" (přímý kontakt na developera).

39\. Backend Stability & Performance

- Database sharding (pro miliony faktur).
- CDN pro statické soubory (JS, CSS).
- Komprese PDF souborů (pro úsporu místa).
- Automatická optimalizace obrázků (log).
- Lazy loading u velkých tabulek.
- Background jobs (fronty) pro náročné operace.
- Monitorování doručení SMTP serveru.
- Garbage collector pro dočasné soubory.
- Automatické škálování serveru.
- Logování pomalých SQL dotazů.

40\. Poslední detaily pro dokonalost

- Podpora pro emoji v poznámkách.
- Možnost změnit název aplikace (White-label).
- Nastavení favicony dle stavu (např. červená tečka, když je problém).
- Vlastní meta tagy pro SEO landing page.
- OpenGraph tagy pro hezké sdílení na soc. sítích.
- Podpora pro RTL jazyky (Arabština atd.).
- Nastavení citlivosti vyhledávání (Fuzzy search).
- Možnost exportovat celou DB do SQL dumpu (pro uživatele).
- Verze aplikace v patičce (v1.0.0-build-liška).
- Kontrola duplicitních IČO při registraci.
- Nastavení "Maintenance mode" stránky.
- Možnost zapnout "Vánoční režim" (padající sníh).
- Tlačítko "Mám hotovo": Oslavná animace lišky při odeslání 500. faktury!

**41\. Pokročilá správa účtu a Identity**

- Dualita přihlášení: Možnost přihlásit se buď unikátním loginem, nebo e-mailem.
- Globální profil: Propojení uživatelského profilu napříč více firmami pod jedním účtem.
- Správa oprávnění: Detailní tabulka práv (kdo smí mazat, kdo jen vidí, kdo smí exportovat).
- Zabezpečení IP adres: Logování každého přihlášení s geolokací (mapa přístupů).
- Delegování správy: Možnost dočasně předat práva jinému uživateli (např. záskok za nemoc).
- Social Login: Volitelné přihlášení přes Google/GitHub (pro vývojáře).
- Vlastní URL profilu: Např. fakturace.lcepelak.cz/profil/lukas.
- Nastavení notifikačních kanálů: Výběr co chci do mailu, co jako push a co do Slacku.
- Historie hesel: Zákaz používání stejného hesla jako v minulosti.
- Emergency Access: Nastavení "kontaktu pro případ nouze", který získá přístup k datům.

**42\. Specifické nástroje pro IT a Freelancery**

- Markdown podpora: Psaní dlouhých popisů na faktuře pomocí Markdownu.
- API Logging: Přehled všech volání, která na tvůj systém přišla zvenčí.
- Webhooks Debugger: Nástroj pro testování, zda tvé webhooky odcházejí správně.
- Sdílení platebního odkazu: Generování unikátní URL adresy, kterou pošleš klientovi v chatu.
- Export do JSON: Pro programátory, co si chtějí data zpracovat vlastním scriptem.
- Tvorba "Service Level Agreement" (SLA): Generování přílohy k faktuře o dostupnosti služeb.

**43\. Pokročilá finanční logika a Daně**

- Sledování "Net Worth": Celková hodnota tvého podnikání (hotovost + pohledávky - závazky).
- Plánovač rezerv: Automatický výpočet, kolik si máš odložit na daně a pojištění z každé faktury.
- Podpora pro "Barter": Evidence výměnných obchodů bez peněžního toku.
- Podpora pro srážkovou daň: Automatický výpočet u dohod o provedení práce (DPP).
- Evidence darů: Sledování darů, které si můžeš odečíst od základu daně.
- Rozpoznání měny z textu: Pokud nahraješ doklad v PDF, AI pozná, o jakou měnu jde.

**44\. Správa dokumentů a Právo**

- Centrální úložiště smluv: Nahrávání PDF smluv ke každému klientovi.
- Hlídání platnosti smluv: Upozornění, že smlouva s klientem končí za 30 dní.
- Generátor GDPR doložek: Automatické vytvoření textu o zpracování údajů pro fakturu.
- Evidence NDA: Sledování, s kým máš podepsanou mlčenlivost.
- Digitální podpis dokumentů: Integrace s nástroji jako Signi nebo DocuSign. (není povinná)
- Archivace e-mailové komunikace: Uložení historie mailů odeslaných z <vulpi@lcepelak.cz>.
- Právní doložka pro mezinárodní obchod: Automatické doplnění textů dle práva dané země.
- Evidence revizí dokladu: Kdo a co změnil v konceptu faktury před odesláním.
- Generování plných mocí: Šablony pro jednání s úřady.
- Ochrana proti smazání (Legal Hold): Zablokování smazání dat při kontrole z finančáku.

**45\. Uživatelský zážitek (UX) a Personalizace**

- Custom Dashboard Widgets: Uživatel si poskládá plochu jako skládačku.
- Barevná témata pro grafy: Výběr mezi pastelovými, high-contrast nebo brandovými barvami.
- Možnost skrýt citlivá data: Tlačítko "Oko", které rozmaže částky (pokud na dashboard kouká někdo jiný).
- Personalizované zprávy v patičce: "Hezký víkend, přeje tým Vulpi".
- Animované oslavy: Konfety na obrazovce po zaplacení faktury s vysokou částkou.
- Plovoucí tlačítko "Nová faktura": Dostupné odevšad v systému.

**46\. Systémová údržba a Výkon (Backend)**

- Auto-healing databáze: Automatická oprava poškozených indexů.
- Data Residency: Volba, zda data leží na serveru v ČR nebo jinde v EU.
- Minimalizace JS balíků: Pro bleskové načítání na slabém 4G připojení.
- Serverless functions: Pro náročné výpočty PDF bez zatížení hlavního webu.
- Database snapshots: Možnost vrátit se do stavu systému před 1 hodinou.
- Automatické promazávání "Orphaned" souborů: (Logy k smazaným fakturám).
- Versioning API: Zajištění, že tvá appka bude fungovat i po updatu webu.
- Integrace s UptimeRobot: Monitoring, zda fakturace.lcepelak.cz běží.

**47\. Marketing a Růst (SaaS vlastnosti)**

- In-app zprávy: Oznámení o údržbě nebo nových funkcích.
- In-app zprávy: Chat na úrovni uživatel-uživatel, uživatel-účetní, manažer/admin-celá organizace, superadmin - všichni
- Email marketing pro uživatele
- Modul pro nápady (Feedback Loop): Uživatelé vkládají, co jim chybí.

**48\. Poslední detaily pro dokonalost (The Masterpiece)**

- Liščí moudra: Každý týden jeden tip pro efektivnější OSVČ život.
- Detekce "Zapomenuté faktury": Systém pozná, že obvykle fakturuješ 1. v měsíci a teď jsi zapomněl.
- Automatické generování "Shrnutí roku": Hezká infografika pro tvé sociální sítě.
- Hromadná změna splatnosti: Jedním klikem posunout splatnost u všech neuhrazených faktur.
- Upozornění na státní svátky: Abys neposílal faktury v den, kdy nikdo nepracuje.
- Export pro státní kontrolu: Jeden velký soubor se vším, co úřad vyžaduje.
- Sledování indexu inflace: Upozornění, kdy bys měl zdražit své služby.
- Vlastní zvuk při odeslání e-mailu: (Švihnutí ocasem).

**51\. No-Code Nastavení (Vše měnitelné v UI)**

- Visual Template Builder: Drag-and-drop editor pro vzhled faktur bez psaní HTML.
- Custom Field Manager: Možnost přidat vlastní datová pole k fakturám (např. "Číslo projektu") přes UI.
- Email Workflow Editor: Grafické znázornění cesty e-mailu s možností měnit triggery (kdy se co pošle).
- Color Palette Picker: Kompletní změna barev aplikace jedním klikem v nastavení.
- Font Manager: Nahrávání vlastních .woff/.ttf souborů pro systém i PDF přímo v prohlížeči.
- Text Overrides: Tabulka, kde lze přepsat jakýkoli text v aplikaci (např. změnit "Faktura" na "Účet").
- Menu Editor: Možnost skrýt nebo přerovnat položky v bočním menu pro celou firmu.
- Rounding Rules UI: Nastavení zaokrouhlování pro každou měnu zvlášť přes přepínače.
- Dashboard Layout Editor: Uživatel si myší poskládá, které grafy chce vidět a kde.
- Tax Rate Manager: Správa sazeb DPH bez nutnosti zásahu do kódu při změně legislativy.
- Currency Toggle: Zapínání/vypínání měn, které se mají nabízet v roletce.
- SMTP Configurator: Kompletní nastavení e-mailového serveru přes formulář s testem spojení.
- Upload Manager pro Razítka: Správa více verzí podpisů a razítek pro různé uživatele.
- Custom CSS Injector: Okno v nastavení pro vložení vlastních stylů pro pokročilé uživatele.
- Integration Toggle: Zapínání modulů (Sklad, Projekty, Banka) jedním přepínačem.

**52\. Workflow a Schvalovací procesy**

- Status "Ke schválení": Nový mezistav faktury před jejím odesláním.
- Approval Queues: Seznam faktur čekajících na podpis manažera.
- Auto-Assignment: Automatické přiřazení faktury konkrétnímu manažerovi podle částky (pokud je jen jeden manažer, tak jen jemu).
- Threshold Logic: Faktury do 5 000 Kč se schválí automaticky, nad 5 000 Kč vyžadují admina/manažera.
- Multi-level Approval: Nutnost schválení dvěma různými osobami u částek nad 50 tisíc (např. Manažer + Účetní). .
- Reject with Comment: Možnost vrátit fakturu tvůrci k opravě s uvedením důvodu.
- Approval History: Log u každé faktury (Kdo vytvořil, kdo schválil, kdy se odeslalo).
- Scheduled Sending: Faktura se odešle automaticky klientovi až po schválení v nejbližší pracovní den v 8:00.
- Internal Notifications: Push notifikace manažerovi: "Máte 5 faktur ke schválení".
- Batch Approval: Schválení 100 faktur jedním kliknutím po hromadné kontrole.
- Emergency Bypass: Superadmin může schválit fakturu okamžitě bez čekání na workflow.
- Draft Expiry: Automatické upozornění na faktury, které visí v "Konceptu" příliš dlouho.
- Client Visibility Toggle: Nastavení, zda klient vidí fakturu hned, nebo až po "schválení" - nastavuje manažer/admini.
- Conflict Detection: Upozornění, pokud dva lidé schvalují stejný dokument ve stejnou chvíli.
- Workflow Templates: Přednastavené cesty schvalování pro různé typy dokladů.

**53\. Role a Oprávnění (Access Control)**

- Role Cloner: Vytvoření nové role na základě existující (např. "Junior Účetní, Uživatel - základní" apod).
- Time-limited Access: Přístup pro externího auditora, který po 7 dnech automaticky vyprší.
- Department Isolation: Uživatel vidí jen faktury svého oddělení (např. IT vs. Marketing).
- Data Export Restriction: Zákaz stahování dat do Excelu pro určité role.
- Sensitive Data Masking: Role "Skladník" vidí položky, ale nevidí prodejní ceny.
- Audit Log Viewer: Speciální náhled pro Superadmina na aktivitu všech uživatelů.
- Password Reset Force: Superadmin může vynutit změnu hesla u jakéhokoli uživatele.
- Login Impersonation Log: Záznam o tom, kdy se Admin přihlásil pod jiným uživatelem pro support.

| **Role** | **Působnost** | **Klíčové pravomoci** |
| --- | --- | --- |
| **Superadmin** | Celý systém (SaaS) | Správa všech firem, nastavení serveru, tarify, globální aktualizace, přístup k logům všech organizací. |
| **Admin** | Daná organizace | Kompletní správa své firmy, administrace jejích uživatelů, nastavení bankovního spojení, vzhled faktur, schvalování všeho. |
| **Manažer** | Oddělení / Tým | Schvalování faktur vystavených uživateli, přehled o cashflow oddělení, nemůže měnit nastavení firmy. |
| **Uživatel** | Operativa | Vystavování faktur, správa adresáře, zadávání nákladů. Faktury jdou po uložení ke schválení. |
| **Účetní** | Finance | Přístup ke všem dokladům, generování exportů (Pohoda, XML), správa DPH. Nemůže mazat faktury. |
| **Klient** | Klientský portál | Přístup pouze ke svým fakturám, stažení PDF, online platba, správa svých fakturačních údajů. |
| **Skladník** | Logistika | Správa skladových zásob a příjemek. Vidí zboží, ale nemusí vidět marže a citlivá finanční data. |

**54\. Další pokročilé funkce**

- Bulk Organization Import: Pro Superadmina - nahrání 100 firem najednou z CSV.
- Database Backup Download: Možnost pro Admina stáhnout si zálohu svých dat.
- Interactive Walkthroughs: Průvodce, který uživatele provede aplikací (šipky a bubliny).
- Custom Email Footer per User: Každý uživatel může mít v mailu s fakturou svůj podpis.
- Superadmin může měnit vše, včetně pravomocí jednotlivých uživatelů (jedna účetní může dělat i faktury, druhá ne apod.)
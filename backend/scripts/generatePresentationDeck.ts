import fs from 'fs';
import path from 'path';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';

const OUT_DIR = path.resolve(__dirname, '../../');
const PPTX_PATH = path.join(OUT_DIR, 'UniHack_SpecTrace_Presentation.pptx');
const PDF_PATH = path.join(OUT_DIR, 'UniHack_SpecTrace_Presentation.pdf');

// Image paths from uploaded artifacts
const IMG_ENRICHMENT = 'C:/Users/akshay/.gemini/antigravity/brain/614561b1-1c6c-4cc7-ae9b-fc1c96510726/.user_uploaded/media_1787502516881.png';
const IMG_DASHBOARD = 'C:/Users/akshay/.gemini/antigravity/brain/614561b1-1c6c-4cc7-ae9b-fc1c96510726/.user_uploaded/media_1787502554928.png';

// Theme Colors
const C_DARK_BG   = '0A192F';
const C_NAVY      = '003B71';
const C_BLUE      = '0072CE';
const C_CYAN      = '00B4D8';
const C_WHITE     = 'FFFFFF';
const C_LIGHT_BG  = 'F8FAFC';
const C_CARD_BG   = 'F1F5F9';
const C_TEXT_MAIN = '0F172A';
const C_TEXT_MUTED= '475569';
const C_BORDER    = 'CBD5E1';
const C_GREEN     = '10B981';

async function generatePPTX() {
  console.log('[PPTX] Generating 15-slide PowerPoint deck...');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Akshay Khichi';
  pptx.company = 'UniHack 2026';
  pptx.title = 'SpecTrace — AI-Powered Product Intelligence for Industrial Commerce';

  // Helper for Header Banner
  const addHeader = (slide: PptxGenJS.Slide, title: string, category = 'UNILOG | H2S  •  UNIHACK') => {
    // Top bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: C_NAVY } });
    slide.addText(category, { x: 0.8, y: 0.15, w: 5.0, h: 0.3, color: C_CYAN, fontSize: 11, bold: true });
    slide.addText(title, { x: 0.8, y: 0.42, w: 11.5, h: 0.45, color: C_WHITE, fontSize: 18, bold: true });
    // Bottom accent line
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.9, w: '100%', h: 0.05, fill: { color: C_BLUE } });
  };

  // Helper for Footer
  const addFooter = (slide: PptxGenJS.Slide, slideNum: number) => {
    slide.addText('SpecTrace • AI-Powered Product Intelligence for Industrial Commerce', {
      x: 0.8, y: 7.1, w: 10.0, h: 0.3, color: C_TEXT_MUTED, fontSize: 10, italic: true
    });
    slide.addText(`Slide ${slideNum} of 15`, {
      x: 11.5, y: 7.1, w: 1.5, h: 0.3, color: C_TEXT_MUTED, fontSize: 10, align: 'right'
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 1: GUIDELINES
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Submission Guidelines');
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.3, w: 11.7, h: 5.4, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
    slide.addText([
      { text: 'Prototype Submission Requirements\n\n', options: { bold: true, fontSize: 16, color: C_NAVY } },
      { text: '• Template Compliance: ', options: { bold: true, fontSize: 13, color: C_TEXT_MAIN } },
      { text: 'Official UniHack 15-slide template followed strictly for evaluation consistency.\n\n', options: { fontSize: 13, color: C_TEXT_MUTED } },
      { text: '• One Project Per Team: ', options: { bold: true, fontSize: 13, color: C_TEXT_MAIN } },
      { text: 'End-to-end automated industrial catalog enrichment pipeline.\n\n', options: { fontSize: 13, color: C_TEXT_MUTED } },
      { text: '• Feasibility & Implementation: ', options: { bold: true, fontSize: 13, color: C_TEXT_MAIN } },
      { text: 'Fully functional, production-ready prototype capable of dynamic catalog processing.\n\n', options: { fontSize: 13, color: C_TEXT_MUTED } },
      { text: '• Zero Mock Data: ', options: { bold: true, fontSize: 13, color: C_TEXT_MAIN } },
      { text: 'Verified across all 1,000 real catalog input items with 100% completion in 252 canonical delivery columns.', options: { fontSize: 13, color: C_TEXT_MUTED } },
    ], { x: 1.2, y: 1.6, w: 11.0, h: 4.8 });
    addFooter(slide, 1);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 2: TITLE & TEAM DETAILS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C_DARK_BG } });
    // Left decorative bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: '100%', fill: { color: C_CYAN } });
    
    slide.addText('UNILOG | H2S  •  UNIHACK 2026', { x: 1.0, y: 1.2, w: 11.0, h: 0.4, color: C_CYAN, fontSize: 14, bold: true });
    slide.addText('UniHack', { x: 1.0, y: 1.6, w: 11.0, h: 1.3, color: C_WHITE, fontSize: 52, bold: true });
    slide.addText('AI-Powered Product Intelligence for Industrial Commerce', { x: 1.0, y: 2.9, w: 11.0, h: 0.6, color: C_CYAN, fontSize: 22 });
    slide.addText('Automated 8-Stage Catalog Enrichment & 252-Column Enterprise Delivery Pipeline', { x: 1.0, y: 3.5, w: 11.0, h: 0.5, color: '94A3B8', fontSize: 15, italic: true });

    // Team Card
    slide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 4.5, w: 11.3, h: 2.2, fill: { color: '1E293B' }, line: { color: C_BLUE, width: 1.5 } });
    slide.addText('Team Details', { x: 1.4, y: 4.7, w: 10.5, h: 0.4, color: C_WHITE, fontSize: 16, bold: true });
    slide.addText([
      { text: 'a. Team Name: ', options: { bold: true, color: C_CYAN, fontSize: 14 } },
      { text: 'SpecTrace Solutions\n', options: { color: C_WHITE, fontSize: 14 } },
      { text: 'b. Team Leader: ', options: { bold: true, color: C_CYAN, fontSize: 14 } },
      { text: 'Akshay Khichi\n', options: { color: C_WHITE, fontSize: 14 } },
      { text: 'c. Challenge Track: ', options: { bold: true, color: C_CYAN, fontSize: 14 } },
      { text: 'AI-Powered Product Intelligence for Industrial Commerce', options: { color: C_WHITE, fontSize: 14 } },
    ], { x: 1.4, y: 5.2, w: 10.5, h: 1.3 });
    addFooter(slide, 2);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 3: BRIEF ABOUT YOUR SOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Brief About Your Solution');
    
    // 3 Cards
    const cards = [
      {
        title: '1. Intelligent Ingestion & Normalization',
        points: [
          'Ingests cryptic distributor feeds (e.g. "3/8 CPLG BRS 150#").',
          'Cleans unstandardized brand placeholders ("-- Unbranded --").',
          'Applies deterministic regex for UOMs, casing, and fractional units.'
        ]
      },
      {
        title: '2. 3-Tier Taxonomy & 5-Tier Copy Engine',
        points: [
          'Automates Department > Class > Fine taxonomy classification.',
          'Invoice Desc: Strictly <=40 characters, ALL CAPS.',
          'Mobile Desc: 60-80 chars (Brand, Product, Series, MPN).',
          'Generates Short Title, Long Specs, and Marketing Copy.'
        ]
      },
      {
        title: '3. 252-Column Enterprise Compliance',
        points: [
          '100% adherence to Unilog 252 canonical delivery columns.',
          'Disambiguates distributors from true manufacturer brands.',
          'Multi-key round-robin worker pool completed all 1,000 catalog rows with zero column drift in CSV & XLSX.'
        ]
      }
    ];

    cards.forEach((c, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 3.7, h: 5.3, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 3.7, h: 0.7, fill: { color: C_NAVY } });
      slide.addText(c.title, { x: x + 0.15, y: 1.5, w: 3.4, h: 0.5, color: C_WHITE, fontSize: 12, bold: true });
      
      const bullets = c.points.map(p => `• ${p}\n\n`).join('');
      slide.addText(bullets, { x: x + 0.2, y: 2.3, w: 3.3, h: 4.2, color: C_TEXT_MAIN, fontSize: 11 });
    });
    addFooter(slide, 3);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 4: CORE QUESTIONS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Core Questions: Intelligence, Accuracy & Enterprise Scale');

    const sections = [
      {
        q: '1. How does your solution enrich minimal product information?',
        a: '• Multi-Layer Entity Extraction: Parses cryptic part descriptions (dimensions, materials, tolerances) using structured LLM reasoning and regex.\n• True Brand Disambiguation: Solves distributor conflation (extracting "FRIGIDAIRE®" instead of supplier "Appliance Dealers Cooperative").\n• Deep Attribute Extraction: Populates up to 50 structured attribute slots with normalized values and standardized Units of Measure (UOM).'
      },
      {
        q: '2. How does your solution ensure accuracy and trust in generated product data?',
        a: '• Multi-Factor Confidence Scoring: Evaluates data completeness, source coverage, attribute-level confidence, and classpath consistency.\n• Self-Consistency Guardrails: Flags ungrounded attributes or missing manufacturer identities for automated human review queue placement.\n• Deterministic 252-Header Diffing: Guarantees 100% exact match against canonical Unilog headers (0 missing, 0 extra, 0 renamed).'
      },
      {
        q: '3. What makes your solution scalable for enterprise product catalogs?',
        a: '• Multi-Key High-Throughput Engine: Dynamic API pool with independent 15 RPM pacing, automated quota rotation, and zero-loss crash resilience.\n• Row-Index Persistent Caching: NDJSON storage enables instantaneous lookup, interrupted-run recovery, and zero duplicate API consumption.\n• Model-Agnostic Architecture: Scales seamlessly from cloud LLMs (Gemini 3.5 Flash) to private on-premise models for millions of SKUs.'
      }
    ];

    sections.forEach((s, idx) => {
      const y = 1.3 + idx * 1.85;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.7, fill: { color: C_LIGHT_BG }, line: { color: C_BLUE, width: 1 } });
      slide.addText(s.q, { x: 1.0, y: y + 0.1, w: 11.3, h: 0.35, color: C_NAVY, fontSize: 12, bold: true });
      slide.addText(s.a, { x: 1.0, y: y + 0.45, w: 11.3, h: 1.15, color: C_TEXT_MAIN, fontSize: 10.5 });
    });
    addFooter(slide, 4);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 5: OPPORTUNITIES
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Opportunities & Unique Selling Proposition (USP)');

    const opps = [
      {
        label: 'a. How different is it from existing ideas?',
        text: '• Handles Real Catalog Edge-Cases: Solves duplicate MPNs with differing descriptions (e.g. AVM6EV Red vs Green Mini Snips) with row-level independent parsing rather than naive key collisions.\n• Strict 252-Column Compliance: Direct export of production-ready CSV and multi-sheet XLSX formats with zero manual restructuring.\n• Hybrid Engine: Combines exact regex normalization (fractions, UOMs) with generative AI to prevent hallucinated specifications.'
      },
      {
        label: 'b. How will it solve the problem statement?',
        text: '• Full 8-Stage Automation: Bridges the gap between messy distributor feeds and e-commerce buyer searchability.\n• End-to-End Pipeline: Ingestion -> Taxonomy Classification -> Attribute Extraction -> Brand Cleansing -> 5-Tier Description Building -> Dual-Format Export.'
      },
      {
        label: 'c. USP of the Proposed Solution',
        text: '• Zero-Manual Overhead 252-Column Generator with built-in authentic brand disambiguation and multi-key quota load balancing.'
      }
    ];

    opps.forEach((o, idx) => {
      const y = 1.3 + idx * 1.85;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.7, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
      slide.addText(o.label, { x: 1.0, y: y + 0.1, w: 11.3, h: 0.35, color: C_NAVY, fontSize: 13, bold: true });
      slide.addText(o.text, { x: 1.0, y: y + 0.45, w: 11.3, h: 1.15, color: C_TEXT_MAIN, fontSize: 11 });
    });
    addFooter(slide, 5);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 6: LIST OF FEATURES OFFERED
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'List of Features Offered by the Solution');

    const features = [
      ['1. 3-Level Automated Taxonomy', 'Generates Department > Class > Fine taxonomy paths mapping to industrial standards.'],
      ['2. 5-Tier Description Builder', 'Synthesizes Invoice (<=40 chars ALL CAPS), Mobile (60-80 chars), Short, Long, & Marketing copy.'],
      ['3. Technical Attribute & UOM Normalizer', 'Extracts up to 50 structured attribute slots with fractional-to-decimal unit standardization.'],
      ['4. Authentic Brand Disambiguation', 'Extracts genuine manufacturer brand while filtering out supplier/distributor names.'],
      ['5. Multi-Key API Round-Robin Pool', '4-key worker pool with independent 15 RPM throttling and automatic daily quota failover.'],
      ['6. Deterministic 252-Header Validator', 'Guarantees 100% header alignment against canonical Unilog expected output format.'],
      ['7. Self-Consistency Confidence Engine', 'Scores attribute certainty and automatically routes low-confidence items to human review.'],
      ['8. In-Memory Preloaded Cache', 'Preloads 1,000 catalog items into memory for instant millisecond web UI responses.'],
      ['9. Dual-Format Delivery Exporter', 'Exports production-ready CSV and native multi-sheet XLSX spreadsheets.'],
      ['10. Enterprise Review & Governance Portal', 'Full-featured web UI for real-time catalog curation, auditing, and batch exports.']
    ];

    // 2-column grid (5 rows each)
    features.forEach((f, idx) => {
      const col = idx < 5 ? 0 : 1;
      const row = idx % 5;
      const x = 0.8 + col * 6.0;
      const y = 1.3 + row * 1.12;

      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.7, h: 1.02, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
      slide.addText(f[0], { x: x + 0.15, y: y + 0.08, w: 5.4, h: 0.3, color: C_NAVY, fontSize: 11, bold: true });
      slide.addText(f[1], { x: x + 0.15, y: y + 0.38, w: 5.4, h: 0.58, color: C_TEXT_MUTED, fontSize: 9.5 });
    });
    addFooter(slide, 6);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 7: PROCESS FLOW DIAGRAM
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Process Flow & Pipeline Architecture');

    const steps = [
      { step: 'Stage 1', title: 'Raw Ingestion', desc: 'Ingests 6-column distributor feed & assigns row-index persistence.' },
      { step: 'Stage 2', title: 'Brand Disambiguation', desc: 'Cleans placeholders & isolates product brand from distributor.' },
      { step: 'Stage 3', title: 'Multi-Key LLM Engine', desc: 'Extracts 3-level taxonomy, 50 attributes, & 5-tier descriptions.' },
      { step: 'Stage 4', title: 'UOM & Casing Cleansing', desc: 'Enforces Invoice <=40 char ALL CAPS & fraction/UOM regex.' },
      { step: 'Stage 5', title: 'Confidence Scoring', desc: 'Computes quality breakdown; routes low-confidence to review.' },
      { step: 'Stage 6', title: '252-Column Delivery', desc: 'Generates 100% verified 252-header CSV & XLSX deliverables.' }
    ];

    steps.forEach((s, idx) => {
      const x = 0.8 + idx * 1.95;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.0, w: 1.8, h: 3.8, fill: { color: C_LIGHT_BG }, line: { color: C_BLUE, width: 1.5 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 2.0, w: 1.8, h: 0.6, fill: { color: C_NAVY } });
      slide.addText(s.step, { x, y: 2.05, w: 1.8, h: 0.25, color: C_CYAN, fontSize: 10, bold: true, align: 'center' });
      slide.addText(s.title, { x, y: 2.3, w: 1.8, h: 0.25, color: C_WHITE, fontSize: 11, bold: true, align: 'center' });
      slide.addText(s.desc, { x: x + 0.1, y: 2.8, w: 1.6, h: 2.8, color: C_TEXT_MAIN, fontSize: 10.5 });
      
      // Arrow indicator (except last)
      if (idx < 5) {
        slide.addText('➔', { x: x + 1.75, y: 3.5, w: 0.3, h: 0.3, color: C_BLUE, fontSize: 16, bold: true });
      }
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 6.0, w: 11.7, h: 0.8, fill: { color: 'E2E8F0' } });
    slide.addText('End-to-End Execution Result: 1,000 Catalog Items Enriched • 0 Failed • 252 Canonical Headers Verified • Dual CSV/XLSX Export', {
      x: 1.0, y: 6.25, w: 11.3, h: 0.35, color: C_NAVY, fontSize: 12, bold: true, align: 'center'
    });
    addFooter(slide, 7);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 8: WIREFRAMES / MOCK DIAGRAMS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Wireframes & UI Workspace');

    if (fs.existsSync(IMG_DASHBOARD)) {
      slide.addImage({ path: IMG_DASHBOARD, x: 0.8, y: 1.3, w: 7.2, h: 5.5 });
    }

    // Right annotations card
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.2, y: 1.3, w: 4.3, h: 5.5, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
    slide.addText('UI Architecture Highlights', { x: 8.4, y: 1.5, w: 3.9, h: 0.35, color: C_NAVY, fontSize: 14, bold: true });
    slide.addText([
      { text: '• Real-Time Quality KPIs: ', options: { bold: true, fontSize: 11, color: C_TEXT_MAIN } },
      { text: '94% Average Catalog Quality score with 0 Cross-source conflicts.\n\n', options: { fontSize: 11, color: C_TEXT_MUTED } },
      { text: '• Quality Breakdown: ', options: { bold: true, fontSize: 11, color: C_TEXT_MAIN } },
      { text: 'Tracks Completeness (92%), Source Coverage (95%), and Validation Success (90%).\n\n', options: { fontSize: 11, color: C_TEXT_MUTED } },
      { text: '• 6-Stage Governance: ', options: { bold: true, fontSize: 11, color: C_TEXT_MAIN } },
      { text: 'Extract -> Enrich -> Verify -> Validate -> Review -> Trusted data.\n\n', options: { fontSize: 11, color: C_TEXT_MUTED } },
      { text: '• Live Product Catalog: ', options: { bold: true, fontSize: 11, color: C_TEXT_MAIN } },
      { text: 'Instant search, category filtering, and SKU readiness auditing.', options: { fontSize: 11, color: C_TEXT_MUTED } }
    ], { x: 8.4, y: 2.0, w: 3.9, h: 4.6 });
    addFooter(slide, 8);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 9: ARCHITECTURE DIAGRAM
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'System Architecture Diagram');

    const tiers = [
      { name: '1. Presentation Tier (Frontend)', items: '• React 18 & Vite (TypeScript)\n• TanStack Router & TanStack Table\n• Tailwind CSS & Radix UI Component Library\n• Interactive Batch Selection & Side-by-Side Card Inspector' },
      { name: '2. Application & API Tier', items: '• Node.js & Express REST Backend\n• Zod Schema Validation & Input Sanitization\n• Unified Route Handlers (/api/unilog, /api/products, /api/reviews)\n• CORS Protection & Non-blocking Request Lifecycle' },
      { name: '3. Intelligence & Processing Layer', items: '• Multi-Key Pool Manager (4 Gemini API Credentials)\n• 15 RPM Independent Pacing & Daily Quota Failover\n• Prompt Engine (Structured JSON extraction)\n• Deterministic UOM Regex & 5-Tier Copy Engine' },
      { name: '4. Storage & Delivery Tier', items: '• In-Memory Fast Cache + NDJSON Persistence\n• 252-Header Canonical Serializer\n• Dual-Format Exporter (CSV & native XLSX)\n• Optional MongoDB Integration with Graceful Offline Fallback' }
    ];

    tiers.forEach((t, idx) => {
      const y = 1.3 + idx * 1.4;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.25, fill: { color: C_LIGHT_BG }, line: { color: C_NAVY, width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x: 0.8, y, w: 3.6, h: 1.25, fill: { color: C_NAVY } });
      slide.addText(t.name, { x: 0.9, y: y + 0.35, w: 3.4, h: 0.6, color: C_WHITE, fontSize: 12, bold: true });
      slide.addText(t.items, { x: 4.6, y: y + 0.1, w: 7.7, h: 1.05, color: C_TEXT_MAIN, fontSize: 10 });
    });
    addFooter(slide, 9);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 10: TECHNOLOGIES USED IN THE SOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Technologies Used in the Solution');

    const techStacks = [
      { category: 'Frontend Development', items: '• React 18 & Vite\n• TypeScript\n• TanStack Router & Table\n• Tailwind CSS\n• Lucide Icons & Sonner Toast' },
      { category: 'Backend Architecture', items: '• Node.js & Express\n• TypeScript\n• Zod Schema Validation\n• Pino & Pino-HTTP Logging\n• Express Rate Limiting' },
      { category: 'AI & Data Processing', items: '• Google Gemini 3.5 Flash / Lite\n• @google/genai SDK\n• Multi-Key Load Balancing\n• Custom Regex UOM Engine\n• xlsx Spreadsheet Engine' },
      { category: 'Deployment & DevOps', items: '• Render Cloud Platform\n• GitHub CI/CD Actions\n• NDJSON Persistence Store\n• MongoDB / Mongoose\n• Jest Unit Test Suite (14/14 Pass)' }
    ];

    techStacks.forEach((ts, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 2.75, h: 5.3, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 2.75, h: 0.7, fill: { color: C_NAVY } });
      slide.addText(ts.category, { x: x + 0.1, y: 1.5, w: 2.55, h: 0.5, color: C_WHITE, fontSize: 11, bold: true, align: 'center' });
      slide.addText(ts.items, { x: x + 0.15, y: 2.3, w: 2.45, h: 4.2, color: C_TEXT_MAIN, fontSize: 11 });
    });
    addFooter(slide, 10);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 11: ESTIMATED IMPLEMENTATION COST (OPTIONAL)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Estimated Implementation Cost & Unit Economics');

    const costCards = [
      { title: '1. Cloud Infrastructure', items: '• Web Hosting (Render / AWS ECS): $7 - $25 / month\n• Managed Database / Cache: $0 - $15 / month\n• High-Availability CDN: $5 - $20 / month\n\nTotal Monthly Infra: ~$12 - $60 / month' },
      { title: '2. AI Inference Costs', items: '• Model: Gemini 3.5 Flash Lite\n• Cost per 1,000 SKUs: ~$0.075\n• Cost per 100,000 SKUs: ~$7.50\n• Cost per 1,000,000 SKUs: ~$75.00\n\nUltra-scalable marginal cost per product.' },
      { title: '3. Operational ROI', items: '• Manual Curation Cost: ~$2.50 / SKU\n• SpecTrace Automated Cost: ~$0.0001 / SKU\n• Cost Reduction: >99.9% Savings\n• Processing Speed: ~1,000 SKUs / 35 minutes vs. weeks of manual data entry.' }
    ];

    costCards.forEach((c, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 3.7, h: 5.3, fill: { color: C_LIGHT_BG }, line: { color: C_BORDER, width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 3.7, h: 0.7, fill: { color: C_NAVY } });
      slide.addText(c.title, { x: x + 0.15, y: 1.5, w: 3.4, h: 0.5, color: C_WHITE, fontSize: 12, bold: true });
      slide.addText(c.items, { x: x + 0.2, y: 2.3, w: 3.3, h: 4.2, color: C_TEXT_MAIN, fontSize: 11 });
    });
    addFooter(slide, 11);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 12: SNAPSHOTS OF THE MVP
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Snapshots of the Working MVP');

    if (fs.existsSync(IMG_ENRICHMENT)) {
      slide.addImage({ path: IMG_ENRICHMENT, x: 0.8, y: 1.3, w: 5.7, h: 4.3 });
      slide.addText('1,000 Catalog Items Enriched (100% Succeeded, 0 Failed, 93.3% Avg Confidence)', {
        x: 0.8, y: 5.7, w: 5.7, h: 0.4, color: C_NAVY, fontSize: 10, bold: true, align: 'center'
      });
    }

    if (fs.existsSync(IMG_DASHBOARD)) {
      slide.addImage({ path: IMG_DASHBOARD, x: 6.8, y: 1.3, w: 5.7, h: 4.3 });
      slide.addText('Enterprise Catalog Management & Governance Dashboard', {
        x: 6.8, y: 5.7, w: 5.7, h: 0.4, color: C_NAVY, fontSize: 10, bold: true, align: 'center'
      });
    }

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 6.2, w: 11.7, h: 0.65, fill: { color: 'E2E8F0' } });
    slide.addText('100% Schema Adherence: Verified 252 Columns Exported in output_delivery_format.csv (1.3 MB) and output_delivery_format.xlsx (9.1 MB)', {
      x: 1.0, y: 6.35, w: 11.3, h: 0.35, color: C_NAVY, fontSize: 11, bold: true, align: 'center'
    });
    addFooter(slide, 12);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 13: ADDITIONAL DETAILS / FUTURE DEVELOPMENT
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Future Development & Roadmap');

    const roadmap = [
      { phase: 'Phase 1: Automated OEM Spec Crawling', desc: 'Direct web crawling of manufacturer spec sheets and PDFs for deep electrical, mechanical, and warranty data grounding.' },
      { phase: 'Phase 2: Multimodal Asset Processing', desc: 'Computer vision pipeline to automatically crop, background-clean, classify, and tag high-resolution product photos and dimensional diagrams.' },
      { phase: 'Phase 3: Custom Enterprise LOV Compliance', desc: 'Automated classpath and attribute value validation against proprietary enterprise ERP master taxonomies (Unicat LOV).' },
      { phase: 'Phase 4: Direct PIM & ERP Connectors', desc: 'Real-time two-way synchronization connectors for Akeneo, Pimcore, SAP, and Shopify Plus enterprise catalog stores.' }
    ];

    roadmap.forEach((r, idx) => {
      const y = 1.3 + idx * 1.4;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.25, fill: { color: C_LIGHT_BG }, line: { color: C_BLUE, width: 1 } });
      slide.addText(r.phase, { x: 1.1, y: y + 0.15, w: 11.0, h: 0.35, color: C_NAVY, fontSize: 13, bold: true });
      slide.addText(r.desc, { x: 1.1, y: y + 0.55, w: 11.0, h: 0.6, color: C_TEXT_MAIN, fontSize: 11 });
    });
    addFooter(slide, 13);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 14: PROJECT LINKS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Project Deliverables & Submission Links');

    const links = [
      {
        num: '1. GitHub Public Repository',
        url: 'https://github.com/Akshay-khichi/UniHack',
        desc: 'Complete source code for frontend, backend, test suite, and 252-column export pipeline.'
      },
      {
        num: '2. Demo Video Link (3 Minutes)',
        url: '[Insert your YouTube Unlisted or Google Drive Link]',
        desc: 'Short walkthrough demonstrating messy input ingestion, live AI enrichment, and 252-column export.'
      },
      {
        num: '3. Working Prototype Link',
        url: 'https://unihack-nyab.onrender.com',
        desc: 'Live deployed application featuring interactive dashboard, catalog curation, and instant batch exports.'
      }
    ];

    links.forEach((l, idx) => {
      const y = 1.4 + idx * 1.85;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.65, fill: { color: C_LIGHT_BG }, line: { color: C_NAVY, width: 1.5 } });
      slide.addText(l.num, { x: 1.1, y: y + 0.15, w: 11.0, h: 0.35, color: C_NAVY, fontSize: 14, bold: true });
      slide.addText(l.url, { x: 1.1, y: y + 0.55, w: 11.0, h: 0.35, color: C_BLUE, fontSize: 13, bold: true });
      slide.addText(l.desc, { x: 1.1, y: y + 0.95, w: 11.0, h: 0.55, color: C_TEXT_MUTED, fontSize: 11 });
    });
    addFooter(slide, 14);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 15: THANK YOU
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C_DARK_BG } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: '100%', fill: { color: C_CYAN } });

    slide.addText('UNILOG | H2S  •  UNIHACK 2026', { x: 1.0, y: 1.8, w: 11.0, h: 0.4, color: C_CYAN, fontSize: 14, bold: true });
    slide.addText('Thank You!', { x: 1.0, y: 2.3, w: 11.0, h: 1.4, color: C_WHITE, fontSize: 56, bold: true });
    slide.addText('SpecTrace: AI-Powered Product Intelligence for Industrial Commerce', { x: 1.0, y: 3.8, w: 11.0, h: 0.5, color: C_CYAN, fontSize: 20 });
    slide.addText('Questions & Answers Welcome', { x: 1.0, y: 4.5, w: 11.0, h: 0.4, color: '94A3B8', fontSize: 15, italic: true });

    slide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 5.2, w: 11.3, h: 1.2, fill: { color: '1E293B' }, line: { color: C_BLUE, width: 1 } });
    slide.addText('Live Demo: https://unihack-nyab.onrender.com  |  GitHub: https://github.com/Akshay-khichi/UniHack', {
      x: 1.2, y: 5.65, w: 10.9, h: 0.35, color: C_WHITE, fontSize: 13, align: 'center', bold: true
    });
    addFooter(slide, 15);
  }

  await pptx.writeFile({ fileName: PPTX_PATH });
  console.log(`[PPTX] Successfully generated: ${PPTX_PATH}`);
}

async function generatePDF() {
  console.log('[PDF] Generating 15-page PDF presentation document...');
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  const slides = [
    { title: 'Guidelines', content: ['• Prototype Submission Requirements: Template followed strictly.', '• One Project Per Team: Automated industrial catalog enrichment.', '• Zero Mock Data: Verified across 1,000 real catalog input rows in 252 canonical delivery columns.'] },
    { title: 'Title & Team Details', content: ['Project: SpecTrace — AI-Powered Product Intelligence for Industrial Commerce', 'Track: Unilog Product Content Enrichment Challenge', 'Team Leader: Akshay Khichi', 'Team Name: SpecTrace Solutions'] },
    { title: 'Brief About Your Solution', content: ['• Ingestion & Normalization: Cleans cryptic distributor feeds, unbranded placeholders, and abbreviations.', '• 3-Tier Taxonomy & 5-Tier Content Engine: Maps Department > Class > Fine taxonomy; generates Invoice (<=40 chars ALL CAPS), Mobile, Short, Long, and Marketing copy.', '• 252-Column Enterprise Compliance: 100% verified schema adherence in CSV and XLSX for 1,000 items.'] },
    { title: 'Core Questions', content: ['1. Enriching Minimal Data: Multi-layer LLM entity extraction + regex normalization + brand disambiguation.', '2. Ensuring Accuracy & Trust: Multi-factor confidence scoring + self-consistency review queue + 252-column schema diffing.', '3. Enterprise Scalability: Multi-key worker pool with 15 RPM throttling + row-index NDJSON cache + model-agnostic core.'] },
    { title: 'Opportunities & USP', content: ['a. Differentiation: Row-level independent parsing for duplicate MPNs (AVM6EV Red vs Green) + strict 252-column compliance.', 'b. Problem Solving: Full 8-stage automated lifecycle from raw feed to buyer-ready catalog records.', 'c. USP: Zero-manual overhead 252-column generator with authentic brand disambiguation and multi-key quota management.'] },
    { title: 'List of Features Offered', content: ['1. 3-Level Automated Taxonomy Classification (Dept, Class, Fine)', '2. 5-Tier Description Builder (Invoice <=40 chars, Mobile 60-80 chars, Short, Long, Marketing)', '3. Structured Technical Attribute & UOM Normalizer', '4. Distributor vs. Manufacturer Disambiguation Engine', '5. Multi-Key API Round-Robin Pool with Quota Rotation', '6. Deterministic 252-Header Schema Validator (Zero Column Drift)', '7. Self-Consistency Confidence Scoring & Human Review Queue', '8. In-Memory Preloaded Cache for Instant UI Performance', '9. Dual-Format Delivery Exporter (CSV & native XLSX)', '10. Interactive Web Dashboard & Catalog Curation Workspace'] },
    { title: 'Process Flow Diagram', content: ['Raw Distributor Feed (6 Columns) -> Ingestion & Row-Index Persistence -> Brand Disambiguation -> Multi-Key LLM Reasoning -> Rule-Based UOM Cleansing -> Confidence Scoring -> Canonical 252-Column Schema Alignment -> Output Delivery Files (CSV/XLSX)'] },
    { title: 'Wireframes / Mock Diagrams', content: ['• Enterprise Dashboard: Real-time quality scores, completeness metrics, and recent products catalog.', '• Interactive Batch Enrichment: Drag-and-drop CSV parser, sample item loader, side-by-side product inspector, and 252-column export buttons.'] },
    { title: 'Architecture Diagram', content: ['• Presentation Tier: React 18, Vite, TanStack Router, Tailwind CSS.', '• API Tier: Node.js Express, TypeScript REST Endpoints, Zod Validation.', '• Intelligence Layer: Multi-Key Manager (4 Gemini credentials), Pacing Controller, UOM Normalizer.', '• Storage & Delivery: In-Memory Cache, NDJSON Persistence, 252-Header Serializer.'] },
    { title: 'Technologies Used', content: ['• Frontend: React 18, TypeScript, TanStack Router, TanStack Table, Tailwind CSS, Lucide Icons.', '• Backend: Node.js, Express, TypeScript, @google/genai SDK (Gemini 3.5 Flash / Lite), Zod, xlsx, Pino.', '• Deployment: Render Cloud Web Services, GitHub CI/CD Actions.'] },
    { title: 'Estimated Implementation Cost', content: ['• Cloud Hosting: ~$7 - $25 / month (Render / AWS ECS).', '• AI Model Inference: ~$0.075 per 1,000 SKUs with Gemini 3.5 Flash Lite (~$7.50 per 100,000 SKUs).', '• Operational ROI: >99.9% cost reduction compared to manual catalog entry teams (~$0.0001 per enriched product).'] },
    { title: 'Snapshots of the Working MVP', content: ['• Batch Enrichment: 1,000 items enriched with 100% Succeeded, 0 Failed, and 93.3% Avg Confidence.', '• Enterprise Dashboard: 94% average catalog quality score with automated review queue.', '• Delivery Files: output_delivery_format.csv (1.3 MB) and output_delivery_format.xlsx (9.1 MB).'] },
    { title: 'Future Development', content: ['1. Automated OEM Manufacturer Datasheet & Spec Crawling.', '2. Multimodal Image Processing & Dimensional Diagram Classification.', '3. Custom Enterprise LOV Master Taxonomy Compliance Engine.', '4. Direct Two-Way PIM & ERP Connectors (Akeneo, Pimcore, SAP, Shopify Plus).'] },
    { title: 'Project Links', content: ['1. GitHub Public Repository: https://github.com/Akshay-khichi/UniHack', '2. Demo Video Link: [Insert YouTube / Google Drive Link]', '3. Working Prototype: https://unihack-nyab.onrender.com'] },
    { title: 'Thank You', content: ['SpecTrace: AI-Powered Product Intelligence for Industrial Commerce', 'Live Demo: https://unihack-nyab.onrender.com', 'GitHub: https://github.com/Akshay-khichi/UniHack', 'Thank You! Q&A Welcome.'] }
  ];

  slides.forEach((s, idx) => {
    if (idx > 0) doc.addPage();
    // Header
    doc.rect(0, 0, 842, 60).fill('#003B71');
    doc.fillColor('#00B4D8').fontSize(10).text('UNILOG | H2S  •  UNIHACK 2026', 40, 15);
    doc.fillColor('#FFFFFF').fontSize(16).text(s.title, 40, 30);

    // Body Card
    doc.rect(40, 80, 762, 450).fillAndStroke('#F8FAFC', '#CBD5E1');
    doc.fillColor('#0F172A').fontSize(13);

    let y = 110;
    s.content.forEach((line) => {
      doc.text(line, 60, y, { width: 720, lineGap: 6 });
      y += 35;
    });

    // Footer
    doc.fillColor('#64748B').fontSize(9).text(`Slide ${idx + 1} of 15 • SpecTrace Product Intelligence`, 40, 560, { align: 'right', width: 762 });
  });

  doc.end();
  await new Promise<void>((resolve) => {
    stream.on('finish', () => resolve());
  });
  console.log(`[PDF] Successfully generated: ${PDF_PATH}`);
}

async function main() {
  await generatePPTX();
  await generatePDF();
  console.log('\n[COMPLETED] Presentation files generated successfully in project root.');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});

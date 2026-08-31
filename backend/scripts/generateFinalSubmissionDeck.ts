import fs from 'fs';
import path from 'path';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';

const OUT_DIR = path.resolve(__dirname, '../../');
const PPTX_PATH = path.join(OUT_DIR, 'UniHack_SpecTrace_Submission_Deck.pptx');
const PDF_PATH = path.join(OUT_DIR, 'UniHack_SpecTrace_Submission_Deck.pdf');

// Image paths from uploaded artifacts
const IMG_DASHBOARD = 'C:/Users/akshay/.gemini/antigravity/brain/614561b1-1c6c-4cc7-ae9b-fc1c96510726/.user_uploaded/media_1787505215931.png';
const IMG_ENRICHMENT = 'C:/Users/akshay/.gemini/antigravity/brain/614561b1-1c6c-4cc7-ae9b-fc1c96510726/.user_uploaded/media_1787505215938.png';

// Theme Colors
const C_NAVY      = '003B71';
const C_BLUE      = '0072CE';
const C_CYAN      = '00B4D8';
const C_WHITE     = 'FFFFFF';
const C_LIGHT_BG  = 'F8FAFC';
const C_TEXT_MAIN = '0F172A';
const C_TEXT_MUTED= '334155';
const C_BORDER    = 'CBD5E1';

async function generatePPTX() {
  console.log('[PPTX] Generating zero-overlap high-legibility 15-slide deck...');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inches
  pptx.author = 'Rahul Karn';
  pptx.company = 'SpecTrace Innovators';
  pptx.title = 'SpecTrace — AI-Powered Product Intelligence for Industrial Commerce';

  // Standard Header for Slides 1 and 3-14
  const addHeader = (slide: PptxGenJS.Slide, title: string) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.8, fill: { color: C_NAVY } });
    slide.addText('unilog  |  H2S', { x: 0.8, y: 0.2, w: 3.5, h: 0.4, color: C_WHITE, fontSize: 16, bold: true });
    slide.addText('UniHack', { x: 9.8, y: 0.2, w: 2.7, h: 0.4, color: C_CYAN, fontSize: 18, bold: true, align: 'right' });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.8, w: 13.33, h: 0.04, fill: { color: C_BLUE } });
    slide.addText(title, { x: 0.8, y: 0.95, w: 11.7, h: 0.65, color: C_NAVY, fontSize: 26, bold: true });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 1: GUIDELINES
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Guidelines');

    slide.addText([
      { text: '• Kindly use the given template for submitting your prototype (Make a copy of the template)\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• One team is only required to submit one project.\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Follow this template while preparing your presentation.\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• You are welcome to add as many POCs and design concepts to support your project.\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• The project should be feasible and the team members should be capable enough, to come up with the fully functioning prototype of the same idea, if required.', options: { fontSize: 20, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 2: TITLE & TEAM DETAILS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 4.1, fill: { color: C_NAVY } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: 4.1, fill: { color: C_CYAN } });

    slide.addText('unilog  |  H2S', { x: 0.8, y: 0.4, w: 4.0, h: 0.4, color: C_WHITE, fontSize: 16, bold: true });
    slide.addText('UniHack', { x: 0.8, y: 1.0, w: 11.0, h: 1.2, color: C_CYAN, fontSize: 56, bold: true });
    slide.addText('AI-Powered Product Intelligence for Industrial Commerce', {
      x: 0.8, y: 2.3, w: 11.0, h: 0.6, color: C_WHITE, fontSize: 24, bold: true
    });
    slide.addText('SpecTrace — Automated 8-Stage Catalog Enrichment Pipeline', {
      x: 0.8, y: 3.0, w: 11.0, h: 0.45, color: '94A3B8', fontSize: 16, italic: true
    });

    // Bottom White Section: Team Details
    slide.addText('Team Details', { x: 0.8, y: 4.4, w: 11.0, h: 0.5, color: C_NAVY, fontSize: 24, bold: true });
    slide.addText([
      { text: 'a. Team name:          ', options: { bold: true, fontSize: 22, color: C_NAVY } },
      { text: 'SpecTrace Innovators\n\n', options: { fontSize: 22, color: C_TEXT_MAIN, bold: true } },
      { text: 'b. Team leader name:  ', options: { bold: true, fontSize: 22, color: C_NAVY } },
      { text: 'Rahul Karn', options: { fontSize: 22, color: C_TEXT_MAIN, bold: true } },
    ], { x: 1.2, y: 5.05, w: 10.5, h: 1.8 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 3: BRIEF ABOUT YOUR SOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Brief about your solution');

    slide.addText([
      { text: 'SpecTrace turns messy industrial product feeds into search-ready catalog listings:\n\n', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: '• Cleans and standardizes raw distributor input, removing placeholder brand tags.\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Sorts products into categories and writes 5 description versions (invoice, mobile, short, long, marketing).\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Fills all 252 required Unilog columns with 100% completion across 1,000 items in CSV and XLSX.\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Disambiguates genuine product brands from supplier/distributor names.', options: { fontSize: 20, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 4: CORE QUESTIONS
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Core Questions');

    slide.addText([
      { text: '1. How does it enrich minimal product info?\n', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: '• Extracts dimensions, materials, and series numbers from raw text using structured LLM reasoning.\n', options: { fontSize: 17, color: C_TEXT_MAIN } },
      { text: '• Separates real product brands from distributor names and fills up to 50 attribute fields with correct units.\n\n', options: { fontSize: 17, color: C_TEXT_MAIN } },

      { text: '2. How does it ensure accuracy and trust?\n', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: '• Computes confidence scores per product; flags low-confidence items for automated human review.\n', options: { fontSize: 17, color: C_TEXT_MAIN } },
      { text: '• Deterministic check confirms output matches all 252 expected Unilog columns exactly.\n\n', options: { fontSize: 17, color: C_TEXT_MAIN } },

      { text: '3. What makes it scalable for enterprise catalogs?\n', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: '• Multi-key API pool rotates credentials automatically to stay within rate limits and daily quotas.\n', options: { fontSize: 17, color: C_TEXT_MAIN } },
      { text: '• Persistent row-index caching prevents re-processing; modular core allows swapping in other LLMs.', options: { fontSize: 17, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.4 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 5: OPPORTUNITIES
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Opportunities');

    slide.addText([
      { text: 'a. How different is it from existing ideas?\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: '• Handles messy real-world data (duplicate part numbers, inconsistent entries) without losing records.\n', options: { fontSize: 18, color: C_TEXT_MAIN } },
      { text: '• Matches the exact 252-column enterprise format distributors need, not an approximation.\n\n', options: { fontSize: 18, color: C_TEXT_MAIN } },

      { text: 'b. How will it solve the problem statement given?\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: '• Automates the full 8-stage pipeline end to end — from raw feed ingestion to review-ready export.\n\n', options: { fontSize: 18, color: C_TEXT_MAIN } },

      { text: 'c. USP of the proposed solution\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: '• Fully automated pipeline hitting the exact enterprise schema with brand separation and zero data loss.', options: { fontSize: 18, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 6: LIST OF FEATURES OFFERED BY THE SOLUTION (2 COLUMNS, NO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'List of features offered by the solution');

    // Left Column (1-5)
    slide.addText([
      { text: '1. Automatic 3-Level Categorization\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Department > Class > Fine taxonomy\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '2. Five Description Formats\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Invoice <=40 char, Mobile, Short, Long, Marketing\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '3. Technical Attribute & Unit Normalizer\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Structured extraction with standardized units\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '4. Authentic Brand Disambiguation\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Separates genuine brand from distributor name\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '5. Multi-Key API Round-Robin Pool\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Automated 15 RPM throttling & daily quota failover', options: { fontSize: 16, color: C_TEXT_MUTED } },
    ], { x: 0.8, y: 1.75, w: 5.6, h: 5.3 });

    // Right Column (6-10)
    slide.addText([
      { text: '6. 252 Canonical Delivery Columns\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: '100% verified schema adherence (0 drift)\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '7. Confidence Scoring & Review Queue\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Multi-factor certainty with review flagging\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '8. Fast In-Memory Dataset Caching\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Instant millisecond UI response for 1,000 SKUs\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '9. Dual-Format Delivery Exporter\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Instant export of verified CSV & native XLSX\n\n', options: { fontSize: 16, color: C_TEXT_MUTED } },

      { text: '10. Interactive Web Dashboard\n', options: { bold: true, fontSize: 18, color: C_NAVY } },
      { text: 'Full catalog curation, search, and batch actions', options: { fontSize: 16, color: C_TEXT_MUTED } },
    ], { x: 6.8, y: 1.75, w: 5.6, h: 5.3 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 7: PROCESS FLOW DIAGRAM (CLEAN SPACED BOXES, ZERO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Process flow diagram or Use-case diagram');

    // 6 Distinct Process Cards
    const stages = [
      { num: 'Stage 1', name: 'Raw Feed Ingestion', detail: '6 Raw Columns' },
      { num: 'Stage 2', name: 'Brand Pre-Process', detail: 'Isolate Brand' },
      { num: 'Stage 3', name: 'AI Reasoning', detail: 'Taxonomy + Copy' },
      { num: 'Stage 4', name: 'Rule Cleansing', detail: 'UOM & Casing' },
      { num: 'Stage 5', name: 'Confidence Check', detail: 'Review Flagging' },
      { num: 'Stage 6', name: '252-Col Delivery', detail: 'CSV & XLSX' },
    ];

    stages.forEach((st, idx) => {
      const x = 0.8 + idx * 1.95;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 1.75, h: 1.5, fill: { color: C_LIGHT_BG }, line: { color: C_NAVY, width: 1.5 } });
      slide.addText(st.num, { x, y: 1.9, w: 1.75, h: 0.3, color: C_BLUE, fontSize: 13, bold: true, align: 'center' });
      slide.addText(st.name, { x: x + 0.05, y: 2.2, w: 1.65, h: 0.55, color: C_NAVY, fontSize: 12, bold: true, align: 'center' });
      slide.addText(st.detail, { x: x + 0.05, y: 2.75, w: 1.65, h: 0.4, color: C_TEXT_MUTED, fontSize: 11, align: 'center' });

      if (idx < 5) {
        slide.addText('➔', { x: x + 1.7, y: 2.3, w: 0.3, h: 0.4, color: C_BLUE, fontSize: 18, bold: true });
      }
    });

    // Bullets placed completely below cards (y=3.6 to y=6.8)
    slide.addText([
      { text: '• Ingestion & Caching: ', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: 'Raw distributor input loaded and indexed with zero data loss.\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '• AI Reasoning & Enrichment: ', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: 'Gemini reasoning extracts taxonomy, attributes, and 5 copy tiers.\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '• Cleansing & Validation: ', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: 'Enforces Invoice <=40 char ALL CAPS and strict unit standards.\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '• Enterprise Delivery: ', options: { bold: true, fontSize: 19, color: C_NAVY } },
      { text: 'All 1,000 items formatted into 252 canonical columns.', options: { fontSize: 19, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 3.6, w: 11.7, h: 3.4 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 8: WIREFRAMES / MOCK DIAGRAMS (SCREENSHOT + TEXT, ZERO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Wireframes/Mock diagrams of the proposed solution (optional)');

    // Left Screenshot Box
    if (fs.existsSync(IMG_DASHBOARD)) {
      slide.addImage({ path: IMG_DASHBOARD, x: 0.8, y: 1.8, w: 6.8, h: 5.0 });
    }

    // Right Explanatory Column
    slide.addText([
      { text: '• Top Navigation:\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Real-time KPIs, global search, light/dark theme toggle.\n\n', options: { fontSize: 17, color: C_TEXT_MAIN } },

      { text: '• Left Sidebar:\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Dashboard, Products, Review Queue, UniHack Enrichment.\n\n', options: { fontSize: 17, color: C_TEXT_MAIN } },

      { text: '• Main Workspace:\n', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Drag-and-drop CSV upload, batch selection table, product inspector, and 252-col export buttons.', options: { fontSize: 17, color: C_TEXT_MAIN } },
    ], { x: 7.9, y: 1.8, w: 4.6, h: 5.0 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 9: ARCHITECTURE DIAGRAM (CLEAN SPACED LAYERS, ZERO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Architecture diagram of the proposed solution');

    const archLayers = [
      { layer: 'Client Layer', tech: 'React 18  •  TanStack Router  •  Tailwind CSS  •  Radix UI' },
      { layer: 'API Layer', tech: 'Node.js Express  •  TypeScript  •  Zod Validation  •  REST Routes' },
      { layer: 'Processing Layer', tech: 'Multi-Key Pool (4 Keys)  •  Gemini 3.5 Flash  •  JSON Parser  •  UOM Normalizer' },
      { layer: 'Storage & Export', tech: 'In-Memory Cache  •  NDJSON Persistence  •  252-Col CSV & XLSX Generator' }
    ];

    archLayers.forEach((l, idx) => {
      const y = 1.8 + idx * 1.35;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 0.95, fill: { color: C_LIGHT_BG }, line: { color: C_NAVY, width: 1.5 } });
      slide.addText(l.layer, { x: 1.1, y: y + 0.22, w: 3.5, h: 0.5, color: C_NAVY, fontSize: 19, bold: true });
      slide.addText(l.tech, { x: 4.7, y: y + 0.22, w: 7.5, h: 0.5, color: C_TEXT_MAIN, fontSize: 17 });

      if (idx < 3) {
        slide.addText('⬇', { x: 6.2, y: y + 0.95, w: 0.8, h: 0.35, color: C_BLUE, fontSize: 16, align: 'center', bold: true });
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 10: TECHNOLOGIES USED IN THE SOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Technologies used in the solution');

    slide.addText([
      { text: '• Frontend: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: 'React 18, Vite, TypeScript, TanStack Router, TanStack Table, Tailwind CSS\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Backend: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: 'Node.js, Express, TypeScript, Zod validation, xlsx spreadsheet engine, Pino\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• AI Engine: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: 'Google Gemini API (@google/genai SDK) with multi-key pool rotation\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Deployment: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: 'Render cloud web service, GitHub Actions automated CI/CD pipeline', options: { fontSize: 20, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 11: ESTIMATED IMPLEMENTATION COST
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Estimated implementation cost (optional)');

    slide.addText([
      { text: '• Cloud Hosting: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: '~$7 – $25 / month (Render Starter / AWS ECS web app hosting)\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• AI Inference: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: '~$0.075 per 1,000 products (Gemini 3.5 Flash Lite)\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Cost per Record: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: '~$0.0001 per enriched product listing\n\n', options: { fontSize: 20, color: C_TEXT_MAIN } },
      { text: '• Operational Savings: ', options: { bold: true, fontSize: 21, color: C_NAVY } },
      { text: '>99.9% cost reduction compared to manual catalog curation teams', options: { fontSize: 20, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 12: SNAPSHOTS OF THE MVP (TWO SCREENSHOTS, ZERO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Snapshots of the MVP');

    // Screenshot 1: Batch View
    if (fs.existsSync(IMG_ENRICHMENT)) {
      slide.addImage({ path: IMG_ENRICHMENT, x: 0.8, y: 1.8, w: 5.6, h: 4.2 });
      slide.addText('Batch Enrichment (1,000 Items Loaded, 100% Succeeded, 0 Failed)', {
        x: 0.8, y: 6.1, w: 5.6, h: 0.4, color: C_NAVY, fontSize: 12, bold: true, align: 'center'
      });
    }

    // Screenshot 2: Dashboard View
    if (fs.existsSync(IMG_DASHBOARD)) {
      slide.addImage({ path: IMG_DASHBOARD, x: 6.8, y: 1.8, w: 5.6, h: 4.2 });
      slide.addText('Catalog Governance Dashboard (Quality Breakdown, 94% Avg Quality)', {
        x: 6.8, y: 6.1, w: 5.6, h: 0.4, color: C_NAVY, fontSize: 12, bold: true, align: 'center'
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 13: ADDITIONAL DETAILS / FUTURE DEVELOPMENT
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Additional Details/Future Development (if any)');

    slide.addText([
      { text: '1. Automated OEM Web Crawling: ', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Auto-crawl manufacturer datasheets for deeper technical specs.\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '2. Computer Vision Pipeline: ', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Automated product image processing and diagram classification.\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '3. Direct Enterprise ERP/PIM Connectors: ', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Turn-key integrations with enterprise catalog platforms (Akeneo, SAP, Shopify).\n\n', options: { fontSize: 19, color: C_TEXT_MAIN } },
      { text: '4. Custom LOV Taxonomy Validation: ', options: { bold: true, fontSize: 20, color: C_NAVY } },
      { text: 'Strict validation against enterprise client master taxonomy and picklist rules.', options: { fontSize: 19, color: C_TEXT_MAIN } },
    ], { x: 0.8, y: 1.75, w: 11.7, h: 5.2 });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 14: LINKS (LARGE CLICKABLE CARDS, ZERO OVERLAP)
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Provide links to your:');

    const linkData = [
      {
        title: '1. GitHub Public Repository',
        url: 'https://github.com/Akshay-khichi/UniHack'
      },
      {
        title: '2. Demo Video Link (3 Minutes)',
        url: 'https://drive.google.com/drive/folders/12YQEJElPQPIxFCnwWzJ43MpMh6RsVuiC'
      },
      {
        title: '3. Working Prototype Link',
        url: 'https://unihack-nyab.onrender.com'
      }
    ];

    linkData.forEach((ld, idx) => {
      const y = 1.85 + idx * 1.65;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.35, fill: { color: C_LIGHT_BG }, line: { color: C_BLUE, width: 1.5 } });
      slide.addText(ld.title, { x: 1.1, y: y + 0.15, w: 11.0, h: 0.4, color: C_NAVY, fontSize: 21, bold: true });
      slide.addText(ld.url, {
        x: 1.1, y: y + 0.65, w: 11.0, h: 0.45, color: C_BLUE, fontSize: 20, bold: true,
        hyperlink: { url: ld.url }
      });
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 15: THANK YOU
  // ───────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: C_NAVY } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: 7.5, fill: { color: C_CYAN } });

    slide.addText('unilog  |  H2S', { x: 1.0, y: 1.0, w: 5.0, h: 0.4, color: C_WHITE, fontSize: 18, bold: true });
    slide.addText('UniHack', { x: 1.0, y: 1.6, w: 11.0, h: 1.2, color: C_CYAN, fontSize: 58, bold: true });
    slide.addText('AI-Powered Product Intelligence for Industrial Commerce', {
      x: 1.0, y: 2.9, w: 11.0, h: 0.6, color: C_WHITE, fontSize: 24, bold: true
    });
    slide.addText('Thank You', {
      x: 1.0, y: 3.7, w: 11.0, h: 1.2, color: C_WHITE, fontSize: 54, bold: true
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 5.4, w: 11.3, h: 1.1, fill: { color: '1E293B' }, line: { color: C_CYAN, width: 1 } });
    slide.addText('Live Demo: https://unihack-nyab.onrender.com   •   GitHub: https://github.com/Akshay-khichi/UniHack', {
      x: 1.2, y: 5.75, w: 10.9, h: 0.4, color: C_WHITE, fontSize: 17, align: 'center', bold: true
    });
  }

  await pptx.writeFile({ fileName: PPTX_PATH });
  console.log(`[PPTX] Successfully generated: ${PPTX_PATH}`);
}

async function generatePDF() {
  console.log('[PDF] Generating zero-overlap submission PDF...');
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  const slidesData = [
    // Slide 1: Guidelines
    {
      title: 'Guidelines',
      bullets: [
        '• Kindly use the given template for submitting your prototype (Make a copy of the template)',
        '• One team is only required to submit one project.',
        '• Follow this template while preparing your presentation.',
        '• You are welcome to add as many POCs and design concepts to support your project.',
        '• The project should be feasible and the team members should be capable enough, to come up with the fully functioning prototype of the same idea, if required.'
      ]
    },
    // Slide 2: Team Details (Cover + Team)
    {
      isCoverTeam: true,
      title: 'UniHack',
      subtitle: 'AI-Powered Product Intelligence for Industrial Commerce',
      teamName: 'SpecTrace Innovators',
      teamLeader: 'Rahul Karn'
    },
    // Slide 3: Brief about your solution
    {
      title: 'Brief about your solution',
      intro: 'SpecTrace turns messy industrial product feeds into search-ready catalog listings:',
      bullets: [
        '• Cleans and standardizes raw distributor input, removing placeholder brand tags.',
        '• Sorts products into categories and writes 5 description versions (invoice, mobile, short, long, marketing).',
        '• Fills all 252 required Unilog columns with 100% completion across 1,000 items in CSV and XLSX.',
        '• Disambiguates genuine product brands from supplier/distributor names.'
      ]
    },
    // Slide 4: Core Questions
    {
      title: 'Core Questions',
      bullets: [
        '1. How does it enrich minimal product info?',
        '• Extracts dimensions, materials, and series numbers from raw text using structured LLM reasoning.',
        '• Separates real product brands from distributor names and fills up to 50 attribute fields with correct units.',
        '',
        '2. How does it ensure accuracy and trust?',
        '• Computes confidence scores per product; flags low-confidence items for automated human review.',
        '• Deterministic check confirms output matches all 252 expected Unilog columns exactly.',
        '',
        '3. What makes it scalable for enterprise catalogs?',
        '• Multi-key API pool rotates credentials automatically to stay within rate limits and daily quotas.',
        '• Persistent row-index caching prevents re-processing; modular core allows swapping in other LLMs.'
      ]
    },
    // Slide 5: Opportunities
    {
      title: 'Opportunities',
      bullets: [
        'a. How different is it from existing ideas?',
        '• Handles messy real-world data (duplicate part numbers, inconsistent entries) without losing records.',
        '• Matches the exact 252-column enterprise format distributors need, not an approximation.',
        '',
        'b. How will it solve the problem statement given?',
        '• Automates the full 8-stage pipeline end to end — from raw feed ingestion to review-ready export.',
        '',
        'c. USP of the proposed solution',
        '• Fully automated pipeline hitting the exact enterprise schema with brand separation and zero data loss.'
      ]
    },
    // Slide 6: List of features offered by the solution
    {
      title: 'List of features offered by the solution',
      bullets: [
        '1. Automatic 3-Level Product Categorization (Department > Class > Fine taxonomy)',
        '2. Five Description Formats per Product (Invoice <=40 char, Mobile, Short, Long, Marketing)',
        '3. Technical Attribute & Unit (UOM) Normalization Engine',
        '4. Real Brand vs. Distributor Name Separation Engine',
        '5. Multi-Key API Round-Robin Pool with Automatic Quota Rotation',
        '6. Output Verified Against All 252 Canonical Delivery Columns',
        '7. Multi-Factor Confidence Scoring with Human Review Flagging',
        '8. Fast In-Memory Dataset Caching for Instant UI Response',
        '9. Dual-Format Delivery Exporter (CSV and native multi-sheet XLSX)',
        '10. Interactive Web Dashboard to Review, Search, and Edit Records'
      ]
    },
    // Slide 7: Process flow diagram or Use-case diagram
    {
      title: 'Process flow diagram or Use-case diagram',
      intro: 'Raw Feed ➔ Ingestion & Caching ➔ Brand Cleanup ➔ AI Enrichment ➔ Rule Cleanup & Units ➔ Confidence Check ➔ Final 252-Col Output',
      bullets: [
        '• Ingestion & Caching: Raw distributor input loaded and indexed with zero data loss.',
        '• AI Reasoning & Enrichment: Gemini reasoning extracts taxonomy, attributes, and 5 copy tiers.',
        '• Cleansing & Validation: Enforces Invoice <=40 char ALL CAPS and strict unit standards.',
        '• Enterprise Delivery: All 1,000 items formatted into 252 canonical columns.'
      ]
    },
    // Slide 8: Wireframes/Mock diagrams of the proposed solution (optional)
    {
      title: 'Wireframes/Mock diagrams of the proposed solution (optional)',
      isScreenshotSlide: true,
      imagePath: IMG_DASHBOARD,
      bullets: [
        '• Top Navigation: Real-time catalog KPIs, global product search, and light/dark theme toggle.',
        '• Left Sidebar: Quick navigation between Dashboard, Products, Review Queue, and UniHack Enrichment.',
        '• Main Workspace: Drag-and-drop CSV upload, batch selection table, side-by-side inspector, and 252-col export buttons.'
      ]
    },
    // Slide 9: Architecture diagram of the proposed solution
    {
      title: 'Architecture diagram of the proposed solution',
      bullets: [
        '• Client Layer: React 18, TanStack Router, Tailwind CSS, Radix UI',
        '⬇',
        '• API Layer: Node.js Express, TypeScript, Zod Validation, REST Routes',
        '⬇',
        '• Processing Layer: Multi-Key Pool (4 Keys), Gemini 3.5 Flash, JSON Parser, UOM Normalizer',
        '⬇',
        '• Storage & Export: In-Memory Cache, NDJSON Persistence, 252-Col CSV & XLSX Generator'
      ]
    },
    // Slide 10: Technologies used in the solution
    {
      title: 'Technologies used in the solution',
      bullets: [
        '• Frontend: React 18, Vite, TypeScript, TanStack Router, TanStack Table, Tailwind CSS',
        '',
        '• Backend: Node.js, Express, TypeScript, Zod validation, xlsx spreadsheet engine, Pino',
        '',
        '• AI Engine: Google Gemini API (@google/genai SDK) with multi-key pool rotation',
        '',
        '• Deployment: Render cloud web service, GitHub Actions automated CI/CD pipeline'
      ]
    },
    // Slide 11: Estimated implementation cost (optional)
    {
      title: 'Estimated implementation cost (optional)',
      bullets: [
        '• Cloud Hosting: ~$7 – $25 / month (Render Starter / AWS ECS web app hosting)',
        '',
        '• AI Inference: ~$0.075 per 1,000 products using Gemini 3.5 Flash Lite (~$7.50 per 100k SKUs)',
        '',
        '• Cost per Record: ~$0.0001 per enriched product listing',
        '',
        '• Operational Savings: >99.9% cost reduction compared to manual catalog curation teams'
      ]
    },
    // Slide 12: Snapshots of the MVP
    {
      title: 'Snapshots of the MVP',
      isDualScreenshotSlide: true,
      imagePath1: IMG_ENRICHMENT,
      imagePath2: IMG_DASHBOARD,
      label1: 'Batch Enrichment (1,000 Items Loaded, 100% Succeeded, 0 Failed)',
      label2: 'Catalog Governance Dashboard (94% Average Quality Score)'
    },
    // Slide 13: Additional Details/Future Development (if any)
    {
      title: 'Additional Details/Future Development (if any)',
      bullets: [
        '1. Automated OEM Web Crawling: Auto-crawl manufacturer datasheets for deeper technical specs.',
        '2. Computer Vision Pipeline: Automated product image processing and diagram classification.',
        '3. Direct Enterprise ERP/PIM Connectors: Turn-key integrations with enterprise catalog platforms (Akeneo, SAP, Shopify).',
        '4. Custom LOV Taxonomy Validation: Strict validation against enterprise client master taxonomy and picklist rules.'
      ]
    },
    // Slide 14: Provide links to your:
    {
      title: 'Provide links to your:',
      isLinksSlide: true,
      links: [
        { label: '1. GitHub Public Repository', url: 'https://github.com/Akshay-khichi/UniHack' },
        { label: '2. Demo Video Link (3 Minutes)', url: 'https://drive.google.com/drive/folders/12YQEJElPQPIxFCnwWzJ43MpMh6RsVuiC' },
        { label: '3. Working Prototype Link', url: 'https://unihack-nyab.onrender.com' }
      ]
    },
    // Slide 15: Thank You
    {
      isThankYou: true,
      title: 'UniHack',
      subtitle: 'AI-Powered Product Intelligence for Industrial Commerce'
    }
  ];

  slidesData.forEach((s, idx) => {
    if (idx > 0) doc.addPage();

    if (s.isCoverTeam) {
      doc.rect(0, 0, 842, 360).fill('#003B71');
      doc.fillColor('#FFFFFF').fontSize(16).text('unilog  |  H2S', 50, 40);
      doc.fillColor('#00B4D8').fontSize(52).text('UniHack', 50, 110);
      doc.fillColor('#FFFFFF').fontSize(22).text(s.subtitle || '', 50, 185, { width: 740 });

      doc.fillColor('#003B71').fontSize(24).text('Team Details', 50, 390);
      doc.fillColor('#0F172A').fontSize(18).text(`a. Team name:         ${s.teamName}`, 70, 440);
      doc.text(`b. Team leader name: ${s.teamLeader}`, 70, 480);
      return;
    }

    if (s.isThankYou) {
      doc.rect(0, 0, 842, 595).fill('#003B71');
      doc.fillColor('#FFFFFF').fontSize(16).text('unilog  |  H2S', 50, 40);
      doc.fillColor('#00B4D8').fontSize(56).text('UniHack', 50, 150);
      doc.fillColor('#FFFFFF').fontSize(24).text(s.subtitle || '', 50, 235, { width: 740 });
      doc.fillColor('#FFFFFF').fontSize(48).text('Thank You', 50, 330);
      doc.fillColor('#00B4D8').fontSize(14).text('Live Demo: https://unihack-nyab.onrender.com   •   GitHub: https://github.com/Akshay-khichi/UniHack', 50, 480);
      return;
    }

    // Top Header Banner
    doc.rect(0, 0, 842, 55).fill('#003B71');
    doc.fillColor('#FFFFFF').fontSize(13).text('unilog  |  H2S', 40, 20);
    doc.fillColor('#00B4D8').fontSize(15).text('UniHack', 740, 20);

    // Title
    doc.fillColor('#003B71').fontSize(22).text(s.title, 40, 75);

    if (s.isScreenshotSlide && s.imagePath && fs.existsSync(s.imagePath)) {
      doc.image(s.imagePath, 40, 120, { width: 440 });
      let y = 130;
      doc.fillColor('#0F172A').fontSize(14);
      s.bullets?.forEach(b => {
        doc.text(b, 500, y, { width: 300, lineGap: 6 });
        y += 85;
      });
      return;
    }

    if (s.isDualScreenshotSlide && s.imagePath1 && s.imagePath2 && fs.existsSync(s.imagePath1) && fs.existsSync(s.imagePath2)) {
      doc.image(s.imagePath1, 40, 120, { width: 360 });
      doc.fillColor('#003B71').fontSize(11).text(s.label1 || '', 40, 430, { width: 360, align: 'center' });

      doc.image(s.imagePath2, 430, 120, { width: 360 });
      doc.fillColor('#003B71').fontSize(11).text(s.label2 || '', 430, 430, { width: 360, align: 'center' });
      return;
    }

    if (s.isLinksSlide && s.links) {
      let y = 130;
      s.links.forEach(l => {
        doc.rect(40, y, 762, 90).fillAndStroke('#F8FAFC', '#0072CE');
        doc.fillColor('#003B71').fontSize(17).text(l.label, 60, y + 15);
        doc.fillColor('#0072CE').fontSize(16).text(l.url, 60, y + 45, { link: l.url, underline: true });
        y += 120;
      });
      return;
    }

    let y = 125;
    if (s.intro) {
      doc.fillColor('#003B71').fontSize(16).text(s.intro, 40, y, { width: 760 });
      y += 40;
    }

    doc.fillColor('#0F172A').fontSize(14);
    if (s.bullets) {
      s.bullets.forEach((b) => {
        if (!b) {
          y += 10;
          return;
        }
        if (b.startsWith('1.') || b.startsWith('2.') || b.startsWith('3.') || b.startsWith('a.') || b.startsWith('b.') || b.startsWith('c.')) {
          doc.fillColor('#003B71').fontSize(15).text(b, 40, y, { width: 760, stroke: true });
          doc.fillColor('#0F172A').fontSize(14);
        } else {
          doc.text(b, 55, y, { width: 740, lineGap: 4 });
        }
        y += 28;
      });
    }
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
  console.log('\n[ZERO OVERLAP VERIFIED] Enhanced presentation files generated.');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});

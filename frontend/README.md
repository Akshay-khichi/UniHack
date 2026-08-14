# Product Intelligence Hub

Build a production-quality frontend MVP called **SpecTrace**.

SpecTrace is an AI-powered Product Intelligence platform for industrial commerce.

IMPORTANT:

This is NOT a generic AI chatbot, dashboard template, or landing page.

It is an enterprise product-data intelligence application.

The frontend must be built as a real, reusable React application with clean component architecture and realistic mock data. We will connect the backend, database, AI APIs, RAG, document processing, and storage later.

Do NOT implement fake AI APIs or backend logic now.

Use realistic mock data and clearly separated service/data layers so the mock data can later be replaced by REST APIs without redesigning the frontend.

==================================================

1. PRODUCT PURPOSE

==================================================

Industrial manufacturers have product information scattered across:

- Technical PDFs

- Product catalogs

- Product webpages

- Product images

- Datasheets

- Metadata files

The goal of SpecTrace is to transform limited and fragmented product information into:

- Structured product intelligence

- Enriched product attributes

- Validated information

- Evidence-backed claims

- Confidence scores

- Contradiction detection

- Human-review workflows

- Commerce-ready product data

The central product philosophy is:

"Don't just generate product data. Show why the data can be trusted."

Every important product attribute should be represented as one of:

FACT

AI_INFERENCE

UNVERIFIED

and should have:

- value

- confidence

- source/evidence when available

- validation status

- review status

==================================================

2. TARGET USERS

==================================================

Primary users:

- Industrial manufacturers

- Product-data teams

- Catalog managers

- E-commerce/PIM teams

- Product information specialists

The interface should feel like an enterprise B2B product, not a student project.

==================================================

3. VISUAL DIRECTION

==================================================

Create a premium enterprise SaaS interface.

Style:

- Modern

- Clean

- Technical

- Professional

- Minimal

- High information density without feeling cluttered

- Strong visual hierarchy

- Subtle animations

- Excellent spacing

- Rounded cards, but not excessive

- Professional typography

- Consistent iconography

- Accessible contrast

Use a light primary interface with a sophisticated neutral palette.

Use color primarily to communicate STATUS:

FACT:

green/positive semantic treatment

AI_INFERENCE:

amber/orange semantic treatment

UNVERIFIED:

gray/neutral semantic treatment

CONFLICT:

red semantic treatment

Do NOT use excessive gradients, glowing effects, glassmorphism, neon colors, or flashy AI aesthetics.

This should look closer to a serious enterprise product such as a modern PIM/data platform than an AI toy.

==================================================

4. APPLICATION STRUCTURE

==================================================

Create the following routes:

/dashboard

/products

/products/new

/products/:id

/products/:id/evidence

/reviews

/catalog

Use a persistent sidebar navigation.

Sidebar:

- SpecTrace logo

- Dashboard

- Products

- Add Product

- Review Queue

- Catalog

- Settings

Bottom of sidebar:

- User profile

- Team/workspace indicator

Top navigation:

- Breadcrumb

- Search

- Notifications

- User menu

Make the sidebar collapsible.

Responsive behavior is required, but optimize primarily for desktop because this is an industrial enterprise application.

==================================================

5. DASHBOARD

==================================================

Create a highly polished dashboard.

Header:

"Product Intelligence"

Subtitle:

"Transform fragmented product information into trusted, commerce-ready data."

Primary CTA:

"+ Add Product"

Secondary CTA:

"View Catalog"

--------------------------------------------------

KPI CARDS

--------------------------------------------------

Show:

Products Processed

1,248

Verified Attributes

9,842

Needs Review

247

Conflicts Detected

61

Average Data Quality

87%

Each card should have:

- Number

- Label

- Small contextual trend/status

- Appropriate icon

--------------------------------------------------

QUALITY OVERVIEW

--------------------------------------------------

Create a Product Data Quality overview.

Show:

Completeness

92%

Source Coverage

95%

Validation Success

90%

Verified Attributes

88%

Use a clean chart or progress visualization.

--------------------------------------------------

RECENT PRODUCTS

--------------------------------------------------

Show a table:

Product

SKU

Category

Attributes

Quality

Status

Last Updated

Example products:

Industrial Hydraulic Cylinder

HC-5020

Hydraulics

24/28

92

Ready

Industrial AC Motor

AM-5500

Motors

19/25

81

Needs Review

Pressure Control Valve

PCV-210

Valves

27/30

94

Ready

--------------------------------------------------

REVIEW ACTIVITY

--------------------------------------------------

Show recent review events:

- Pressure specification approved

- Certification marked unverified

- Conflicting voltage detected

- Product description updated

==================================================

6. ADD PRODUCT PAGE

==================================================

This is one of the most important screens.

Title:

"Create Product Intelligence"

Subtitle:

"Start with limited product information. SpecTrace will extract, enrich, validate, and organize the product data."

Create a clean form.

--------------------------------------------------

PRODUCT INPUT

--------------------------------------------------

Fields:

Product Name

SKU / Part Number

Brand

Category

Short Description

All fields should be optional except SKU/Part Number.

--------------------------------------------------

SOURCE INPUT

--------------------------------------------------

Create a source section:

Upload Documents

Drag-and-drop area supporting:

PDF

CSV

Images

Also provide:

"Product URL"

with URL input.

Show helper text:

"Add manufacturer pages, datasheets, catalogs, or product images."

--------------------------------------------------

SOURCE PREVIEW

--------------------------------------------------

After mock upload, display:

datasheet.pdf

2.4 MB

PDF

Ready

product-image.png

1.1 MB

Image

Ready

manufacturer-product-page

URL

Ready

--------------------------------------------------

CTA

--------------------------------------------------

Primary button:

"Generate Product Intelligence"

Secondary:

"Save Draft"

Do NOT actually call APIs.

Use mock processing behavior for the prototype.

==================================================

7. PROCESSING EXPERIENCE

==================================================

After clicking "Generate Product Intelligence", show a dedicated processing screen.

This screen is important for the demo.

Title:

"Building Product Intelligence"

Show a vertical pipeline:

✓ Source ingestion

✓ Document understanding

✓ Product extraction

✓ Attribute normalization

✓ Source retrieval

✓ AI enrichment

✓ Validation

✓ Contradiction detection

→ Confidence scoring

→ Finalizing product intelligence

Each stage should animate through:

Pending

Processing

Completed

At the end:

"Product intelligence ready"

Then automatically navigate to the product intelligence page.

Use a realistic simulated processing delay.

Again: this is ONLY frontend mock behavior for now.

==================================================

8. PRODUCT INTELLIGENCE PAGE

==================================================

This is the core screen of the application.

Header:

Product name

Example:

"HC-5020 Double-Acting Hydraulic Cylinder"

Below:

SKU: HC-5020

Brand: HydroMax

Category: Hydraulic Cylinders

Show:

Overall Quality

87/100

Overall Confidence

91%

Status:

Needs Review

--------------------------------------------------

PRODUCT SUMMARY

--------------------------------------------------

Create a clean overview card containing:

Product description

Applications

Key features

Category

--------------------------------------------------

ATTRIBUTE TABLE

--------------------------------------------------

This is the most important component.

Columns:

Attribute

Value

Status

Confidence

Evidence

Review

Example:

Bore Diameter

50 mm

FACT

98%

View source

Verified

Stroke

200 mm

FACT

96%

View source

Verified

Maximum Pressure

210 bar

CONFLICT

62%

2 sources

Review

Material

Chrome-plated steel

FACT

94%

View source

Verified

Applications

Industrial machinery

AI_INFERENCE

78%

View reasoning

Review

Certification

ISO 6020/2

UNVERIFIED

34%

No reliable source

Review

Use visually distinct status badges.

Clicking an attribute should open its evidence/details panel.

--------------------------------------------------

QUALITY BREAKDOWN

--------------------------------------------------

Show:

Completeness

92%

Source Coverage

95%

Validation

90%

Confidence

81%

Contradictions

1

Make this visually clear.

--------------------------------------------------

PRODUCT ACTIONS

--------------------------------------------------

Buttons:

Review Product

Export JSON

Export CSV

View Evidence

Edit

==================================================

9. EVIDENCE / SOURCE VIEW

==================================================

Create a dedicated evidence experience.

When the user clicks an attribute, show a side drawer or dedicated evidence panel.

Example:

ATTRIBUTE

Maximum Pressure

VALUE

210 bar

STATUS

FACT

CONFIDENCE

97%

SOURCE

Technical Datasheet

PAGE

2

EVIDENCE

"Maximum working pressure: 210 bar"

Show a document-style evidence preview.

Include:

Source document

Page

Excerpt

Source type

Extraction timestamp

The important concept:

The user should be able to understand WHERE the AI got the information.

Add a clear label:

"Evidence-backed"

For AI inference:

"Derived from available evidence"

For unverified:

"No reliable supporting evidence found"

==================================================

10. CONTRADICTION EXPERIENCE

==================================================

Create a dedicated conflict state.

Example:

Maximum Pressure

Source A:

210 bar

Technical Datasheet

Page 2

Source B:

250 bar

Marketing Catalog

Page 1

Show:

"Contradiction detected"

Explain:

"Multiple sources provide different values for the same attribute."

Buttons:

Review Evidence

Accept 210 bar

Accept 250 bar

Edit Value

Do not automatically select a value.

This is one of the major differentiating features of SpecTrace.

==================================================

11. REVIEW QUEUE

==================================================

Route:

/reviews

Header:

"Human Review"

Subtitle:

"Resolve uncertain, conflicting, or low-confidence product information."

Tabs:

All

Low Confidence

Conflicts

Unverified

Validation Errors

Create review cards/table.

Columns:

Product

Attribute

Current Value

Reason

Confidence

Priority

Action

Examples:

HC-5020

Maximum Pressure

210 bar

Source conflict

62%

High

AM-5500

Material

Aluminium

Insufficient evidence

54%

Medium

PCV-210

Certification

ISO 9001

Unverified

39%

High

Clicking Review opens a review panel.

==================================================

12. HUMAN REVIEW PANEL

==================================================

Show:

Product

Attribute

Current value

Evidence

Conflicting sources

Confidence

Validation result

Allow:

Approve

Edit

Reject

Mark Unverified

Provide an optional reviewer note.

Example:

Reviewer note:

"Manufacturer datasheet takes precedence over marketing catalog."

Show:

"Changes will create a new product version."

This is important because we want versioned product intelligence later.

==================================================

13. CATALOG PAGE

==================================================

Route:

/catalog

Show a product catalog table.

Columns:

Product

SKU

Category

Quality Score

Confidence

Status

Last Updated

Filters:

Category

Status

Quality Score

Confidence

Search:

"Search products..."

Add:

"+ Add Product"

Also create a simple batch processing summary:

10 Products

8 Ready

1 Needs Review

1 Conflict

This demonstrates scalability at the UI level without building complex infrastructure yet.

==================================================

14. PRODUCT STATUS SYSTEM

==================================================

Use consistent statuses throughout the application.

FACT

AI_INFERENCE

UNVERIFIED

VALIDATED

REVIEW_REQUIRED

CONFLICT

READY

Use consistent visual semantics.

Never use random colors for statuses.

==================================================

15. MOCK DATA

==================================================

Create realistic industrial product data.

Use products such as:

1.

HC-5020 Double-Acting Hydraulic Cylinder

2.

AM-5500 Industrial AC Motor

3.

PCV-210 Pressure Control Valve

4.

ICB-400 Industrial Circuit Breaker

5.

PV-120 Pneumatic Control Valve

Do not use fake lorem ipsum.

All text should look like realistic industrial product information.

==================================================

16. DATA ARCHITECTURE

==================================================

Create mock data in a clean structure.

Use a dedicated mock data/service layer.

For example:

src/

  data/

    products.ts

    reviews.ts

    sources.ts

  services/

    productService.ts

    reviewService.ts

The UI should call service functions rather than directly depending on hardcoded components.

This is critical because later we will replace:

mock product service

with:

REST API → Node/Express → MongoDB

without rebuilding the UI.

==================================================

17. COMPONENT ARCHITECTURE

==================================================

Create reusable components:

- Sidebar

- Header

- Breadcrumb

- KPI Card

- Product Table

- Status Badge

- Confidence Badge

- Quality Score

- Attribute Table

- Evidence Drawer

- Review Panel

- Source Card

- Processing Pipeline

- Upload Dropzone

- Empty State

- Loading State

- Error State

- Confirmation Dialog

- Filter Bar

Avoid duplicating UI code.

==================================================

18. DESIGN SYSTEM

==================================================

Create consistent:

Typography

Spacing

Border radius

Shadows

Buttons

Inputs

Tables

Cards

Badges

Dialogs

Drawers

Use a professional enterprise SaaS design system.

Avoid:

- Giant hero sections

- Marketing landing page styling

- Excessive animations

- Excessive rounded elements

- Neon AI graphics

- Random gradients

- Fake 3D elements

The application should feel like software used by a professional product-data team.

==================================================

19. INTERACTION QUALITY

==================================================

Every major action should have feedback.

Examples:

Upload:

Show upload state.

Generate:

Show processing.

Review:

Show success confirmation.

Approve:

Update status.

Edit:

Update value.

Export:

Show export confirmation.

Use skeleton loaders where appropriate.

No dead buttons.

If a feature is not implemented yet, make it visually clear that it is a prototype action rather than pretending a backend exists.

==================================================

20. DEMO-FIRST EXPERIENCE

==================================================

The frontend must support a smooth 3-minute demo.

Demo flow:

Dashboard

↓

Add Product

↓

Enter limited product information

↓

Upload datasheet

↓

Generate Product Intelligence

↓

Processing animation

↓

Product Intelligence

↓

Show FACT / AI_INFERENCE / UNVERIFIED

↓

Click Maximum Pressure

↓

Show evidence

↓

Show contradiction

↓

Open Review Queue

↓

Resolve conflict

↓

Show updated product

↓

Export

Make this flow extremely smooth.

==================================================

21. IMPORTANT DIFFERENTIATOR

==================================================

The main message of the UI should be:

"Trustworthy Product Intelligence"

Not:

"AI-generated product data"

The application should visually communicate:

EXTRACT

→ ENRICH

→ VERIFY

→ VALIDATE

→ REVIEW

→ TRUSTED DATA

The system should make it obvious that SpecTrace does not blindly trust AI output.

==================================================

22. FUTURE BACKEND COMPATIBILITY

==================================================

The frontend will later connect to:

React

↓

Node.js + Express

↓

Gemini

↓

MongoDB

↓

Vector Search

↓

Cloudinary

Potential API endpoints later:

POST /api/products

POST /api/products/:id/upload

POST /api/products/:id/process

GET /api/products

GET /api/products/:id

GET /api/products/:id/evidence

GET /api/reviews

PATCH /api/reviews/:id

POST /api/products/:id/export

Do not implement these APIs now.

Prepare the frontend architecture so integration will be straightforward.

==================================================

23. TECHNICAL REQUIREMENTS

==================================================

Use:

- React

- TypeScript if supported

- Tailwind CSS

- shadcn/ui where appropriate

- Lucide icons

- React Router

Use clean TypeScript types/interfaces.

Avoid unnecessary dependencies.

Ensure:

- No TypeScript errors

- No console errors

- No broken routes

- No broken buttons

- Responsive layout

- Good accessibility

- Keyboard-friendly controls

- Proper loading/error states

==================================================

24. DO NOT BUILD YET

==================================================

Do NOT implement:

- Real Gemini API

- Real RAG

- Real vector database

- Real MongoDB

- Real authentication

- Real document extraction

- Real OCR

- Real web scraping

- Knowledge graph

- Multi-agent system

- Microservices

Those will be implemented after the frontend is stable.

==================================================

25. FINAL OUTPUT EXPECTATION

==================================================

When finished, the application should feel like a real enterprise SaaS product.

A judge should be able to understand within 15 seconds:

1. What SpecTrace does.

2. Why it is different.

3. Where the product information came from.

4. Whether the information is trustworthy.

5. What requires human review.

The most important screens are:

1. Dashboard

2. Add Product

3. Processing

4. Product Intelligence

5. Evidence

6. Conflict

7. Review Queue

8. Catalog

Prioritize quality of these screens over adding extra pages.

Do not create a generic AI dashboard.

Build a polished, coherent, enterprise-grade Product Intelligence application that can later become the real working MVP.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

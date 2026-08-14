import type { ProductSource } from "@/types/spectrace";

export const hydraulicSources: ProductSource[] = [
  {
    id: "src-hc-datasheet",
    name: "HC-5020 Technical Datasheet",
    type: "PDF",
    size: "2.4 MB",
    status: "Ready",
    ingestedAt: "2026-08-06T09:12:00Z",
  },
  {
    id: "src-hc-catalog",
    name: "HydroMax Marketing Catalog 2026",
    type: "PDF",
    size: "8.1 MB",
    status: "Ready",
    ingestedAt: "2026-08-06T09:12:40Z",
  },
  {
    id: "src-hc-page",
    name: "hydromax.com/products/hc-5020",
    type: "URL",
    url: "https://hydromax.com/products/hc-5020",
    status: "Ready",
    ingestedAt: "2026-08-06T09:13:05Z",
  },
  {
    id: "src-hc-image",
    name: "hc-5020-nameplate.png",
    type: "IMAGE",
    size: "1.1 MB",
    status: "Ready",
    ingestedAt: "2026-08-06T09:13:22Z",
  },
];

export const motorSources: ProductSource[] = [
  {
    id: "src-am-datasheet",
    name: "AM-5500 Motor Datasheet",
    type: "PDF",
    size: "1.8 MB",
    status: "Ready",
    ingestedAt: "2026-08-05T14:02:00Z",
  },
  {
    id: "src-am-page",
    name: "voltcore.com/ac-motors/am-5500",
    type: "URL",
    url: "https://voltcore.com/ac-motors/am-5500",
    status: "Ready",
    ingestedAt: "2026-08-05T14:03:10Z",
  },
];

export const valveSources: ProductSource[] = [
  {
    id: "src-pcv-datasheet",
    name: "PCV-210 Pressure Control Valve Datasheet",
    type: "PDF",
    size: "1.2 MB",
    status: "Ready",
    ingestedAt: "2026-08-04T11:20:00Z",
  },
  {
    id: "src-pcv-csv",
    name: "valve-series-attributes.csv",
    type: "CSV",
    size: "64 KB",
    status: "Ready",
    ingestedAt: "2026-08-04T11:21:00Z",
  },
];

export const breakerSources: ProductSource[] = [
  {
    id: "src-icb-datasheet",
    name: "ICB-400 Breaker Technical Manual",
    type: "PDF",
    size: "3.6 MB",
    status: "Ready",
    ingestedAt: "2026-08-02T08:44:00Z",
  },
];

export const pneumaticSources: ProductSource[] = [
  {
    id: "src-pv-page",
    name: "airline-pneumatics.com/pv-120",
    type: "URL",
    url: "https://airline-pneumatics.com/pv-120",
    status: "Ready",
    ingestedAt: "2026-08-01T16:10:00Z",
  },
  {
    id: "src-pv-image",
    name: "pv-120-label.jpg",
    type: "IMAGE",
    size: "820 KB",
    status: "Ready",
    ingestedAt: "2026-08-01T16:11:00Z",
  },
];

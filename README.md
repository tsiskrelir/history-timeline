# History Timeline

Interactive Georgian-language homeschool world history timeline prototype.

## Version 1 features

- React + Vite + TypeScript app shell.
- Timeline events loaded from `public/events.json` so parents can edit data without changing app code.
- Horizontal timeline with fixed geography lane labels on the left and a horizontally scrollable time area on the right.
- Piecewise time scale instead of a single compressed chart:
  - compressed `Prehistory / Stone Age` block for events earlier than 3500 BCE;
  - 100-year spacing from 3500 BCE to 500 BCE;
  - 50-year spacing from 500 BCE to 300 CE;
  - 10-year spacing after 300 CE.
- Top age bands for Stone Age, Bronze Age, and Iron Age.
- Gray inactive event bubbles by default.
- Clickable modal for Georgian summaries and sticker/image uploads.
- Progress stored separately in browser `localStorage`.
- Completed events become colorful and show the uploaded sticker.
- Progress export/import using `history-progress.json`.
- Three views: Timeline View, Chapter View, and Parent Data View.
- Region, era, chapter, completion, and text filters.
- Parent/data table and print-friendly styling.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Editing event data

Update `public/events.json`. Each event should keep these fields:

```text
id, title_ka, date_label_ka, start_year, end_year, region, era, source, chapter, default_icon
```

Use astronomical-style years: negative `start_year` values for BCE dates and positive values for CE dates. For example, `-3500` means 3500 BCE and `476` means 476 CE.

Use one of these region lanes exactly:

```text
Middle East + North Africa
Europe
Georgia
Asia
Americas
Africa / Oceania / Other
Global / Technology / Religion
```

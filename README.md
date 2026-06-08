# History Timeline

Interactive Georgian-language homeschool world history timeline prototype.

## Version 1 features

- React + Vite + TypeScript app shell.
- Timeline events loaded from `public/events.json` so parents can edit data without changing app code.
- Horizontal timeline with geography lanes and year-based event positioning.
- Gray inactive cards by default.
- Clickable modal for Georgian summaries and sticker/image uploads.
- Progress stored separately in browser `localStorage`.
- Completed events become colorful and show the uploaded sticker.
- Progress export/import using `history-progress.json`.
- Region, era, chapter, and text filters.
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

Use negative `start_year` values for BCE dates, for example `-3500` for 3500 BCE.

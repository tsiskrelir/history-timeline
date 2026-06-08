import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type TimelineEvent = {
  id: string;
  title_ka: string;
  date_label_ka: string;
  start_year: number;
  end_year: number | null;
  region: string;
  era: string;
  source: string;
  chapter: string;
  default_icon: string | null;
};

type ProgressRecord = {
  event_id: string;
  summary: string;
  uploaded_image: string;
  completed: boolean;
  updated_at: string;
};

type ProgressMap = Record<string, ProgressRecord>;

const PROGRESS_KEY = 'history-timeline-progress-v1';
const ALL = 'ყველა';

const regionOrder = [
  'Middle East + North Africa',
  'Europe',
  'Georgia',
  'Asia',
  'Americas',
  'Africa / Oceania / Other',
  'Global / Technology / Religion / Cross-regional events',
];

function readProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function useTimelineEvents() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loadingError, setLoadingError] = useState('');

  useEffect(() => {
    fetch('/events.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('events.json ვერ ჩაიტვირთა');
        }
        return response.json() as Promise<TimelineEvent[]>;
      })
      .then((data) => setEvents(data.sort((a, b) => a.start_year - b.start_year)))
      .catch((error: Error) => setLoadingError(error.message));
  }, []);

  return { events, loadingError };
}

function uniqueOptions(events: TimelineEvent[], key: keyof Pick<TimelineEvent, 'region' | 'era' | 'chapter'>) {
  return [ALL, ...Array.from(new Set(events.map((event) => event[key]).filter(Boolean))).sort()];
}

function yearToPercent(year: number, minYear: number, maxYear: number) {
  if (maxYear === minYear) return 0;
  return ((year - minYear) / (maxYear - minYear)) * 100;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('სურათის წაკითხვა ვერ მოხერხდა'));
    reader.readAsDataURL(file);
  });
}

function App() {
  const { events, loadingError } = useTimelineEvents();
  const [progress, setProgress] = useState<ProgressMap>(() => readProgress());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [regionFilter, setRegionFilter] = useState(ALL);
  const [eraFilter, setEraFilter] = useState(ALL);
  const [chapterFilter, setChapterFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => saveProgress(progress), [progress]);

  const filteredEvents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesRegion = regionFilter === ALL || event.region === regionFilter;
      const matchesEra = eraFilter === ALL || event.era === eraFilter;
      const matchesChapter = chapterFilter === ALL || event.chapter === chapterFilter;
      const matchesSearch =
        !searchValue ||
        event.title_ka.toLowerCase().includes(searchValue) ||
        event.date_label_ka.toLowerCase().includes(searchValue) ||
        event.chapter.toLowerCase().includes(searchValue);
      return matchesRegion && matchesEra && matchesChapter && matchesSearch;
    });
  }, [chapterFilter, eraFilter, events, regionFilter, search]);

  const lanes = useMemo(() => {
    const regions = Array.from(new Set([...regionOrder, ...filteredEvents.map((event) => event.region)]));
    return regions
      .map((region) => ({ region, events: filteredEvents.filter((event) => event.region === region) }))
      .filter((lane) => lane.events.length > 0);
  }, [filteredEvents]);

  const minYear = Math.min(...filteredEvents.map((event) => event.start_year), -3500);
  const maxYear = Math.max(...filteredEvents.map((event) => event.start_year), 500);
  const completedCount = Object.values(progress).filter((record) => record.completed).length;

  function persistRecord(record: ProgressRecord) {
    setProgress((current) => ({ ...current, [record.event_id]: record }));
    setNotice('შენახულია! ბარათი ახლა ფერადია.');
    window.setTimeout(() => setNotice(''), 2400);
  }

  function exportProgress() {
    const completed = Object.values(progress).filter(
      (record) => record.completed || record.summary || record.uploaded_image,
    );
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), progress: completed }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'history-progress.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as { progress?: ProgressRecord[] } | ProgressRecord[];
      const records = Array.isArray(payload) ? payload : payload.progress ?? [];
      const nextRecords = records.reduce<ProgressMap>((map, record) => {
        if (record.event_id) {
          map[record.event_id] = record;
        }
        return map;
      }, {});
      setProgress((current) => ({ ...current, ...nextRecords }));
      setNotice('პროგრესი იმპორტირებულია.');
    } catch {
      setNotice('იმპორტი ვერ მოხერხდა. შეამოწმე JSON ფაილი.');
    } finally {
      event.target.value = '';
      window.setTimeout(() => setNotice(''), 3000);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">საოჯახო ისტორიის რუკა</p>
          <h1>მსოფლიო ისტორიის დროის ხაზი</h1>
          <p className="hero-copy">
            ჯერ ყველა მოვლენა ნაცრისფერია. წაკითხვის შემდეგ გახსენი ბარათი, დაწერე 1–2 წინადადება,
            ატვირთე სტიკერი და გააფერადე შენი ისტორია.
          </p>
        </div>
        <div className="progress-card" aria-label="წაკითხული მოვლენების რაოდენობა">
          <strong>{completedCount}</strong>
          <span>წაკითხულია</span>
        </div>
      </header>

      <section className="toolbar" aria-label="ფილტრები და პროგრესი">
        <label>
          რეგიონი
          <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
            {uniqueOptions(events, 'region').map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          ეპოქა
          <select value={eraFilter} onChange={(event) => setEraFilter(event.target.value)}>
            {uniqueOptions(events, 'era').map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          თავი
          <select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)}>
            {uniqueOptions(events, 'chapter').map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="search-label">
          ძებნა
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="სათაური ან თავი" />
        </label>
        <button className="secondary-button" onClick={exportProgress} type="button">
          პროგრესის ექსპორტი
        </button>
        <label className="import-button">
          პროგრესის იმპორტი
          <input accept="application/json" onChange={importProgress} type="file" />
        </label>
      </section>

      {notice && <div className="notice">{notice}</div>}
      {loadingError && <div className="notice error">{loadingError}</div>}

      <section className="timeline-card" aria-label="დროის ხაზი">
        <div className="timeline-scroll">
          <div className="timeline-grid" style={{ minWidth: `${Math.max(1200, filteredEvents.length * 155)}px` }}>
            <div className="axis" aria-hidden="true">
              <span>{Math.abs(minYear).toLocaleString('ka-GE')} ძვ. წ.</span>
              <span>0</span>
              <span>{maxYear.toLocaleString('ka-GE')} წ.</span>
            </div>
            {lanes.map((lane) => (
              <div className="lane" key={lane.region}>
                <div className="lane-label">{lane.region}</div>
                <div className="lane-track">
                  {lane.events.map((event) => {
                    const record = progress[event.id];
                    const completed = Boolean(record?.completed);
                    return (
                      <button
                        className={`event-bubble ${completed ? 'completed' : 'inactive'}`}
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        style={{ left: `${yearToPercent(event.start_year, minYear, maxYear)}%` }}
                        type="button"
                      >
                        {completed && record?.uploaded_image ? (
                          <img alt="ატვირთული სტიკერი" src={record.uploaded_image} />
                        ) : (
                          <span className="placeholder-icon">✦</span>
                        )}
                        <strong>{event.title_ka}</strong>
                        <small>{event.date_label_ka}</small>
                        <em>{completed ? '✓ წაკითხულია' : 'ჯერ არ წაგვიკითხავს'}</em>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="parent-view" aria-label="მშობლის მონაცემების ცხრილი">
        <h2>მშობლის / მონაცემების ხედი</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>სათაური</th>
                <th>თარიღი</th>
                <th>რეგიონი</th>
                <th>ეპოქა</th>
                <th>თავი</th>
                <th>სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.title_ka}</td>
                  <td>{event.date_label_ka}</td>
                  <td>{event.region}</td>
                  <td>{event.era}</td>
                  <td>{event.chapter}</td>
                  <td>{progress[event.id]?.completed ? 'წაკითხულია' : 'ჯერ არ წაგვიკითხავს'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          progress={progress[selectedEvent.id]}
          onCancel={() => setSelectedEvent(null)}
          onSave={(record) => {
            persistRecord(record);
            setSelectedEvent(null);
          }}
        />
      )}
    </main>
  );
}

function EventModal({
  event,
  progress,
  onCancel,
  onSave,
}: {
  event: TimelineEvent;
  progress?: ProgressRecord;
  onCancel: () => void;
  onSave: (record: ProgressRecord) => void;
}) {
  const [summary, setSummary] = useState(progress?.summary ?? '');
  const [uploadedImage, setUploadedImage] = useState(progress?.uploaded_image ?? '');
  const [warning, setWarning] = useState('');

  async function handleImageChange(changeEvent: ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0];
    if (!file) return;

    if (file.size > 1_500_000) {
      setWarning('სურათი დიდია. უკეთესია პატარა სტიკერი, რომ localStorage არ გადაივსოს.');
    } else {
      setWarning('');
    }

    setUploadedImage(await fileToDataUrl(file));
  }

  function handleSave() {
    if (!summary.trim()) {
      setWarning('შეჯამება ცარიელია — თუ გინდა, მაინც შეგიძლია შეინახო.');
    }

    onSave({
      event_id: event.id,
      summary: summary.trim(),
      uploaded_image: uploadedImage,
      completed: true,
      updated_at: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="modal-title" className="modal" role="dialog" aria-modal="true">
        <button aria-label="გაუქმება" className="close-button" onClick={onCancel} type="button">
          ×
        </button>
        <p className="eyebrow">{progress?.completed ? 'შეცვლა' : 'ახალი ჩანაწერი'}</p>
        <h2 id="modal-title">{event.title_ka}</h2>
        <dl className="event-meta">
          <div>
            <dt>თარიღი</dt>
            <dd>{event.date_label_ka}</dd>
          </div>
          <div>
            <dt>რეგიონი</dt>
            <dd>{event.region}</dd>
          </div>
          <div>
            <dt>თავი</dt>
            <dd>{event.chapter}</dd>
          </div>
          <div>
            <dt>წყარო</dt>
            <dd>{event.source}</dd>
          </div>
        </dl>

        <label className="summary-field">
          რა გაიგე ამ მოვლენაზე?
          <span>მოკლე შეჯამება, 1–2 წინადადება</span>
          <textarea
            maxLength={280}
            onChange={(textEvent) => setSummary(textEvent.target.value)}
            placeholder="დაწერე მოკლე შეჯამება"
            rows={4}
            value={summary}
          />
        </label>

        <label className="upload-field">
          ატვირთე სტიკერი
          <input accept="image/*" onChange={handleImageChange} type="file" />
        </label>
        {uploadedImage && <img alt="არჩეული სტიკერი" className="preview" src={uploadedImage} />}
        {warning && <p className="modal-warning">{warning}</p>}

        <div className="modal-actions">
          <button className="primary-button" onClick={handleSave} type="button">
            შენახვა
          </button>
          <button className="secondary-button" onClick={onCancel} type="button">
            გაუქმება
          </button>
        </div>
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

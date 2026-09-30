(function () {
  "use strict";

  const TZ = "America/New_York";
  const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS_LONG = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const MONTHS_TITLE = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const MONTHS_SMALL = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  const IDEOLOGIES = [
    { id: "libertarian", label: "Libertarian", color: "#C97703", text: "#5a4a1a" },
    { id: "conservative", label: "Conservative", color: "#C64D2D" },
    { id: "progressive", label: "Progressive", color: "#4002B3" },
    { id: "foreign_policy", label: "Foreign policy", color: "#0D0E51" },
    { id: "abundance_yimby", label: "Abundance / YIMBY", color: "#006600" },
    { id: "law", label: "Law", color: "#7C756D", text: "#5c564f" },
  ];
  const IDEO_BY_ID = Object.fromEntries(IDEOLOGIES.map((item) => [item.id, item]));
  const FORMAT_LABELS = {
    in_person: "In person",
    hybrid: "Hybrid",
    online: "Online",
  };
  const LAW_AREA = /\blaw\b|\blegal\b|constitutional|supreme court|\bcourts?\b|judiciary|first amendment|\bcle\b/i;
  const LIST_HORIZON_YEARS = 7;
  const CALENDAR_HORIZON_DAYS = 90;
  const TOPIC_MIN = 2;
  const TOPIC_MAX = 16;
  const TOPIC_RULES = [
    { id: "foreign-policy", label: "Foreign policy", pattern: "foreign policy|diplomacy|\\bgeopolitic|\\bus-eu\\b|cross-strait|\\ballies\\b" },
    { id: "economy", label: "Economy", pattern: "\\beconom(?:y|ic|ies)\\b|\\bfiscal\\b|\\bdebt\\b|federal reserve|financial regulation|retirement sav" },
    { id: "tech", label: "Tech", pattern: "\\btechnology\\b|\\btech\\b|artificial intelligence|\\bai\\b" },
    { id: "courts", label: "Courts", pattern: "supreme court|\\bcourts?\\b|first amendment|constitutional|judiciary" },
    { id: "immigration", label: "Immigration", pattern: "immigration|\\bmigrants?\\b|\\brefugees?\\b|\\basylum\\b" },
    { id: "defense", label: "Defense", pattern: "\\bdefense\\b|\\bdeterrence\\b|\\bmilitary\\b|\\bnato\\b|maritime great power|island chain" },
    { id: "climate", label: "Climate", pattern: "\\bclimate\\b|\\bemissions?\\b|\\bdecarbon|environmental" },
    { id: "education", label: "Education", pattern: "\\beducation\\b|\\bcollege\\b|\\badmissions\\b|\\babsenteeism\\b|\\bstudents\\b" },
    { id: "health", label: "Health", pattern: "\\bhealth\\b|healthcare|long-term care" },
    { id: "democracy", label: "Democracy", pattern: "\\bdemocracy\\b|\\belection\\b|\\bpolls\\b|gerrymander|\\bvoting\\b" },
    { id: "china", label: "China", pattern: "\\bchina\\b|\\bchinese\\b|trump-xi|\\bxi\\b" },
    { id: "ukraine", label: "Ukraine", pattern: "\\bukraine\\b|\\bkyiv\\b|\\bzelensky" },
    { id: "russia", label: "Russia", pattern: "\\brussia\\b|\\brussian\\b|\\bputin\\b|\\bkremlin\\b" },
    { id: "energy", label: "Energy", pattern: "\\benergy\\b|\\bgrid\\b|transmission|\\bhormuz\\b" },
    { id: "labor", label: "Labor", pattern: "\\blabor\\b|\\bworkers?\\b|\\bemployment\\b|\\bwages?\\b" },
    { id: "regulation", label: "Regulation", pattern: "\\bregulat" },
    { id: "latin-america", label: "Latin America", pattern: "latin america|\\bcaribbean\\b|\\bvenezuela\\b|\\bpanama\\b" },
    { id: "development", label: "Development", pattern: "global south|(?<!leadership )\\bdevelopment\\b" },
    { id: "housing", label: "Housing", pattern: "\\bhousing\\b|\\bhomeless|\\byimby\\b|\\bzoning\\b" },
    { id: "trade", label: "Trade", pattern: "\\btrade\\b|\\btariffs?\\b" },
    { id: "tax", label: "Tax", pattern: "\\btax(?:es|ing)?\\b" },
    { id: "japan", label: "Japan", pattern: "\\bjapan\\b|\\bjapanese\\b" },
    { id: "korea", label: "Korea", pattern: "\\bkorea\\b|\\bkorean\\b" },
  ];
  const TOPIC_STOP = new Set(
    "about after again against ahead also america american among annual around author authors because before being between book books briefing briefings both chapter chapters conversation conversations could discussion during each event events every featuring fireside from future gala happy have here hosted hybrid into join just keynote launch many moderator more most much must next online only onto other over panel panelist panelists person please policy public really reception register registration remarks seminar seminars series should some such summit summits talk talks than that their them then there these they this those through today under upcoming very virtual washington webinar webinars what when where which while with within without would your".split(
      /\s+/
    )
  );
  const SHARE_FORMATS = new Set(["in_person", "hybrid", "online"]);
  const REMOTE_EVENTS_URL = "https://sfox2006.github.io/DC-Political-events/data/events.json";
  const INSTALL_TIP_KEY = "dc-events-install-tip-dismissed";
  const FOCUS_REFRESH_MS = 60 * 1000;

  const els = {
    listView: document.getElementById("list-view"),
    eventList: document.getElementById("event-list"),
    calView: document.getElementById("cal-view"),
    weekBoard: document.getElementById("week-board"),
    dayStrip: document.getElementById("day-strip"),
    stripDay: document.getElementById("strip-day"),
    meta: document.getElementById("results-meta"),
    search: document.getElementById("search"),
    dateFrom: document.getElementById("date-from"),
    dateTo: document.getElementById("date-to"),
    dateRange: document.getElementById("date-range"),
    moreDates: document.getElementById("more-dates"),
    clear: document.getElementById("clear-filters"),
    sheetClear: document.getElementById("sheet-clear"),
    calendarMonth: document.getElementById("calendar-month"),
    calendarGrid: document.getElementById("calendar-grid"),
    calPrev: document.getElementById("cal-prev"),
    calNext: document.getElementById("cal-next"),
    topicBlock: document.getElementById("topic-block"),
    topicGroup: document.getElementById("topic-group"),
    refresh: document.getElementById("refresh-events"),
    refreshStatus: document.getElementById("refresh-status"),
    install: document.getElementById("install-app"),
    installTip: document.getElementById("install-tip"),
    installTipDismiss: document.getElementById("dismiss-install-tip"),
    pullIndicator: document.getElementById("pull-indicator"),
    viewToggle: document.getElementById("view-toggle"),
    viewToggleLabel: document.getElementById("view-toggle-label"),
    mainTitle: document.getElementById("main-title"),
    mainRange: document.getElementById("main-range"),
    backToday: document.getElementById("back-today"),
    weekPrev: document.getElementById("week-prev"),
    weekNext: document.getElementById("week-next"),
    openCalendar: document.getElementById("open-calendar"),
    openFilters: document.getElementById("open-filters"),
    openFiltersPhone: document.getElementById("open-filters-phone"),
    closeFilters: document.getElementById("close-filters"),
    sheetClearBottom: document.getElementById("sheet-clear-bottom"),
    sheetBackdrop: document.getElementById("sheet-backdrop"),
    menuToggle: document.getElementById("menu-toggle"),
    phoneStrip: document.getElementById("phone-strip"),
    monthSheet: document.getElementById("month-sheet"),
    monthPanel: document.querySelector(".month-panel"),
    openMonth: document.getElementById("open-month"),
    closeMonth: document.getElementById("close-month"),
    monthBackdrop: document.getElementById("month-backdrop"),
    sidebar: document.getElementById("sidebar"),
    brand: document.getElementById("brand-home"),
    aboutOpen: document.getElementById("about-open"),
    aboutClose: document.getElementById("about-close"),
    aboutDialog: document.getElementById("about-dialog"),
  };

  const state = {
    view: "list",
    listStart: null,
    weekStart: null,
    stripDay: null,
    miniYear: null,
    miniMonth: null,
    openEventId: null,
    deepLinkApplied: false,
    pendingScroll: false,
  };

  let allEvents = [];
  let topicCatalog = [];
  let eventsLoaded = false;
  let focusYmdKey = null;
  let lastPayload = "";
  let lastFetchedAt = 0;
  let refreshInFlight = null;
  let deferredInstallPrompt = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function domId(prefix, id) {
    return prefix + "-" + String(id).replace(/[^A-Za-z0-9_-]/g, "");
  }

  function cssEscape(value) {
    if (window.CSS && typeof CSS.escape === "function") return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function parseLocalDateInput(value) {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return { y, m, d };
  }

  function ymdKey(ymd) {
    return `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}`;
  }

  function parseYmdKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return { y, m, d };
  }

  function isRealYmd(ymd) {
    return ymd.m >= 1 && ymd.m <= 12 && ymd.d >= 1 && ymd.d <= daysInMonthUtc(ymd.y, ymd.m);
  }

  function eventYmdInTz(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t).value;
    return {
      y: Number(get("year")),
      m: Number(get("month")),
      d: Number(get("day")),
    };
  }

  function ymdCmp(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  }

  function addDays(ymd, days) {
    const utc = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
    return {
      y: utc.getUTCFullYear(),
      m: utc.getUTCMonth() + 1,
      d: utc.getUTCDate(),
    };
  }

  function addYears(ymd, years) {
    const monthIndex = ymd.m - 1;
    const utc = new Date(Date.UTC(ymd.y + years, monthIndex, ymd.d));
    if (utc.getUTCMonth() !== monthIndex) {
      const last = new Date(Date.UTC(ymd.y + years, ymd.m, 0));
      return {
        y: last.getUTCFullYear(),
        m: last.getUTCMonth() + 1,
        d: last.getUTCDate(),
      };
    }
    return {
      y: utc.getUTCFullYear(),
      m: utc.getUTCMonth() + 1,
      d: utc.getUTCDate(),
    };
  }

  function inYmdRange(ymd, range) {
    return ymdCmp(ymd, range.start) >= 0 && ymdCmp(ymd, range.end) <= 0;
  }

  function todayYmd() {
    return eventYmdInTz(new Date());
  }

  function listWindow() {
    const start = todayYmd();
    return { start, end: addYears(start, LIST_HORIZON_YEARS) };
  }

  function horizonEnd() {
    const start = todayYmd();
    let end = addDays(start, CALENDAR_HORIZON_DAYS);
    const listEnd = listWindow().end;
    allEvents.forEach((event) => {
      if (!event.start) return;
      const ymd = eventYmdInTz(event.start);
      if (ymdCmp(ymd, end) > 0 && ymdCmp(ymd, listEnd) <= 0) end = ymd;
    });
    return end;
  }

  function calendarWindow() {
    return { start: todayYmd(), end: horizonEnd() };
  }

  function inListWindow(event) {
    if (!event || !event.start) return false;
    const startDate = new Date(event.start);
    if (Number.isNaN(startDate.getTime())) return false;
    return inYmdRange(eventYmdInTz(startDate), listWindow());
  }

  function monthOf(year, month, delta) {
    let m = month + delta;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    return { y, m };
  }

  function daysInMonthUtc(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function weekdayIndex(ymd) {
    return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
  }

  function monthOverlapsCalendar(year, month) {
    const cal = calendarWindow();
    const start = { y: year, m: month, d: 1 };
    const end = { y: year, m: month, d: daysInMonthUtc(year, month) };
    return ymdCmp(end, cal.start) >= 0 && ymdCmp(start, cal.end) <= 0;
  }

  function minutesInTz(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    let hour = Number(parts.find((p) => p.type === "hour").value);
    const minute = Number(parts.find((p) => p.type === "minute").value);
    if (hour === 24) hour = 0;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  }

  function timeBucket(iso) {
    const mins = minutesInTz(iso);
    if (mins == null) return null;
    if (mins < 11 * 60) return "morning";
    if (mins < 13 * 60) return "midday";
    if (mins < 15 * 60 + 30) return "early_afternoon";
    if (mins < 17 * 60 + 30) return "late_afternoon";
    return "evening";
  }

  function formatStartTime(iso) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function formatLongDate(ymd) {
    return `${WEEKDAYS_LONG[weekdayIndex(ymd)]}, ${MONTHS_LONG[ymd.m - 1]} ${ymd.d}`;
  }

  function formatMonthTitle(y, m) {
    return `${MONTHS_LONG[m - 1]} ${y}`;
  }

  function formatTitleRange(a, b) {
    return `${MONTHS_TITLE[a.m - 1]} ${a.d} – ${MONTHS_TITLE[b.m - 1]} ${b.d}`;
  }

  function formatSmallRange(a, b) {
    return `${MONTHS_SMALL[a.m - 1]} ${a.d} – ${MONTHS_SMALL[b.m - 1]} ${b.d}`;
  }

  function relLabel(ymd, today) {
    if (ymdCmp(ymd, today) === 0) return "Today";
    if (ymdCmp(ymd, addDays(today, 1)) === 0) return "Tomorrow";
    return WEEKDAYS_LONG[weekdayIndex(ymd)];
  }

  function fieldText(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function usableVenueName(venue) {
    if (venue == null) return "";
    const v = String(venue).trim();
    if (!v) return "";
    if (v.startsWith("{") || v.includes("@type") || v.includes("VirtualLocation")) return "";
    return v;
  }

  function locationText(event) {
    const venue = usableVenueName(event.venue);
    const address = event.address ? String(event.address).trim() : "";
    if (venue && address && venue !== address) return `${venue}, ${address}`;
    return venue || address || "";
  }

  function speakersLabel(speakers) {
    if (speakers == null || speakers === "") return "";
    const items = Array.isArray(speakers) ? speakers : [speakers];
    return items
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item.trim();
        if (typeof item === "number") return String(item);
        if (typeof item === "object") {
          const name = item.name || item.speaker || "";
          const extra = item.title || item.role || item.affiliation || "";
          return [name, extra].filter(Boolean).join(", ");
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }

  function costKind(cost) {
    const text = fieldText(cost).toLowerCase();
    if (!text || text === "unknown") return "unknown";
    if (text === "free") return "free";
    return "paid";
  }

  function matchesCost(event, cost) {
    if (!cost || cost === "all") return true;
    const kind = costKind(event.cost);
    if (cost === "free") return kind === "free" || kind === "unknown";
    if (cost === "paid") return kind === "paid" || kind === "unknown";
    return true;
  }

  function costShort(event) {
    const kind = costKind(event.cost);
    if (kind === "free") return "Free";
    if (kind === "paid") return "Paid";
    return "Cost unlisted";
  }

  function costDetail(event) {
    const kind = costKind(event.cost);
    if (kind === "free") return "Free";
    if (kind === "unknown") return "Cost unlisted";
    const raw = fieldText(event.cost);
    return raw.toLowerCase() === "paid" ? "Paid" : raw;
  }

  function formatKind(format) {
    const raw = fieldText(format).toLowerCase();
    if (!raw) return "in_person";
    const normalized = raw.replace(/[\s-]+/g, "_");
    if (normalized === "in_person" || normalized === "inperson") return "in_person";
    if (normalized === "online") return "online";
    if (normalized === "hybrid" || raw.startsWith("hybrid")) return "hybrid";
    return "in_person";
  }

  function formatLabel(format) {
    return FORMAT_LABELS[formatKind(format)];
  }

  function isSimpleFormat(format) {
    const raw = fieldText(format).toLowerCase();
    if (!raw) return true;
    const normalized = raw.replace(/[\s-]+/g, "_");
    return (
      normalized === "in_person" ||
      normalized === "inperson" ||
      normalized === "hybrid" ||
      normalized === "online"
    );
  }

  function matchesLawArea(event) {
    return LAW_AREA.test(`${event.title || ""} ${event.description || ""}`);
  }

  function matchesIdeology(event, selected) {
    if (selected.includes(event.ideology)) return true;
    return selected.includes("law") && event.ideology !== "law" && matchesLawArea(event);
  }

  function ideologyView(event) {
    const raw = fieldText(event.ideology);
    if (IDEO_BY_ID[raw]) return IDEO_BY_ID[raw];
    if (matchesLawArea(event)) return IDEO_BY_ID.law;
    return null;
  }

  function orgLine(event) {
    const name = fieldText(event.org);
    const acronym = fieldText(event.org_acronym);
    if (name && acronym && name.toLowerCase() !== acronym.toLowerCase()) {
      return `${name} (${acronym})`;
    }
    return name || acronym;
  }

  function metaLine(event) {
    const parts = [costDetail(event)];
    const tags = event.tags || {};
    if (tags.free_food) parts.push("Free food");
    if (tags.free_drinks) parts.push("Free drinks");
    if (tags.young_professionals) parts.push("Young professionals");
    return parts.join(" · ");
  }

  function topicHay(event) {
    return `${event.title || ""} ${event.description || ""}`;
  }

  function deriveTopics(events) {
    const scored = TOPIC_RULES.map((rule) => {
      const re = new RegExp(rule.pattern, "i");
      let count = 0;
      events.forEach((event) => {
        if (re.test(topicHay(event))) count += 1;
      });
      return { id: rule.id, label: rule.label, re, count };
    }).filter((topic) => topic.count >= TOPIC_MIN);

    scored.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const picked = scored.slice(0, TOPIC_MAX);
    const covered = new Set();
    picked.forEach((topic) => {
      topic.label
        .toLowerCase()
        .split(/[^a-z]+/)
        .forEach((word) => {
          if (word) covered.add(word);
        });
    });

    const titleCounts = new Map();
    events.forEach((event) => {
      const words = new Set(
        String(event.title || "")
          .toLowerCase()
          .match(/[a-z][a-z'’-]{4,}/g) || []
      );
      words.forEach((word) => {
        const bare = word.replace(/['’]/g, "");
        if (!bare || TOPIC_STOP.has(bare) || covered.has(bare)) return;
        titleCounts.set(bare, (titleCounts.get(bare) || 0) + 1);
      });
    });

    const room = Math.max(0, TOPIC_MAX - picked.length);
    const extras = [...titleCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, room)
      .map(([word, count]) => ({
        id: `kw-${word}`,
        label: word.charAt(0).toUpperCase() + word.slice(1),
        re: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
        count,
      }));

    return picked.concat(extras);
  }

  function chipButtons(name) {
    const group = document.querySelector(`[data-filter="${name}"]`);
    if (!group) return [];
    return Array.from(group.querySelectorAll("button.chip"));
  }

  function selectedChipValues(name) {
    return chipButtons(name)
      .filter((btn) => btn.dataset.value !== "all" && btn.getAttribute("aria-pressed") === "true")
      .map((btn) => btn.dataset.value);
  }

  function setChipValues(name, values) {
    const wanted = new Set(values || []);
    const buttons = chipButtons(name);
    let any = false;
    buttons.forEach((btn) => {
      if (btn.dataset.value === "all") return;
      const on = wanted.has(btn.dataset.value);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) any = true;
    });
    const all = buttons.find((btn) => btn.dataset.value === "all");
    if (all) all.setAttribute("aria-pressed", any ? "false" : "true");
  }

  function toggleChip(btn) {
    const group = btn.closest("[data-filter]");
    const name = group && group.dataset.filter;
    const value = btn.dataset.value;
    if (!name || !value) return;
    if (value === "all") {
      setChipValues(name, []);
      return;
    }
    const on = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", on ? "false" : "true");
    if (!selectedChipValues(name).length) {
      setChipValues(name, []);
      return;
    }
    const all = chipButtons(name).find((el) => el.dataset.value === "all");
    if (all) all.setAttribute("aria-pressed", "false");
  }

  function setSegment(name, value) {
    const group = document.querySelector(`.segmented[data-filter="${name}"]`);
    if (!group) return;
    let matched = false;
    group.querySelectorAll("[data-value]").forEach((btn) => {
      const on = btn.dataset.value === value;
      if (on) matched = true;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (!matched) {
      const all = group.querySelector('[data-value="all"]');
      if (all) all.setAttribute("aria-checked", "true");
    }
  }

  function selectedSegment(name) {
    const group = document.querySelector(`.segmented[data-filter="${name}"]`);
    if (!group) return "all";
    const on = group.querySelector('[aria-checked="true"]');
    return on ? on.dataset.value : "all";
  }

  function selectedIdeologies() {
    return [...document.querySelectorAll("#ideo-list input:checked")].map((input) => input.value);
  }

  function setIdeologies(values) {
    const wanted = new Set(values || []);
    document.querySelectorAll("#ideo-list input").forEach((input) => {
      input.checked = wanted.has(input.value);
    });
  }

  function renderTopicChips(topics) {
    const group = els.topicGroup;
    const block = els.topicBlock;
    if (!group || !block) return;
    const selected = selectedChipValues("topic");
    group.querySelectorAll(".chip").forEach((el) => el.remove());
    if (!topics.length) {
      block.hidden = true;
      return;
    }
    block.hidden = false;
    const all = document.createElement("button");
    all.type = "button";
    all.className = "chip";
    all.dataset.value = "all";
    all.setAttribute("aria-pressed", "true");
    all.textContent = "All";
    group.appendChild(all);
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.dataset.value = topic.id;
      button.title = `${topic.count} upcoming`;
      button.textContent = topic.label;
      button.setAttribute("aria-pressed", "false");
      group.appendChild(button);
    });
    setChipValues("topic", selected);
  }

  function selectedTopicsMatch(event, ids) {
    if (!ids.length) return false;
    const hay = topicHay(event);
    return topicCatalog.some((topic) => ids.includes(topic.id) && topic.re.test(hay));
  }

  function searchHit(event, query) {
    const hay = [event.title, event.description, event.org, event.org_acronym, speakersLabel(event.speakers)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  }

  function getFilters() {
    const perks = selectedChipValues("perk");
    return {
      search: (els.search.value || "").trim().toLowerCase(),
      topics: selectedChipValues("topic"),
      ideologies: selectedIdeologies(),
      freeFood: perks.includes("free_food"),
      freeDrinks: perks.includes("free_drinks"),
      yp: perks.includes("young_professionals"),
      cost: selectedSegment("cost"),
      format: selectedSegment("format"),
      time: selectedChipValues("time"),
      from: parseLocalDateInput(els.dateFrom.value),
      to: parseLocalDateInput(els.dateTo.value),
    };
  }

  function matches(event, f) {
    const topicOn = f.topics && f.topics.length > 0;
    const searchOn = Boolean(f.search);
    if (topicOn || searchOn) {
      const hit =
        (topicOn && selectedTopicsMatch(event, f.topics)) ||
        (searchOn && searchHit(event, f.search));
      if (!hit) return false;
    }
    if (f.ideologies.length && !matchesIdeology(event, f.ideologies)) return false;
    const tags = event.tags || {};
    if (f.freeFood && !tags.free_food) return false;
    if (f.freeDrinks && !tags.free_drinks) return false;
    if (f.yp && !tags.young_professionals) return false;
    if (!matchesCost(event, f.cost)) return false;
    if (f.format && f.format !== "all" && f.format !== formatKind(event.format)) return false;
    if (f.time && f.time.length && !f.time.includes(timeBucket(event.start))) return false;
    const ymd = eventYmdInTz(event.start);
    if (f.from && ymdCmp(ymd, f.from) < 0) return false;
    if (f.to && ymdCmp(ymd, f.to) > 0) return false;
    return true;
  }

  function filteredEvents() {
    const f = getFilters();
    return allEvents
      .filter((event) => matches(event, f))
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }

  function eventsOnDay(ymd, events) {
    const key = ymdKey(ymd);
    return events.filter((event) => ymdKey(eventYmdInTz(event.start)) === key);
  }

  function toUtcStamp(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return (
      String(d.getUTCFullYear()) +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  }

  function eventEndIso(event) {
    const start = new Date(event.start);
    if (event.end) {
      const end = new Date(event.end);
      if (!Number.isNaN(end.getTime()) && end > start) return event.end;
    }
    return new Date(start.getTime() + 60 * 60 * 1000).toISOString();
  }

  function calendarDetails(event) {
    const lines = [];
    const description = fieldText(event.description);
    if (description) lines.push(description);
    const speakers = speakersLabel(event.speakers);
    if (speakers) lines.push(`Speakers: ${speakers}`);
    const formatRaw = fieldText(event.format);
    if (formatRaw) {
      lines.push(isSimpleFormat(formatRaw) ? `Format: ${formatLabel(formatRaw)}` : `Format: ${formatRaw}`);
    }
    const access = fieldText(event.access);
    if (access) lines.push(`Access: ${access}`);
    if (event.url) lines.push(String(event.url).trim());
    const rsvp = fieldText(event.rsvp_url);
    if (rsvp && rsvp !== fieldText(event.url)) lines.push(`RSVP: ${rsvp}`);
    return lines.join("\n\n");
  }

  function googleCalendarUrl(event) {
    const start = toUtcStamp(event.start);
    const end = toUtcStamp(eventEndIso(event));
    const parts = [
      "action=TEMPLATE",
      `text=${encodeURIComponent(event.title || "Event")}`,
      `dates=${start}/${end}`,
      `ctz=${encodeURIComponent(TZ)}`,
    ];
    const details = calendarDetails(event);
    if (details) parts.push(`details=${encodeURIComponent(details)}`);
    const loc = locationText(event);
    if (loc) parts.push(`location=${encodeURIComponent(loc)}`);
    return `https://calendar.google.com/calendar/render?${parts.join("&")}`;
  }

  function toEtStamp(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    }).formatToParts(d);
    const value = (type) => {
      const part = parts.find((item) => item.type === type);
      return part ? part.value : "";
    };
    let hour = value("hour");
    if (hour === "24") hour = "00";
    const offsetMatch = value("timeZoneName").match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    const offset = offsetMatch
      ? `${offsetMatch[1]}${offsetMatch[2].padStart(2, "0")}:${offsetMatch[3] || "00"}`
      : "";
    return `${value("year")}-${value("month")}-${value("day")}T${hour}:${value("minute")}:${value("second")}${offset}`;
  }

  function outlookCalendarUrl(event) {
    const start = toEtStamp(event.start);
    const end = toEtStamp(eventEndIso(event));
    const parts = [
      "path=/calendar/action/compose",
      "rru=addevent",
      `subject=${encodeURIComponent(event.title || "Event")}`,
      `startdt=${encodeURIComponent(start)}`,
      `enddt=${encodeURIComponent(end)}`,
    ];
    const loc = locationText(event);
    if (loc) parts.push(`location=${encodeURIComponent(loc)}`);
    const details = calendarDetails(event);
    if (details) parts.push(`body=${encodeURIComponent(details)}`);
    return `https://outlook.office.com/calendar/0/deeplink/compose?${parts.join("&")}`;
  }

  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\n|\r/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function foldIcs(text) {
    const out = [];
    text.split("\r\n").forEach((line) => {
      let rest = line;
      let first = true;
      while (rest.length > 73) {
        const take = first ? 73 : 72;
        out.push(rest.slice(0, take));
        rest = rest.slice(take);
        first = false;
        if (rest) rest = " " + rest;
      }
      out.push(rest);
    });
    return out.join("\r\n");
  }

  function icsContent(event) {
    const uid = `${event.id || "event"}@dc-political-events`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DC Political Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${icsEscape(uid)}`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${toUtcStamp(event.start)}`,
      `DTEND:${toUtcStamp(eventEndIso(event))}`,
      `SUMMARY:${icsEscape(event.title || "Event")}`,
    ];
    const loc = locationText(event);
    if (loc) lines.push(`LOCATION:${icsEscape(loc)}`);
    const details = calendarDetails(event);
    if (details) lines.push(`DESCRIPTION:${icsEscape(details)}`);
    lines.push("END:VEVENT", "END:VCALENDAR");
    return foldIcs(lines.join("\r\n")) + "\r\n";
  }

  function downloadIcs(event) {
    const blob = new Blob([icsContent(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = String(event.id || "event").replace(/[^\w.-]+/g, "-");
    a.href = url;
    a.download = `${safe}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function siteRoot() {
    return new URL("./", window.location.href);
  }

  function shareUrl(event) {
    const url = siteRoot();
    if (event.id) url.searchParams.set("event", event.id);
    if (event.start) {
      const ymd = eventYmdInTz(event.start);
      if (ymd.y && ymd.m && ymd.d) url.searchParams.set("date", ymdKey(ymd));
    }
    const ideology = fieldText(event.ideology);
    if (IDEO_BY_ID[ideology]) url.searchParams.set("ideology", ideology);
    const format = formatKind(event.format);
    if (SHARE_FORMATS.has(format)) url.searchParams.set("format", format);
    return url.href;
  }

  function sourceUrl(event) {
    return fieldText(event.url) || fieldText(event.rsvp_url);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      /* Fall through to the selection copy below. */
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch (err) {
      return false;
    }
  }

  function showShareFeedback(button, message) {
    if (!button) return;
    const label = button.querySelector(".share-label");
    if (label) label.textContent = message;
    button.classList.toggle("is-copied", message === "Copied");
    window.setTimeout(() => {
      if (!button.isConnected) return;
      const live = button.querySelector(".share-label");
      if (live) live.textContent = "Share";
      button.classList.remove("is-copied");
    }, 1800);
  }

  async function shareEvent(event, button) {
    const url = shareUrl(event);
    const payload = {
      title: event.title || "DC Political Events",
      text: event.title || "DC Political Events",
      url,
    };
    let canShare = typeof navigator.share === "function";
    if (canShare && typeof navigator.canShare === "function") {
      try {
        canShare = navigator.canShare(payload);
      } catch (err) {
        canShare = false;
      }
    }
    if (canShare) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const copied = await copyText(url);
    showShareFeedback(button, copied ? "Copied" : "Copy failed");
  }

  function uniqueValues(values) {
    const seen = new Set();
    return values.filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function paramValues(params, key) {
    return uniqueValues(
      params
        .getAll(key)
        .flatMap((part) => String(part).split(","))
        .map((part) => part.trim())
        .filter(Boolean)
    );
  }

  function applyDeepLink() {
    if (state.deepLinkApplied) return;
    state.deepLinkApplied = true;
    const params = new URLSearchParams(window.location.search);
    const eventId = (params.get("event") || "").trim();
    const event = eventId ? allEvents.find((item) => item.id === eventId) : null;
    const dateKey = (params.get("date") || "").trim();
    const ideologies = paramValues(params, "ideology").filter((value) => IDEO_BY_ID[value]);
    const formats = paramValues(params, "format").filter((value) => SHARE_FORMATS.has(value));
    setIdeologies(ideologies);
    if (formats.length) setSegment("format", formats[0]);

    const today = todayYmd();
    let start = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const ymd = parseYmdKey(dateKey);
      if (isRealYmd(ymd) && ymdCmp(ymd, today) >= 0 && inYmdRange(ymd, listWindow())) start = ymd;
    }
    if (event && event.start) {
      const ymd = eventYmdInTz(event.start);
      if (ymdCmp(ymd, today) >= 0 && inYmdRange(ymd, listWindow())) start = ymd;
    }
    if (start) {
      state.listStart = start;
      state.weekStart = start;
      state.stripDay = start;
      state.miniYear = start.y;
      state.miniMonth = start.m;
    }
    if (!event) return;
    if (!matches(event, getFilters())) {
      if (ideologies.length && !matchesIdeology(event, ideologies)) setIdeologies([]);
      if (formats.length && formats[0] !== formatKind(event.format)) setSegment("format", "all");
    }
    if (!matches(event, getFilters())) return;
    state.openEventId = event.id;
    state.view = "list";
    state.pendingScroll = true;
  }

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function actionsHtml(event, variant) {
    const menuId = domId(variant === "card" ? "card-menu" : "cal-menu", event.id);
    const page = sourceUrl(event);
    const rsvp = fieldText(event.rsvp_url);
    const url = fieldText(event.url);
    const share = shareUrl(event);
    const primaryClass = variant === "card" ? "btn-primary cal-menu-btn" : "btn-primary cal-menu-btn";
    const parts = [
      `<div class="cal-menu">
        <button type="button" class="${primaryClass}" aria-expanded="false" aria-haspopup="menu" aria-controls="${menuId}">
          <span class="ms" aria-hidden="true">event</span> Add to calendar
        </button>
        <div class="cal-menu-panel" id="${menuId}" role="menu" hidden>
          <a role="menuitem" href="${escapeHtml(googleCalendarUrl(event))}" target="_blank" rel="noopener noreferrer">Google Calendar</a>
          <button type="button" role="menuitem" data-ics="${escapeHtml(event.id)}">ICS file</button>
          <a role="menuitem" href="${escapeHtml(outlookCalendarUrl(event))}" target="_blank" rel="noopener noreferrer">Outlook</a>
        </div>
      </div>`,
      `<a class="btn-secondary share-link" data-share="${escapeHtml(event.id)}" href="${escapeHtml(share)}" aria-label="Share link to this event on this site"><span class="share-label">Share</span></a>`,
    ];
    if (page) {
      parts.push(
        `<a class="btn-secondary" href="${escapeHtml(page)}" target="_blank" rel="noopener noreferrer">Event page ↗</a>`
      );
    }
    if (rsvp && url && rsvp !== url) {
      parts.push(
        `<a class="btn-secondary" href="${escapeHtml(rsvp)}" target="_blank" rel="noopener noreferrer">RSVP ↗</a>`
      );
    }
    return `<div class="event-actions">${parts.join("")}</div>`;
  }

  function detailsInner(event) {
    const parts = [];
    const description = fieldText(event.description);
    if (description) {
      parts.push(`<p class="event-description">${escapeHtml(description).replace(/\n/g, "<br>")}</p>`);
    } else {
      parts.push(`<p class="event-description is-empty">No description posted.</p>`);
    }
    const speakers = speakersLabel(event.speakers);
    if (speakers) {
      parts.push(`<p class="detail-line"><span class="detail-label">Speakers</span> ${escapeHtml(speakers)}</p>`);
    }
    if (event.end) {
      const end = new Date(event.end);
      const start = new Date(event.start);
      if (!Number.isNaN(end.getTime()) && end > start) {
        parts.push(`<p class="detail-line"><span class="detail-label">Ends</span> ${escapeHtml(formatStartTime(event.end))}</p>`);
      }
    }
    const loc = locationText(event);
    if (loc) {
      const maps = fieldText(event.maps_url);
      const body = maps
        ? `<a href="${escapeHtml(maps)}" target="_blank" rel="noopener noreferrer">${escapeHtml(loc)}</a>`
        : escapeHtml(loc);
      parts.push(
        `<div class="event-venue"><span class="ms" aria-hidden="true">location_on</span><span>${body}</span></div>`
      );
    }
    const access = fieldText(event.access);
    if (access && access.toLowerCase() !== "rsvp") {
      parts.push(`<p class="detail-line"><span class="detail-label">Access</span> ${escapeHtml(access)}</p>`);
    }
    const formatRaw = fieldText(event.format);
    if (formatRaw && !isSimpleFormat(formatRaw)) {
      parts.push(`<p class="detail-line"><span class="detail-label">Format</span> ${escapeHtml(formatRaw)}</p>`);
    }
    const paid = costKind(event.cost) === "paid" ? fieldText(event.cost) : "";
    if (paid && paid.toLowerCase() !== "paid") {
      parts.push(`<p class="detail-line"><span class="detail-label">Cost</span> ${escapeHtml(paid)}</p>`);
    }
    parts.push(actionsHtml(event, "list"));
    return parts.join("");
  }

  function formatCardWhen(event) {
    const ymd = eventYmdInTz(event.start);
    const today = todayYmd();
    let day;
    if (ymdCmp(ymd, today) === 0) day = "Today";
    else if (ymdCmp(ymd, addDays(today, 1)) === 0) day = "Tomorrow";
    else day = `${WEEKDAYS_SHORT[weekdayIndex(ymd)]}, ${MONTHS_SMALL[ymd.m - 1]} ${ymd.d}`;
    return `${day} · ${formatStartTime(event.start)}`;
  }

  function renderEventRow(event) {
    const open = state.openEventId === event.id;
    const ideo = ideologyView(event);
    const detailsId = domId("details", event.id);
    const org = orgLine(event);
    return `
      <article class="event-row${open ? " is-open" : ""}" data-id="${escapeHtml(event.id)}">
        <button type="button" class="event-summary" aria-expanded="${open ? "true" : "false"}" aria-controls="${detailsId}">
          <span class="event-when">
            <span class="event-time">${escapeHtml(formatStartTime(event.start))}</span>
            <span class="event-format">${escapeHtml(formatLabel(event.format))}</span>
          </span>
          <span class="event-main">
            <span class="event-dateline">${escapeHtml(formatCardWhen(event))}</span>
            <span class="event-eyebrow">
              ${org ? `<span class="event-org">${escapeHtml(org)}</span>` : ""}
              ${ideo ? `<span class="event-ideo" style="color:${ideo.text || ideo.color}">${escapeHtml(ideo.label)}</span>` : ""}
            </span>
            <span class="event-title">${escapeHtml(event.title || "Untitled event")}</span>
            <span class="event-meta">${escapeHtml(metaLine(event))}</span>
            <span class="event-badges">
              <span class="event-badge">${escapeHtml(formatLabel(event.format))}</span>
              <span class="event-badge">${escapeHtml(costShort(event))}</span>
            </span>
          </span>
          <span class="ms chevron" aria-hidden="true">${open ? "expand_less" : "expand_more"}</span>
        </button>
        <div class="event-details" id="${detailsId}"${open ? "" : " hidden"}>${open ? detailsInner(event) : ""}</div>
      </article>
    `;
  }

  function renderDaySection(ymd, events, today) {
    const headingId = domId("day", ymdKey(ymd));
    const body = events.length
      ? events.map(renderEventRow).join("")
      : `<p class="day-empty">Nothing listed for this day.</p>`;
    return `
      <section class="day-group" aria-labelledby="${headingId}">
        <div class="day-head" id="${headingId}">
          <span class="day-rel">${escapeHtml(relLabel(ymd, today))}</span>
          <h3 class="day-date">${escapeHtml(formatLongDate(ymd))}</h3>
        </div>
        ${body}
      </section>
    `;
  }

  function renderCalendarCard(event) {
    const open = state.openEventId === event.id;
    const ideo = ideologyView(event);
    const color = ideo ? ideo.color : "#CABEB1";
    const detailsId = domId("card-details", event.id);
    const org = orgLine(event);
    const more = open
      ? `<div class="cal-card-more" id="${detailsId}">
          ${detailsInner(event)}
        </div>`
      : `<div class="cal-card-more" id="${detailsId}" hidden></div>`;
    return `
      <article class="cal-card" data-id="${escapeHtml(event.id)}" style="--ideo:${color}">
        <button type="button" class="cal-card-hit" aria-expanded="${open ? "true" : "false"}" aria-controls="${detailsId}">
          <span class="cal-card-time">${escapeHtml(formatStartTime(event.start))}</span>
          <span class="cal-card-title">${escapeHtml(event.title || "Untitled event")}</span>
          ${org ? `<span class="cal-card-org">${escapeHtml(org)}</span>` : ""}
          <span class="cal-tags">
            <span class="cal-tag">${escapeHtml(formatLabel(event.format))}</span>
            <span class="cal-tag">${escapeHtml(costShort(event))}</span>
          </span>
        </button>
        ${more}
      </article>
    `;
  }

  function renderList(events) {
    if (!eventsLoaded) {
      els.eventList.innerHTML = `<p class="loading">Loading events…</p>`;
      return;
    }
    const today = todayYmd();
    if (isPhoneLayout()) {
      const ymd = state.listStart || today;
      els.eventList.innerHTML = renderDaySection(ymd, eventsOnDay(ymd, events), today);
      return;
    }
    const html = [0, 1, 2]
      .map((offset) => {
        const ymd = addDays(state.listStart, offset);
        return renderDaySection(ymd, eventsOnDay(ymd, events), today);
      })
      .join("");
    els.eventList.innerHTML = html;
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function isPhoneLayout() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function activeFilterCount() {
    const f = getFilters();
    let count = 0;
    if (f.search) count += 1;
    if (f.from || f.to) count += 1;
    count += (f.topics || []).length;
    count += f.ideologies.length;
    count += (f.time || []).length;
    if (f.freeFood) count += 1;
    if (f.freeDrinks) count += 1;
    if (f.yp) count += 1;
    if (f.cost && f.cost !== "all") count += 1;
    if (f.format && f.format !== "all") count += 1;
    return count;
  }

  function syncPhoneDom() {
    const phone = isPhoneLayout();
    document.body.classList.toggle("is-phone", phone);
    const search = document.getElementById("search-block");
    const searchHome = document.getElementById("search-home");
    const searchSlot = document.getElementById("phone-search-slot");
    const mini = document.querySelector(".mini-cal-block");
    const miniHome = document.getElementById("mini-home");
    const monthSlot = document.getElementById("month-slot");
    if (search && searchHome && searchSlot) {
      const target = phone ? searchSlot : searchHome;
      if (search.parentElement !== target) target.appendChild(search);
    }
    if (mini && miniHome && monthSlot) {
      const target = phone ? monthSlot : miniHome;
      if (mini.parentElement !== target) target.appendChild(mini);
    }
    document.querySelectorAll(".section-toggle").forEach((btn) => {
      if (phone) btn.removeAttribute("tabindex");
      else btn.setAttribute("tabindex", "-1");
    });
    if (els.dateRange && els.moreDates) {
      if (phone) els.dateRange.hidden = false;
      else els.dateRange.hidden = els.moreDates.getAttribute("aria-expanded") !== "true";
    }
    if (!phone) {
      closeMenu();
      closeMonthSheet(false);
    }
  }

  function renderPhoneStrip(events) {
    if (!els.phoneStrip) return;
    const today = todayYmd();
    const selected = state.listStart || today;
    let last = horizonEnd();
    const cap = addDays(today, 120);
    if (ymdCmp(last, cap) > 0) last = cap;
    if (ymdCmp(selected, last) > 0) last = selected;
    const parts = [];
    for (let ymd = today; ymdCmp(ymd, last) <= 0; ymd = addDays(ymd, 1)) {
      const count = eventsOnDay(ymd, events).length;
      const selectedDay = ymdCmp(ymd, selected) === 0;
      const dow = ymdCmp(ymd, today) === 0 ? "Today" : WEEKDAYS_SHORT[weekdayIndex(ymd)];
      parts.push(
        `<button type="button" class="phone-day${selectedDay ? " is-selected" : ""}${count ? " has-events" : ""}" role="tab" data-ymd="${ymdKey(ymd)}" aria-selected="${selectedDay ? "true" : "false"}" aria-label="${escapeHtml(formatLongDate(ymd))}, ${count} event${count === 1 ? "" : "s"}">` +
          `<span class="phone-dow">${escapeHtml(dow)}</span>` +
          `<span class="phone-num">${ymd.d}</span>` +
          `<span class="phone-dot"></span>` +
        `</button>`
      );
    }
    els.phoneStrip.innerHTML = parts.join("");
    const current = els.phoneStrip.querySelector(".is-selected");
    if (current) {
      const left = current.offsetLeft - (els.phoneStrip.clientWidth - current.offsetWidth) / 2;
      els.phoneStrip.scrollLeft = Math.max(0, left);
    }
  }

  function renderWeek(events) {
    const today = todayYmd();
    const mobile = isMobileLayout();
    const columns = [];
    const strip = [];
    for (let i = 0; i < 7; i += 1) {
      const ymd = addDays(state.weekStart, i);
      const dayEvents = eventsOnDay(ymd, events);
      const isToday = ymdCmp(ymd, today) === 0;
      const selected = state.stripDay && ymdCmp(ymd, state.stripDay) === 0;
      if (!mobile) {
        const body = dayEvents.length
          ? dayEvents.map(renderCalendarCard).join("")
          : `<p class="week-empty">Nothing listed</p>`;
        columns.push(`
          <div class="week-col${isToday ? " is-today" : ""}">
            <div class="week-col-head">
              <span class="week-col-dow">${WEEKDAYS_SHORT[weekdayIndex(ymd)]}</span>
              <span class="week-col-num">${ymd.d}</span>
            </div>
            <div class="week-col-body">${body}</div>
          </div>
        `);
      } else {
        strip.push(`
          <button type="button" class="strip-btn${selected ? " is-selected" : ""}${dayEvents.length ? " has-events" : ""}" role="tab" data-ymd="${ymdKey(ymd)}" aria-selected="${selected ? "true" : "false"}" aria-label="${escapeHtml(formatLongDate(ymd))}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}">
            <span class="dow">${WEEKDAYS_SHORT[weekdayIndex(ymd)]}</span>
            <span class="n">${ymd.d}</span>
            <span class="strip-dot"></span>
          </button>
        `);
      }
    }
    if (mobile) {
      els.weekBoard.innerHTML = "";
      els.dayStrip.innerHTML = strip.join("");
      const stripYmd = state.stripDay && inYmdRange(state.stripDay, { start: state.weekStart, end: addDays(state.weekStart, 6) })
        ? state.stripDay
        : state.weekStart;
      state.stripDay = stripYmd;
      const stripEvents = eventsOnDay(stripYmd, events);
      const stripBody = stripEvents.length
        ? stripEvents.map(renderEventRow).join("")
        : `<p class="day-empty">Nothing listed for this day.</p>`;
      els.stripDay.innerHTML = `
        <section class="day-group" aria-labelledby="strip-heading">
          <div class="day-head" id="strip-heading">
            <span class="day-rel">${escapeHtml(relLabel(stripYmd, today))}</span>
            <h3 class="day-date">${escapeHtml(formatLongDate(stripYmd))}</h3>
          </div>
          ${stripBody}
        </section>
      `;
    } else {
      els.weekBoard.innerHTML = columns.join("");
      els.dayStrip.innerHTML = "";
      els.stripDay.innerHTML = "";
    }
  }

  function dayCounts() {
    const counts = new Map();
    const cal = calendarWindow();
    filteredEvents().forEach((event) => {
      const ymd = eventYmdInTz(event.start);
      if (!inYmdRange(ymd, cal)) return;
      const key = ymdKey(ymd);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }

  function renderMiniCalendar() {
    if (state.miniYear == null || state.miniMonth == null) {
      const today = todayYmd();
      state.miniYear = today.y;
      state.miniMonth = today.m;
    }
    const title = formatMonthTitle(state.miniYear, state.miniMonth);
    els.calendarMonth.textContent = title;
    const today = todayYmd();
    const counts = dayCounts();
    const firstWeekday = weekdayIndex({ y: state.miniYear, m: state.miniMonth, d: 1 });
    const dim = daysInMonthUtc(state.miniYear, state.miniMonth);
    const prevDays = daysInMonthUtc(state.miniYear, state.miniMonth === 1 ? 12 : state.miniMonth - 1);
    const totalCells = Math.ceil((firstWeekday + dim) / 7) * 7;
    const rangeStart = state.listStart;
    const rangeEnd = addDays(state.listStart, 2);
    const cells = [];
    for (let i = 0; i < totalCells; i += 1) {
      let dayNum;
      let cellYear = state.miniYear;
      let cellMonth = state.miniMonth;
      let outside = false;
      if (i < firstWeekday) {
        dayNum = prevDays - firstWeekday + 1 + i;
        const prev = monthOf(state.miniYear, state.miniMonth, -1);
        cellYear = prev.y;
        cellMonth = prev.m;
        outside = true;
      } else if (i >= firstWeekday + dim) {
        dayNum = i - firstWeekday - dim + 1;
        const next = monthOf(state.miniYear, state.miniMonth, 1);
        cellYear = next.y;
        cellMonth = next.m;
        outside = true;
      } else {
        dayNum = i - firstWeekday + 1;
      }
      const ymd = { y: cellYear, m: cellMonth, d: dayNum };
      const key = ymdKey(ymd);
      const count = counts.get(key) || 0;
      const cal = calendarWindow();
      const inWindow = inYmdRange(ymd, cal);
      const isToday = ymdCmp(today, ymd) === 0;
      const inRange = state.view === "list" && ymdCmp(ymd, rangeStart) >= 0 && ymdCmp(ymd, rangeEnd) <= 0;
      const classes = ["cal-cell"];
      if (outside) classes.push("is-outside");
      if (count) classes.push("has-events");
      if (inRange && inWindow) classes.push("is-range");
      if (isToday) classes.push("is-today");
      const label = !inWindow
        ? ymdCmp(ymd, cal.start) < 0
          ? `${formatLongDate(ymd)}, in the past`
          : `${formatLongDate(ymd)}, outside the calendar`
        : count
          ? `${formatLongDate(ymd)}, ${count} event${count === 1 ? "" : "s"}`
          : `${formatLongDate(ymd)}, no events`;
      cells.push(
        `<button type="button" class="${classes.join(" ")}" data-ymd="${key}" aria-pressed="${inRange && inWindow ? "true" : "false"}"${isToday ? ' aria-current="date"' : ""}${inWindow ? "" : " disabled"} aria-label="${escapeHtml(label)}"><span>${dayNum}</span><span class="cal-dot"></span></button>`
      );
    }
    els.calendarGrid.innerHTML = cells.join("");
    els.calendarGrid.setAttribute("aria-label", title);
    const prevMonth = monthOf(state.miniYear, state.miniMonth, -1);
    const nextMonth = monthOf(state.miniYear, state.miniMonth, 1);
    els.calPrev.disabled = !monthOverlapsCalendar(prevMonth.y, prevMonth.m);
    els.calNext.disabled = !monthOverlapsCalendar(nextMonth.y, nextMonth.m);
    if (focusYmdKey) {
      const button = els.calendarGrid.querySelector(`button[data-ymd="${focusYmdKey}"]`);
      focusYmdKey = null;
      if (button) button.focus();
    }
  }

  function updateIdeologyCounts() {
    const f = getFilters();
    const base = { ...f, ideologies: [] };
    const counts = Object.fromEntries(IDEOLOGIES.map((item) => [item.id, 0]));
    allEvents.forEach((event) => {
      if (!matches(event, base)) return;
      IDEOLOGIES.forEach((ideo) => {
        if (matchesIdeology(event, [ideo.id])) counts[ideo.id] += 1;
      });
    });
    IDEOLOGIES.forEach((ideo) => {
      const el = document.querySelector(`[data-count-for="${ideo.id}"]`);
      if (el) el.textContent = String(counts[ideo.id] || 0);
    });
  }

  function visibleCount(events) {
    if (state.view === "calendar") {
      let n = 0;
      for (let i = 0; i < 7; i += 1) n += eventsOnDay(addDays(state.weekStart, i), events).length;
      return n;
    }
    let n = 0;
    for (let i = 0; i < 3; i += 1) n += eventsOnDay(addDays(state.listStart, i), events).length;
    return n;
  }

  function canShiftWeek(delta) {
    const next = addDays(state.weekStart, delta * 7);
    if (delta < 0 && ymdCmp(next, todayYmd()) < 0) return false;
    if (delta > 0 && ymdCmp(next, horizonEnd()) > 0) return false;
    return true;
  }

  function updateChrome(events) {
    const today = todayYmd();
    const phone = isPhoneLayout();
    const calendar = state.view === "calendar" && !phone;
    document.body.classList.toggle("is-calendar", calendar);
    els.listView.hidden = calendar;
    els.calView.hidden = !calendar;
    els.weekPrev.hidden = !calendar;
    els.weekNext.hidden = !calendar;
    if (calendar) {
      els.weekPrev.disabled = !canShiftWeek(-1);
      els.weekNext.disabled = !canShiftWeek(1);
    }
    const icon = els.viewToggle.querySelector(".ms");
    if (icon) icon.textContent = calendar ? "view_agenda" : "calendar_month";
    if (els.viewToggleLabel) els.viewToggleLabel.textContent = calendar ? "List view" : "Calendar";
    els.viewToggle.setAttribute("aria-pressed", calendar ? "true" : "false");

    if (phone) {
      const ymd = state.listStart || today;
      const rel = relLabel(ymd, today);
      els.mainTitle.textContent = rel === "Today" || rel === "Tomorrow" ? rel : formatLongDate(ymd);
      els.mainRange.textContent = formatLongDate(ymd);
      els.backToday.hidden = ymdCmp(ymd, today) === 0;
    } else if (calendar) {
      const a = state.weekStart;
      const b = addDays(a, 6);
      els.mainTitle.textContent = ymdCmp(a, today) === 0 ? "This week" : formatTitleRange(a, b);
      els.mainRange.textContent = formatSmallRange(a, b);
      els.backToday.hidden = ymdCmp(a, today) === 0;
    } else {
      const a = state.listStart;
      const b = addDays(a, 2);
      els.mainTitle.textContent = ymdCmp(a, today) === 0 ? "Next three days" : formatTitleRange(a, b);
      els.mainRange.textContent = formatSmallRange(a, b);
      els.backToday.hidden = ymdCmp(a, today) === 0;
    }

    const shown = eventsLoaded
      ? phone
        ? eventsOnDay(state.listStart || today, events).length
        : visibleCount(events)
      : 0;
    if (els.closeFilters) {
      els.closeFilters.textContent = eventsLoaded
        ? `Show ${shown} event${shown === 1 ? "" : "s"}`
        : "Show events";
    }
    if (els.meta) {
      if (!eventsLoaded) els.meta.textContent = "Loading events";
      else if (phone) {
        els.meta.textContent = `${shown} events, ${formatLongDate(state.listStart || today)}`;
      } else if (calendar) {
        els.meta.textContent = `${shown} events, ${formatSmallRange(state.weekStart, addDays(state.weekStart, 6))}`;
      } else {
        els.meta.textContent = `${shown} events, ${formatSmallRange(state.listStart, addDays(state.listStart, 2))}`;
      }
    }
    const filtersOn = activeFilterCount();
    document.querySelectorAll("[data-filter-count]").forEach((badge) => {
      badge.hidden = filtersOn === 0;
      badge.textContent = String(filtersOn);
    });
  }

  function scrollPending() {
    if (!state.pendingScroll || !state.openEventId) return;
    const root = state.view === "calendar" ? els.calView : els.eventList;
    const card = root.querySelector(`[data-id="${cssEscape(state.openEventId)}"]`);
    state.pendingScroll = false;
    if (!card) return;
    const target = card.querySelector(".event-summary, .cal-card-hit");
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
    target.focus({ preventScroll: true });
  }

  function render() {
    syncPhoneDom();
    const events = eventsLoaded ? filteredEvents() : [];
    updateChrome(events);
    updateIdeologyCounts();
    renderMiniCalendar();
    if (isPhoneLayout()) {
      renderPhoneStrip(events);
      renderList(events);
      els.weekBoard.innerHTML = "";
      els.dayStrip.innerHTML = "";
      els.stripDay.innerHTML = "";
    } else if (state.view === "list") {
      renderList(events);
      els.weekBoard.innerHTML = "";
      els.dayStrip.innerHTML = "";
      els.stripDay.innerHTML = "";
      if (els.phoneStrip) els.phoneStrip.innerHTML = "";
    } else {
      els.eventList.innerHTML = "";
      renderWeek(events);
    }
    requestAnimationFrame(scrollPending);
  }

  function clearFilters() {
    els.search.value = "";
    els.dateFrom.value = "";
    els.dateTo.value = "";
    setIdeologies([]);
    setSegment("format", "all");
    setSegment("cost", "all");
    ["time", "topic", "perk"].forEach((name) => setChipValues(name, []));
    if (els.dateRange) els.dateRange.hidden = true;
    if (els.moreDates) els.moreDates.setAttribute("aria-expanded", "false");
    render();
  }

  function goToday() {
    const today = todayYmd();
    state.view = "list";
    state.listStart = today;
    state.weekStart = today;
    state.stripDay = today;
    state.miniYear = today.y;
    state.miniMonth = today.m;
    state.openEventId = null;
    closeFilterSheet(false);
    render();
  }

  function shiftWeek(delta) {
    if (!canShiftWeek(delta)) return;
    state.weekStart = addDays(state.weekStart, delta * 7);
    state.stripDay = state.weekStart;
    render();
  }

  function closeMenus(restore) {
    document.querySelectorAll(".cal-menu.is-open").forEach((menu) => {
      menu.classList.remove("is-open");
      const btn = menu.querySelector(".cal-menu-btn");
      const panel = menu.querySelector(".cal-menu-panel");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (panel) {
        panel.hidden = true;
        panel.classList.remove("is-up");
      }
      if (restore && btn) btn.focus();
    });
  }

  function openMenu(menu) {
    closeMenus(false);
    const btn = menu.querySelector(".cal-menu-btn");
    const panel = menu.querySelector(".cal-menu-panel");
    if (!btn || !panel) return;
    menu.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    const rect = panel.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) panel.classList.add("is-up");
    const first = panel.querySelector("[role='menuitem']");
    if (first) first.focus({ preventScroll: true });
  }

  function toggleOpen(id) {
    state.openEventId = state.openEventId === id ? null : id;
    render();
  }

  function findEvent(id) {
    return allEvents.find((item) => item.id === id);
  }

  function onResultClick(e) {
    const ics = e.target.closest("[data-ics]");
    if (ics) {
      e.preventDefault();
      const event = findEvent(ics.dataset.ics);
      if (event) downloadIcs(event);
      closeMenus(false);
      return;
    }
    const share = e.target.closest("[data-share]");
    if (share) {
      e.preventDefault();
      const event = findEvent(share.dataset.share);
      if (event) shareEvent(event, share);
      return;
    }
    const calBtn = e.target.closest(".cal-menu-btn");
    if (calBtn) {
      e.preventDefault();
      const menu = calBtn.closest(".cal-menu");
      if (!menu) return;
      if (menu.classList.contains("is-open")) closeMenus(false);
      else openMenu(menu);
      return;
    }
    if (e.target.closest(".cal-menu-panel")) {
      if (e.target.closest("a")) closeMenus(false);
      return;
    }
    if (e.target.closest("a, button")) {
      const summary = e.target.closest(".event-summary, .cal-card-hit");
      if (!summary) return;
    }
    const details = e.target.closest(".event-details, .cal-card-more");
    if (details && !e.target.closest("a, button")) {
      const selection = window.getSelection && window.getSelection();
      if (selection && !selection.isCollapsed && details.contains(selection.anchorNode)) return;
      const card = details.closest("[data-id]");
      if (card) toggleOpen(card.getAttribute("data-id"));
      return;
    }
    const summary = e.target.closest(".event-summary, .cal-card-hit");
    if (!summary) return;
    const card = summary.closest("[data-id]");
    if (!card) return;
    toggleOpen(card.getAttribute("data-id"));
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (!els.menuToggle) return;
    els.menuToggle.setAttribute("aria-expanded", "false");
    els.menuToggle.setAttribute("aria-label", "Open menu");
    const icon = els.menuToggle.querySelector(".ms");
    if (icon) icon.textContent = "menu";
  }

  function openMenuPanel() {
    closeMonthSheet(false);
    closeFilterSheet(false);
    document.body.classList.add("menu-open");
    els.menuToggle.setAttribute("aria-expanded", "true");
    els.menuToggle.setAttribute("aria-label", "Close menu");
    const icon = els.menuToggle.querySelector(".ms");
    if (icon) icon.textContent = "close";
    const first = [...document.querySelectorAll("#overflow-menu button, #overflow-menu a")].find(
      (el) => !el.hidden && el.offsetParent !== null
    );
    if (first) first.focus();
  }

  function openMonthSheet() {
    if (!isPhoneLayout() || !els.monthSheet) return;
    closeMenu();
    closeFilterSheet(false);
    document.body.classList.add("month-open");
    els.monthSheet.hidden = false;
    if (els.closeMonth) els.closeMonth.focus();
  }

  function closeMonthSheet(restore) {
    const was = document.body.classList.contains("month-open");
    document.body.classList.remove("month-open");
    if (els.monthSheet) els.monthSheet.hidden = true;
    if (was && restore && els.openMonth) els.openMonth.focus();
  }

  function filtersOpener() {
    if (isPhoneLayout() && els.openFiltersPhone) return els.openFiltersPhone;
    return els.openFilters;
  }

  function openFilterSheet() {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    closeMenu();
    closeMonthSheet(false);
    document.body.classList.add("filters-open");
    els.sidebar.setAttribute("role", "dialog");
    els.sidebar.setAttribute("aria-modal", "true");
    els.sidebar.setAttribute("aria-labelledby", "filters-heading");
    if (els.sheetBackdrop) els.sheetBackdrop.hidden = false;
    const start = isPhoneLayout()
      ? [...els.sidebar.querySelectorAll(".section-toggle")].find((el) => !el.closest("[hidden]"))
      : document.getElementById("sheet-clear") || els.search;
    if (start) start.focus();
  }

  function closeFilterSheet(restore) {
    const was = document.body.classList.contains("filters-open");
    document.body.classList.remove("filters-open");
    els.sidebar.removeAttribute("role");
    els.sidebar.removeAttribute("aria-modal");
    if (els.sheetBackdrop) els.sheetBackdrop.hidden = true;
    const opener = filtersOpener();
    if (was && restore && opener) opener.focus();
  }

  function trapIn(e, root) {
    if (e.key !== "Tab" || !root) return;
    const focusable = root.querySelectorAll("button, [href], input, select, textarea");
    const list = [...focusable].filter((el) => !el.disabled && !el.closest("[hidden]") && el.offsetParent !== null);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function bind() {
    [els.search, els.dateFrom, els.dateTo].forEach((el) => {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    document.getElementById("ideo-list").addEventListener("change", render);
    els.sidebar.addEventListener("click", (e) => {
      const toggle = e.target.closest(".section-toggle");
      if (toggle && isPhoneLayout()) {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        const panel = document.getElementById(toggle.getAttribute("aria-controls"));
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        const block = toggle.closest(".filter-block");
        if (block) block.classList.toggle("is-collapsed", expanded);
        const icon = toggle.querySelector(".section-chevron");
        if (icon) icon.textContent = expanded ? "expand_more" : "expand_less";
        if (panel) panel.hidden = expanded;
        return;
      }
      const radio = e.target.closest(".segmented [role='radio']");
      if (radio && els.sidebar.contains(radio)) {
        setSegment(radio.closest(".segmented").dataset.filter, radio.dataset.value);
        render();
        return;
      }
      const chip = e.target.closest("button.chip");
      if (chip && els.sidebar.contains(chip)) {
        toggleChip(chip);
        render();
      }
    });
    els.sidebar.addEventListener("keydown", (e) => {
      const radio = e.target.closest(".segmented [role='radio']");
      if (!radio) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const buttons = [...radio.parentElement.querySelectorAll("[role='radio']")];
      const index = buttons.indexOf(radio);
      if (index < 0) return;
      e.preventDefault();
      const next = buttons[(index + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
      setSegment(radio.parentElement.dataset.filter, next.dataset.value);
      next.focus();
      render();
    });
    els.clear.addEventListener("click", clearFilters);
    if (els.sheetClear) els.sheetClear.addEventListener("click", clearFilters);
    if (els.sheetClearBottom) els.sheetClearBottom.addEventListener("click", clearFilters);
    els.moreDates.addEventListener("click", () => {
      const open = els.dateRange.hidden;
      els.dateRange.hidden = !open;
      els.moreDates.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && els.dateFrom) els.dateFrom.focus();
    });
    els.refresh.addEventListener("click", () => loadEvents("refresh"));
    els.brand.addEventListener("click", goToday);
    els.backToday.addEventListener("click", goToday);
    els.viewToggle.addEventListener("click", () => {
      if (state.view === "list") {
        state.view = "calendar";
        state.weekStart = state.listStart;
        state.stripDay = state.listStart;
      } else {
        state.view = "list";
      }
      closeFilterSheet(false);
      render();
    });
    els.openCalendar.addEventListener("click", () => {
      state.view = "calendar";
      state.weekStart = state.listStart;
      state.stripDay = state.listStart;
      closeFilterSheet(false);
      render();
    });
    els.weekPrev.addEventListener("click", () => shiftWeek(-1));
    els.weekNext.addEventListener("click", () => shiftWeek(1));
    els.calPrev.addEventListener("click", () => {
      const next = monthOf(state.miniYear, state.miniMonth, -1);
      if (!monthOverlapsCalendar(next.y, next.m)) return;
      state.miniYear = next.y;
      state.miniMonth = next.m;
      renderMiniCalendar();
    });
    els.calNext.addEventListener("click", () => {
      const next = monthOf(state.miniYear, state.miniMonth, 1);
      if (!monthOverlapsCalendar(next.y, next.m)) return;
      state.miniYear = next.y;
      state.miniMonth = next.m;
      renderMiniCalendar();
    });
    els.calendarGrid.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-ymd]");
      if (!button || button.disabled) return;
      const ymd = parseYmdKey(button.dataset.ymd);
      focusYmdKey = button.dataset.ymd;
      state.listStart = ymd;
      state.weekStart = ymd;
      state.stripDay = ymd;
      state.view = "list";
      state.miniYear = ymd.y;
      state.miniMonth = ymd.m;
      state.openEventId = null;
      closeFilterSheet(false);
      closeMonthSheet(false);
      render();
    });
    if (els.phoneStrip) {
      els.phoneStrip.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-ymd]");
        if (!button) return;
        const ymd = parseYmdKey(button.dataset.ymd);
        state.listStart = ymd;
        state.weekStart = ymd;
        state.stripDay = ymd;
        state.view = "list";
        state.miniYear = ymd.y;
        state.miniMonth = ymd.m;
        state.openEventId = null;
        render();
      });
    }
    if (els.menuToggle) {
      els.menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.body.classList.contains("menu-open")) closeMenu();
        else openMenuPanel();
      });
    }
    const overflow = document.getElementById("overflow-menu");
    if (overflow) {
      overflow.addEventListener("click", () => {
        if (isPhoneLayout()) closeMenu();
      });
    }
    if (els.openMonth) els.openMonth.addEventListener("click", openMonthSheet);
    if (els.closeMonth) els.closeMonth.addEventListener("click", () => closeMonthSheet(true));
    if (els.monthBackdrop) els.monthBackdrop.addEventListener("click", () => closeMonthSheet(true));
    els.dayStrip.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-ymd]");
      if (!button) return;
      state.stripDay = parseYmdKey(button.dataset.ymd);
      render();
    });
    els.eventList.addEventListener("click", onResultClick);
    els.calView.addEventListener("click", onResultClick);
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".cal-menu")) closeMenus(false);
      if (document.body.classList.contains("menu-open") && !e.target.closest(".top-actions")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (document.body.classList.contains("month-open")) trapIn(e, els.monthPanel);
      else if (document.body.classList.contains("filters-open")) trapIn(e, els.sidebar);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const panel = e.target.closest(".cal-menu-panel");
        if (!panel) return;
        const items = [...panel.querySelectorAll("[role='menuitem']")];
        const index = items.indexOf(document.activeElement);
        if (index < 0) return;
        e.preventDefault();
        const next = e.key === "ArrowDown"
          ? items[(index + 1) % items.length]
          : items[(index - 1 + items.length) % items.length];
        next.focus();
        return;
      }
      if (e.key !== "Escape") return;
      if (els.aboutDialog && els.aboutDialog.open) return;
      const openMenuEl = document.querySelector(".cal-menu.is-open");
      if (openMenuEl) {
        closeMenus(true);
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("month-open")) {
        closeMonthSheet(true);
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("menu-open")) {
        closeMenu();
        if (els.menuToggle) els.menuToggle.focus();
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("filters-open")) {
        closeFilterSheet(true);
        e.preventDefault();
        return;
      }
      if (state.openEventId) {
        const id = state.openEventId;
        state.openEventId = null;
        render();
        const card = document.querySelector(`[data-id="${cssEscape(id)}"] .event-summary, [data-id="${cssEscape(id)}"] .cal-card-hit`);
        if (card) card.focus();
      }
    });
    els.openFilters.addEventListener("click", openFilterSheet);
    if (els.openFiltersPhone) els.openFiltersPhone.addEventListener("click", openFilterSheet);
    els.closeFilters.addEventListener("click", () => closeFilterSheet(true));
    els.sheetBackdrop.addEventListener("click", () => closeFilterSheet(true));
    let wasMobile = isMobileLayout();
    let wasPhone = isPhoneLayout();
    window.addEventListener("resize", () => {
      if (!isMobileLayout()) closeFilterSheet(false);
      if (!isPhoneLayout()) {
        closeMenu();
        closeMonthSheet(false);
      }
      const mobile = isMobileLayout();
      const phone = isPhoneLayout();
      if (mobile !== wasMobile || phone !== wasPhone) {
        wasMobile = mobile;
        wasPhone = phone;
        render();
      }
    });

    els.aboutOpen.addEventListener("click", () => {
      if (els.aboutDialog.showModal) els.aboutDialog.showModal();
      else els.aboutDialog.setAttribute("open", "");
    });
    els.aboutClose.addEventListener("click", () => {
      if (els.aboutDialog.close) els.aboutDialog.close();
      else els.aboutDialog.removeAttribute("open");
    });

    bindInstall();
    bindPullToRefresh();
  }

  function abortAfter(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  function setRefreshStatus(message, kind) {
    const el = els.refreshStatus;
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-error", kind === "error");
  }

  function applyEventsPayload(data) {
    const raw = Array.isArray(data) ? data : data.events || [];
    allEvents = raw.filter(inListWindow);
    const win = listWindow();
    const min = ymdKey(win.start);
    const max = ymdKey(win.end);
    if (els.dateFrom) {
      els.dateFrom.min = min;
      els.dateFrom.max = max;
    }
    if (els.dateTo) {
      els.dateTo.min = min;
      els.dateTo.max = max;
    }
    topicCatalog = deriveTopics(allEvents);
    renderTopicChips(topicCatalog);
    eventsLoaded = true;
    applyDeepLink();
    render();
  }

  function showLoadFailure(err) {
    setRefreshStatus("Failed — try again", "error");
    if (eventsLoaded) return;
    if (els.meta) els.meta.textContent = "Could not load events.";
    els.eventList.innerHTML = `<p class="day-empty">Could not load events. ${escapeHtml(
      err && err.message ? err.message : err
    )}</p>`;
  }

  async function fetchEventsDocument(url) {
    const res = await fetch(url, {
      cache: "no-store",
      signal: abortAfter(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fromCache = res.headers.get("X-DC-Events-Source") === "cache";
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid events JSON");
    }
    const events = Array.isArray(data) ? data : data && data.events;
    if (!Array.isArray(events)) throw new Error("No events array");
    return { text, data, fromCache, events };
  }

  async function loadEvents(reason) {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = loadEventsNow(reason).finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  async function loadEventsNow(reason) {
    const explicit = reason === "refresh" || reason === "pull";
    if (els.refresh) els.refresh.disabled = true;
    if (explicit) setRefreshStatus("Updating…");
    try {
      let payload = null;
      let usedFallback = false;
      try {
        const remote = await fetchEventsDocument(`${REMOTE_EVENTS_URL}?ts=${Date.now()}`);
        if (remote.fromCache) throw new Error("Stale cache");
        payload = remote;
      } catch (err) {
        usedFallback = true;
        payload = await fetchEventsDocument(`data/events.json?ts=${Date.now()}`);
      }
      lastFetchedAt = Date.now();
      if (payload.text === lastPayload && eventsLoaded) {
        if (explicit || usedFallback) {
          setRefreshStatus(usedFallback ? "Showing saved copy" : "Updated just now", payload.fromCache ? "error" : "");
        }
        return;
      }
      lastPayload = payload.text;
      applyEventsPayload(payload.data);
      if (explicit || usedFallback) {
        if (usedFallback && payload.fromCache) setRefreshStatus("Offline — saved copy", "error");
        else if (usedFallback) setRefreshStatus("Showing saved copy");
        else setRefreshStatus("Updated just now");
      } else {
        setRefreshStatus("");
      }
    } catch (err) {
      showLoadFailure(err);
      console.error(err);
    } finally {
      if (els.refresh) els.refresh.disabled = false;
    }
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    const ua = window.navigator.userAgent || "";
    const classic = /iPad|iPhone|iPod/.test(ua);
    const ipadOs = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    return classic || ipadOs;
  }

  function bindInstall() {
    const tipDismissed = (() => {
      try {
        return localStorage.getItem(INSTALL_TIP_KEY) === "1";
      } catch (err) {
        return false;
      }
    })();
    if (els.installTip && isIos() && !isStandalone() && !tipDismissed) {
      els.installTip.hidden = false;
    }
    if (els.installTipDismiss) {
      els.installTipDismiss.addEventListener("click", () => {
        if (els.installTip) els.installTip.hidden = true;
        try {
          localStorage.setItem(INSTALL_TIP_KEY, "1");
        } catch (err) {
          /* Private mode can block storage; the tip still closes. */
        }
      });
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (els.install && !isStandalone()) els.install.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      if (els.install) els.install.hidden = true;
      if (els.installTip) els.installTip.hidden = true;
    });
    if (els.install) {
      els.install.addEventListener("click", async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        try {
          await deferredInstallPrompt.userChoice;
        } catch (err) {
          /* The prompt can be dismissed without a choice result. */
        }
        deferredInstallPrompt = null;
        els.install.hidden = true;
      });
    }
  }

  function bindPullToRefresh() {
    const indicator = els.pullIndicator;
    if (!indicator) return;
    let startY = 0;
    let pulling = false;
    let dy = 0;
    const threshold = 72;

    window.addEventListener(
      "touchstart",
      (event) => {
        if (window.scrollY > 0 || event.touches.length !== 1) {
          pulling = false;
          return;
        }
        startY = event.touches[0].clientY;
        dy = 0;
        pulling = true;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (event) => {
        if (!pulling || event.touches.length !== 1) return;
        if (window.scrollY > 0) {
          pulling = false;
          indicator.hidden = true;
          return;
        }
        dy = event.touches[0].clientY - startY;
        if (dy > 28) {
          indicator.hidden = false;
          indicator.textContent = dy > threshold ? "Release to refresh" : "Pull to refresh";
        } else {
          indicator.hidden = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("touchend", () => {
      const release = pulling && dy > threshold;
      pulling = false;
      dy = 0;
      indicator.hidden = true;
      indicator.textContent = "Pull to refresh";
      if (release) loadEvents("pull");
    });
  }

  function bindFocusRefresh() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (eventsLoaded && Date.now() - lastFetchedAt < FOCUS_REFRESH_MS) return;
      loadEvents("focus");
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;
    const reloadOnce = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "shell-updated") return;
      const port = event.ports && event.ports[0];
      if (port) {
        try {
          port.postMessage("ok");
        } catch (err) {
          /* The worker falls back to navigating this window itself. */
        }
      }
      setTimeout(reloadOnce, 40);
    });
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        check();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function init() {
    const today = todayYmd();
    state.listStart = today;
    state.weekStart = today;
    state.stripDay = today;
    state.miniYear = today.y;
    state.miniMonth = today.m;
    bind();
    bindFocusRefresh();
    registerServiceWorker();
    render();
    loadEvents("startup");
  }

  init();
})();

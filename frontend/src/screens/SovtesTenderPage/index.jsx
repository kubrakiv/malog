import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TenderCard from "./TenderCard";
import {
  fetchTenderGroups,
  fetchCurrentTenders,
  fetchMyTenders,
  fetchBasicDetails,
  fetchNotInterested,
  fetchCompleteRoutes,
} from "./tendersService";
import { useSovtesEvents } from "../../contexts/SovtesRealtimeContext.jsx";
import "./style.scss";

const PAGE_SIZE = 20;
const REVEAL_STEP = 5;
const HIDDEN_TAB_ID = "hidden";
const ARCHIVE_TAB_ID = "archive";
// Backend group id=6 is "Архів" — we handle archive ourselves via getCompleteRoutes
const BACKEND_ARCHIVE_GROUP_ID = 6;
// Price/km and price-sum live only on the detailed card payload (not the lightweight
// tender list), so these sort modes need a one-off full-detail fetch — see priceSortData.
const PRICE_SORT_VALUES = new Set(["price_km_desc", "price_km_asc", "price_sum_desc", "price_sum_asc"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniqueValues(arr, key) {
  return [...new Set(arr.map((t) => t[key]).filter(Boolean))];
}

// Mirrors TenderCard's own currentMinPrice/pricePerKm computation so sort order
// matches what's shown on the card.
function computeSortMetrics(card) {
  const maxPriceNum = parseFloat(card.maxquotewithcommission) || null;
  const currentMinPrice = parseFloat(card.routetender?.currentminpricewithcommission) || maxPriceNum;
  const distance = parseFloat(card.distance || card.km || card.routetender?.km) || null;
  const perKm = distance && currentMinPrice ? currentMinPrice / distance : null;
  return { sum: currentMinPrice || null, perKm };
}

function flatUniqueValues(arr, key) {
  return [
    ...new Set(
      arr.flatMap((t) => (Array.isArray(t[key]) ? t[key] : t[key] ? [t[key]] : []))
    ),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SovtesTenderPage() {
  // ── Data state ────────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState([]);
  const [allTenders, setAllTenders] = useState([]);
  const [hiddenTenders, setHiddenTenders] = useState([]);
  const [archiveData, setArchiveData] = useState({ data: [], total: 0 });
  const [cards, setCards] = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [activeTabId, setActiveTabId] = useState(null);
  const [page, setPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  // How many cards of the current page (up to PAGE_SIZE) are revealed — grows
  // by REVEAL_STEP as the user scrolls .tenders-list, reset on each new batch.
  const [visibleCount, setVisibleCount] = useState(REVEAL_STEP);
  const tendersListRef = useRef(null);
  const [onlyMyCustomers, setOnlyMyCustomers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tenderTypeFilter, setTenderTypeFilter] = useState(null); // null | "open" | "closed" | "blind"
  const [directionFilter, setDirectionFilter] = useState(null);   // null | "import" | "export" | "internal"
  const [bidStatusFilter, setBidStatusFilter] = useState(null);   // null | "winning" | "losing" | "following"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sortBy, setSortBy] = useState("deadline");
  // periodic -> {sum, perKm}, populated only while a price-based sort is active
  const [priceSortData, setPriceSortData] = useState({});
  const [loadingPriceSort, setLoadingPriceSort] = useState(false);

  const [detailedFilters, setDetailedFilters] = useState({
    loading_point: "",
    unloading_point: "",
    cartype: "",
    chargetype: "",
    dateFrom: "",
    dateTo: "",
  });

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [hasNewTenders, setHasNewTenders] = useState(false);

  // ── Tabs definition ───────────────────────────────────────────────────────────
  const tabs = useMemo(
    () => [
      // Exclude the backend archive group (id=6) — handled by our frontend tab
      ...groups.filter((g) => g.id !== BACKEND_ARCHIVE_GROUP_ID),
      { id: HIDDEN_TAB_ID, title: "Приховані", multistati: null },
      { id: ARCHIVE_TAB_ID, title: "Архів", multistati: null },
    ],
    [groups]
  );

  // ── Fetch init data ───────────────────────────────────────────────────────────
  const loadTenders = async () => {
    try {
      const [fetchedGroups, fetchedTenders] = await Promise.all([
        fetchTenderGroups(),
        onlyMyCustomers ? fetchMyTenders() : fetchCurrentTenders(),
      ]);

      const groupList = Array.isArray(fetchedGroups) ? fetchedGroups : [];
      setGroups(groupList);
      setAllTenders(Array.isArray(fetchedTenders) ? fetchedTenders : []);

      setActiveTabId((prev) => prev ?? groupList[0]?.id ?? null);
    } catch (e) {
      console.error("Failed to load tender data", e);
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    setLoadingInit(true);
    loadTenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyMyCustomers]);

  useEffect(() => {
    if (activeTabId !== HIDDEN_TAB_ID) return;
    fetchNotInterested()
      .then((d) => setHiddenTenders(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setHiddenTenders([]));
  }, [activeTabId]);

  useEffect(() => {
    if (activeTabId !== ARCHIVE_TAB_ID) return;
    setLoadingArchive(true);
    fetchCompleteRoutes(archivePage, PAGE_SIZE)
      .then((d) => {
        const rows = Array.isArray(d) ? d : d?.data || d?.routes || [];
        const total = d?.total ?? rows.length;
        setArchiveData({ data: rows, total });
      })
      .catch(() => setArchiveData({ data: [], total: 0 }))
      .finally(() => setLoadingArchive(false));
  }, [activeTabId, archivePage]);

  useEffect(() => {
    setPage(1);
  }, [activeTabId, tenderTypeFilter, directionFilter, bidStatusFilter, selectedCompany, detailedFilters, sortBy]);

  // ── Tab tenders ───────────────────────────────────────────────────────────────
  const tabTenders = useMemo(() => {
    if (activeTabId === HIDDEN_TAB_ID) return hiddenTenders;
    if (activeTabId === ARCHIVE_TAB_ID) return archiveData.data;
    const group = groups.find((g) => g.id === activeTabId);
    if (!group) return [];
    return allTenders.filter((t) =>
      Array.isArray(group.multistati)
        ? group.multistati.includes(t.contextstatus)
        : false
    );
  }, [activeTabId, groups, allTenders, hiddenTenders, archiveData.data]);

  // ── Tab counts ────────────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts = {};
    groups.forEach((g) => {
      counts[g.id] = allTenders.filter((t) =>
        Array.isArray(g.multistati) ? g.multistati.includes(t.contextstatus) : false
      ).length;
    });
    counts[HIDDEN_TAB_ID] = hiddenTenders.length;
    counts[ARCHIVE_TAB_ID] = archiveData.total;
    return counts;
  }, [groups, allTenders, hiddenTenders, archiveData.total]);

  // ── Active tab helpers (computed early — used by sortedTenders) ──────────────
  const activeTab = tabs.find((t) => t.id === activeTabId);
  // Playing tab: group whose multistati contains 101 (spec §3, §5)
  const isMyBidTab = !!(activeTab?.multistati?.includes(101));

  // ── Company counts from active tab ────────────────────────────────────────────
  const companyCounts = useMemo(() => {
    const counts = {};
    tabTenders.forEach((t) => {
      const co = t.clientCompany || null;
      if (co) counts[co] = (counts[co] || 0) + 1;
    });
    return counts;
  }, [tabTenders]);

  const companies = Object.keys(companyCounts).sort(
    (a, b) => companyCounts[b] - companyCounts[a]
  );

  // ── Filter options for detailed panel ─────────────────────────────────────────
  const filterOptions = useMemo(
    () => ({
      cartypes: flatUniqueValues(tabTenders, "cartype"),
      chargetypes: uniqueValues(tabTenders, "chargetype"),
      loadingPoints: flatUniqueValues(tabTenders, "loading_points"),
      unloadingPoints: flatUniqueValues(tabTenders, "unloading_points"),
    }),
    [tabTenders]
  );

  // ── Apply filters ─────────────────────────────────────────────────────────────
  const filteredTenders = useMemo(() => {
    return tabTenders.filter((t) => {
      // Tender type (freeforall / blindtender)
      if (tenderTypeFilter === "open"   && !t.freeforall) return false;
      if (tenderTypeFilter === "closed" && (t.freeforall || t.blindtender)) return false;
      if (tenderTypeFilter === "blind"  && !t.blindtender) return false;

      // Direction — spec §6 field: geographyContext (fallback to legacy variants)
      if (directionFilter) {
        const geo = (t.geographyContext ?? t.importexport ?? t.direction ?? "")
          .toString().toLowerCase();
        if (geo) {
          if (directionFilter === "import"   && !geo.includes("import")   && !geo.includes("імпорт"))   return false;
          if (directionFilter === "export"   && !geo.includes("export")   && !geo.includes("експорт"))  return false;
          if (directionFilter === "internal" && !geo.includes("internal") && !geo.includes("внутр"))    return false;
        }
      }

      // Company chip
      if (selectedCompany && t.clientCompany !== selectedCompany) return false;

      // Detailed filters — spec §7 fields
      if (detailedFilters.cartype) {
        const ct = Array.isArray(t.cartype) ? t.cartype : t.cartype ? [t.cartype] : [];
        if (!ct.includes(detailedFilters.cartype)) return false;
      }
      if (detailedFilters.chargetype && t.chargetype !== detailedFilters.chargetype) return false;

      if (detailedFilters.loading_point) {
        const pts = Array.isArray(t.loading_points) ? t.loading_points : [];
        if (!pts.includes(detailedFilters.loading_point)) return false;
      }
      if (detailedFilters.unloading_point) {
        const pts = Array.isArray(t.unloading_points) ? t.unloading_points : [];
        if (!pts.includes(detailedFilters.unloading_point)) return false;
      }

      if (detailedFilters.dateFrom && t.tenderavailableuntilmoment) {
        if (t.tenderavailableuntilmoment < detailedFilters.dateFrom) return false;
      }
      if (detailedFilters.dateTo && t.tenderavailableuntilmoment) {
        if (t.tenderavailableuntilmoment > detailedFilters.dateTo + " 23:59:59") return false;
      }

      return true;
    });
  }, [tabTenders, tenderTypeFilter, directionFilter, selectedCompany, detailedFilters]);

  // Stable string key for the filtered tab's id set. Realtime events (handleSovtesEvent)
  // call setAllTenders on every bid/ended/etc update, which gives filteredTenders a new
  // array reference even when its contents are unchanged — keying off this string instead
  // of the array reference stops those no-op updates from cancelling/restarting the
  // price-detail fetch below before it can resolve.
  const filteredTenderIdsKey = useMemo(
    () => filteredTenders.map((t) => t.periodic).filter(Boolean).join(","),
    [filteredTenders]
  );

  // ── Price sort data: lightweight list has no price/distance fields, so a price
  // sort needs a one-off full-detail fetch across the whole filtered tab ─────────
  useEffect(() => {
    if (!PRICE_SORT_VALUES.has(sortBy)) return;
    const ids = filteredTenderIdsKey ? filteredTenderIdsKey.split(",") : [];
    if (!ids.length) {
      setPriceSortData({});
      return;
    }
    let cancelled = false;
    setLoadingPriceSort(true);
    fetchBasicDetails(ids)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
        const map = {};
        list.forEach((c) => {
          map[String(c.periodic ?? c.id)] = computeSortMetrics(c);
        });
        setPriceSortData(map);
      })
      .catch((err) => {
        console.error("[SovtesTenderPage] price-sort detail fetch failed", err);
        if (!cancelled) setPriceSortData({});
      })
      .finally(() => {
        if (!cancelled) setLoadingPriceSort(false);
      });
    return () => { cancelled = true; };
  }, [sortBy, filteredTenderIdsKey]);

  // ── Sort + order (spec §5) ────────────────────────────────────────────────────
  const sortedTenders = useMemo(() => {
    // Playing tab and Archive tab: reverse the group list (spec §5)
    if (isMyBidTab || activeTabId === ARCHIVE_TAB_ID) {
      return [...filteredTenders].reverse();
    }
    if (PRICE_SORT_VALUES.has(sortBy)) {
      const metric = sortBy.startsWith("price_km") ? "perKm" : "sum";
      const dir = sortBy.endsWith("desc") ? -1 : 1;
      return [...filteredTenders].sort((a, b) => {
        const va = priceSortData[String(a.periodic)]?.[metric];
        const vb = priceSortData[String(b.periodic)]?.[metric];
        if (va == null && vb == null) return 0;
        if (va == null) return 1; // tenders missing price data sink to the end
        if (vb == null) return -1;
        return dir * (va - vb);
      });
    }
    if (sortBy === "deadline") {
      return [...filteredTenders].sort((a, b) => {
        const ta = a.tenderavailableuntilmoment || a.tenderuntil || "";
        const tb = b.tenderavailableuntilmoment || b.tenderuntil || "";
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
    }
    return filteredTenders;
  }, [filteredTenders, sortBy, isMyBidTab, activeTabId, priceSortData]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalItems =
    activeTabId === ARCHIVE_TAB_ID ? archiveData.total : sortedTenders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pagedPeriodicIds = useMemo(() => {
    if (activeTabId === ARCHIVE_TAB_ID) {
      return archiveData.data.map((t) => t.periodic).filter(Boolean);
    }
    return sortedTenders
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((t) => t.periodic)
      .filter(Boolean);
  }, [sortedTenders, page, activeTabId, archiveData.data]);

  const pagedPeriodicIdsRef = useRef([]);
  useEffect(() => { pagedPeriodicIdsRef.current = pagedPeriodicIds; }, [pagedPeriodicIds]);

  // ── Bid-status filter on card data (spec §7: minquote is detailed-only field) ─
  const displayCards = useMemo(() => {
    if (!bidStatusFilter) return cards;
    return cards.filter((card) => {
      if (bidStatusFilter === "winning")   return card.minquote?.mine === true;
      if (bidStatusFilter === "losing")    return !!(card.minquote && !card.minquote.mine);
      if (bidStatusFilter === "following") return !!(card.bookmarked || card.isfollowed);
      return true;
    });
  }, [cards, bidStatusFilter]);

  // ── Scroll reveal: show REVEAL_STEP cards at a time, up to the current batch ──
  useEffect(() => {
    setVisibleCount(REVEAL_STEP);
    if (tendersListRef.current) tendersListRef.current.scrollTop = 0;
  }, [pagedPeriodicIds, bidStatusFilter]);

  const handleListScroll = useCallback(() => {
    const el = tendersListRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount((v) => Math.min(displayCards.length, v + REVEAL_STEP));
    }
  }, [displayCards.length]);

  // ── Fetch basic details for visible ids ───────────────────────────────────────
  const lastFetchedIds = useRef("");
  // Tracks periodics the user bookmarked this session so re-fetches can't clear the flag
  const locallyBookmarked = useRef(new Set());
  const applyLocalBookmarks = (list) => {
    if (!locallyBookmarked.current.size) return list;
    return list.map((c) => {
      const key = String(c.periodic ?? c.id);
      return locallyBookmarked.current.has(key)
        ? { ...c, bookmarked: true, isfollowed: true }
        : c;
    });
  };
  useEffect(() => {
    // While a price sort's detail fetch is still in flight, sortedTenders falls back to
    // an unsorted tie order — skip fetching cards for that transient order so we don't
    // flash the wrong order before priceSortData resolves and triggers the real fetch.
    if (PRICE_SORT_VALUES.has(sortBy) && loadingPriceSort) return;
    const idsKey = pagedPeriodicIds.join(",");
    if (!pagedPeriodicIds.length) {
      setCards([]);
      return;
    }
    if (idsKey === lastFetchedIds.current) return;
    lastFetchedIds.current = idsKey;

    setLoadingCards(true);
    fetchBasicDetails(pagedPeriodicIds)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
        const byPeriodic = Object.fromEntries(
          list.map((c) => [String(c.periodic ?? c.id), c])
        );
        const ordered = pagedPeriodicIds
          .map((id) => byPeriodic[String(id)])
          .filter(Boolean);
        setCards(applyLocalBookmarks(ordered));
      })
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false));
  }, [pagedPeriodicIds, sortBy, loadingPriceSort]);

  // ── Bookmark optimistic patch ─────────────────────────────────────────────────
  const handleCardBookmark = (periodic) => {
    locallyBookmarked.current.add(String(periodic));
    setCards((prev) =>
      prev.map((c) =>
        String(c.periodic ?? c.id) === String(periodic)
          ? { ...c, bookmarked: true, isfollowed: true }
          : c
      )
    );
  };

  // ── Refresh handler ───────────────────────────────────────────────────────────
  const handleRefresh = () => {
    // Clear the guard so the pagedPeriodicIds useEffect will re-fetch cards even
    // if the ID list doesn't change (e.g. tender bookmarked but still on same tab)
    lastFetchedIds.current = "";
    loadTenders().then(() => {
      // After loadTenders resolves, React has queued re-renders but hasn't painted yet.
      // pagedPeriodicIdsRef still holds the pre-render value — same as the closure —
      // so we use it here as the best available ID list for an immediate re-fetch.
      // If the IDs change after re-render, the pagedPeriodicIds useEffect will fire
      // again (lastFetchedIds is now "" so the guard is cleared) and overwrite.
      const ids = pagedPeriodicIdsRef.current;
      if (ids.length) {
        setLoadingCards(true);
        fetchBasicDetails(ids)
          .then((data) => {
            const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
            const byPeriodic = Object.fromEntries(
              list.map((c) => [String(c.periodic ?? c.id), c])
            );
            setCards(applyLocalBookmarks(ids.map((id) => byPeriodic[String(id)]).filter(Boolean)));
          })
          .catch(() => setCards([]))
          .finally(() => setLoadingCards(false));
      }
    });
  };

  // ── Real-time event handler ───────────────────────────────────────────────────
  const cardsRef = useRef([]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const handleSovtesEvent = useCallback((event) => {
    const { type, periodic, id: eventHashedId } = event;

    if (type === "tenderCreated") {
      setHasNewTenders(true);
      return;
    }

    if (type === "updated" && periodic) {
      // `updated` payload has periodic — targeted single-card re-fetch
      fetchBasicDetails([periodic])
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
          if (list.length > 0) {
            setCards((prev) =>
              applyLocalBookmarks(
                prev.map((c) =>
                  String(c.periodic ?? c.id) === String(periodic) ? list[0] : c
                )
              )
            );
          }
        })
        .catch(() => {});
      return;
    }

    // bid / ended / winnerChoosen / deleted / revived
    // Payload has no periodic — only eventHashedId (tender's hashedId).
    // Try to find the matching visible card; if found, re-fetch just that one;
    // otherwise re-fetch all visible cards so we don't miss anything.
    const matchCard = eventHashedId
      ? cardsRef.current.find(
          (c) => c.hashedId === eventHashedId || c.id_hashed === eventHashedId
        )
      : null;

    const periodicIds = matchCard
      ? [matchCard.periodic ?? matchCard.id]
      : pagedPeriodicIdsRef.current;

    // Also refresh the lightweight list so tab counts stay current
    const fetchList = onlyMyCustomers ? fetchMyTenders : fetchCurrentTenders;
    fetchList()
      .then((d) => setAllTenders(Array.isArray(d) ? d : []))
      .catch(() => {});

    if (periodicIds.length > 0) {
      fetchBasicDetails(periodicIds)
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
          if (list.length === 0) return;
          const byPeriodic = Object.fromEntries(
            list.map((c) => [String(c.periodic ?? c.id), c])
          );
          setCards((prev) =>
            applyLocalBookmarks(
              prev.map((c) => byPeriodic[String(c.periodic ?? c.id)] ?? c)
            )
          );
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyMyCustomers]);

  useSovtesEvents(handleSovtesEvent);

  // ── Tab change — clear all chip filters ───────────────────────────────────────
  const handleTabChange = (tabId) => {
    setActiveTabId(tabId);
    setTenderTypeFilter(null);
    setDirectionFilter(null);
    setBidStatusFilter(null);
    setSelectedCompany(null);
    setPage(1);
  };

  // ── Clear all filters ─────────────────────────────────────────────────────────
  const clearFilters = () => {
    setTenderTypeFilter(null);
    setDirectionFilter(null);
    setBidStatusFilter(null);
    setSelectedCompany(null);
    setDetailedFilters({ loading_point: "", unloading_point: "", cartype: "", chargetype: "", dateFrom: "", dateTo: "" });
  };

  const hasActiveFilters =
    tenderTypeFilter || directionFilter || bidStatusFilter || selectedCompany ||
    Object.values(detailedFilters).some(Boolean);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <div className="tenders-container">
        <p className="tenders-loading">Завантаження тендерів...</p>
      </div>
    );
  }

  return (
    <div className="tenders-container">

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="tenders-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tenders-tab ${activeTabId === tab.id ? "tenders-tab--active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.title}
            {tabCounts[tab.id] > 0 && (
              <span className="tenders-tab__count">{tabCounts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── New-tenders banner ────────────────────────────────────────────── */}
      {hasNewTenders && (
        <button
          className="tenders-new-banner"
          onClick={() => { setHasNewTenders(false); handleRefresh(); }}
        >
          Нові тендери доступні — натисніть для оновлення
        </button>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="tenders-filter-bar">
        <div className="tenders-filter-chips">
          {isMyBidTab ? (
            // Bid-status chips for "Приймаю участь" and similar tabs
            <>
              {[
                { key: "winning",   label: "Моя пропозиція найкраща" },
                { key: "losing",    label: "Є краща пропозиція" },
                { key: "following", label: "Слідкую" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-chip ${bidStatusFilter === key ? "filter-chip--active" : ""}`}
                  onClick={() => setBidStatusFilter((v) => (v === key ? null : key))}
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            // Direction + type chips for all other tabs
            <>
              {[
                { key: "import",   label: "Імпорт",    set: setDirectionFilter, current: directionFilter },
                { key: "export",   label: "Експорт",   set: setDirectionFilter, current: directionFilter },
                { key: "internal", label: "Внутрішні", set: setDirectionFilter, current: directionFilter },
                { key: "open",     label: "Відкриті",  set: setTenderTypeFilter, current: tenderTypeFilter },
                { key: "closed",   label: "Закриті",   set: setTenderTypeFilter, current: tenderTypeFilter },
                { key: "blind",    label: "Сліпі",     set: setTenderTypeFilter, current: tenderTypeFilter },
              ].map(({ key, label, set, current }) => (
                <button
                  key={key}
                  className={`filter-chip ${current === key ? "filter-chip--active" : ""}`}
                  onClick={() => set((v) => (v === key ? null : key))}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="tenders-filter-controls">
          <div className="tenders-customer-toggle">
            <button
              className={onlyMyCustomers ? "customer-btn customer-btn--active" : "customer-btn"}
              onClick={() => setOnlyMyCustomers(true)}
            >
              Мої замовники
            </button>
            <button
              className={!onlyMyCustomers ? "customer-btn customer-btn--active" : "customer-btn"}
              onClick={() => setOnlyMyCustomers(false)}
            >
              Всі замовники
            </button>
          </div>

          <button
            className={`tc-icon-btn ${showFilters ? "tc-icon-btn--active" : ""}`}
            title="Налаштування фільтрів"
            onClick={() => setShowFilters((v) => !v)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <button
            className={`tenders-all-filters-btn ${hasActiveFilters ? "tenders-all-filters-btn--active" : ""}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Всі фільтри
            {hasActiveFilters && (
              <span className="tenders-all-filters-btn__dot" />
            )}
          </button>
        </div>
      </div>

      {/* ── Company chips ─────────────────────────────────────────────────── */}
      {companies.length > 0 && (
        <div className="tenders-company-chips">
          {companies.map((co) => (
            <button
              key={co}
              className={`company-chip ${selectedCompany === co ? "company-chip--active" : ""}`}
              onClick={() => setSelectedCompany((v) => (v === co ? null : co))}
            >
              {co}&nbsp;({companyCounts[co]})
            </button>
          ))}
        </div>
      )}

      {/* ── Detailed filters panel ────────────────────────────────────────── */}
      {showFilters && (
        <div className="tenders-detailed-filters">
          {filterOptions.loadingPoints.length > 0 && (
            <label>
              Завантаження
              <select
                value={detailedFilters.loading_point}
                onChange={(e) => setDetailedFilters((f) => ({ ...f, loading_point: e.target.value }))}
              >
                <option value="">Всі</option>
                {filterOptions.loadingPoints.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          {filterOptions.unloadingPoints.length > 0 && (
            <label>
              Розвантаження
              <select
                value={detailedFilters.unloading_point}
                onChange={(e) => setDetailedFilters((f) => ({ ...f, unloading_point: e.target.value }))}
              >
                <option value="">Всі</option>
                {filterOptions.unloadingPoints.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Тип транспорту
            <select
              value={detailedFilters.cartype}
              onChange={(e) => setDetailedFilters((f) => ({ ...f, cartype: e.target.value }))}
            >
              <option value="">Всі</option>
              {filterOptions.cartypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Тип вантажу
            <select
              value={detailedFilters.chargetype}
              onChange={(e) => setDetailedFilters((f) => ({ ...f, chargetype: e.target.value }))}
            >
              <option value="">Всі</option>
              {filterOptions.chargetypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Дедлайн від
            <input
              type="date"
              value={detailedFilters.dateFrom}
              onChange={(e) => setDetailedFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </label>
          <label>
            Дедлайн до
            <input
              type="date"
              value={detailedFilters.dateTo}
              onChange={(e) => setDetailedFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </label>
          {hasActiveFilters && (
            <button className="filter-chip filter-chip--clear" onClick={clearFilters}>
              Скинути всі
            </button>
          )}
        </div>
      )}

      {/* ── Count + sort bar ──────────────────────────────────────────────── */}
      <div className="tenders-sort-bar">
        <span className="tenders-count">{totalItems} тендерів</span>
        <div className="tenders-sort-right">
          <select
            className="tenders-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline">Сортувати по часу завершення</option>
            <option value="none">За замовчуванням</option>
            <option value="price_km_desc">Грн/км: за спаданням</option>
            <option value="price_km_asc">Грн/км: за зростанням</option>
            <option value="price_sum_desc">Грн сума: за спаданням</option>
            <option value="price_sum_asc">Грн сума: за зростанням</option>
          </select>
          {loadingPriceSort && <span className="tenders-sort-loading">Сортування…</span>}
          <button className="tenders-refresh-btn" onClick={handleRefresh} title="Оновити">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Оновити
          </button>
          <div className="tenders-view-toggle">
            <button className="view-btn view-btn--active" title="Список">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Card list ─────────────────────────────────────────────────────── */}
      <div className="tenders-list" ref={tendersListRef} onScroll={handleListScroll}>
        {loadingCards || (activeTabId === ARCHIVE_TAB_ID && loadingArchive) ? (
          <p className="tenders-loading">Завантаження...</p>
        ) : displayCards.length === 0 ? (
          <p className="tenders-empty">
            {sortedTenders.length === 0 && totalItems > 0
              ? "Немає тендерів для цих фільтрів"
              : "Немає доступних тендерів"}
          </p>
        ) : (
          displayCards.slice(0, visibleCount).map((card) => (
            <TenderCard key={card.id ?? card.periodic} card={card} onRefresh={handleRefresh} onBookmark={handleCardBookmark} />
          ))
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="tenders-pagination">
          <button
            className="pagination-btn"
            onClick={() =>
              activeTabId === ARCHIVE_TAB_ID
                ? setArchivePage((p) => Math.max(1, p - 1))
                : setPage((p) => Math.max(1, p - 1))
            }
            disabled={activeTabId === ARCHIVE_TAB_ID ? archivePage <= 1 : page <= 1}
          >
            ←
          </button>
          <span className="pagination-info">
            {activeTabId === ARCHIVE_TAB_ID ? archivePage : page} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() =>
              activeTabId === ARCHIVE_TAB_ID
                ? setArchivePage((p) => Math.min(totalPages, p + 1))
                : setPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={
              activeTabId === ARCHIVE_TAB_ID ? archivePage >= totalPages : page >= totalPages
            }
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

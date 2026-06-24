import { useEffect, useMemo, useRef, useState } from "react";
import TenderCard from "./TenderCard";
import {
  fetchTenderGroups,
  fetchCurrentTenders,
  fetchMyTenders,
  fetchBasicDetails,
  fetchNotInterested,
  fetchCompleteRoutes,
} from "./tendersService";
import "./style.scss";

const PAGE_SIZE = 10;
const HIDDEN_TAB_ID = "hidden";
const ARCHIVE_TAB_ID = "archive";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniqueValues(arr, key) {
  return [...new Set(arr.map((t) => t[key]).filter(Boolean))];
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
  const [onlyMyCustomers, setOnlyMyCustomers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [quickFilters, setQuickFilters] = useState({
    freeforall: false,
    blindtender: false,
  });

  const [detailedFilters, setDetailedFilters] = useState({
    clientCompany: "",
    loading_point: "",
    unloading_point: "",
    cartype: "",
    chargetype: "",
  });

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);

  // ── Tabs definition ───────────────────────────────────────────────────────────
  const tabs = useMemo(
    () => [
      ...groups,
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

      // Set default active tab to first group if not already set
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

  // ── Fetch hidden tenders when hidden tab is active ────────────────────────────
  useEffect(() => {
    if (activeTabId !== HIDDEN_TAB_ID) return;
    fetchNotInterested()
      .then((d) => setHiddenTenders(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setHiddenTenders([]));
  }, [activeTabId]);

  // ── Fetch archive when archive tab is active / page changes ──────────────────
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

  // ── Reset page when tab or filters change ─────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [activeTabId, quickFilters, detailedFilters]);

  // ── Tab tenders (lightweight source) ─────────────────────────────────────────
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

  // ── Filter options built from active tab list ─────────────────────────────────
  const filterOptions = useMemo(
    () => ({
      companies: uniqueValues(tabTenders, "clientCompany"),
      loadingPoints: flatUniqueValues(tabTenders, "loading_points"),
      unloadingPoints: flatUniqueValues(tabTenders, "unloading_points"),
      cartypes: flatUniqueValues(tabTenders, "cartype"),
      chargetypes: uniqueValues(tabTenders, "chargetype"),
    }),
    [tabTenders]
  );

  // ── Apply filters ──────────────────────────────────────────────────────────────
  const filteredTenders = useMemo(() => {
    return tabTenders.filter((t) => {
      if (quickFilters.freeforall && !t.freeforall) return false;
      if (quickFilters.blindtender && !t.blindtender) return false;
      if (detailedFilters.clientCompany && t.clientCompany !== detailedFilters.clientCompany)
        return false;
      if (detailedFilters.cartype) {
        const ct = Array.isArray(t.cartype) ? t.cartype : t.cartype ? [t.cartype] : [];
        if (!ct.includes(detailedFilters.cartype)) return false;
      }
      if (detailedFilters.chargetype && t.chargetype !== detailedFilters.chargetype)
        return false;
      return true;
    });
  }, [tabTenders, quickFilters, detailedFilters]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalItems =
    activeTabId === ARCHIVE_TAB_ID ? archiveData.total : filteredTenders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pagedPeriodicIds = useMemo(() => {
    if (activeTabId === ARCHIVE_TAB_ID) {
      return archiveData.data.map((t) => t.periodic).filter(Boolean);
    }
    return filteredTenders
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((t) => t.periodic)
      .filter(Boolean);
  }, [filteredTenders, page, activeTabId, archiveData.data]);

  // ── Stable refs so SSE handler never captures stale closures ─────────────────
  const pagedPeriodicIdsRef = useRef([]);
  useEffect(() => { pagedPeriodicIdsRef.current = pagedPeriodicIds; }, [pagedPeriodicIds]);

  // ── Fetch basic details for visible ids ───────────────────────────────────────
  const lastFetchedIds = useRef("");
  useEffect(() => {
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
        // Sort to match requested periodic order
        const byPeriodic = Object.fromEntries(
          list.map((c) => [String(c.periodic ?? c.id), c])
        );
        const ordered = pagedPeriodicIds
          .map((id) => byPeriodic[String(id)])
          .filter(Boolean);
        setCards(ordered);
      })
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false));
  }, [pagedPeriodicIds]);

  // ── Refresh handler (called after any card action) ────────────────────────────
  const handleRefresh = () => {
    lastFetchedIds.current = "";
    loadTenders().then(() => {
      if (pagedPeriodicIds.length) {
        setLoadingCards(true);
        fetchBasicDetails(pagedPeriodicIds)
          .then((data) => {
            const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
            setCards(list);
          })
          .catch(() => setCards([]))
          .finally(() => setLoadingCards(false));
      }
    });
  };

  // ── SSE: keep a mutable ref so the EventSource callback always has latest fns ─
  const sseHandlerRef = useRef(null);
  sseHandlerRef.current = (periodic, routeId) => {
    // Refresh lightweight list so tab counts stay accurate
    const fetchList = onlyMyCustomers ? fetchMyTenders : fetchCurrentTenders;
    fetchList()
      .then((d) => setAllTenders(Array.isArray(d) ? d : []))
      .catch(() => {});

    // If the updated tender is on the current page, patch that card in-place
    const currentIds = pagedPeriodicIdsRef.current.map(String);
    if (periodic && currentIds.includes(String(periodic))) {
      fetchBasicDetails([periodic])
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.routes || data?.data || [];
          if (list.length > 0) {
            setCards((prev) =>
              prev.map((c) =>
                String(c.periodic ?? c.id) === String(periodic) ? list[0] : c
              )
            );
          }
        })
        .catch(() => {});
    }
  };

  // ── Open SSE connection on mount, auto-reconnect is handled by the browser ───
  useEffect(() => {
    let es = null;

    const connect = () => {
      try {
        const raw = localStorage.getItem("userInfo");
        const userInfo = raw ? JSON.parse(raw) : {};
        const token = userInfo.token || userInfo.access || "";
        if (!token) return;

        es = new EventSource(`/api/sovtes/events/?token=${encodeURIComponent(token)}`);

        es.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data);
            sseHandlerRef.current?.(event.periodic, event.route_id);
          } catch {
            // ignore malformed events
          }
        };

        es.onerror = () => {
          // browser auto-reconnects; nothing to do
        };
      } catch {
        // ignore if localStorage/JSON fails
      }
    };

    connect();
    return () => es?.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Quick filter toggle helper ────────────────────────────────────────────────
  const toggleQuick = (key) =>
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const clearFilters = () => {
    setQuickFilters({ freeforall: false, blindtender: false });
    setDetailedFilters({ clientCompany: "", loading_point: "", unloading_point: "", cartype: "", chargetype: "" });
  };

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
      {/* Header */}
      <div className="tenders-header">
        <h2 className="tenders-title">Тендери</h2>
        <label className="tenders-toggle">
          <input
            type="checkbox"
            checked={onlyMyCustomers}
            onChange={(e) => setOnlyMyCustomers(e.target.checked)}
          />
          Тільки мої клієнти
        </label>
      </div>

      {/* Tabs */}
      <div className="tenders-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tenders-tab ${activeTabId === tab.id ? "tenders-tab--active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.title}
            {tabCounts[tab.id] > 0 && (
              <span className="tenders-tab__count">{tabCounts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Quick filters */}
      <div className="tenders-quick-filters">
        <button
          className={`filter-chip ${quickFilters.freeforall ? "filter-chip--active" : ""}`}
          onClick={() => toggleQuick("freeforall")}
        >
          Відкриті
        </button>
        <button
          className={`filter-chip ${quickFilters.blindtender ? "filter-chip--active" : ""}`}
          onClick={() => toggleQuick("blindtender")}
        >
          Закриті
        </button>
        <button
          className="filter-chip filter-chip--toggle"
          onClick={() => setShowFilters((v) => !v)}
        >
          Фільтри {showFilters ? "▲" : "▼"}
        </button>
        {(quickFilters.freeforall ||
          quickFilters.blindtender ||
          Object.values(detailedFilters).some(Boolean)) && (
          <button className="filter-chip filter-chip--clear" onClick={clearFilters}>
            Скинути
          </button>
        )}
      </div>

      {/* Detailed filters */}
      {showFilters && (
        <div className="tenders-detailed-filters">
          <label>
            Клієнт
            <select
              value={detailedFilters.clientCompany}
              onChange={(e) =>
                setDetailedFilters((f) => ({ ...f, clientCompany: e.target.value }))
              }
            >
              <option value="">Всі</option>
              {filterOptions.companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Тип транспорту
            <select
              value={detailedFilters.cartype}
              onChange={(e) =>
                setDetailedFilters((f) => ({ ...f, cartype: e.target.value }))
              }
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
              onChange={(e) =>
                setDetailedFilters((f) => ({ ...f, chargetype: e.target.value }))
              }
            >
              <option value="">Всі</option>
              {filterOptions.chargetypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Card list */}
      <div className="tenders-list">
        {loadingCards || (activeTabId === ARCHIVE_TAB_ID && loadingArchive) ? (
          <p className="tenders-loading">Завантаження...</p>
        ) : cards.length === 0 ? (
          <p className="tenders-empty">
            {filteredTenders.length === 0 && totalItems > 0
              ? "Немає тендерів для цих фільтрів"
              : "Немає доступних тендерів"}
          </p>
        ) : (
          cards.map((card) => (
            <TenderCard key={card.id ?? card.periodic} card={card} onRefresh={handleRefresh} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="tenders-pagination">
          <button
            className="pagination-btn"
            onClick={() =>
              activeTabId === ARCHIVE_TAB_ID
                ? setArchivePage((p) => Math.max(1, p - 1))
                : setPage((p) => Math.max(1, p - 1))
            }
            disabled={
              activeTabId === ARCHIVE_TAB_ID ? archivePage <= 1 : page <= 1
            }
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
              activeTabId === ARCHIVE_TAB_ID
                ? archivePage >= totalPages
                : page >= totalPages
            }
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

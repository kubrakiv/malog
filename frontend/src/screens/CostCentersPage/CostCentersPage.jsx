import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "./CostCentersPage.scss";

const CURRENCIES = ["UAH", "EUR", "USD"];
const EUR_RATES = { EUR: 1, UAH: 1 / 42, USD: 1 / 1.08 };
const toEUR = (amount, currency) => parseFloat(amount) * (EUR_RATES[currency] ?? 1 / 42);
const fmt = (n, dec = 0) => n.toLocaleString("uk-UA", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const emptyRow = () => ({ name: "", monthly_amount: "", currency: "UAH" });

export default function CostCentersPage() {
  const token = useSelector((s) => s.userLogin?.userInfo?.token);
  const authHeaders = useCallback(
    () => token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" },
    [token]
  );

  const [truckUnits, setTruckUnits] = useState([]);   // from cost-config
  const [centers, setCenters] = useState([]);          // flat list from cost-config
  const [unitSettings, setUnitSettings] = useState({}); // { "1": { assumed_km, planned_trucks } }
  const [addRows, setAddRows] = useState({});           // { unitId: { name, monthly_amount, currency } }
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState({});
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/route_calculator/cost-config/", { headers: authHeaders() });
      if (!res.ok) return;
      const cfg = await res.json();
      const units = cfg.truck_units || [];
      setTruckUnits(units);
      setCenters(cfg.cost_centers || []);
      const km = {};
      units.forEach((u) => {
        km[String(u.id)] = { assumed_km: u.assumed_km, planned_trucks: u.planned_trucks };
      });
      setUnitSettings(km);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  // Save a unit setting field on blur
  const saveUnitSetting = async (unitId, field, value) => {
    const num = parseInt(value) || 0;
    setUnitSettings((prev) => ({
      ...prev,
      [String(unitId)]: { ...prev[String(unitId)], [field]: num },
    }));
    setTruckUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, [field]: num } : u))
    );
    await fetch("/api/cost-centers/assumed-km/", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ unit_settings: { [unitId]: { [field]: num } } }),
    });
    // Refresh to get updated per-unit EUR/km totals
    fetchAll();
  };

  // Add a new cost center for a unit
  const handleAdd = async (unitId) => {
    const row = addRows[unitId] ?? emptyRow();
    setError((e) => ({ ...e, [unitId]: null }));
    if (!row.name.trim()) { setError((e) => ({ ...e, [unitId]: "Вкажіть назву" })); return; }
    if (!row.monthly_amount) { setError((e) => ({ ...e, [unitId]: "Вкажіть суму" })); return; }
    setSaving((s) => ({ ...s, [unitId]: true }));
    try {
      const res = await fetch("/api/cost-centers/create/", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: row.name,
          truck_unit: unitId || null,
          monthly_amount: parseFloat(row.monthly_amount),
          currency: row.currency,
          is_active: true,
        }),
      });
      if (res.ok) {
        setAddRows((r) => ({ ...r, [unitId]: emptyRow() }));
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((e) => ({ ...e, [unitId]: data.detail || `Помилка ${res.status}` }));
      }
    } catch (ex) {
      setError((e) => ({ ...e, [unitId]: "Помилка мережі: " + ex.message }));
    } finally {
      setSaving((s) => ({ ...s, [unitId]: false }));
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    setSaving((s) => ({ ...s, edit: true }));
    try {
      const res = await fetch(`/api/cost-centers/${editingId}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...editForm, monthly_amount: parseFloat(editForm.monthly_amount) }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchAll();
      }
    } finally {
      setSaving((s) => ({ ...s, edit: false }));
    }
  };

  const handleToggle = async (center) => {
    const res = await fetch(`/api/cost-centers/${center.id}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ ...center, is_active: !center.is_active }),
    });
    if (res.ok) fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Видалити центр витрат?")) return;
    const res = await fetch(`/api/cost-centers/${id}/`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setCenters((prev) => prev.filter((c) => c.id !== id));
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, monthly_amount: c.monthly_amount, currency: c.currency, is_active: c.is_active });
  };

  // Per-unit calculations (frontend mirrors backend)
  const unitCalc = (unit) => {
    const planned = Math.max(unitSettings[String(unit.id)]?.planned_trucks ?? unit.planned_trucks ?? 1, 1);
    const km = unitSettings[String(unit.id)]?.assumed_km ?? unit.assumed_km ?? 10000;
    const unitCenters = centers.filter((c) => c.truck_unit === unit.id && c.is_active);
    const totalEUR = unitCenters.reduce((s, c) => s + toEUR(c.monthly_amount, c.currency), 0);
    const totalUAH = totalEUR * 42;
    const totalKm = planned * km;
    const perKm = totalKm ? totalEUR / totalKm : 0;
    const perKmUAH = perKm * 42;
    const perTruckEUR = totalEUR / planned;
    const perTruckUAH = perTruckEUR * 42;
    return { totalEUR, totalUAH, totalKm, perKm, perKmUAH, perTruckEUR, perTruckUAH, planned };
  };

  // Grand total
  const allActive = centers.filter((c) => c.is_active);
  const grandTotalEUR = allActive.reduce((s, c) => s + toEUR(c.monthly_amount, c.currency), 0);
  const grandTotalUAH = grandTotalEUR * 42;
  const grandTotalTrucksKm = truckUnits.reduce((s, u) => {
    const planned = Math.max(unitSettings[String(u.id)]?.planned_trucks ?? u.planned_trucks ?? 1, 1);
    const km = unitSettings[String(u.id)]?.assumed_km ?? u.assumed_km ?? 10000;
    return s + planned * km;
  }, 0);
  const grandPerKm = grandTotalTrucksKm ? grandTotalEUR / grandTotalTrucksKm : 0;
  const grandPerKmUAH = grandPerKm * 42;

  const renderUnitSection = (unit) => {
    const unitId = unit?.id ?? "global";
    const unitCenters = centers.filter((c) => c.truck_unit === (unit?.id ?? null));
    const addRow = addRows[unitId] ?? emptyRow();
    const calc = unit ? unitCalc(unit) : null;
    const { totalEUR = 0, totalUAH = 0, totalKm = 0, perKm = 0, perKmUAH = 0, perTruckEUR = 0, perTruckUAH = 0 } = calc ?? {};
    const planned = unit ? (unitSettings[String(unit.id)]?.planned_trucks ?? unit.planned_trucks) : null;
    const km = unit ? (unitSettings[String(unit.id)]?.assumed_km ?? unit.assumed_km) : null;

    return (
      <div key={unitId} className="cc-unit-section">
        {/* Section header */}
        <div className="cc-unit-section__header">
          <span className="cc-unit-section__title">{unit?.name ?? "Без підрозділу"}</span>
          {unit && (
            <div className="cc-unit-section__meta">
              <label className="cc-unit-section__meta-label">
                <span>Планових машин</span>
                <input
                  className="cc-unit-meta-input"
                  type="number"
                  min="1"
                  defaultValue={planned}
                  key={`pt-${unit.id}-${planned}`}
                  onBlur={(e) => saveUnitSetting(unit.id, "planned_trucks", e.target.value)}
                />
              </label>
              <label className="cc-unit-section__meta-label">
                <span>км / авто / міс</span>
                <input
                  className="cc-unit-meta-input"
                  type="number"
                  min="0"
                  defaultValue={km}
                  key={`km-${unit.id}-${km}`}
                  onBlur={(e) => saveUnitSetting(unit.id, "assumed_km", e.target.value)}
                />
              </label>
              <div className="cc-unit-section__stat">
                <span className="cc-unit-section__stat-label">Сума / міс</span>
                <span className="cc-unit-section__stat-value">{fmt(totalEUR)} EUR</span>
                <span className="cc-unit-section__stat-sub">{fmt(totalUAH)} грн</span>
              </div>
              <div className="cc-unit-section__stat">
                <span className="cc-unit-section__stat-label">На 1 авто / міс</span>
                <span className="cc-unit-section__stat-value">{fmt(perTruckEUR)} EUR</span>
                <span className="cc-unit-section__stat-sub">{fmt(perTruckUAH)} грн</span>
              </div>
              <div className="cc-unit-section__stat">
                <span className="cc-unit-section__stat-label">Всього км / міс</span>
                <span className="cc-unit-section__stat-value">{fmt(totalKm)} км</span>
              </div>
              <div className="cc-unit-section__stat">
                <span className="cc-unit-section__stat-label">Витрати / км</span>
                <span className="cc-unit-section__stat-value cc-unit-section__stat-value--km">
                  {fmt(perKm, 4)} EUR/км
                </span>
                <span className="cc-unit-section__stat-sub cc-unit-section__stat-sub--km">
                  {fmt(perKmUAH, 2)} грн/км
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cost center rows */}
        {unitCenters.length > 0 && (
          <table className="cc-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Сума / міс</th>
                <th>Валюта</th>
                <th>грн / міс</th>
                <th>EUR / міс</th>
                <th>грн / км</th>
                <th>Активний</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...unitCenters]
                .sort((a, b) => toEUR(b.monthly_amount, b.currency) - toEUR(a.monthly_amount, a.currency))
                .map((c) => {
                const eurMonth = toEUR(c.monthly_amount, c.currency);
                const uahMonth = eurMonth * 42;
                const perKmUAH = totalKm ? (uahMonth / totalKm) : 0;
                return (
                <tr key={c.id} className={c.is_active ? "" : "cc-table__row--inactive"}>
                  {editingId === c.id ? (
                    <>
                      <td>
                        <input className="cc-inline-input" value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </td>
                      <td>
                        <input className="cc-inline-input cc-inline-input--amount" type="number"
                          value={editForm.monthly_amount}
                          onChange={(e) => setEditForm({ ...editForm, monthly_amount: e.target.value })} />
                      </td>
                      <td>
                        <select className="cc-form__select" value={editForm.currency}
                          onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>
                          {CURRENCIES.map((cur) => <option key={cur}>{cur}</option>)}
                        </select>
                      </td>
                      <td>{fmt(toEUR(editForm.monthly_amount || 0, editForm.currency) * 42)} грн</td>
                      <td>{fmt(toEUR(editForm.monthly_amount || 0, editForm.currency))} EUR</td>
                      <td></td>
                      <td></td>
                      <td className="cc-table__actions">
                        <button className="cc-form__btn cc-form__btn--save cc-form__btn--sm"
                          onClick={handleSaveEdit} disabled={saving.edit}>Зберегти</button>
                        <button className="cc-form__btn cc-form__btn--cancel cc-form__btn--sm"
                          onClick={() => setEditingId(null)}>✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.name}</td>
                      <td>{fmt(parseFloat(c.monthly_amount))} {c.currency === "UAH" ? "грн" : c.currency}</td>
                      <td>{c.currency}</td>
                      <td className="cc-table__uah">{fmt(uahMonth)} грн</td>
                      <td>{fmt(eurMonth)} EUR</td>
                      <td className="cc-table__km">{fmt(perKmUAH, 2)} грн/км</td>
                      <td>
                        <button className={`cc-toggle${c.is_active ? " cc-toggle--on" : ""}`}
                          onClick={() => handleToggle(c)}>
                          {c.is_active ? "Так" : "Ні"}
                        </button>
                      </td>
                      <td className="cc-table__actions">
                        <button className="cc-btn" onClick={() => startEdit(c)}>✏️</button>
                        <button className="cc-btn" onClick={() => handleDelete(c.id)}>🗑</button>
                      </td>
                    </>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Inline add row */}
        <div className="cc-add-row">
          <input
            className="cc-form__input cc-add-row__name"
            placeholder="Назва (Лізинг, Зарплата...)"
            value={addRow.name}
            onChange={(e) => setAddRows((r) => ({ ...r, [unitId]: { ...addRow, name: e.target.value } }))}
          />
          <input
            className="cc-form__input cc-form__input--amount"
            type="number"
            placeholder="Сума/міс"
            value={addRow.monthly_amount}
            onChange={(e) => setAddRows((r) => ({ ...r, [unitId]: { ...addRow, monthly_amount: e.target.value } }))}
          />
          <select
            className="cc-form__select"
            value={addRow.currency}
            onChange={(e) => setAddRows((r) => ({ ...r, [unitId]: { ...addRow, currency: e.target.value } }))}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            className="cc-form__btn cc-form__btn--save"
            onClick={() => handleAdd(unitId === "global" ? null : unitId)}
            disabled={saving[unitId]}
          >
            + Додати
          </button>
        </div>
        {error[unitId] && <p className="cc-form__error">{error[unitId]}</p>}
      </div>
    );
  };

  // Collect IDs of truck units that have cost centers (to show "global" section only if needed)
  const globalCenters = centers.filter((c) => c.truck_unit === null);

  return (
    <div className="cc-page">
      <h2 className="cc-page__title">Центри витрат</h2>

      {loading ? (
        <p className="cc-page__loading">Завантаження...</p>
      ) : (
        <>
          {truckUnits.map((unit) => renderUnitSection(unit))}

          {/* Global / unassigned section */}
          {(globalCenters.length > 0 || truckUnits.length === 0) && renderUnitSection(null)}

          {/* Grand total */}
          {truckUnits.length > 0 && (
            <div className="cc-summary cc-summary--grand">
              <div className="cc-summary__item">
                <span className="cc-summary__label">Загальна сума / міс</span>
                <span className="cc-summary__value cc-summary__value--total">{fmt(grandTotalEUR)} EUR</span>
                <span className="cc-summary__sub">{fmt(grandTotalUAH)} грн/міс</span>
              </div>
              <div className="cc-summary__item">
                <span className="cc-summary__label">Всього км / міс</span>
                <span className="cc-summary__value">{fmt(grandTotalTrucksKm)} км</span>
              </div>
              <div className="cc-summary__item cc-summary__item--result">
                <span className="cc-summary__label">Середні витрати / км</span>
                <span className="cc-summary__value cc-summary__value--km">{fmt(grandPerKm, 4)} EUR/км</span>
                <span className="cc-summary__sub cc-summary__sub--km">{fmt(grandPerKmUAH, 2)} грн/км</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

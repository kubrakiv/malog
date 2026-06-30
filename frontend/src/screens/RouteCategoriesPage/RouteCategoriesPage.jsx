import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "../CostCentersPage/CostCentersPage.scss";

const emptyRow = () => ({ ukr: "", eng: "" });

export default function RouteCategoriesPage() {
  const token = useSelector((s) => s.userLogin?.userInfo?.token);
  const authHeaders = useCallback(
    () => token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" },
    [token]
  );

  const [categories, setCategories] = useState([]);
  const [addRow, setAddRow] = useState(emptyRow());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/route-categories/", { headers: authHeaders() });
      if (!res.ok) return;
      setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const handleAdd = async () => {
    setError(null);
    if (!addRow.ukr.trim()) { setError("Вкажіть назву (укр)"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/route-categories/create/", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ukr: addRow.ukr, eng: addRow.eng || null, is_active: true }),
      });
      if (res.ok) {
        setAddRow(emptyRow());
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || `Помилка ${res.status}`);
      }
    } catch (ex) {
      setError("Помилка мережі: " + ex.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ ukr: c.ukr, eng: c.eng || "", is_active: c.is_active });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/route-categories/${editingId}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (category) => {
    const res = await fetch(`/api/route-categories/${category.id}/`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ ...category, is_active: !category.is_active }),
    });
    if (res.ok) fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Видалити категорію?")) return;
    const res = await fetch(`/api/route-categories/${id}/`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="cc-page">
      <h2 className="cc-page__title">Категорії маршрутів</h2>

      {loading ? (
        <p className="cc-page__loading">Завантаження...</p>
      ) : (
        <div className="cc-unit-section">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Назва (укр)</th>
                <th>Назва (англ)</th>
                <th>Активна</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="cc-table__empty">Категорій ще немає</td>
                </tr>
              )}
              {categories.map((c) => (
                <tr key={c.id} className={c.is_active ? "" : "cc-table__row--inactive"}>
                  {editingId === c.id ? (
                    <>
                      <td>
                        <input className="cc-inline-input" value={editForm.ukr}
                          onChange={(e) => setEditForm({ ...editForm, ukr: e.target.value })} />
                      </td>
                      <td>
                        <input className="cc-inline-input" value={editForm.eng}
                          onChange={(e) => setEditForm({ ...editForm, eng: e.target.value })} />
                      </td>
                      <td></td>
                      <td className="cc-table__actions">
                        <button className="cc-form__btn cc-form__btn--save cc-form__btn--sm"
                          onClick={handleSaveEdit} disabled={saving}>Зберегти</button>
                        <button className="cc-form__btn cc-form__btn--cancel cc-form__btn--sm"
                          onClick={() => setEditingId(null)}>✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.ukr}</td>
                      <td>{c.eng || "—"}</td>
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
              ))}
            </tbody>
          </table>

          <div className="cc-add-row">
            <input
              className="cc-form__input cc-add-row__name"
              placeholder="Назва (укр), напр. Імпорт"
              value={addRow.ukr}
              onChange={(e) => setAddRow((r) => ({ ...r, ukr: e.target.value }))}
            />
            <input
              className="cc-form__input"
              placeholder="Назва (англ), напр. Import"
              value={addRow.eng}
              onChange={(e) => setAddRow((r) => ({ ...r, eng: e.target.value }))}
            />
            <button
              className="cc-form__btn cc-form__btn--save"
              onClick={handleAdd}
              disabled={saving}
            >
              + Додати
            </button>
          </div>
          {error && <p className="cc-form__error">{error}</p>}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";
import {
  FaBuilding, FaEdit, FaSave, FaTimes, FaSync,
  FaPlus, FaTrash, FaUniversity,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchCompany, saveCompany,
  fetchBanks, createBank, updateBank, deleteBank,
} from "../../features/company/companyOperations";
import { clearCompanyErrors } from "../../features/company/companySlice";
import "./style.scss";

// ── constants ─────────────────────────────────────────────────────────────────

const COMPANY_SECTIONS = [
  {
    section: "Загальна інформація",
    rows: [
      { key: "name", label: "Назва компанії", required: true },
      { key: "name_en", label: "Назва (англ.)" },
      { key: "nip_number", label: "Податковий номер (NIP)" },
      { key: "vat_number", label: "VAT номер" },
    ],
  },
  {
    section: "Контактна інформація",
    rows: [
      { key: "phone", label: "Телефон" },
      { key: "email", label: "Email (для рахунків)", type: "email" },
      { key: "website", label: "Вебсайт" },
    ],
  },
  {
    section: "Адреси",
    rows: [
      { key: "post_address", label: "Поштова адреса" },
      { key: "legal_address", label: "Юридична адреса" },
    ],
  },
];

const BANK_FIELDS = [
  { key: "name", label: "Назва банку", required: true },
  { key: "swift_code", label: "SWIFT / BIC" },
  { key: "iban_eur", label: "IBAN (EUR)" },
  { key: "iban_cz", label: "IBAN (CZK)" },
  { key: "account_number_eur", label: "Рахунок (EUR)" },
  { key: "account_number_cz", label: "Рахунок (CZK)" },
  { key: "bank_address", label: "Адреса банку" },
];

const emptyBank = () => ({
  name: "", swift_code: "", iban_eur: "", iban_cz: "",
  account_number_eur: "", account_number_cz: "", bank_address: "",
});

const bankToForm = (b) => ({
  name: b.name ?? "",
  swift_code: b.swift_code ?? "",
  iban_eur: b.iban_eur ?? "",
  iban_cz: b.iban_cz ?? "",
  account_number_eur: b.account_number_eur ?? "",
  account_number_cz: b.account_number_cz ?? "",
  bank_address: b.bank_address ?? "",
});

const companyToForm = (c) => ({
  name: c.name ?? "",
  name_en: c.name_en ?? "",
  nip_number: c.nip_number ?? "",
  vat_number: c.vat_number ?? "",
  phone: c.phone ?? "",
  email: c.email ?? "",
  website: c.website ?? "",
  post_address: c.post_address ?? "",
  legal_address: c.legal_address ?? "",
});

const emptyCompanyForm = () => companyToForm({});

// ── sub-components ────────────────────────────────────────────────────────────

const FieldRow = ({ field, editMode, value, onChange }) => (
  <div className="company-page__field">
    <label className="company-page__label">
      {field.label}
      {field.required && <span className="company-page__required">*</span>}
    </label>
    {editMode ? (
      <input
        className="company-page__input"
        type={field.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
      />
    ) : (
      <div className="company-page__value">
        {value || <span className="company-page__empty">—</span>}
      </div>
    )}
  </div>
);

const BankCard = ({ bank, onSaved, onDeleted }) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(!bank.id); // new banks open in edit mode
  const [form, setForm] = useState(bank.id ? bankToForm(bank) : emptyBank());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Назва банку є обов'язковою."); return; }
    setSaving(true);
    let result;
    if (bank.id) {
      result = await dispatch(updateBank({ id: bank.id, ...form }));
      if (updateBank.fulfilled.match(result)) {
        toast.success("Банківський рахунок оновлено.");
        setEditing(false);
        onSaved?.(result.payload);
      } else {
        toast.error("Помилка збереження.");
      }
    } else {
      result = await dispatch(createBank(form));
      if (createBank.fulfilled.match(result)) {
        toast.success("Банківський рахунок додано.");
        onSaved?.(result.payload);
      } else {
        toast.error("Помилка збереження.");
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!bank.id) { onDeleted?.(); return; }
    if (!await confirm(`Видалити "${bank.name}"?`)) return;
    setDeleting(true);
    const result = await dispatch(deleteBank(bank.id));
    if (deleteBank.fulfilled.match(result)) {
      toast.success("Рахунок видалено.");
      onDeleted?.();
    } else {
      toast.error("Помилка видалення.");
    }
    setDeleting(false);
  };

  const handleCancel = () => {
    if (!bank.id) { onDeleted?.(); return; }
    setForm(bankToForm(bank));
    setEditing(false);
  };

  return (
    <div className={`bank-card${editing ? " bank-card--editing" : ""}`}>
      <div className="bank-card__header">
        <span className="bank-card__name">
          <FaUniversity className="bank-card__icon" />
          {editing ? (
            <input
              className="company-page__input bank-card__name-input"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Назва банку *"
            />
          ) : (
            bank.name || <span className="company-page__empty">Без назви</span>
          )}
        </span>
        <div className="bank-card__actions">
          {editing ? (
            <>
              <button
                className="bank-card__btn bank-card__btn--cancel"
                onClick={handleCancel}
                disabled={saving}
                type="button"
                title="Скасувати"
              >
                <FaTimes />
              </button>
              <button
                className="bank-card__btn bank-card__btn--save"
                onClick={handleSave}
                disabled={saving}
                type="button"
                title="Зберегти"
              >
                {saving ? <FaSync className="company-page__spinner" /> : <FaSave />}
              </button>
            </>
          ) : (
            <>
              <button
                className="bank-card__btn bank-card__btn--edit"
                onClick={() => setEditing(true)}
                type="button"
                title="Редагувати"
              >
                <FaEdit />
              </button>
              <button
                className="bank-card__btn bank-card__btn--delete"
                onClick={handleDelete}
                disabled={deleting}
                type="button"
                title="Видалити"
              >
                {deleting ? <FaSync className="company-page__spinner" /> : <FaTrash />}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="bank-card__fields">
          {BANK_FIELDS.filter((f) => f.key !== "name").map((field) => (
            <div key={field.key} className="company-page__field">
              <label className="company-page__label">{field.label}</label>
              <input
                className="company-page__input"
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.label}
              />
            </div>
          ))}
        </div>
      )}

      {!editing && (
        <div className="bank-card__summary">
          {[
            { label: "SWIFT", val: bank.swift_code },
            { label: "IBAN EUR", val: bank.iban_eur },
            { label: "IBAN CZK", val: bank.iban_cz },
            { label: "Рахунок EUR", val: bank.account_number_eur },
            { label: "Рахунок CZK", val: bank.account_number_cz },
            { label: "Адреса", val: bank.bank_address },
          ].filter((r) => r.val).map(({ label, val }) => (
            <div key={label} className="bank-card__summary-row">
              <span className="bank-card__summary-key">{label}</span>
              <span className="bank-card__summary-val">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────

const CompanyPage = () => {
  const dispatch = useDispatch();
  const { company, banks, loading, saving, error, saveError } = useSelector(
    (s) => s.companyInfo
  );

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(emptyCompanyForm());
  // Tracks unsaved new bank drafts (no id yet)
  const [newBanks, setNewBanks] = useState([]);

  useEffect(() => {
    dispatch(fetchCompany());
    dispatch(fetchBanks());
  }, [dispatch]);

  useEffect(() => {
    if (company) setForm(companyToForm(company));
  }, [company]);

  useEffect(() => {
    if (saveError) { toast.error(saveError); dispatch(clearCompanyErrors()); }
  }, [saveError, dispatch]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Назва компанії є обов'язковою."); return; }
    const result = await dispatch(saveCompany(form));
    if (saveCompany.fulfilled.match(result)) {
      toast.success("Дані компанії збережено.");
      setEditMode(false);
      dispatch(fetchBanks()); // refresh banks after company saved (may have been created)
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (company) setForm(companyToForm(company));
  };

  const addNewBank = () => setNewBanks((p) => [...p, { _tmpId: Date.now() }]);

  const removeNewBank = (tmpId) =>
    setNewBanks((p) => p.filter((b) => b._tmpId !== tmpId));

  const onNewBankSaved = (tmpId) => {
    setNewBanks((p) => p.filter((b) => b._tmpId !== tmpId));
  };

  return (
    <div className="company-page">
      {/* Hero */}
      <div className="company-page__hero">
        <h2 className="company-page__title">
          <FaBuilding className="company-page__title-icon" />
          Компанія
        </h2>
        <div className="company-page__hero-actions">
          {!editMode ? (
            <button
              className="company-page__btn company-page__btn--edit"
              onClick={() => setEditMode(true)}
              type="button"
            >
              <FaEdit /> Редагувати
            </button>
          ) : (
            <>
              <button
                className="company-page__btn company-page__btn--cancel"
                onClick={handleCancel}
                disabled={saving}
                type="button"
              >
                <FaTimes /> Скасувати
              </button>
              <button
                className="company-page__btn company-page__btn--save"
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? <FaSync className="company-page__spinner" /> : <FaSave />}
                {saving ? "Збереження…" : "Зберегти"}
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="company-page__state">
          <FaSync className="company-page__spinner" /> <span>Завантаження…</span>
        </div>
      )}

      {error && !loading && (
        <div className="company-page__state company-page__state--error">{error}</div>
      )}

      {!loading && (
        <div className="company-page__body">
          {!company && !error && (
            <div className="company-page__no-company">
              Інформацію про компанію ще не заповнено. Натисніть «Редагувати», щоб додати дані.
            </div>
          )}

          {/* Company info sections */}
          {COMPANY_SECTIONS.map(({ section, rows }) => (
            <div key={section} className="company-page__section">
              <h3 className="company-page__section-title">{section}</h3>
              <div className="company-page__grid">
                {rows.map((field) => (
                  <FieldRow
                    key={field.key}
                    field={field}
                    editMode={editMode}
                    value={form[field.key]}
                    onChange={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Bank accounts */}
          <div className="company-page__section">
            <div className="company-page__section-header">
              <h3 className="company-page__section-title">Банківські реквізити</h3>
              <button
                className="company-page__btn company-page__btn--add-bank"
                onClick={addNewBank}
                type="button"
                title="Додати банківський рахунок"
              >
                <FaPlus /> Додати рахунок
              </button>
            </div>

            <div className="company-page__banks">
              {banks.map((bank) => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                />
              ))}
              {newBanks.map((draft) => (
                <BankCard
                  key={draft._tmpId}
                  bank={draft}
                  onSaved={() => onNewBankSaved(draft._tmpId)}
                  onDeleted={() => removeNewBank(draft._tmpId)}
                />
              ))}
              {banks.length === 0 && newBanks.length === 0 && (
                <p className="company-page__banks-empty">
                  Банківські рахунки не додано.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;

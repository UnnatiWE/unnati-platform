import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { localized } from "./i18n";
import "./FirebaseResources.css";

export default function FirebaseSHG({ lang = "en", t, saved = [], onSave }) {
  const [shgs, setShgs] = useState([]);
  const [district, setDistrict] = useState("All");
  const [taluka, setTaluka] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSHGs = async () => {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "shgs"));

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setShgs(data);
      } catch (e) {
        console.error("Error loading SHGs:", e);
        setError(
          `${e.code || "error"}: ${
            e.message || t.unableShgs || "Unable to load SHGs"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadSHGs();
  }, [t.unableShgs]);

  /*
   * ==========================================
   * CONSISTENT CANONICAL FIELD HELPER
   * ==========================================
   * Extracts underlying consistent value for reliable filtering
   */
  const getConsistentValue = (item, field) => {
    if (!item) return "";
    if (item[`${field}_en`] && typeof item[`${field}_en`] === "string") {
      return item[`${field}_en`].trim();
    }
    const val = item[field];
    if (typeof val === "string") {
      return val.trim();
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return String(val.en || val.hi || val.mr || Object.values(val)[0] || "").trim();
    }
    if (val !== undefined && val !== null) {
      return String(val).trim();
    }
    return "";
  };

  /*
   * ==========================================
   * MULTILINGUAL FIELD FUNCTION
   * ==========================================
   * Supports nested multilingual objects, _en/_hi/_mr,
   * _hindi/_marathi, shared localized() helper, and base field
   */
  const getLocalized = (item, field) => {
    if (!item) return "";
    const language = lang || "en";

    // 1. Nested multilingual object
    if (
      item[field] &&
      typeof item[field] === "object" &&
      !Array.isArray(item[field])
    ) {
      return (
        item[field][language] ||
        item[field].en ||
        item[field].hi ||
        item[field].mr ||
        ""
      );
    }

    // 2. Standard _en / _hi / _mr format
    const languageField = `${field}_${language}`;

    if (
      item[languageField] !== undefined &&
      item[languageField] !== null &&
      String(item[languageField]).trim() !== ""
    ) {
      return item[languageField];
    }

    // 3. Alternative Hindi / Marathi naming
    if (language === "hi") {
      const hindiField = `${field}_hindi`;

      if (
        item[hindiField] !== undefined &&
        item[hindiField] !== null &&
        String(item[hindiField]).trim() !== ""
      ) {
        return item[hindiField];
      }
    }

    if (language === "mr") {
      const marathiField = `${field}_marathi`;

      if (
        item[marathiField] !== undefined &&
        item[marathiField] !== null &&
        String(item[marathiField]).trim() !== ""
      ) {
        return item[marathiField];
      }
    }

    // 4. Shared localized helper fallback
    const shared = localized(item, field, language);
    if (shared && typeof shared === "string" && shared.trim() !== "") {
      return shared;
    }

    // 5. Base field fallback
    if (
      item[field] !== undefined &&
      item[field] !== null &&
      typeof item[field] !== "object"
    ) {
      return item[field];
    }

    // 6. English fallback
    if (
      item[`${field}_en`] !== undefined &&
      item[`${field}_en`] !== null
    ) {
      return item[`${field}_en`];
    }

    return "";
  };

  /*
   * ==========================================
   * DISTRICTS (Unique from existing SHG records)
   * ==========================================
   */
  const districtOptions = useMemo(() => {
    const map = new Map();
    shgs.forEach((s) => {
      const raw = getConsistentValue(s, "district");
      if (!raw) return;
      if (!map.has(raw)) {
        const display = getLocalized(s, "district") || raw;
        map.set(raw, display);
      }
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, lang || "en"));
  }, [shgs, lang]);

  /*
   * ==========================================
   * DEPENDENT TALUKAS (Belonging to selected district)
   * ==========================================
   */
  const talukaOptions = useMemo(() => {
    if (!district || district === "All") return [];

    const map = new Map();
    shgs.forEach((s) => {
      const rawDist = getConsistentValue(s, "district");
      const locDist = getLocalized(s, "district");
      if (rawDist === district || locDist === district) {
        const rawTaluka = getConsistentValue(s, "taluka");
        if (!rawTaluka || rawTaluka === "—") return;
        if (!map.has(rawTaluka)) {
          const display = getLocalized(s, "taluka") || rawTaluka;
          map.set(rawTaluka, display);
        }
      }
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, lang || "en"));
  }, [shgs, district, lang]);

  /*
   * ==========================================
   * FILTER LOGIC (District + Dependent Taluka)
   * ==========================================
   */
  const filtered = useMemo(() => {
    return shgs.filter((s) => {
      const rawDist = getConsistentValue(s, "district");
      const locDist = getLocalized(s, "district");
      const districtMatch =
        !district ||
        district === "All" ||
        rawDist === district ||
        locDist === district;

      if (!districtMatch) return false;

      if (!taluka || taluka === "All") {
        return true;
      }

      const rawTaluka = getConsistentValue(s, "taluka");
      const locTaluka = getLocalized(s, "taluka");
      return rawTaluka === taluka || locTaluka === taluka;
    });
  }, [shgs, district, taluka, lang]);

  const handleDistrictChange = (e) => {
    setDistrict(e.target.value);
    setTaluka("All");
  };

  const handleClear = () => {
    setDistrict("All");
    setTaluka("All");
  };

  /*
   * ==========================================
   * PAGE
   * ==========================================
   */

  return (
    <section className="firebase-page">

      {/* HERO */}
      <div className="firebase-hero">
        <span>
          UNNATI • {t.shg}
        </span>

        <h1>{t.shg}</h1>

        <p>{t.shgHero}</p>
      </div>

      {/* CONTEXTUAL TIP */}
      <div className="contextual-tip-banner" role="status">
        <p>{t.tipSHG}</p>
      </div>

      {/* FILTERS */}
      <div className="firebase-filters">
        <label htmlFor="shg-district-select" className="visually-hidden">
          {t.selectDistrict || "Select District"}
        </label>
        <select
          id="shg-district-select"
          aria-label={t.selectDistrict || "Select District"}
          title={t.selectDistrict || "Select District"}
          value={district}
          onChange={handleDistrictChange}
        >
          <option value="All">
            {t.allDistricts || "All Districts"}
          </option>
          {districtOptions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <label htmlFor="shg-taluka-select" className="visually-hidden">
          {t.selectTaluka || "Select Taluka"}
        </label>
        <select
          id="shg-taluka-select"
          aria-label={t.selectTaluka || "Select Taluka"}
          title={t.selectTaluka || "Select Taluka"}
          value={taluka}
          disabled={!district || district === "All"}
          onChange={(e) => setTaluka(e.target.value)}
        >
          {!district || district === "All" ? (
            <option value="All">
              {t.selectDistrictFirst || "Select District First"}
            </option>
          ) : (
            <>
              <option value="All">
                {t.allTalukas || "All Talukas"}
              </option>
              {talukaOptions.map((tk) => (
                <option key={tk.value} value={tk.value}>
                  {tk.label}
                </option>
              ))}
            </>
          )}
        </select>

        <button
          type="button"
          onClick={handleClear}
        >
          {t.clear || "Clear"}
        </button>
      </div>

      {/* COUNT */}
      <p className="firebase-count">
        {t.showing} <b>{filtered.length}</b> {t.shgRecords}
      </p>

      {/* LOADING */}
      {loading && (
        <div className="firebase-state">
          {t.loading}...
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="firebase-error">
          {t.unableShgs}
          <br />
          {error}
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && !error && filtered.length === 0 && (
        <div className="firebase-state">
          {t.noShgs}
        </div>
      )}

      {/* SHG CARDS */}
      {!loading && !error && filtered.length > 0 && (
        <div className="firebase-grid">

          {filtered.map((s) => {

            const name =
              getLocalized(s, "institutional_hub") ||
              getLocalized(s, "name") ||
              s.id;

            const currentDistrict =
              getLocalized(s, "district") ||
              t.maharashtra;

            const taluka =
              getLocalized(s, "taluka") || "—";

            const institutionType =
              getLocalized(s, "institution_type") || "—";

            const services =
              getLocalized(s, "key_services") || "—";

            const products =
              getLocalized(s, "products_produced") || "—";

            const contact =
              getLocalized(s, "contact_person") ||
              t.localContact;

            return (
              <article
                className="firebase-card"
                key={s.id}
              >

                {/* DISTRICT */}
                <span className="firebase-badge">
                  {currentDistrict}
                </span>

                {/* NAME */}
                <h2>{name}</h2>

                {/* LOCATION */}
                <p>
                  <b>{t.location}:</b>{" "}
                  {taluka}
                  {taluka !== "—" && currentDistrict
                    ? `, ${currentDistrict}`
                    : ""}
                </p>

                {/* TYPE */}
                <p>
                  <b>{t.type}:</b>{" "}
                  {institutionType}
                </p>

                {/* SERVICES */}
                <p>
                  <b>{t.services}:</b>{" "}
                  {services}
                </p>

                {/* PRODUCTS */}
                <p>
                  <b>{t.products}:</b>{" "}
                  {products}
                </p>

                {/* CONTACT */}
                <p>
                  <b>{t.contact}:</b>{" "}
                  {contact}

                  {s.phone
                    ? ` • ${s.phone}`
                    : ""}
                </p>

                {/* NOTE */}
                <p className="firebase-note">
                  {t.verifyShg}
                </p>

                <button
                  type="button"
                  className="save-resource-btn"
                  aria-pressed={saved.includes(`shg_${s.id}`)}
                  onClick={() => onSave?.(s)}
                >
                  {saved.includes(`shg_${s.id}`)
                    ? (lang === "hi" ? "🔖 सहेजा गया" : lang === "mr" ? "🔖 जतन केले" : "🔖 Saved")
                    : (lang === "hi" ? "🔖 समूह सहेजें" : lang === "mr" ? "🔖 गट जतन करा" : "🔖 Save SHG")}
                </button>

              </article>
            );
          })}

        </div>
      )}

    </section>
  );
}
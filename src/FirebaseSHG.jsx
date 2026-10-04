import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./FirebaseResources.css";

export default function FirebaseSHG({ lang = "en", t }) {
  const [shgs, setShgs] = useState([]);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All");
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
   * MULTILINGUAL FIELD FUNCTION
   * ==========================================
   *
   * Supports:
   *
   * field_en
   * field_hi
   * field_mr
   *
   * Also supports:
   *
   * field_hindi
   * field_marathi
   *
   * And nested format:
   *
   * field: {
   *   en: "...",
   *   hi: "...",
   *   mr: "..."
   * }
   */

  const getLocalized = (item, field) => {
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

    // 4. Base field fallback
    if (
      item[field] !== undefined &&
      item[field] !== null &&
      typeof item[field] !== "object"
    ) {
      return item[field];
    }

    // 5. English fallback
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
   * DISTRICTS
   * ==========================================
   */

  const districts = useMemo(() => {
    const list = shgs
      .map((s) => getLocalized(s, "district"))
      .filter(Boolean);

    return ["All", ...Array.from(new Set(list)).sort()];
  }, [shgs, lang]);

  /*
   * ==========================================
   * SEARCH + FILTER
   * ==========================================
   */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return shgs.filter((s) => {
      const values = [
        s.id,
        getLocalized(s, "taluka"),
        getLocalized(s, "district"),
        getLocalized(s, "division"),
        getLocalized(s, "institutional_hub"),
        getLocalized(s, "institution_type"),
        getLocalized(s, "address"),
        getLocalized(s, "key_services"),
        getLocalized(s, "products_produced"),
        getLocalized(s, "contact_person"),
      ];

      const searchableText = values
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const currentDistrict = getLocalized(s, "district");

      return (
        (!q || searchableText.includes(q)) &&
        (district === "All" || currentDistrict === district)
      );
    });
  }, [shgs, search, district, lang]);

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

      {/* FILTERS */}
      <div className="firebase-filters">

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchShg}
        />

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setDistrict("All");
          }}
        >
          {t.clear}
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

              </article>
            );
          })}

        </div>
      )}

    </section>
  );
}
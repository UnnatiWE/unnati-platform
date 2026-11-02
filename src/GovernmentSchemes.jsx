import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";
import { localized } from "./i18n";

import "./GovernmentSchemes.css";

export default function GovernmentSchemes({
  lang = "en",
  t,
  onViewDetails,
  saved = [],
  onSave,
}) {
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [governmentLevel, setGovernmentLevel] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocs(collection(db, "schemes"))
      .then((snapshot) => {
        setSchemes(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      })
      .catch((e) =>
        setError(
          `${e.code || "error"}: ${
            e.message || t.unableSchemes
          }`
        )
      )
      .finally(() => setLoading(false));
  }, [t.unableSchemes]);


  /* ================================
     CATEGORIES
  ================================= */

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          schemes
            .map((s) =>
              localized(
                s,
                "category",
                lang
              )
            )
            .filter(Boolean)
        )
      ),
    ],
    [schemes, lang]
  );


  /* ================================
     FILTER
  ================================= */

  const filtered = useMemo(() => {
    const q = search
      .toLowerCase()
      .trim();

    return schemes.filter((s) => {

      const name = localized(
        s,
        "name",
        lang
      );

      const cat = localized(
        s,
        "category",
        lang
      );

      const purpose = localized(
        s,
        "purpose",
        lang
      );

      const benefits = localized(
        s,
        "benefits",
        lang
      );

      const government = localized(
        s,
        "government_level",
        lang
      );

      const matchesSearch =
        !q ||
        [
          name,
          cat,
          purpose,
          benefits,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q)
        );

      const matchesCategory =
        category === "All" ||
        cat === category;

      const matchesGovernment =
        governmentLevel === "All" ||
        s.government_level ===
          governmentLevel ||
        government === governmentLevel;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGovernment
      );
    });
  }, [
    schemes,
    search,
    category,
    governmentLevel,
    lang,
  ]);


  return (
    <div className="schemes-page">

      {/* ================================
          HEADER
      ================================= */}

      <section className="schemes-header">

        <div className="header-content">

          <span className="section-label">
            UNNATI
          </span>

          <h1>
            {t.schemes}
          </h1>

          <p>
            {t.schemeHero}
          </p>

        </div>

      </section>


      {/* ================================
          FILTERS
      ================================= */}

      <section className="filter-section">

        {/* CONTEXTUAL TIP */}
        <div className="contextual-tip-banner" role="status">
          <p>{t.tipSchemes}</p>
        </div>

        <div className="search-box">

          <span className="search-icon">
            🔍
          </span>

          <input
            placeholder={
              t.searchSchemes
            }
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="filter-row">

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >
            {categories.map(
              (c) => (
                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>
              )
            )}
          </select>


          <select
            value={governmentLevel}
            onChange={(e) =>
              setGovernmentLevel(
                e.target.value
              )
            }
          >

            <option value="All">
              {t.allGovernment}
            </option>

            <option value="Maharashtra State">
              {t.maharashtraState}
            </option>

            <option value="Central Government">
              {t.centralGovernment}
            </option>

          </select>


          <button
            className="clear-btn"
            onClick={() => {
              setSearch("");
              setCategory("All");
              setGovernmentLevel(
                "All"
              );
            }}
          >
            {t.clearFilters}
          </button>

        </div>

      </section>


      {/* ================================
          RESULTS
      ================================= */}

      <div className="results-info">

        <p>
          {t.showing}{" "}
          <strong>
            {filtered.length}
          </strong>{" "}
          {t.schemesWord}
        </p>

      </div>


      {/* ================================
          SCHEMES
      ================================= */}

      <section className="schemes-container">

        {loading && (
          <div className="loading">

            <div className="spinner"></div>

            <p>
              {t.loading}...
            </p>

          </div>
        )}


        {error && !loading && (
          <div className="error-message">

            <h3>
              {t.somethingWrong}
            </h3>

            <p>{error}</p>

          </div>
        )}


        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="no-results">

              <div className="no-results-icon">
                🔎
              </div>

              <h3>
                {t.noSchemes}
              </h3>

              <p>
                {t.trySchemeSearch}
              </p>

            </div>
          )}


        {!loading &&
          !error &&
          filtered.length > 0 && (

            <div className="schemes-grid">

              {filtered.map(
                (scheme) => (

                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    lang={lang}
                    t={t}
                    onViewDetails={onViewDetails}
                    saved={saved}
                    onSave={onSave}
                  />

                )
              )}

            </div>

          )}

      </section>

    </div>
  );
}


/* =====================================
   SCHEME CARD
===================================== */

function SchemeCard({
  scheme,
  lang,
  t,
  onViewDetails,
  saved = [],
  onSave,
}) {

  return (
    <article className="scheme-card">

      {/* CARD TOP */}

      <div className="card-top">

        <span className="category-badge">
          {localized(
            scheme,
            "category",
            lang
          )}
        </span>

        <span className="government-badge">
          {localized(
            scheme,
            "government_level",
            lang
          )}
        </span>

      </div>


      {/* NAME */}

      <h2>
        {localized(
          scheme,
          "name",
          lang
        )}
      </h2>


      {/* PURPOSE */}

      <p className="purpose">
        {localized(
          scheme,
          "purpose",
          lang
        )}
      </p>


      {/* BENEFITS */}

      <div className="info-block">

        <h4>
          {t.benefits}
        </h4>

        <p>
          {localized(
            scheme,
            "benefits",
            lang
          )}
        </p>

      </div>


      {/* BUTTONS */}

      <div className="card-actions">

        <button
          type="button"
          className="save-resource-btn"
          aria-pressed={saved.includes(`scheme_${scheme.id}`)}
          onClick={() => onSave?.(scheme)}
        >
          {saved.includes(`scheme_${scheme.id}`)
            ? (lang === "hi" ? "🔖 सहेजा गया" : lang === "mr" ? "🔖 जतन केले" : "🔖 Saved")
            : (lang === "hi" ? "🔖 योजना सहेजें" : lang === "mr" ? "🔖 योजना जतन करा" : "🔖 Save Scheme")}
        </button>

        <button
          className="details-btn"
          onClick={() =>
            onViewDetails(scheme)
          }
        >
          {t.viewDetails}
        </button>


        {scheme.official_link && (

          <a
            href={scheme.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="official-btn"
          >
            {t.officialWebsite}
          </a>

        )}

      </div>

    </article>
  );
}
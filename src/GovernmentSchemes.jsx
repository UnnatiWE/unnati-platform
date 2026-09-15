import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "./firebase";

import "./GovernmentSchemes.css";

function GovernmentSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [governmentLevel, setGovernmentLevel] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch schemes from Firebase
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);

        const querySnapshot = await getDocs(
          collection(db, "schemes")
        );

        const schemeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setSchemes(schemeList);
        setFilteredSchemes(schemeList);

      } catch (err) {
        console.error("🔥 FIREBASE ERROR:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);

        setError(
         `Firebase Error: ${err.code || "unknown"} - ${
           err.message || "Unable to load government schemes."
         }`
        );
      }
        finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // Get unique categories
  const categories = [
    "All",
    ...new Set(
      schemes
        .map((scheme) => scheme.category)
        .filter(Boolean)
    )
  ];

  // Search + filters
  useEffect(() => {
    const searchText = search.toLowerCase().trim();

    const filtered = schemes.filter((scheme) => {

      const matchesSearch =
        !searchText ||
        scheme.name?.toLowerCase().includes(searchText) ||
        scheme.category?.toLowerCase().includes(searchText) ||
        scheme.purpose?.toLowerCase().includes(searchText) ||
        scheme.benefits?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" ||
        scheme.category === category;

      const matchesGovernment =
        governmentLevel === "All" ||
        scheme.government_level === governmentLevel;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGovernment
      );
    });

    setFilteredSchemes(filtered);

  }, [search, category, governmentLevel, schemes]);

  return (
    <div className="schemes-page">

      {/* HEADER */}

      <section className="schemes-header">

        <div className="header-content">

          <span className="section-label">
            UNNATI
          </span>

          <h1>
            Government Schemes
          </h1>

          <p>
            Discover government schemes and financial
            support available for women.
          </p>

        </div>

      </section>


      {/* FILTER SECTION */}

      <section className="filter-section">

        <div className="search-box">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        <div className="filter-row">

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >

            {categories.map((item) => (
              <option
                value={item}
                key={item}
              >
                {item}
              </option>
            ))}

          </select>


          {/* GOVERNMENT LEVEL */}

          <select
            value={governmentLevel}
            onChange={(e) =>
              setGovernmentLevel(e.target.value)
            }
          >

            <option value="All">
              All Government
            </option>

            <option value="Maharashtra State">
              Maharashtra State
            </option>

            <option value="Central Government">
              Central Government
            </option>

          </select>


          {/* CLEAR */}

          <button
            className="clear-btn"
            onClick={() => {
              setSearch("");
              setCategory("All");
              setGovernmentLevel("All");
            }}
          >
            Clear Filters
          </button>

        </div>

      </section>


      {/* RESULT COUNT */}

      <div className="results-info">

        <p>
          Showing{" "}
          <strong>
            {filteredSchemes.length}
          </strong>{" "}
          schemes
        </p>

      </div>


      {/* CONTENT */}

      <section className="schemes-container">

        {loading && (

          <div className="loading">

            <div className="spinner"></div>

            <p>
              Loading government schemes...
            </p>

          </div>

        )}


        {error && !loading && (

          <div className="error-message">

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          filteredSchemes.length === 0 && (

            <div className="no-results">

              <div className="no-results-icon">
                🔎
              </div>

              <h3>
                No schemes found
              </h3>

              <p>
                Try another search term or category.
              </p>

            </div>

          )}


        {/* SCHEME CARDS */}

        {!loading &&
          !error &&
          filteredSchemes.length > 0 && (

            <div className="schemes-grid">

              {filteredSchemes.map((scheme) => (

                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                />

              ))}

            </div>

          )}

      </section>

    </div>
  );
}


/* =====================================
   SCHEME CARD
===================================== */

function SchemeCard({ scheme }) {

  const [expanded, setExpanded] = useState(false);

  return (

    <article className="scheme-card">

      {/* CARD HEADER */}

      <div className="card-top">

        <span className="category-badge">
          {scheme.category}
        </span>

        <span className="government-badge">
          {scheme.government_level}
        </span>

      </div>


      {/* TITLE */}

      <h2>
        {scheme.name}
      </h2>


      {/* PURPOSE */}

      <p className="purpose">
        {scheme.purpose}
      </p>


      {/* BENEFITS */}

      <div className="info-block">

        <h4>
          Benefits
        </h4>

        <p>
          {scheme.benefits}
        </p>

      </div>


      {/* EXPANDED CONTENT */}

      {expanded && (

        <div className="expanded-content">

          <div className="info-block">

            <h4>
              Eligibility
            </h4>

            <p>
              {scheme.eligibility}
            </p>

          </div>


          <div className="info-block">

            <h4>
              Documents Required
            </h4>

            <p>
              {scheme.documents_required}
            </p>

          </div>


          <div className="info-block">

            <h4>
              How to Apply
            </h4>

            <p>
              {scheme.application_procedure}
            </p>

          </div>

        </div>

      )}


      {/* BUTTONS */}

      <div className="card-actions">

        <button
          className="details-btn"
          onClick={() =>
            setExpanded(!expanded)
          }
        >
          {expanded
            ? "Show Less"
            : "View Details"}
        </button>


        {scheme.official_link && (

          <a
            href={scheme.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="official-btn"
          >
            Official Website ↗
          </a>

        )}

      </div>

    </article>

  );
}

export default GovernmentSchemes;
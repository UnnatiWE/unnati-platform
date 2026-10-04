import React from "react";
import { localized } from "./i18n";
import "./GovernmentSchemes.css";

export default function SchemeDetails({
  scheme,
  lang = "en",
  t,
  onBack,
}) {
  if (!scheme) {
    return (
      <div className="scheme-details-page">
        <div className="scheme-details-container">
          <div className="scheme-detail-section">
            <h2>{t?.noSchemes || "Scheme not found"}</h2>

            <button
              className="details-btn"
              onClick={onBack}
            >
              ← {t?.back || "Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getDocumentsList = () => {
    const documents = localized(
      scheme,
      "documents_required",
      lang
    );

    if (!documents) {
      return [];
    }

    return String(documents)
      .split(/\n|•|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const documentsList = getDocumentsList();

  return (
    <div className="scheme-details-page">

      {/* HEADER */}
      <section className="scheme-details-header">

        <div className="scheme-details-header-inner">

          <button
            className="details-back-btn"
            onClick={onBack}
          >
            ← {t?.back || "Back to Schemes"}
          </button>

          <span className="section-label">
            UNNATI
          </span>

          <h1>
            {localized(
              scheme,
              "name",
              lang
            )}
          </h1>

          <div className="details-badges">

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

        </div>

      </section>


      {/* DETAILS */}
      <main className="scheme-details-container">

        {/* PURPOSE */}
        <section className="scheme-detail-section">

          <h2>
            {t?.purpose || "Purpose"}
          </h2>

          <p>
            {localized(
              scheme,
              "purpose",
              lang
            )}
          </p>

        </section>


        {/* BENEFITS */}
        <section className="scheme-detail-section">

          <h2>
            {t?.benefits || "Benefits"}
          </h2>

          <p>
            {localized(
              scheme,
              "benefits",
              lang
            )}
          </p>

        </section>


        {/* ELIGIBILITY */}
        <section className="scheme-detail-section">

          <h2>
            {t?.eligibility || "Eligibility"}
          </h2>

          <p>
            {localized(
              scheme,
              "eligibility",
              lang
            )}
          </p>

        </section>


        {/* DOCUMENTS */}
        <section className="scheme-detail-section">

          <h2>
            {t?.documentsRequired ||
              "Documents Required"}
          </h2>

          {documentsList.length > 0 ? (
            <ul className="documents-list">

              {documentsList.map(
                (document, index) => (
                  <li key={index}>
                    {document}
                  </li>
                )
              )}

            </ul>
          ) : (
            <p>—</p>
          )}

        </section>


        {/* HOW TO APPLY */}
        <section className="scheme-detail-section">

          <h2>
            {t?.howToApply ||
              "How to Apply"}
          </h2>

          <p>
            {localized(
              scheme,
              "application_procedure",
              lang
            )}
          </p>

        </section>


        {/* OFFICIAL WEBSITE */}
        {scheme.official_link && (
          <section className="scheme-detail-action">

            <h2>
              {t?.officialWebsite ||
                "Official Website"}
            </h2>

            <p>
              {t?.officialWebsiteText ||
                "Visit the official government website for the latest information and application process."}
            </p>

            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="official-btn"
            >
              {t?.officialWebsite ||
                "Visit Official Website"}{" "}
            </a>

          </section>
        )}


        {/* BACK */}
        <div className="scheme-details-bottom">

          <button
            className="details-back-btn"
            onClick={onBack}
          >
            ← {t?.back || "Back to Schemes"}
          </button>

        </div>

      </main>

    </div>
  );
}
// src/App.jsx
import { useState } from "react";
import { products } from "./products";
import { getRecommendations } from "./api";

const CategoryColors = {
  Laptops: "bg-blue-100 text-blue-700",
  Fitness: "bg-green-100 text-green-700",
  Audio: "bg-purple-100 text-purple-700",
  Cameras: "bg-orange-100 text-orange-700",
  Office: "bg-slate-100 text-slate-700",
};

function ProductCard({ product, isHighlighted }) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 ${
        isHighlighted
          ? "border-indigo-500 shadow-lg shadow-indigo-100 bg-white scale-[1.02]"
          : "border-slate-200 bg-white opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{product.name}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${CategoryColors[product.category] ?? "bg-gray-100 text-gray-600"}`}>
          {product.category}
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{product.description}</p>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-lg font-bold text-indigo-600">${product.price}</span>
        {isHighlighted && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ✓ Recommended
          </span>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Laptop under $900 for work",
  "Budget fitness gear for home",
  "Wireless headphones with noise cancellation",
  "Camera for vlogging",
  "Office setup upgrade",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [recommendedIds, setRecommendedIds] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;

    setQuery(q);
    setStatus("loading");
    setRecommendedIds(null);
    setErrorMsg("");

    const ids = await getRecommendations(q, products);

    if (ids === null) {
      setStatus("error");
      setErrorMsg("The AI service is unavailable. Check your API key or try again.");
    } else if (ids.length === 0) {
      setStatus("success");
      setRecommendedIds([]);
    } else {
      setStatus("success");
      setRecommendedIds(ids);
    }
  };

  const handleReset = () => {
    setQuery("");
    setStatus("idle");
    setRecommendedIds(null);
    setErrorMsg("");
  };

  const sortedProducts = recommendedIds
    ? [...products].sort((a, b) => {
        const aRec = recommendedIds.includes(a.id);
        const bRec = recommendedIds.includes(b.id);
        return bRec - aRec;
      })
    : products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="font-bold text-slate-800 text-lg tracking-tight">AI Recommender</span>
          </div>
          <span className="text-xs text-slate-400">{products.length} products in catalog</span>
        </div>
      </header>

      {/* Hero Search */}
      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Find exactly what you need
        </h1>
        <p className="text-slate-500 mb-8 text-lg">
          Describe what you're looking for in plain English — our AI will match it.
        </p>

        {/* Search bar */}
        <div className="flex gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-md focus-within:border-indigo-400 focus-within:shadow-indigo-100 transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "I need a laptop under $900 for travel"'
            className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          {status !== "idle" && (
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 px-2 text-lg"
              title="Clear"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            disabled={status === "loading" || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Thinking…
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Suggestion chips */}
        {status === "idle" && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Status messages */}
        {status === "error" && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            ⚠️ {errorMsg}
          </div>
        )}
        {status === "success" && recommendedIds?.length === 0 && (
          <div className="mt-4 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3">
            No products matched your query. Try different keywords.
          </div>
        )}
        {status === "success" && recommendedIds?.length > 0 && (
          <div className="mt-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            ✨ Found <strong>{recommendedIds.length}</strong> recommendation{recommendedIds.length > 1 ? "s" : ""} for "<em>{query}</em>"
          </div>
        )}
      </section>

      {/* Product Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isHighlighted={
                status !== "success" || recommendedIds === null
                  ? true // show all normally before search
                  : recommendedIds.includes(product.id)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
import React from "react";
import { addons, types } from "storybook/manager-api";

const ADDON_ID = "aesthetic-grade";
const PANEL_ID = `${ADDON_ID}/panel`;

const GRADE_COLORS = {
  S: "#d4a84b",
  A: "#22D3EE",
  B: "#10B981",
  C: "#EAB308",
  D: "#EF4444",
};

const TIER_LABELS = { t1: "Tier 1 — Structure", t2: "Tier 2 — Visual", t3: "Tier 3 — Holistic" };

const DIMENSION_LABELS = {
  composition: "Composition",
  colorHarmony: "Color Harmony",
  typography: "Typography",
  spacing: "Spacing",
  motionDesign: "Motion Design",
  brandCoherence: "Brand Coherence",
};

function Bar({ label, value, max = 100, color = "#22D3EE" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return React.createElement(
    "div",
    { style: { marginBottom: 8 } },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#a1a1aa",
          marginBottom: 3,
        },
      },
      React.createElement("span", null, label),
      React.createElement("span", null, `${value}/${max}`)
    ),
    React.createElement(
      "div",
      {
        style: {
          height: 6,
          borderRadius: 3,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        },
      },
      React.createElement("div", {
        style: {
          width: `${pct}%`,
          height: "100%",
          borderRadius: 3,
          background: color,
          transition: "width 0.3s ease",
        },
      })
    )
  );
}

function GradeBadge({ grade, score }) {
  const color = GRADE_COLORS[grade] || "#71717a";
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          width: 56,
          height: 56,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 700,
          color,
          border: `2px solid ${color}`,
          background: `${color}18`,
        },
      },
      grade
    ),
    React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { fontSize: 24, fontWeight: 600, color: "#fafafa" } },
        score,
        React.createElement(
          "span",
          { style: { fontSize: 14, color: "#71717a", marginLeft: 2 } },
          "/100"
        )
      ),
      React.createElement(
        "div",
        { style: { fontSize: 12, color: "#a1a1aa" } },
        "Composite Score"
      )
    )
  );
}

function AestheticPanel({ active, api }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [currentStory, setCurrentStory] = React.useState(null);

  React.useEffect(() => {
    const channel = api.getChannel();
    const onStoryChanged = (storyId) => setCurrentStory(storyId);

    // Get initial story
    const state = api.getStoryContext?.() || {};
    if (state.id) setCurrentStory(state.id);

    channel.on("storyChanged", onStoryChanged);
    return () => channel.off("storyChanged", onStoryChanged);
  }, [api]);

  // Also try getting story from the API state when it updates
  React.useEffect(() => {
    const store = api.getCurrentStoryData?.();
    if (store?.id && store.id !== currentStory) {
      setCurrentStory(store.id);
    }
  });

  React.useEffect(() => {
    if (!active || !currentStory) return;

    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/grades/by-story/${currentStory}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError("not-graded");
        setLoading(false);
      });
  }, [active, currentStory]);

  if (!active) return null;

  const panelStyle = {
    padding: 20,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#fafafa",
    background: "#18181b",
    minHeight: "100%",
    overflowY: "auto",
  };

  if (loading) {
    return React.createElement(
      "div",
      { style: { ...panelStyle, color: "#71717a" } },
      "Loading grade..."
    );
  }

  if (error === "not-graded") {
    return React.createElement(
      "div",
      { style: panelStyle },
      React.createElement(
        "div",
        {
          style: {
            padding: 16,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "#a1a1aa",
            fontSize: 13,
          },
        },
        "Not yet graded — run ",
        React.createElement(
          "code",
          {
            style: {
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.08)",
              fontSize: 12,
            },
          },
          "npm run aesthetic-grade"
        )
      )
    );
  }

  if (!data) return null;

  const { grade, compositeScore, tiers, dimensions, suggestions, componentTier } = data;

  return React.createElement(
    "div",
    { style: panelStyle },
    // Grade badge
    React.createElement(GradeBadge, { grade, score: compositeScore }),

    // Component tier label
    componentTier &&
      React.createElement(
        "div",
        {
          style: {
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 500,
            background: "rgba(255,255,255,0.06)",
            color: "#a1a1aa",
            textTransform: "capitalize",
            marginBottom: 16,
          },
        },
        componentTier
      ),

    // Tier breakdown
    tiers &&
      React.createElement(
        "div",
        { style: { marginBottom: 20 } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#d4d4d8",
              marginBottom: 10,
            },
          },
          "Tier Breakdown"
        ),
        Object.entries(TIER_LABELS).map(([key, label]) =>
          tiers[key] != null
            ? React.createElement(Bar, {
                key,
                label,
                value: tiers[key],
                max: 100,
                color: GRADE_COLORS.A,
              })
            : null
        )
      ),

    // Tier 3 dimensions
    dimensions &&
      React.createElement(
        "div",
        { style: { marginBottom: 20 } },
        React.createElement(
          "div",
          {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#d4d4d8",
              marginBottom: 10,
            },
          },
          "Dimensions"
        ),
        Object.entries(DIMENSION_LABELS).map(([key, label]) =>
          dimensions[key] != null
            ? React.createElement(Bar, {
                key,
                label,
                value: dimensions[key],
                max: 100,
                color: GRADE_COLORS.B,
              })
            : null
        )
      ),

    // Suggestions
    suggestions &&
      suggestions.length > 0 &&
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#d4d4d8",
              marginBottom: 8,
            },
          },
          "Suggestions"
        ),
        React.createElement(
          "ul",
          {
            style: {
              margin: 0,
              padding: "0 0 0 18px",
              fontSize: 12,
              color: "#a1a1aa",
              lineHeight: 1.6,
            },
          },
          suggestions.map((s, idx) =>
            React.createElement("li", { key: idx }, s)
          )
        )
      )
  );
}

addons.register(ADDON_ID, (api) => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Aesthetic Grade",
    render: ({ active }) =>
      React.createElement(AestheticPanel, { active, api }),
  });
});

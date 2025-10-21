// src/View3.js
import React, { useEffect } from "react";
import * as d3 from "d3";

function View3() {
  useEffect(() => {
  // 🧹 Clear any existing SVG before re-rendering
  d3.select("#view3").select("svg").remove();

  // 🧾 Project details
  const lines = [
    "Visual Analytics for Cancer Nutrition Website Data",
    "CS 529 – Visual Data Science – Fall 2025",
    "",
    "Team Members:",
    "• Santhosh Reddy Katasani Venkata (Project Manager)",
    "• Madhura Dongare",
    "• Het Nagda",
    "",
    "Client:",
    "Dr. Jean Reading – Department of Family and Community Medicine, UI Health",
    "Email: jreading@uic.edu",
    "",
    "Description:",
    "An interactive D3.js dashboard to visualize patient nutrition patterns, AI-recommended recipes,",
    "and health metrics for cancer research at UI Health.",
  ];

  // dynamically calculate height (each line ~22px spacing + margin)
  const height = lines.length * 25 + 60;

  const svg = d3
    .select("#view3")
    .append("svg")
    .attr("width", 850)
    .attr("height", height);

  svg
    .selectAll("text")
    .data(lines)
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", (d, i) => 40 + i * 25)
    .text((d) => d)
    .style("font-size", (d, i) => (i === 0 ? "18px" : "14px"))
    .style("font-weight", (d, i) => (i === 0 ? "bold" : "normal"))
    .style("fill", "#333");
}, []);

  return (
    <div
      id="view3"
      className="view"
      style={{
        marginTop: "1rem",
        paddingBottom: "2rem",
      }}
    />
  );
}

export default View3;

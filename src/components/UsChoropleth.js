import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const stateAbbrToName = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const fipsToAbbr = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY",
};


function MetricCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "clamp(4px, 1%, 8px)",
        borderRadius: "4px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "0",
        overflow: "hidden",
      }}
    >
      <div style={{ 
        fontSize: "0.55em", 
        color: "#6b7280", 
        marginBottom: "0.15em",
        lineHeight: "1.2" 
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: "1.1em", 
        fontWeight: 700, 
        color, 
        lineHeight: "1.1" 
      }}>
        {value != null && !isNaN(value) ? value.toFixed(1) : "N/A"}
      </div>
      <div style={{ 
        fontSize: "0.45em", 
        color: "#9ca3af", 
        marginTop: "0.1em",
        lineHeight: "1.2" 
      }}>
        / 100
      </div>
    </div>
  );
}

const USChoropleth = ({ data, selectedState, onStateClick }) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [stateMetrics, setStateMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        const bounds = wrapperRef.current.getBoundingClientRect();
        setDims({ width: bounds.width, height: bounds.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);


  useEffect(() => {
    if (!dims.width || !dims.height || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();


    const tooltip = d3
      .select(tooltipRef.current)
      .style("position", "fixed")
      .style("pointerEvents", "none")
      .style("background", "rgba(255,255,255,0.97)")
      .style("padding", "8px 10px")
      .style("borderRadius", "6px")
      .style("border", "1px solid #d1d5db")
      .style("boxShadow", "0 4px 10px rgba(0,0,0,0.15)")
      .style("fontSize", "11px")
      .style("opacity", 0)
      .style("display", "none")
      .style("zIndex", 2000);

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then((topology) => {
        const states = feature(topology, topology.objects.states).features;


        const agg = {};
        data.forEach((p) => {
          const s = p.state;
          if (!s) return;
          if (!agg[s]) agg[s] = { n: 0, lifestyle: 0, diet: 0, pa: 0, bmi: 0 };
          agg[s].n++;
          agg[s].lifestyle += p.lifestyleScore || 0;
          agg[s].diet += p.dietScore || 0;
          agg[s].pa += p.activityScore || 0;
          agg[s].bmi += p.bmiScore || 0;
        });

        const computed = {};
        const avgLifestyle = new Map();
        const patientsByAbbr = new Map();

        Object.keys(agg).forEach((abbr) => {
          const a = agg[abbr];
          computed[abbr] = {
            lifestyle: a.n ? a.lifestyle / a.n : null,
            diet: a.n ? a.diet / a.n : null,
            pa: a.n ? a.pa / a.n : null,
            bmi: a.n ? a.bmi / a.n : null,
          };
          avgLifestyle.set(abbr, computed[abbr].lifestyle);
          patientsByAbbr.set(abbr, a.n);
        });

        setStateMetrics(computed);


        const vals = [...avgLifestyle.values()].filter((v) => v != null);
        const colorScale =
          vals.length > 0
            ? d3
                .scaleSequential(d3.interpolateYlOrRd)
                .domain([d3.min(vals), d3.max(vals)])
            : () => "#eee";

        const projection = d3
          .geoAlbersUsa()
          .fitSize([dims.width, dims.height], {
            type: "FeatureCollection",
            features: states,
          });

        const path = d3.geoPath(projection);


        svg
          .append("g")
          .selectAll("path")
          .data(states)
          .join("path")
          .attr("d", path)
          .attr("fill", (d) => {
            const abbr = fipsToAbbr[d.id];
            const base = colorScale(avgLifestyle.get(abbr)) || "#eee";


            if (!selectedState) return base;
            if (selectedState === abbr) return base;

            return "#e0e0e0"; 
          })
          .attr("stroke", "#ffffff")
          .attr("strokeWidth", 0.7)
          .style("cursor", "pointer")


          .on("click", (event, d) => {
            event.stopPropagation();
            tooltip
              .style("opacity", 0)
              .style("display", "none");
            const abbr = fipsToAbbr[d.id];
            onStateClick(abbr === selectedState ? null : abbr);
          })


          .on("mousemove", (event, d) => {
            if (selectedState) {
              tooltip
                .style("opacity", 0)
                .style("display", "none");
              return;
            }

            const abbr = fipsToAbbr[d.id];
            const name = stateAbbrToName[abbr];
            const life = avgLifestyle.get(abbr);
            const n = patientsByAbbr.get(abbr);

            tooltip
              .style("display", "block")
              .style("opacity", 1)
              .style("left", event.pageX + 12 + "px")
              .style("top", event.pageY + 12 + "px")
              .html(`
                <div><strong>${name} (${abbr})</strong></div>
                <div>Lifestyle Score: ${life != null ? life.toFixed(1) : "N/A"}</div>
                <div>Patients: ${n != null ? n : "N/A"}</div>
              `);
          })

          .on("mouseleave", () => {
            tooltip
              .style("opacity", 0)
              .style("display", "none");
          });

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Error loading map");
        setLoading(false);
      });
  }, [dims, data, selectedState, onStateClick]);

  const selected = selectedState ? stateMetrics[selectedState] : null;

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#999',
          fontSize: '14px'
        }}>
          Loading map...
        </div>
      )}
      {error && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#cc3311',
          fontSize: '14px'
        }}>
          Error: {error}
        </div>
      )}

      {/* Map */}
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
        }}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Tooltip */}
      <div ref={tooltipRef} />

      {/* Legend */}
      {!loading && !error && (
        <div
          style={{
            position: "absolute",
            top: "25px",
            left: "25px",
            fontSize: "10px",
            textAlign: "center",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <div>Higher</div>
          <div
            style={{
              width: "8px",
              height: "90px",
              borderRadius: "4px",
              margin: "4px auto",
              background:
                "linear-gradient(to bottom, #f03b20, #feb24c, #ffeda0, #ffffcc)",
            }}
          ></div>
          <div>Lower</div>
        </div>
      )}

      {/* Score Panel - Shows when state is selected */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: "2%",
            right: "2%",
            width: "min(160px, 15%)",
            maxHeight: "96%",
            background: "#fff",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 1500,
            pointerEvents: "none",
          }}
        >
          <div style={{ 
            fontSize: "0.7em", 
            fontWeight: 600, 
            marginBottom: "0.3em",
            paddingBottom: "0.3em",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
            pointerEvents: "auto",
            lineHeight: "1.2",
          }}>
            {stateAbbrToName[selectedState]} ({selectedState})
          </div>

          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "6px", 
            flex: 1,
            pointerEvents: "auto",
          }}>
            <MetricCard label="Lifestyle" value={selected.lifestyle} color="#3b82f6" />
            <MetricCard label="Diet" value={selected.diet} color="#10b981" />
            <MetricCard label="Activity" value={selected.pa} color="#f59e0b" />
            <MetricCard label="BMI" value={selected.bmi} color="#ef4444" />
          </div>
        </div>
      )}
    </div>
  );
};

export default USChoropleth;
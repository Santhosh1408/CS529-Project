import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const STATE_NAMES = {
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

const DivergingBarChart = ({ selectedState, stateData, nationalData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !selectedState || !stateData || !nationalData) return;

    const margin = { top: 20, right: 60, bottom: 60, left: 140 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const state = stateData.find(s => s.state_abbr === selectedState);
    if (!state) return;

    const metrics = [
      { key: 'avg_lifestyle_score_100', label: 'Lifestyle Score' },
      { key: 'avg_diet_score_100', label: 'Diet Score' },
      { key: 'avg_pa_score_100', label: 'Physical Activity' },
      { key: 'avg_bmi_score_100', label: 'BMI Score' },
      { key: 'avg_cancer_score_100', label: 'Cancer Score' }
    ];

    const data = metrics.map(m => ({
      label: m.label,
      stateValue: state[m.key] || 0,
      nationalValue: nationalData[m.key] || 0,
      difference: (state[m.key] || 0) - (nationalData[m.key] || 0)
    }));

    const y = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, height])
      .padding(0.3);

    const maxAbsDiff = d3.max(data, d => Math.abs(d.difference)) || 10;
    const x = d3.scaleLinear()
      .domain([-maxAbsDiff * 1.2, maxAbsDiff * 1.2])
      .range([0, width]);

    g.append('line')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8))
      .style('font-size', '11px');

    xAxis.selectAll('line').attr('stroke', '#ccc');
    xAxis.select('.domain').attr('stroke', '#ccc');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#555')
      .text('Points Above/Below National Average');

    const yAxis = g.append('g')
      .call(d3.axisLeft(y))
      .style('font-size', '13px')
      .style('font-weight', '500');

    yAxis.selectAll('line').remove();
    yAxis.select('.domain').remove();

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => d.difference >= 0 ? x(0) : x(d.difference))
      .attr('y', d => y(d.label))
      .attr('width', d => Math.abs(x(d.difference) - x(0)))
      .attr('height', y.bandwidth())
      .attr('fill', d => d.difference >= 0 ? '#4ecdc4' : '#e74c3c')
      .attr('opacity', 0.85)
      .attr('rx', 3);

    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => {
        const barEnd = d.difference >= 0 ? x(d.difference) : x(d.difference);
        return d.difference >= 0 ? barEnd + 5 : barEnd - 5;
      })
      .attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.difference >= 0 ? 'start' : 'end')
      .style('font-size', '13px')
      .style('font-weight', '700')
      .style('fill', '#2c3e50')
      .text(d => (d.difference >= 0 ? '+' : '') + d.difference.toFixed(1));

    const legend = svg.append('g')
      .attr('transform', `translate(${dimensions.width - 180}, 10)`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', '#4ecdc4')
      .attr('opacity', 0.85)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 10)
      .style('font-size', '11px')
      .style('fill', '#555')
      .text('Above Avg');

    legend.append('rect')
      .attr('x', 100)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 12)
      .attr('fill', '#e74c3c')
      .attr('opacity', 0.85)
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 125)
      .attr('y', 10)
      .style('font-size', '11px')
      .style('fill', '#555')
      .text('Below Avg');

  }, [dimensions, selectedState, stateData, nationalData]);

  if (!selectedState) {
    return (
      <div ref={containerRef} style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        Select a state to compare with national average
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ display: 'block' }}></svg>
    </div>
  );
};

export default DivergingBarChart;

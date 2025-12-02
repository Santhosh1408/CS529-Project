import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/RadarChart.css';

const RadarChart = ({ patient, allData }) => {
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
    if (!patient || !dimensions.width || !dimensions.height) return;

    const metrics = [
      { key: 'fiber', label: 'Fiber (g)', max: 40 },
      { key: 'sugar', label: 'Sugar (g)', max: 150 },
      { key: 'protein', label: 'Protein (g)', max: 150 },
      { key: 'calories', label: 'Calories', max: 3000 },
      { key: 'satFat', label: 'Sat. Fat (g)', max: 50 }
    ];

    const averages = {};
    metrics.forEach(metric => {
      const values = allData.map(d => d[metric.key]).filter(v => v && !isNaN(v));
      averages[metric.key] = values.length > 0 ? d3.mean(values) : 0;
    });

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    const angleScale = d3.scaleLinear()
      .domain([0, metrics.length])
      .range([0, 2 * Math.PI]);

    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      g.append('circle')
        .attr('r', (radius / levels) * i)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    }

    metrics.forEach((metric, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);

      const labelDistance = radius + 20;
      const labelX = Math.cos(angle) * labelDistance;
      const labelY = Math.sin(angle) * labelDistance;

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', '#2c3e50')
        .text(metric.label);
    });

    const patientDataPoints = metrics.map((metric, i) => {
      const value = patient[metric.key] || 0;
      const normalized = Math.min(value / metric.max, 1);
      const angle = angleScale(i) - Math.PI / 2;
      return {
        metric: metric,
        value: value,
        normalized: normalized,
        angle: angle,
        x: Math.cos(angle) * radius * normalized,
        y: Math.sin(angle) * radius * normalized,
        radiusValue: radius * normalized
      };
    });

    const avgLine = d3.lineRadial()
      .angle((d, i) => angleScale(i) - Math.PI / 2)
      .radius(d => {
        const value = averages[d.key] || 0;
        return radius * Math.min(value / d.max, 1);
      })
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(metrics)
      .attr('d', avgLine)
      .attr('fill', '#009988')
      .attr('fill-opacity', 0.1)
      .attr('stroke', '#009988')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    const patientPath = d3.line()
      .x((d, i) => patientDataPoints[i].x)
      .y((d, i) => patientDataPoints[i].y)
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(patientDataPoints)
      .attr('d', patientPath)
      .attr('fill', '#0077BB')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#0077BB')
      .attr('stroke-width', 3);

    patientDataPoints.forEach(point => {
      g.append('circle')
        .attr('cx', point.x)
        .attr('cy', point.y)
        .attr('r', 5)
        .attr('fill', '#0077BB')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#0077BB')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .style('font-size', '11px')
      .style('fill', '#333')
      .text('Patient');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 20)
      .attr('y2', 20)
      .attr('stroke', '#009988')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 24)
      .style('font-size', '11px')
      .style('fill', '#333')
      .text('Average');
  }, [patient, allData, dimensions]);

  if (!patient) {
    return (
      <div ref={containerRef} className="radar-container">
        <div className="radar-empty">Select a patient to view nutritional profile</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="radar-container">
      <svg ref={svgRef} className="radar-svg"></svg>
    </div>
  );
};

export default RadarChart;

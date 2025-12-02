import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/ParallelCoordinates.css';

const ParallelCoordinates = ({ patient, allData }) => {
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
    if (!patient || !allData || allData.length === 0 || !dimensions.width || !dimensions.height) return;

    const margin = { top: 40, right: 80, bottom: 20, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const day1Data = {
      fiber: patient.fiberDay1 || 0,
      sugar: patient.sugarDay1 || 0,
      protein: patient.proteinDay1 || 0,
      calories: patient.caloriesDay1 || 0,
      satFat: patient.satFatDay1 || 0
    };

    const day2Data = {
      fiber: patient.fiberDay2 || 0,
      sugar: patient.sugarDay2 || 0,
      protein: patient.proteinDay2 || 0,
      calories: patient.caloriesDay2 || 0,
      satFat: patient.satFatDay2 || 0
    };

    const avgData = {
      fiber: (day1Data.fiber + day2Data.fiber) / 2,
      sugar: (day1Data.sugar + day2Data.sugar) / 2,
      protein: (day1Data.protein + day2Data.protein) / 2,
      calories: (day1Data.calories + day2Data.calories) / 2,
      satFat: (day1Data.satFat + day2Data.satFat) / 2
    };

    const getDomain = (key) => {
      const values = [day1Data[key], day2Data[key], avgData[key]];
      const max = Math.max(...values);
      const padded = max * 1.2;
      return [0, padded];
    };

    const dims = [
      { key: 'fiber', label: 'Fiber (g)', domain: getDomain('fiber') },
      { key: 'sugar', label: 'Sugar (g)', domain: getDomain('sugar') },
      { key: 'protein', label: 'Protein (g)', domain: getDomain('protein') },
      { key: 'calories', label: 'Calories', domain: getDomain('calories') },
      { key: 'satFat', label: 'Sat. Fat (g)', domain: getDomain('satFat') }
    ];

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(dims.map(d => d.key))
      .range([0, width])
      .padding(0.1);

    const y = {};
    dims.forEach(dim => {
      y[dim.key] = d3.scaleLinear()
        .domain(dim.domain)
        .range([height, 0]);
    });

    const path = (d) => {
      return d3.line()(dims.map(dim => [x(dim.key), y[dim.key](d[dim.key] || 0)]));
    };

    g.append('path')
      .datum(avgData)
      .attr('class', 'avg-line')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#999999')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);

    g.append('path')
      .datum(day2Data)
      .attr('class', 'day2-line')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#EE7733')
      .attr('stroke-width', 3)
      .attr('opacity', 0.8);

    g.append('path')
      .datum(day1Data)
      .attr('class', 'day1-line')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#0077BB')
      .attr('stroke-width', 3)
      .attr('opacity', 1);

    dims.forEach(dim => {
      const axis = g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${x(dim.key)},0)`)
        .call(d3.axisLeft(y[dim.key]).ticks(5));

      axis.selectAll('line')
        .attr('stroke', '#ccc');

      axis.selectAll('text')
        .style('font-size', '10px')
        .style('fill', '#666');

      axis.select('.domain')
        .attr('stroke', '#999')
        .attr('stroke-width', 2);

      axis.append('text')
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', '#2c3e50')
        .text(dim.label);

      axis.append('circle')
        .attr('cy', y[dim.key](day1Data[dim.key]))
        .attr('r', 5)
        .attr('fill', '#0077BB')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      axis.append('circle')
        .attr('cy', y[dim.key](day2Data[dim.key]))
        .attr('r', 5)
        .attr('fill', '#EE7733')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      axis.append('circle')
        .attr('cy', y[dim.key](avgData[dim.key]))
        .attr('r', 4)
        .attr('fill', '#999999')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6);
    });

    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top - 30})`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 25)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#0077BB')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 4)
      .style('font-size', '11px')
      .style('fill', '#333')
      .text('Day 1');

    legend.append('line')
      .attr('x1', 80)
      .attr('x2', 105)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#EE7733')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 110)
      .attr('y', 4)
      .style('font-size', '11px')
      .style('fill', '#333')
      .text('Day 2');

    legend.append('line')
      .attr('x1', 160)
      .attr('x2', 185)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#999999')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);

    legend.append('text')
      .attr('x', 190)
      .attr('y', 4)
      .style('font-size', '11px')
      .style('fill', '#333')
      .text('Average');

  }, [patient, allData, dimensions]);

  if (!patient) {
    return (
      <div ref={containerRef} className="parallel-container">
        <div className="parallel-empty">Select a patient to view multivariate profile</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="parallel-container">
      <svg ref={svgRef} className="parallel-svg"></svg>
    </div>
  );
};

export default ParallelCoordinates;

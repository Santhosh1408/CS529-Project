import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import '../styles/BeeswarmPlot.css';

const BeeswarmPlot = ({ data, searchSeqn, onPatientClick, selectedState, sankeyFilter }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPatient, setHoveredPatient] = useState(null);
  const [searchError, setSearchError] = useState('');

  const getColor = (bmi, cancerStatus) => {
    const isObesity = bmi >= 30;
    const isOverweight = bmi >= 25 && bmi < 30;
    const isHealthy = bmi < 25;
    const hasCancer = cancerStatus === 'Yes';

    if (hasCancer) {
      if (isObesity) return '#CC3311';
      if (isOverweight) return '#EE7733';
      if (isHealthy) return '#EE3377';
    } else {
      if (isObesity) return '#0077BB';
      if (isOverweight) return '#33BBEE';
      if (isHealthy) return '#009988';
    }
    return '#BBBBBB';
  };

  const validData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.filter(d => {
      const bmi = d.bmi || d.BMXBMI;
      return bmi > 10 && bmi < 60 && !isNaN(bmi);
    }).map(d => ({
      SEQN: d.id || d.SEQN,
      BMXBMI: d.bmi || d.BMXBMI,
      RIDAGEYR: d.age || d.RIDAGEYR,
      RIAGENDR: d.gender || d.RIAGENDR,
      AVG_FIBE: d.fiber || d.AVG_FIBE,
      AVG_SUGR: d.sugar || d.AVG_SUGR,
      LIFESTYLE_SCORE_100: d.lifestyleScore || d.LIFESTYLE_SCORE_100,
      CANCER_STATUS_TEXT: d.cancerStatus || d.CANCER_STATUS_TEXT || 'Unknown',
      state: d.state || d.synthetic_state_abbr
    }));
  }, [data]);

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
    if (!validData.length || !dimensions.width || !dimensions.height) return;

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    svg.append('rect')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('fill', 'transparent')
      .style('cursor', 'default')
      .on('click', function() {
        if (searchSeqn && onPatientClick) {
          onPatientClick(null);
        }
      });

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, width])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([15, 50])
      .range([height, 0]);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(0))
      .style('color', '#555');

    xAxis.append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', '#2c3e50')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Patient Distribution');

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(10))
      .style('color', '#555');

    yAxis.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('fill', '#2c3e50')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('text-anchor', 'middle')
      .text('Body Mass Index (BMI)');

    const referenceLines = [18.5, 25, 30];
    referenceLines.forEach(bmi => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(bmi))
        .attr('y2', yScale(bmi))
        .attr('stroke', 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
    });

    const nodes = validData.map(d => ({
      ...d,
      x: width / 2,
      y: yScale(d.BMXBMI),
      radius: 5
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(d => yScale(d.BMXBMI)).strength(1))
      .force('collide', d3.forceCollide(6))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    const searchedPatient = searchSeqn ? 
      nodes.find(d => d.SEQN === parseInt(searchSeqn)) : null;

    if (searchSeqn && !searchedPatient) {
      setSearchError('Patient not found');
    } else {
      setSearchError('');
    }

    g.selectAll('.patient-dot')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'patient-dot')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 5)
      .attr('fill', d => getColor(d.BMXBMI, d.CANCER_STATUS_TEXT))
      .attr('opacity', d => {
        if (searchSeqn && d.SEQN !== parseInt(searchSeqn)) return 0.2;
        
        let matchesSankeyFilter = true;
        if (sankeyFilter) {
          const fiber = d.AVG_FIBE || 0;
          const sugar = d.AVG_SUGR || 0;
          
          const fiberGroup = fiber < 15 ? 'Low Fiber' : 
                            fiber < 25 ? 'Med Fiber' : 
                            'High Fiber';
          const sugarGroup = sugar < 50 ? 'Low Sugar' :
                            sugar < 100 ? 'Med Sugar' :
                            'High Sugar';
          const bmiGroup = d.BMXBMI < 18.5 ? 'Underweight' :
                          d.BMXBMI < 25 ? 'Healthy' :
                          d.BMXBMI < 30 ? 'Overweight' :
                          'Obese';

          if (sankeyFilter.type === 'node') {
            const nodeName = sankeyFilter.name;
            matchesSankeyFilter = fiberGroup === nodeName || sugarGroup === nodeName || bmiGroup === nodeName;
          } else if (sankeyFilter.type === 'link') {
            const { source, target } = sankeyFilter;
            matchesSankeyFilter = (
              (fiberGroup === source && sugarGroup === target) ||
              (sugarGroup === source && bmiGroup === target)
            );
          }
        }
        
        const matchesState = !selectedState || d.state === selectedState;
        
        if (!matchesSankeyFilter || !matchesState) return 0.1;
        
        return 1;
      })
      .attr('stroke', d => {
        if (searchSeqn && d.SEQN === parseInt(searchSeqn)) {
          return '#FFD700';
        }
        return 'none';
      })
      .attr('stroke-width', d => {
        if (searchSeqn && d.SEQN === parseInt(searchSeqn)) {
          return 3;
        }
        return 0;
      })
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        if (onPatientClick) {
          if (searchSeqn && d.SEQN === parseInt(searchSeqn)) {
            onPatientClick(null);
          } else {
            onPatientClick(d.SEQN);
          }
        }
      })
      .on('mouseenter', function(event, d) {
        setHoveredPatient(d);
        d3.select(this)
          .transition()
          .duration(0)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      })
      .on('mousemove', function(event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${event.pageX + 10}px`;
          tooltipRef.current.style.top = `${event.pageY + 10}px`;
        }
      })
      .on('mouseleave', function(event, d) {
        setHoveredPatient(null);
        const isSearched = searchSeqn && d.SEQN === parseInt(searchSeqn);
        d3.select(this)
          .transition()
          .duration(0)
          .attr('stroke', isSearched ? '#FFD700' : 'none')
          .attr('stroke-width', isSearched ? 3 : 0);
      });

    if (searchedPatient) {
      const scale = 1.5;
      const translateX = width / 2 - searchedPatient.x * scale;
      const translateY = height / 2 - searchedPatient.y * scale;

      g.transition()
        .duration(750)
        .attr('transform', `translate(${margin.left + translateX},${margin.top + translateY}) scale(${scale})`);
    } else {
      g.transition()
        .duration(750)
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }

  }, [validData, dimensions, searchSeqn, sankeyFilter, selectedState]);

  return (
    <div ref={containerRef} className="beeswarm-container">
      <svg ref={svgRef} className="beeswarm-svg"></svg>

      <div className="beeswarm-legend">
        <div className="legend-sections">
          <div className="legend-section">
            <div className="legend-section-title">Cancer:</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#CC3311' }}></div>
                <span>Obese</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#EE7733' }}></div>
                <span>Overweight</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#EE3377' }}></div>
                <span>Healthy</span>
              </div>
            </div>
          </div>
          <div className="legend-section">
            <div className="legend-section-title">No Cancer:</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#0077BB' }}></div>
                <span>Obese</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#33BBEE' }}></div>
                <span>Overweight</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#009988' }}></div>
                <span>Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hoveredPatient && (
        <div ref={tooltipRef} className="beeswarm-tooltip">
          <div><strong>Patient ID:</strong> {hoveredPatient.SEQN}</div>
          <div>
            <strong>Age:</strong> {hoveredPatient.RIDAGEYR} | 
            <strong> Sex:</strong> {hoveredPatient.RIAGENDR === 1 ? ' Male' : ' Female'}
          </div>
          <div><strong>BMI:</strong> {hoveredPatient.BMXBMI.toFixed(1)} 
            {hoveredPatient.BMXBMI >= 30 ? ' (Obese)' : 
             hoveredPatient.BMXBMI >= 25 ? ' (Overweight)' : ' (Healthy)'}
          </div>
          <div><strong>Cancer:</strong> {hoveredPatient.CANCER_STATUS_TEXT}</div>
          <div><strong>Fiber:</strong> {hoveredPatient.AAVG_FIBE ? 
            `${hoveredPatient.AVG_FIBE.toFixed(1)}g/day` : 'N/A'}
          </div>
          <div><strong>Lifestyle Score:</strong> {hoveredPatient.LIFESTYLE_SCORE_100 ? 
            `${hoveredPatient.LIFESTYLE_SCORE_100.toFixed(0)}/100` : 'N/A'}
          </div>
        </div>
      )}

      {searchError && (
        <div className="search-error">
          {searchError}
        </div>
      )}
    </div>
  );
};

export default BeeswarmPlot;

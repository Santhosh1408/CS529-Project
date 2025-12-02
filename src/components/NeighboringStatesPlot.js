import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import '../styles/NeighboringStatesPlot.css';

const NeighboringStatesPlot = ({ data, metric = 'cancerRate', selectedState, onStateClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedRegion, setSelectedRegion] = useState('Midwest');

  const stateNames = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
    'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
    'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
    'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
    'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
    'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const stateNeighbors = {
    'AL': ['MS', 'TN', 'GA', 'FL'], 'AK': [], 'AZ': ['CA', 'NV', 'UT', 'NM'],
    'AR': ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'], 'CA': ['OR', 'NV', 'AZ'],
    'CO': ['WY', 'NE', 'KS', 'OK', 'NM', 'UT'], 'CT': ['MA', 'RI', 'NY'],
    'DE': ['MD', 'PA', 'NJ'], 'FL': ['AL', 'GA'], 'GA': ['FL', 'AL', 'TN', 'NC', 'SC'],
    'HI': [], 'ID': ['MT', 'WY', 'UT', 'NV', 'OR', 'WA'], 'IL': ['WI', 'IN', 'KY', 'MO', 'IA'],
    'IN': ['MI', 'OH', 'KY', 'IL'], 'IA': ['MN', 'WI', 'IL', 'MO', 'NE', 'SD'],
    'KS': ['NE', 'MO', 'OK', 'CO'], 'KY': ['IL', 'IN', 'OH', 'WV', 'VA', 'TN', 'MO'],
    'LA': ['TX', 'AR', 'MS'], 'ME': ['NH'], 'MD': ['PA', 'DE', 'VA', 'WV'],
    'MA': ['NH', 'VT', 'NY', 'CT', 'RI'], 'MI': ['WI', 'IN', 'OH'], 'MN': ['WI', 'IA', 'SD', 'ND'],
    'MS': ['TN', 'AL', 'LA', 'AR'], 'MO': ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
    'MT': ['ND', 'SD', 'WY', 'ID'], 'NE': ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
    'NV': ['ID', 'UT', 'AZ', 'CA', 'OR'], 'NH': ['ME', 'MA', 'VT'], 'NJ': ['NY', 'PA', 'DE'],
    'NM': ['CO', 'OK', 'TX', 'AZ'], 'NY': ['VT', 'MA', 'CT', 'PA', 'NJ'], 'NC': ['VA', 'TN', 'GA', 'SC'],
    'ND': ['MN', 'SD', 'MT'], 'OH': ['PA', 'WV', 'KY', 'IN', 'MI'], 'OK': ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'],
    'OR': ['WA', 'ID', 'NV', 'CA'], 'PA': ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'], 'RI': ['MA', 'CT'],
    'SC': ['NC', 'GA'], 'SD': ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'], 'TN': ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
    'TX': ['NM', 'OK', 'AR', 'LA'], 'UT': ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'], 'VT': ['NY', 'NH', 'MA'],
    'VA': ['MD', 'WV', 'KY', 'TN', 'NC'], 'WA': ['ID', 'OR'], 'WV': ['OH', 'PA', 'MD', 'VA', 'KY'],
    'WI': ['MI', 'IL', 'IA', 'MN'], 'WY': ['MT', 'SD', 'NE', 'CO', 'UT', 'ID']
  };

  const regions = {
    'Northeast': ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
    'Southeast': ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA'],
    'Midwest': ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
    'Southwest': ['AZ', 'NM', 'OK', 'TX'],
    'West': ['CO', 'ID', 'MT', 'NV', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA']
  };

  const regionColors = {
    'Northeast': '#0077BB',
    'Southeast': '#CC3311',
    'Midwest': '#EE7733',
    'Southwest': '#009988',
    'West': '#33BBEE'
  };

  const getStateRegion = (stateAbbr) => {
    for (const [regionName, states] of Object.entries(regions)) {
      if (states.includes(stateAbbr)) return regionName;
    }
    return null;
  };

  useEffect(() => {
    if (selectedState) {
      const region = getStateRegion(selectedState);
      if (region && region !== selectedRegion) {
        setSelectedRegion(region);
      }
    }
  }, [selectedState]);

  const stateAggregates = useMemo(() => {
    if (!data || data.length === 0) return {};
    const aggregates = {};
    data.forEach(patient => {
      const state = patient.state;
      if (!state) return;
      if (!aggregates[state]) {
        aggregates[state] = {
          state: state,
          count: 0,
          cancerCount: 0,
          totalBMI: 0,
          totalLifestyle: 0,
          totalFiber: 0
        };
      }
      aggregates[state].count++;
      aggregates[state].cancerCount += patient.cancerBinary || 0;
      aggregates[state].totalBMI += patient.bmi || 0;
      aggregates[state].totalLifestyle += patient.lifestyleScore || 0;
      aggregates[state].totalFiber += patient.fiber || 0;
    });
    Object.keys(aggregates).forEach(state => {
      const agg = aggregates[state];
      agg.cancerRate = (agg.cancerCount / agg.count) * 100;
      agg.avgBMI = agg.totalBMI / agg.count;
      agg.avgLifestyle = agg.totalLifestyle / agg.count;
      agg.avgFiber = agg.totalFiber / agg.count;
    });
    return aggregates;
  }, [data]);

  const getMetricValue = (stateAgg) => {
    switch(metric) {
      case 'cancerRate': return stateAgg.cancerRate;
      case 'avgBMI': return stateAgg.avgBMI;
      case 'lifestyleScore': return stateAgg.avgLifestyle;
      case 'fiber': return stateAgg.avgFiber;
      default: return 0;
    }
  };

  const nationalAverage = useMemo(() => {
    const states = Object.values(stateAggregates);
    if (states.length === 0) return 0;
    const sum = states.reduce((acc, state) => acc + getMetricValue(state), 0);
    return sum / states.length;
  }, [stateAggregates, metric]);

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
    if (!dimensions.width || !dimensions.height || Object.keys(stateAggregates).length === 0) return;

    const margin = { top: 120, right: 120, bottom: 50, left: 150 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const metricLabels = {
      'cancerRate': 'Cancer Rate (%)',
      'avgBMI': 'Average BMI',
      'lifestyleScore': 'Lifestyle Score',
      'fiber': 'Fiber Intake (g/day)'
    };

    const metricLabel = metricLabels[metric] || 'Value';

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    let yOffset = 20;
    const statePositions = {};
    const regionData = [];

    const regionName = selectedRegion;
    const regionStates = regions[regionName]
      .filter(state => stateAggregates[state])
      .map(state => ({
        state: state,
        region: regionName,
        value: getMetricValue(stateAggregates[state])
      }))
      .sort((a, b) => a.value - b.value);

    if (regionStates.length > 0) {
      regionData.push({
        name: regionName,
        states: regionStates,
        yStart: yOffset
      });

      regionStates.forEach((s, i) => {
        statePositions[s.state] = {
          y: yOffset + i * 25,
          value: s.value,
          region: regionName
        };
      });

      yOffset += regionStates.length * 25 + 20;
    }

    const allValues = Object.values(statePositions).map(d => d.value);
    const minValue = d3.min(allValues);
    const maxValue = d3.max(allValues);
    const padding = (maxValue - minValue) * 0.1;

    const xScale = d3.scaleLinear()
      .domain([minValue - padding, maxValue + padding])
      .range([0, width]);

    const nationalX = xScale(nationalAverage);
    g.append('line')
      .attr('x1', nationalX)
      .attr('x2', nationalX)
      .attr('y1', -20)
      .attr('y2', yOffset - 20)
      .attr('stroke', '#EE7733')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    g.append('text')
      .attr('x', nationalX + 5)
      .attr('y', 20)
      .attr('fill', '#EE7733')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(`National: ${nationalAverage.toFixed(1)}`);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${yOffset - 20})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .style('color', '#555');

    xAxis.append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#2c3e50')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .text(metricLabel);

    Object.keys(statePositions).forEach(state => {
      const statePos = statePositions[state];
      const neighbors = stateNeighbors[state] || [];

      neighbors.forEach(neighbor => {
        const neighborPos = statePositions[neighbor];
        if (!neighborPos) return;
        if (neighborPos.region === statePos.region) {
          g.append('line')
            .attr('x1', xScale(statePos.value))
            .attr('y1', statePos.y)
            .attr('x2', xScale(neighborPos.value))
            .attr('y2', neighborPos.y)
            .attr('stroke', regionColors[statePos.region])
            .attr('stroke-width', 1)
            .attr('opacity', 0.15);
        }
      });
    });

    regionData.forEach(region => {
      g.append('text')
        .attr('x', -10)
        .attr('y', region.yStart - 10)
        .attr('text-anchor', 'end')
        .attr('fill', regionColors[region.name])
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(region.name);

      region.states.forEach(state => {
        const pos = statePositions[state.state];
        const isSelected = selectedState === state.state;

        g.append('text')
          .attr('x', -15)
          .attr('y', pos.y + 4)
          .attr('text-anchor', 'end')
          .attr('fill', '#555')
          .attr('font-size', '11px')
          .attr('font-weight', isSelected ? '600' : '400')
          .text(state.state);

        g.append('circle')
          .attr('cx', xScale(pos.value))
          .attr('cy', pos.y)
          .attr('r', isSelected ? 7 : 5)
          .attr('fill', regionColors[region.name])
          .attr('stroke', isSelected ? '#FFD700' : 'white')
          .attr('stroke-width', isSelected ? 3 : 2)
          .attr('opacity', isSelected ? 1 : 0.8)
          .style('cursor', 'pointer')
          .on('click', function(event) {
            event.stopPropagation();
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
            if (onStateClick) {
              onStateClick(state.state === selectedState ? null : state.state);
            }
          })
          .on('mouseenter', function(event) {
            d3.select(this)
              .transition()
              .duration(0)
              .attr('r', 8)
              .attr('opacity', 1);

            if (tooltipRef.current) {
              const stateData = stateAggregates[state.state];
              const fullStateName = stateNames[state.state] || state.state;
              tooltipRef.current.innerHTML = `
                <div><strong>${fullStateName} (${state.state})</strong></div>
                <div>Cancer Rate: ${stateData.cancerRate.toFixed(1)}%</div>
                <div>Avg BMI: ${stateData.avgBMI.toFixed(1)}</div>
                <div>Lifestyle Score: ${stateData.avgLifestyle.toFixed(1)}</div>
                <div>Fiber: ${stateData.avgFiber.toFixed(1)}g/day</div>
                <div style="margin-top: 4px; font-size: 11px; color: #888;">
                  n = ${stateData.count} patients
                </div>
              `;
              tooltipRef.current.style.display = 'block';
              tooltipRef.current.style.left = `${event.pageX + 10}px`;
              tooltipRef.current.style.top = `${event.pageY - 10}px`;
            }
          })
          .on('mousemove', function(event) {
            if (tooltipRef.current) {
              tooltipRef.current.style.left = `${event.pageX + 10}px`;
              tooltipRef.current.style.top = `${event.pageY - 10}px`;
            }
          })
          .on('mouseleave', function() {
            d3.select(this)
              .transition()
              .duration(0)
              .attr('r', isSelected ? 7 : 5)
              .attr('opacity', isSelected ? 1 : 0.8);

            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none';
            }
          });

        g.append('text')
          .attr('x', xScale(pos.value))
          .attr('y', pos.y - 12)
          .attr('text-anchor', 'middle')
          .attr('fill', '#666')
          .attr('font-size', '9px')
          .text(pos.value.toFixed(1));
      });
    });

    svg.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2c3e50')
      .attr('font-size', '15px')
      .attr('font-weight', '600')
      .text(`${metricLabel} - ${selectedRegion} Region`);

    const regionSelector = svg.append('g')
      .attr('transform', `translate(${margin.left + 10}, 45)`);

    Object.keys(regionColors).forEach((region, i) => {
      const button = regionSelector.append('g')
        .attr('transform', `translate(${i * 110}, 0)`)
        .style('cursor', 'pointer')
        .on('click', function() {
          setSelectedRegion(region);
        });

      button.append('rect')
        .attr('x', -5)
        .attr('y', -10)
        .attr('width', 100)
        .attr('height', 20)
        .attr('rx', 3)
        .attr('fill', region === selectedRegion ? regionColors[region] : 'transparent')
        .attr('stroke', regionColors[region])
        .attr('stroke-width', 1.5)
        .attr('opacity', region === selectedRegion ? 0.2 : 0);

      button.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', regionColors[region]);

      button.append('text')
        .attr('x', 8)
        .attr('y', 4)
        .attr('font-size', '11px')
        .attr('font-weight', region === selectedRegion ? '600' : '400')
        .attr('fill', region === selectedRegion ? regionColors[region] : '#555')
        .text(region);
    });

  }, [stateAggregates, dimensions, metric, nationalAverage, selectedState, onStateClick, selectedRegion]);

  if (Object.keys(stateAggregates).length === 0) {
    return (
      <div ref={containerRef} className="neighboring-states-container">
        <div className="neighboring-states-empty">
          No state data available for the selected filters
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="neighboring-states-container">
      <svg ref={svgRef} className="neighboring-states-svg"></svg>
      <div ref={tooltipRef} className="neighboring-states-tooltip"></div>
    </div>
  );
};

export default NeighboringStatesPlot;

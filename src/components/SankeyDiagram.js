import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyDiagram = ({ data, selectedState, onNodeClick, selectedFilter }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();
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
    if (!dimensions.width || !dimensions.height || dimensions.width < 100) return;
    if (!data || data.length === 0) {
      const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height);
      svg.selectAll('*').remove();
      svg.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#999')
        .attr('font-size', '14px')
        .text('No data available for selected filters');
      return;
    }

    const categorizedData = data.map(d => ({
      fiberGroup: d.fiber < 15 ? 'Low Fiber' : d.fiber < 25 ? 'Med Fiber' : 'High Fiber',
      sugarGroup: d.sugar < 50 ? 'Low Sugar' : d.sugar < 100 ? 'Med Sugar' : 'High Sugar',
      bmiGroup: d.bmi < 18.5 ? 'Underweight' : d.bmi < 25 ? 'Healthy' : d.bmi < 30 ? 'Overweight' : 'Obese'
    }));

    const fiberToSugar = {};
    categorizedData.forEach(d => {
      const key = `${d.fiberGroup}→${d.sugarGroup}`;
      fiberToSugar[key] = (fiberToSugar[key] || 0) + 1;
    });

    const sugarToBmi = {};
    categorizedData.forEach(d => {
      const key = `${d.sugarGroup}→${d.bmiGroup}`;
      sugarToBmi[key] = (sugarToBmi[key] || 0) + 1;
    });

    const nodes = [
      { name: 'Low Fiber', id: 0 }, { name: 'Med Fiber', id: 1 }, { name: 'High Fiber', id: 2 },
      { name: 'Low Sugar', id: 3 }, { name: 'Med Sugar', id: 4 }, { name: 'High Sugar', id: 5 },
      { name: 'Underweight', id: 6 }, { name: 'Healthy', id: 7 }, { name: 'Overweight', id: 8 }, { name: 'Obese', id: 9 }
    ];

    const nameToIndex = {
      'Low Fiber': 0, 'Med Fiber': 1, 'High Fiber': 2,
      'Low Sugar': 3, 'Med Sugar': 4, 'High Sugar': 5,
      'Underweight': 6, 'Healthy': 7, 'Overweight': 8, 'Obese': 9
    };

    const links = [];
    Object.entries(fiberToSugar).forEach(([key, value]) => {
      const [source, target] = key.split('→');
      links.push({ source: nameToIndex[source], target: nameToIndex[target], value });
    });
    Object.entries(sugarToBmi).forEach(([key, value]) => {
      const [source, target] = key.split('→');
      links.push({ source: nameToIndex[source], target: nameToIndex[target], value });
    });

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 35, right: 60, bottom: 10, left: 60 };

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeWidth(10)
      .nodePadding(15)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const sankeyData = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    const getNodeColor = nodeName => {
  // Paul Tol's colorblind-safe palette
  
  // Fiber groups
  if (nodeName === 'Low Fiber') return '#EE3377';    
  if (nodeName === 'Med Fiber') return '#CCBB44';    
  if (nodeName === 'High Fiber') return '#228833';   
  
  // Sugar groups  
  if (nodeName === 'Low Sugar') return '#228833';    
  if (nodeName === 'Med Sugar') return '#CCBB44';    
  if (nodeName === 'High Sugar') return '#EE3377';   
  
  // BMI groups
  if (nodeName === 'Underweight') return '#4477AA';  
  if (nodeName === 'Healthy') return '#228833';      
  if (nodeName === 'Overweight') return '#CCBB44';   
  if (nodeName === 'Obese') return '#EE3377';        
  
  return '#BBBBBB';  // Gray fallback
};

    svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.4)
      .selectAll('path')
      .data(sankeyData.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => getNodeColor(sankeyData.nodes[d.source.index].name))
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', d => {
        if (selectedFilter?.type === 'link') {
          const source = sankeyData.nodes[d.source.index].name;
          const target = sankeyData.nodes[d.target.index].name;
          if (selectedFilter.source === source && selectedFilter.target === target) return 0.8;
        }
        return 0.4;
      })
      .style('mix-blend-mode', 'multiply')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const source = sankeyData.nodes[d.source.index].name;
        const target = sankeyData.nodes[d.target.index].name;
        if (onNodeClick) {
          if (selectedFilter?.type === 'link' &&
              selectedFilter.source === source &&
              selectedFilter.target === target) {
            onNodeClick(null);
          } else {
            onNodeClick({ type: 'link', source, target });
          }
        }
      })
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', Math.max(2, d.width + 1));
        const source = sankeyData.nodes[d.source.index].name;
        const target = sankeyData.nodes[d.target.index].name;
        const percentage = ((d.value / data.length) * 100).toFixed(1);
        if (tooltipRef.current) {
          tooltipRef.current.innerHTML = `
            <strong>${source} → ${target}</strong><br/>
            ${d.value} patients (${percentage}%)<br/>
            <em>Click to filter</em>
          `;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = event.pageX + 10 + 'px';
          tooltipRef.current.style.top = event.pageY - 10 + 'px';
        }
      })
      .on('mousemove', event => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.pageX + 10 + 'px';
          tooltipRef.current.style.top = event.pageY - 10 + 'px';
        }
      })
      .on('mouseout', (event, d) => {
        const source = sankeyData.nodes[d.source.index].name;
        const target = sankeyData.nodes[d.target.index].name;
        const isSelected = selectedFilter?.type === 'link' &&
                           selectedFilter.source === source &&
                           selectedFilter.target === target;
        d3.select(event.currentTarget)
          .attr('stroke-opacity', isSelected ? 0.8 : 0.4)
          .attr('stroke-width', Math.max(1, d.width));
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      });

    svg.append('g')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => getNodeColor(d.name))
      .attr('stroke', d => 
        selectedFilter?.type === 'node' && selectedFilter.name === d.name ? '#FFD700' : '#333')
      .attr('stroke-width', d =>
        selectedFilter?.type === 'node' && selectedFilter.name === d.name ? 3 : 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          if (selectedFilter?.type === 'node' && selectedFilter.name === d.name) {
            onNodeClick(null);
          } else {
            onNodeClick({ type: 'node', name: d.name });
          }
        }
      })
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('opacity', 0.7)
          .attr('stroke-width', 2);
        const percentage = ((d.value / data.length) * 100).toFixed(1);
        if (tooltipRef.current) {
          tooltipRef.current.innerHTML = `
            <strong>${d.name}</strong><br/>
            ${d.value || 0} patients (${percentage}%)<br/>
            <em>Click to filter</em>
          `;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = event.pageX + 10 + 'px';
          tooltipRef.current.style.top = event.pageY - 10 + 'px';
        }
      })
      .on('mousemove', event => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.pageX + 10 + 'px';
          tooltipRef.current.style.top = event.pageY - 10 + 'px';
        }
      })
      .on('mouseout', (event, d) => {
        const isSelected = selectedFilter?.type === 'node' && selectedFilter.name === d.name;
        d3.select(event.currentTarget)
          .attr('opacity', 1)
          .attr('stroke-width', isSelected ? 3 : 1);
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      });

    svg.append('g')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('font-size', 11)
      .selectAll('text')
      .data(sankeyData.nodes)
      .join('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 5 : d.x0 - 5)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .attr('fill', '#555')
      .attr('font-weight', '500')
      .text(d => d.name);

    const headerY = 15;
    svg.append('g')
      .selectAll('text')
      .data([
        { text: 'Fiber Intake', x: margin.left + 10 },
        { text: 'Sugar Intake', x: width / 2 },
        { text: 'BMI Category', x: width - margin.right - 10 }
      ])
      .join('text')
      .attr('x', d => d.x)
      .attr('y', headerY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2c3e50')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => d.text);

    const subtitle = selectedState
      ? `${selectedState} - ${data.length} patients`
      : `All States - ${data.length} patients`;

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7f8c8d')
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .text(subtitle);

  }, [dimensions, data, selectedState, selectedFilter, onNodeClick]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: 0,
        position: 'relative'
      }}
    >
      <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }}></svg>
      <div 
        ref={tooltipRef}
        style={{
          position: 'fixed',
          display: 'none',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};

export default SankeyDiagram;

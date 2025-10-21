/*
import React, {useEffect, useRef, useMemo, useState} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = 50;
    const radius = 10;

    const cleanString = (s)=>String(s||'').trim().toLowerCase().replaceAll('.', '').replaceAll(/\s+/g,'_');
    const [popByState, setPopByState] = useState(null);
    const [abbrToFull, setAbbrToFull] = useState(null);
    useEffect(()=>{
        d3.csv(process.env.PUBLIC_URL + '/state_populations.csv').then(rows=>{
            const stateRow = rows.find(r => String(r['']||'').toLowerCase() === 'state');
            const popRow   = rows.find(r => String(r['']||'').toLowerCase().includes('pop'));
            const popMap = new Map(), a2f = new Map();
            if(stateRow && popRow){
                Object.keys(stateRow).forEach(k=>{
                    if(k === '') return;
                    const fullName = stateRow[k];
                    const abbr = String(k).toUpperCase();
                    const pop = +popRow[k];
                    if(fullName){
                        popMap.set(cleanString(fullName), Number.isFinite(pop)? pop: undefined);
                        a2f.set(abbr, fullName);
                    }
                });
            }
            setPopByState(popMap);
            setAbbrToFull(a2f);
        }).catch(console.error);
    },[]);

    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    useEffect(()=>{
        //wait until the data loads
        if(svg === undefined || props.data === undefined || !popByState || !abbrToFull){ return }

        //aggregate gun deaths by state
        const data = props.data.states;
        
        //get data for each state
        const perCap = (Array.isArray(data)? data: []).map(state=>{
            let name = state.state || '';
            let full = (name.length === 2) ? (abbrToFull.get(String(name).toUpperCase()) || name) : name;
            const key = cleanString(full);
            const pop = popByState.get(key);
            const deaths = +state.count || 0;
            const per100k = (Number.isFinite(pop) && pop>0) ? (deaths/pop)*100000 : 0;
            return {
                'count': deaths,
                'name': full,
                'per100k': per100k
            };
        });

        //get transforms for each value into x and y coordinates
        const plotData = perCap.sort((a,b)=> b.per100k - a.per100k).slice(0,10);

        let xScale = d3.scaleLinear()
            .domain([0, d3.max(plotData, d=>d.per100k) || 1]).nice()
            .range([0, Math.max(240, (width  || 0) - margin*2)]);

        let yScale = d3.scaleBand()
            .domain(plotData.map(d=>d.name))
            .range([0, Math.max(200, (height || 0) - margin*2)])
            .padding(0.2);

        //draw a line showing the mean values across the curve
        //this probably isn't actually regression
        const regressionLine = [];
        
        //scale color by gender ratio for no reason
        let colorScale = d3.scaleDiverging()
            .domain([0,.5,1])
            .range(['magenta','white','navy']);

        //draw the circles for each state
        svg.selectAll('.dot').remove();
           
        //draw the line
        svg.selectAll('.regressionLine').remove();

        //change the title
        const labelSize = margin/2;
        svg.selectAll('text').remove();
        svg.selectAll('g').remove();
        svg.selectAll('*').remove();

        const innerW = Math.max(240, (width  || 0) - margin*2);
        const innerH = Math.max(200, (height || 0) - margin*2);
        const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);

        g.selectAll('rect.bar').data(plotData)
          .enter().append('rect')
          .attr('class','bar')
          .attr('x', 0)
          .attr('y', d=> yScale(d.name))
          .attr('width', d=> xScale(d.per100k))
          .attr('height', yScale.bandwidth())
          .attr('fill', '#377eb8')
          .on('mouseover', (e,d)=>{
              let string = d.name + '</br>'
                + 'Gun Deaths: ' + d.count.toLocaleString() + '</br>'
                + '<b>Per 100k: ' + d.per100k.toFixed(2) + '</b></br>'
                + '<span style="font-size:.85em">Normalized by 2014 population.</span>';
              props.ToolTip.moveTTipEvent(tTip,e)
              tTip.html(string)
          }).on('mousemove',(e)=>{
              props.ToolTip.moveTTipEvent(tTip,e);
          }).on('mouseout',()=>{
              props.ToolTip.hideTTip(tTip);
          });

        const xAxis = d3.axisBottom(xScale).ticks(6);
        g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .call(xAxis);

        g.append('g')
            .call(d3.axisLeft(yScale));   

        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Top-10 State Death Rates (Deaths per 100k)');

        //change the disclaimer here
        svg.append('text')
            .attr('x',width-20)
            .attr('y',height/3)
            .attr('text-anchor','end')
            .attr('font-size',10)
            .text("Per-100k; normalized by 2014 population.");

        //draw basic axes using the x and y scales

    },[props.data,svg,width,height,popByState,abbrToFull]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

 
const drawingDifficulty = {
    'IL': 9,
    'AL': 2,
    'AK': 1,
    'AR': 3,
    'CA': 9.51,
    'CO': 0,
    'DE': 3.1,
    'DC': 1.3,
    'FL': 8.9,
    'GA': 3.9,
    'HI': 4.5,
    'ID': 4,
    'IN': 4.3,
    'IA': 4.1,
    'KS': 1.6,
    'KY': 7,
    'LA': 6.5,
    'MN': 2.1,
    'MO': 5.5,
    'ME': 7.44,
    'MD': 10,
    'MA': 6.8,
    'MI': 9.7,
    'MN': 5.1,
    'MS': 3.8,
    'MT': 1.4,
    'NE': 1.9,
    'NV': .5,
    'NH': 3.7,
    'NJ': 9.1,
    'NM': .2,
    'NY': 8.7,
    'NC': 8.5,
    'ND': 2.3,
    'OH': 5.8,
    'OK': 6.05,
    'OR': 4.7,
    'PA': 4.01,
    'RI': 8.4,
    'SC': 7.1,
    'SD': .9,
    'TN': 3.333333,
    'TX': 8.1,
    'UT': 2.8,
    'VT': 2.6,
    'VA': 8.2,
    'WA': 9.2,
    'WV': 7.9,
    'WY': 0,
}*/

import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = 50;
    const radius = 10;


    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    useEffect(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }

        //aggregate gun deaths by state
        const data = props.data.states || [];
        
        //get data for each state
        const rows = [];
        for(let s of data){
            const total = +s.count || 0;
            const male = +s.male_count || 0;
            const femaleRaw = (s.female_count !== undefined && s.female_count !== null) ? +s.female_count : NaN;
            const female = Number.isFinite(femaleRaw) ? femaleRaw : Math.max(0, total - male);
            const denom = Math.max(1, male + female);
            rows.push({
                name: s.state,
                male, female, total: male + female,
                malePct: male/denom,
                femalePct: female/denom
            });
        }

        //get transforms for each value into x and y coordinates
        const topN = 20;
        const plotData = rows.sort((a,b)=> b.total - a.total).slice(0, topN);

        const innerW = Math.max(260, (width  || 0) - margin*2);
        const innerH = Math.max(220, (height || 0) - margin*2);

        let xScale = d3.scaleLinear()
            .domain([0, d3.max(plotData, d=>Math.max(d.male, d.female)) || 1]).nice()
            .range([0, innerW]);

        let yScale = d3.scaleBand()
            .domain(plotData.map(d=>d.name))
            .range([0, innerH])
            .padding(0.2);

        const y1 = d3.scaleBand()
            .domain(['Male','Female'])
            .range([0, yScale.bandwidth()])
            .padding(0.25);

        //draw a line showing the mean values across the curve
        //this probably isn't actually regression
        const regressionLine = [];
        
        //scale color by gender ratio for no reason
        let colorScale = d3.scaleDiverging()
            .domain([0,.5,1])
            .range(['magenta','white','navy']);

        //draw the circles for each state
        svg.selectAll('.dot').remove();
           
        //draw the line
        svg.selectAll('.regressionLine').remove();

        //change the title
        const labelSize = margin/2;
        svg.selectAll('text').remove();
        svg.selectAll('g').remove();
        svg.selectAll('*').remove();

        const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);

        const stateG = g.selectAll('.stateRow')
            .data(plotData).enter()
            .append('g').attr('class','stateRow')
            .attr('transform', d=> `translate(0,${yScale(d.name)})`);

        stateG.append('rect')
            .attr('class','bar male')
            .attr('x', 0)
            .attr('y', y1('Male'))
            .attr('width', d=> xScale(d.male))
            .attr('height', y1.bandwidth())
            .attr('fill', '#4e79a7')
            .on('mouseover',(e,d)=>{
                const pct = (d.malePct*100).toFixed(1);
                const str = d.name + '</br>'
                    + 'Male: ' + d.male.toLocaleString() + ' (' + pct + '%)';
                props.ToolTip.moveTTipEvent(tTip,e);
                tTip.html(str);
            })
            .on('mousemove',(e)=> props.ToolTip.moveTTipEvent(tTip,e))
            .on('mouseout',()=> props.ToolTip.hideTTip(tTip));

        stateG.append('rect')
            .attr('class','bar female')
            .attr('x', 0)
            .attr('y', y1('Female'))
            .attr('width', d=> xScale(d.female))
            .attr('height', y1.bandwidth())
            .attr('fill', '#f28e2b')
            .on('mouseover',(e,d)=>{
                const pct = (d.femalePct*100).toFixed(1);
                const str = d.name + '</br>'
                    + 'Female: ' + d.female.toLocaleString() + ' (' + pct + '%)';
                props.ToolTip.moveTTipEvent(tTip,e);
                tTip.html(str);
            })
            .on('mousemove',(e)=> props.ToolTip.moveTTipEvent(tTip,e))
            .on('mouseout',()=> props.ToolTip.hideTTip(tTip));

        if(props.brushedState){
            const yb = yScale(props.brushedState);
            if(yb !== undefined){
                g.append('rect')
                 .attr('x', -6)
                 .attr('y', yb)
                 .attr('width', innerW + 12)
                 .attr('height', yScale.bandwidth())
                 .attr('fill', 'none')
                 .attr('stroke', '#333')
                 .attr('stroke-width', 2);
            }
        }

        const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('~s'));
        g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis);
        g.append('g').call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Male vs Female gun deaths by state (Top 20 by total)');

        //change the disclaimer here
        svg.append('text')
            .attr('x',width-20)
            .attr('y',height/3)
            .attr('text-anchor','end')
            .attr('font-size',10)
            .text('Counts per state; not normalized by population.');

        //draw basic axes using the x and y scales
        
    },[props.data,svg,width,height,props.brushedState]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

 
const drawingDifficulty = {
    'IL': 9,
    'AL': 2,
    'AK': 1,
    'AR': 3,
    'CA': 9.51,
    'CO': 0,
    'DE': 3.1,
    'DC': 1.3,
    'FL': 8.9,
    'GA': 3.9,
    'HI': 4.5,
    'ID': 4,
    'IN': 4.3,
    'IA': 4.1,
    'KS': 1.6,
    'KY': 7,
    'LA': 6.5,
    'MN': 2.1,
    'MO': 5.5,
    'ME': 7.44,
    'MD': 10,
    'MA': 6.8,
    'MI': 9.7,
    'MN': 5.1,
    'MS': 3.8,
    'MT': 1.4,
    'NE': 1.9,
    'NV': .5,
    'NH': 3.7,
    'NJ': 9.1,
    'NM': .2,
    'NY': 8.7,
    'NC': 8.5,
    'ND': 2.3,
    'OH': 5.8,
    'OK': 6.05,
    'OR': 4.7,
    'PA': 4.01,
    'RI': 8.4,
    'SC': 7.1,
    'SD': .9,
    'TN': 3.333333,
    'TX': 8.1,
    'UT': 2.8,
    'VT': 2.6,
    'VA': 8.2,
    'WA': 9.2,
    'WV': 7.9,
    'WY': 0,
}

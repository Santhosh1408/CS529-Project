
import React, {useRef,useMemo,useEffect, useState} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';


export default function Whitehat(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    var isZoomed = false;


    //TODO: change the line below to change the size of the white-hat maximum bubble size
    const maxRadius = width/90;

    //albers usa projection puts alaska in the corner
    //this automatically convert latitude and longitude to coordinates on the svg canvas
    const projection = d3.geoAlbersUsa()
        .translate([width/2,height/2]);

    //set up the path generator to draw the states
    const geoGenerator = d3.geoPath().projection(projection);

    //we need to use this function to convert state names into ids so we can select individual states by name using javascript selectors
    //since spaces makes it not work correctly
    function cleanString(string){
        return String(string || '').trim().toLowerCase().replaceAll('.', '').replaceAll(/\s+/g,'_');
    }

    const [popByState, setPopByState] = useState(null);   
    const [abbrToFull, setAbbrToFull] = useState(null);   
    const [fullToAbbr, setFullToAbbr] = useState(null);   
    useEffect(()=>{
        d3.csv(process.env.PUBLIC_URL + '/state_populations.csv')
          .then(rows=>{
            const stateRow = rows.find(r => String(r['']||'').toLowerCase() === 'state');
            const popRow   = rows.find(r => String(r['']||'').toLowerCase().includes('pop'));
            const popMap = new Map(), a2f = new Map(), f2a = new Map();
            if(stateRow && popRow){
              Object.keys(stateRow).forEach(k=>{
                if(k === '') return;
                const fullName = stateRow[k];          
                const abbr = String(k).toUpperCase();  
                const pop = +popRow[k];
                if(fullName){
                  const key = cleanString(fullName);
                  a2f.set(abbr, fullName);
                  f2a.set(key, abbr);
                  if(Number.isFinite(pop) && pop>0){
                    popMap.set(key, pop);
                  }
                }
              });
            }
            setPopByState(popMap);
            setAbbrToFull(a2f);
            setFullToAbbr(f2a);
          })
          .catch(err=>console.error('Population CSV load error', err));
    },[]);


    //This is the main loop that renders the code once the data loads
    //TODO: edit or replace this code to create your white-hat version of the map view; for example, change the color map based on colorbrewer2, 
    const mapGroupSelection = useMemo(()=>{
        //wait until the svg is rendered and data is loaded
        if(svg !== undefined && props.map !== undefined && props.data !== undefined && popByState && abbrToFull && fullToAbbr){

            const stateData = props.data.states;

            //EDIT THIS TO CHANGE WHAT IS USED TO ENCODE COLOR
            const getEncodedFeature = d => {
                let key = cleanString(d.state);
                let pop = popByState.get(key);
                if(!pop){
                    const full = (String(d.state||'').length===2) ? (abbrToFull.get(String(d.state).toUpperCase()) || d.state) : d.state;
                    key = cleanString(full);
                    pop = popByState.get(key);
                }
                const deaths = +d.count || 0;
                return (Number.isFinite(pop) && pop>0) ? (deaths/pop)*100000 : 0;
            };

            //this section of code sets up the colormap
            const stateCounts = Object.values(stateData).map(getEncodedFeature);

            //get color extends for the color legend
            const [stateMin,stateMax] = d3.extent(stateCounts);

            //color map scale, scales numbers to a smaller range to use with a d3 color scale
            //we're using 1-0 to invert the red-yellow-green color scale
            //so red is bad (p.s. this is not a good color scheme still)
            const stateScale = d3.scaleLinear()
                .domain([stateMin,stateMax])
                .range([0,1]);

            //TODO: EDIT HERE TO CHANGE THE COLOR SCHEME
            //this function takes a number 0-1 and returns a color
            const colorMap = d3.interpolateYlGnBu;

            //this set of functions extracts the features given the state name from the geojson
            function getCount(name){
                const fullKey = cleanString(name);
                let entry = stateData.find(d=> cleanString(d.state) === fullKey);
                if(!entry){
                  const abbr = fullToAbbr.get(fullKey);
                  if (abbr){
                    entry = stateData.find(d=>(d.state||'').toUpperCase() === abbr);
                  }
                }
                if(!entry){ return 0 }
                return getEncodedFeature(entry);
            }
            function getStateVal(name){
                let per100k = getCount(name);
                let val = stateScale(per100k);
                return val
            }

            function getStateColor(d){
                return colorMap(getStateVal(d.properties.NAME))
            }

            //clear earlier drawings
            svg.selectAll('g').remove();

            //OPTIONAL: EDIT THIS TO CHANGE THE DETAILS OF HOW THE MAP IS DRAWN
            //draw borders from map and add tooltip
            let mapGroup = svg.append('g').attr('class','mapbox');
            mapGroup.selectAll('path').filter('.state')
                .data(props.map.features).enter()
                .append('path').attr('class','state')
                //ID is useful if you want to do brushing as it gives you a way to select the path
                .attr('id',d=> cleanString(d.properties.NAME))
                .attr('d',geoGenerator)
                .attr('fill',getStateColor)
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .on('mouseover',(e,d)=>{
                    let state = cleanString(d.properties.NAME);
                    //this updates the brushed state
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    let sname = d.properties.NAME;

                    const fullKey = cleanString(sname);
                    let entry = stateData.find(x=> cleanString(x.state)===fullKey);
                    if(!entry){
                        const abbr = fullToAbbr.get(fullKey);
                        if(abbr){
                          entry = stateData.find(x => (x.state||'').toUpperCase() === abbr);
                        }
                    }
                    const raw = entry ? (+entry.count || 0) : 0;

                    let pop = popByState.get(fullKey);
                    if(!pop && entry){
                      const full = (String(entry.state||'').length===2) ? (abbrToFull.get(String(entry.state).toUpperCase()) || entry.state) : entry.state;
                      pop = popByState.get(cleanString(full));
                    }
                    const per100k = (Number.isFinite(pop) && pop>0) ? (raw/pop)*100000 : 0
                    let text = `
                        <div><b>${sname}</b></div>
                        <div>Deaths: ${raw.toLocaleString()}</div>
                        <div>Population: ${Number.isFinite(pop)? pop.toLocaleString():'n/a'}</div>
                        <div><b>Deaths per 100k: ${per100k.toFixed(2)}</b></div>
                        <div style="margin-top:6px;font-size:.85em;color:#333">Normalized by 2014 population.</div>
                    `;
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    //see app.js for the helper function that makes this easier
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });


            //TODO: replace or edit the code below to change the city marker being used. Hint: think of the cityScale range (perhaps use area rather than radius). 
            //draw markers for each city
            const cityData = props.data.cities
            const cityMax = d3.max(cityData.map(d=>+d.count)) || 1;
            const cityScale = d3.scaleSqrt()
                .domain([0,cityMax])
                .range([0,maxRadius]);

            mapGroup.selectAll('.city').remove();

            //TODO: Add code for a tooltip when you mouse over the city (hint: use the same code for the state tooltip events .on... and modify what is used for the tTip.html)
            //OPTIONAL: change the color or opacity
            mapGroup.selectAll('.city')
                .data(cityData).enter()
                .append('circle').attr('class','city')
                .attr('id',d=>d.key)
                .attr('cx',d=> projection([d.lng,d.lat])[0])
                .attr('cy',d=> projection([d.lng,d.lat])[1])
                .attr('r',d=>cityScale(+d.count))
                .attr('fill','rgba(0,0,0,0.5)')
                .attr('stroke','#fff')
                .attr('stroke-width',0.5)
                .attr('opacity',.5)
                .on('mouseover',(e,d)=>{
                    const city = d.city || 'City';
                    const state = d.state || '';
                    const count = +d.count || 0;
                    const male = +d.male_count || undefined;
                    const female = +d.female_count || undefined;
                    const extra = (Number.isFinite(male) && Number.isFinite(female))
                        ? `<div>Male: ${male.toLocaleString()} | Female: ${female.toLocaleString()}</div>` : '';
                    const html = `
                        <div><b>${city}, ${state}</b></div>
                        <div>Deaths: ${count.toLocaleString()}</div>
                        ${extra}
                        <div style="margin-top:6px;font-size:.85em;color:#333">Circle area encodes deaths.</div>
                    `;
                    tTip.html(html);
                    props.ToolTip.moveTTipEvent(tTip,e);
                })
                .on('mousemove',(e)=> props.ToolTip.moveTTipEvent(tTip,e))
                .on('mouseout',()=> props.ToolTip.hideTTip(tTip));
                                

            
            //draw a color legend, automatically scaled based on data extents
            function drawLegend(){
                let bounds = mapGroup.node().getBBox();
                const barHeight = Math.min(height/10,40);
                
                let legendX = bounds.x + 10 + bounds.width;
                const barWidth = Math.min((width - legendX)/3,40);
                const fontHeight = Math.min(barWidth/2,16);
                let legendY = bounds.y + 2*fontHeight;
                
                let colorLData = [];
                //OPTIONAL: EDIT THE VALUES IN THE ARRAY TO CHANGE THE NUMBER OF ITEMS IN THE COLOR LEGEND
                for(let ratio of [0.1,.2,.3,.4,.5,.6,.7,.8,.9,.99]){
                    let val = (1-ratio)*stateMin + ratio*stateMax;
                    let scaledVal = stateScale(val);
                    let color = colorMap(scaledVal);
                    let entry = {
                        'x': legendX,
                        'y': legendY,
                        'value': val,
                        'color':color,
                    }
                    entry.text = (entry.value).toFixed(3);
            
                    colorLData.push(entry);
                    legendY += barHeight;
                }
    
                svg.selectAll('.legendRect').remove();
                svg.selectAll('.legendRect')
                    .data(colorLData).enter()
                    .append('rect').attr('class','legendRect')
                    .attr('x',d=>d.x)
                    .attr('y',d=>d.y)
                    .attr('fill',d=>d.color)
                    .attr('height',barHeight)
                    .attr('width',barWidth);
    
                svg.selectAll('.legendText').remove();
                const legendTitle = {
                    'x': legendX - barWidth,
                    'y': bounds.y,
                    'text': 'Deaths per 100k' 
                }
                svg.selectAll('.legendText')
                    .data([legendTitle].concat(colorLData)).enter()
                    .append('text').attr('class','legendText')
                    .attr('x',d=>d.x+barWidth+5)
                    .attr('y',d=>d.y+barHeight/2 + fontHeight/4)
                    .attr('font-size',(d,i) => i === 0? 1.2*fontHeight:fontHeight)
                    .text(d=>d.text);
            }

            drawLegend();
            return mapGroup
        }
    },[svg,props.map,props.data,popByState,abbrToFull,fullToAbbr])

    //This adds zooming. Triggers whenever the function above finishes
    //this section can be included in the main body but is here as an example 
    //of how to do multiple hooks so updates don't have to occur in every state
    useMemo(()=>{
        if(mapGroupSelection === undefined){ return }
        
        //set up zooming
        function zoomed(event) {
            const {transform} = event;
            mapGroupSelection
                .attr("transform", transform)
               .attr("stroke-width", 1 / transform.k);
        }

        const zoom = d3.zoom()
            .on("zoom", zoomed);

        //OPTIONAL: EDIT THIS CODE TO CHANGE WHAT HAPPENS WHEN YOU CLICK A STATE
        //useful if you want to add brushing
        function clicked(event, d) {
            event.stopPropagation();
            if(isZoomed){
                mapGroupSelection.transition().duration(300).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(0,0),
                    d3.pointer(event,svg.node())
                )
                    
            }
            else{
                //get bounds of path from map
                const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
                //zoom to bounds
                mapGroupSelection.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg.node())
                );
            }
            //sets the zoomed state property in the main app when we click on something
            //if we are zoomed in, unzoom instead
            isZoomed = !isZoomed;
            if(isZoomed){
                props.setZoomedState(d.properties.NAME);
            } else{
                props.setZoomedState(undefined);
            }
        }
        

        mapGroupSelection.selectAll('.state')
            .attr('cursor','pointer')//so we know the states are clickable
            .on('click',clicked);

    },[mapGroupSelection]);

    //OPTIONAL: EDIT HERE TO CHANGE THE BRUSHING BEHAVIOUR IN THE MAP WHEN MOUSING OVER A STATE
    //WILL UPDATE WHEN THE "BRUSHEDSTATE" VARIABLE CHANGES
    //brush the state by altering it's opacity when the property changes
    //brushed state can be on the same level but that makes it harder to use in linked views
    //so its in the parent app to simplify the "whitehat" part which uses linked views.
    useMemo(()=>{
        if(mapGroupSelection !== undefined){
            const isBrushed = props.brushedState !== undefined;
            mapGroupSelection.selectAll('.state')
                .attr('opacity',isBrushed? .4:.8)
                .attr('strokeWidth',isBrushed? 1:2);
            if(isBrushed){
                mapGroupSelection.select('#'+props.brushedState)
                    .attr('opacity',1)
                    .attr('strokeWidth',3);
            }
        }
    },[mapGroupSelection,props.brushedState]);
    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
} 

/*
import React, {useRef,useMemo,useEffect, useState} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';


export default function Whitehat(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    const isZoomed = React.useRef(false); // <— useRef so zoom state persists

    //TODO: change the line below to change the size of the white-hat maximum bubble size
    const maxRadius = width/90;

    //albers usa projection puts alaska in the corner
    //this automatically convert latitude and longitude to coordinates on the svg canvas
    const projection = d3.geoAlbersUsa()
        .translate([width/2,height/2]);

    //set up the path generator to draw the states
    const geoGenerator = d3.geoPath().projection(projection);

    //we need to use this function to convert state names into ids so we can select individual states by name using javascript selectors
    //since spaces makes it not work correctly
    function cleanString(string){
        return String(string || '').trim().toLowerCase().replaceAll('.', '').replaceAll(/\s+/g,'_');
    }

    const [popByState, setPopByState] = useState(null);   
    const [abbrToFull, setAbbrToFull] = useState(null);   
    const [fullToAbbr, setFullToAbbr] = useState(null);   
    useEffect(()=>{
        d3.csv(process.env.PUBLIC_URL + '/state_populations.csv')
          .then(rows=>{
            const stateRow = rows.find(r => String(r['']||'').toLowerCase() === 'state');
            const popRow   = rows.find(r => String(r['']||'').toLowerCase().includes('pop'));
            const popMap = new Map(), a2f = new Map(), f2a = new Map();
            if(stateRow && popRow){
              Object.keys(stateRow).forEach(k=>{
                if(k === '') return;
                const fullName = stateRow[k];          
                const abbr = String(k).toUpperCase();  
                const pop = +popRow[k];
                if(fullName){
                  const key = cleanString(fullName);
                  a2f.set(abbr, fullName);
                  f2a.set(key, abbr);
                  if(Number.isFinite(pop) && pop>0){
                    popMap.set(key, pop);
                  }
                }
              });
            }
            setPopByState(popMap);
            setAbbrToFull(a2f);
            setFullToAbbr(f2a);
          })
          .catch(err=>console.error('Population CSV load error', err));
    },[]);


    //This is the main loop that renders the code once the data loads
    //TODO: edit or replace this code to create your white-hat version of the map view; for example, change the color map based on colorbrewer2, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const mapGroupSelection = useMemo(()=>{
        //wait until the svg is rendered and data is loaded
        if(svg !== undefined && props.map !== undefined && props.data !== undefined && popByState && abbrToFull && fullToAbbr){

            const stateData = props.data.states;

            //EDIT THIS TO CHANGE WHAT IS USED TO ENCODE COLOR
            const getEncodedFeature = d => {
                let key = cleanString(d.state);
                let pop = popByState.get(key);
                if(!pop){
                    const full = (String(d.state||'').length===2) ? (abbrToFull.get(String(d.state).toUpperCase()) || d.state) : d.state;
                    key = cleanString(full);
                    pop = popByState.get(key);
                }
                const deaths = +d.count || 0;
                return (Number.isFinite(pop) && pop>0) ? (deaths/pop)*100000 : 0;
            };

            //this section of code sets up the colormap
            const stateCounts = Object.values(stateData).map(getEncodedFeature);

            //get color extends for the color legend
            const [stateMin,stateMax] = d3.extent(stateCounts);

            //color map scale, scales numbers to a smaller range to use with a d3 color scale
            //we're using 1-0 to invert the red-yellow-green color scale
            //so red is bad (p.s. this is not a good color scheme still)
            const stateScale = d3.scaleLinear()
                .domain([stateMin,stateMax])
                .range([0,1]); // <— higher rate => brighter in Viridis

            //TODO: EDIT HERE TO CHANGE THE COLOR SCHEME
            //this function takes a number 0-1 and returns a color
            const colorMap = d3.interpolateViridis;

            //this set of functions extracts the features given the state name from the geojson
            function getCount(name){
                const fullKey = cleanString(name);
                let entry = stateData.find(d=> cleanString(d.state) === fullKey);
                if(!entry){
                  const abbr = fullToAbbr.get(fullKey);
                  if (abbr){
                    entry = stateData.find(d=>(d.state||'').toUpperCase() === abbr);
                  }
                }
                if(!entry){ return 0 }
                return getEncodedFeature(entry);
            }
            function getStateVal(name){
                let per100k = getCount(name);
                let val = stateScale(per100k);
                return val
            }

            function getStateColor(d){
                return colorMap(getStateVal(d.properties.NAME))
            }

            //clear earlier drawings
            svg.selectAll('g').remove();

            //OPTIONAL: EDIT THIS TO CHANGE THE DETAILS OF HOW THE MAP IS DRAWN
            //draw borders from map and add tooltip
            let mapGroup = svg.append('g').attr('class','mapbox');
            mapGroup.selectAll('path').filter('.state')
                .data(props.map.features).enter()
                .append('path').attr('class','state')
                //ID is useful if you want to do brushing as it gives you a way to select the path
                .attr('id',d=> cleanString(d.properties.NAME))
                .attr('d',geoGenerator)
                .attr('fill',getStateColor)
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .on('mouseover',(e,d)=>{
                    let state = cleanString(d.properties.NAME);
                    //this updates the brushed state
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    let sname = d.properties.NAME;

                    const fullKey = cleanString(sname);
                    let entry = stateData.find(x=> cleanString(x.state)===fullKey);
                    if(!entry){
                        const abbr = fullToAbbr.get(fullKey);
                        if(abbr){
                          entry = stateData.find(x => (x.state||'').toUpperCase() === abbr);
                        }
                    }
                    const raw = entry ? (+entry.count || 0) : 0;

                    let pop = popByState.get(fullKey);
                    if(!pop && entry){
                      const full = (String(entry.state||'').length===2) ? (abbrToFull.get(String(entry.state).toUpperCase()) || entry.state) : entry.state;
                      pop = popByState.get(cleanString(full));
                    }
                    const per100k = (Number.isFinite(pop) && pop>0) ? (raw/pop)*100000 : 0
                    let text = `
                        <div><b>${sname}</b></div>
                        <div>Deaths: ${raw.toLocaleString()}</div>
                        <div>Population: ${Number.isFinite(pop)? pop.toLocaleString():'n/a'}</div>
                        <div><b>Deaths per 100k: ${per100k.toFixed(2)}</b></div>
                        <div style="margin-top:6px;font-size:.85em;color:#333">Normalized by 2014 population.</div>
                    `;
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    //see app.js for the helper function that makes this easier
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });


            //TODO: replace or edit the code below to change the city marker being used. Hint: think of the cityScale range (perhaps use area rather than radius). 
            //draw markers for each city
            const cityData = props.data.cities
            const cityMax = d3.max(cityData.map(d=>+d.count)) || 1;
            const cityScale = d3.scaleSqrt()
                .domain([0,cityMax])
                .range([0,maxRadius]);

            mapGroup.selectAll('.city').remove();

            //TODO: Add code for a tooltip when you mouse over the city (hint: use the same code for the state tooltip events .on... and modify what is used for the tTip.html)
            //OPTIONAL: change the color or opacity
            mapGroup.selectAll('.city')
                .data(cityData).enter()
                .append('circle').attr('class','city')
                .attr('id',d=>d.key)
                .attr('cx',d=> projection([d.lng,d.lat])[0])
                .attr('cy',d=> projection([d.lng,d.lat])[1])
                .attr('r',d=>cityScale(+d.count))
                .attr('fill','rgba(0,0,0,0.5)')
                .attr('stroke','#fff')
                .attr('stroke-width',0.5)
                .attr('opacity',.5)
                .on('mouseover',(e,d)=>{
                    const city = d.city || 'City';
                    const state = d.state || '';
                    const count = +d.count || 0;
                    const male = +d.male_count || undefined;
                    const female = +d.female_count || undefined;
                    const extra = (Number.isFinite(male) && Number.isFinite(female))
                        ? `<div>Male: ${male.toLocaleString()} | Female: ${female.toLocaleString()}</div>` : '';
                    const html = `
                        <div><b>${city}, ${state}</b></div>
                        <div>Deaths: ${count.toLocaleString()}</div>
                        ${extra}
                        <div style="margin-top:6px;font-size:.85em;color:#333">Circle area encodes deaths.</div>
                    `;
                    tTip.html(html);
                    props.ToolTip.moveTTipEvent(tTip,e);
                })
                .on('mousemove',(e)=> props.ToolTip.moveTTipEvent(tTip,e))
                .on('mouseout',()=> props.ToolTip.hideTTip(tTip));
                                

            
            //draw a color legend, automatically scaled based on data extents
            function drawLegend(){
                let bounds = mapGroup.node().getBBox();
                const barHeight = Math.min(height/10,40);
                
                let legendX = bounds.x + 10 + bounds.width;
                const barWidth = Math.min((width - legendX)/3,40);
                const fontHeight = Math.min(barWidth/2,16);
                let legendY = bounds.y + 2*fontHeight;
                
                let colorLData = [];
                //OPTIONAL: EDIT THE VALUES IN THE ARRAY TO CHANGE THE NUMBER OF ITEMS IN THE COLOR LEGEND
                for(let ratio of [0.1,.2,.3,.4,.5,.6,.7,.8,.9,.99]){
                    let val = (1-ratio)*stateMin + ratio*stateMax;
                    let scaledVal = stateScale(val);
                    let color = colorMap(scaledVal);
                    let entry = {
                        'x': legendX,
                        'y': legendY,
                        'value': val,
                        'color':color,
                    }
                    entry.text = (entry.value).toFixed(2); // strict equality warning fix is below
                    colorLData.push(entry);
                    legendY += barHeight;
                }
    
                svg.selectAll('.legendRect').remove();
                svg.selectAll('.legendRect')
                    .data(colorLData).enter()
                    .append('rect').attr('class','legendRect')
                    .attr('x',d=>d.x)
                    .attr('y',d=>d.y)
                    .attr('fill',d=>d.color)
                    .attr('height',barHeight)
                    .attr('width',barWidth);
    
                svg.selectAll('.legendText').remove();
                const legendTitle = {
                    'x': legendX - barWidth,
                    'y': bounds.y,
                    'text': 'Deaths per 100k' 
                }
                svg.selectAll('.legendText')
                    .data([legendTitle].concat(colorLData)).enter()
                    .append('text').attr('class','legendText')
                    .attr('x',d=>d.x+barWidth+5)
                    .attr('y',d=>d.y+barHeight/2 + fontHeight/4)
                    .attr('font-size',(d,i) => i === 0 ? 1.2*fontHeight : fontHeight) // <— use ===
                    .text(d=>d.text);
            }

            drawLegend();
            return mapGroup
        }
    },[svg,props.map,props.data,popByState,abbrToFull,fullToAbbr])

    //This adds zooming. Triggers whenever the function above finishes
    //this section can be included in the main body but is here as an example 
    //of how to do multiple hooks so updates don't have to occur in every state
    useMemo(()=>{
        if(mapGroupSelection === undefined){ return }
        
        //set up zooming
        function zoomed(event) {
            const {transform} = event;
            mapGroupSelection
                .attr("transform", transform)
               .attr("stroke-width", 1 / transform.k);
        }

        const zoom = d3.zoom()
            .on("zoom", zoomed);

        //OPTIONAL: EDIT THIS CODE TO CHANGE WHAT HAPPENS WHEN YOU CLICK A STATE
        //useful if you want to add brushing
        function clicked(event, d) {
            event.stopPropagation();
            if(isZoomed.current){
                mapGroupSelection.transition().duration(300).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(0,0),
                    d3.pointer(event,svg.node())
                )
                    
            }
            else{
                //get bounds of path from map
                const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
                //zoom to bounds
                mapGroupSelection.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg.node())
                );
            }
            //sets the zoomed state property in the main app when we click on something
            //if we are zoomed in, unzoom instead
            isZoomed.current = !isZoomed.current;
            if(isZoomed.current){
                props.setZoomedState(d.properties.NAME);
            } else{
                props.setZoomedState(undefined);
            }
        }
        

        mapGroupSelection.selectAll('.state')
            .attr('cursor','pointer')//so we know the states are clickable
            .on('click',clicked);

    },[mapGroupSelection]);

    //OPTIONAL: EDIT HERE TO CHANGE THE BRUSHING BEHAVIOUR IN THE MAP WHEN MOUSING OVER A STATE
    //WILL UPDATE WHEN THE "BRUSHEDSTATE" VARIABLE CHANGES
    //brush the state by altering it's opacity when the property changes
    //brushed state can be on the same level but that makes it harder to use in linked views
    //so its in the parent app to simplify the "whitehat" part which uses linked views.
    useMemo(()=>{
        if(mapGroupSelection !== undefined){
            const isBrushed = props.brushedState !== undefined;
            mapGroupSelection.selectAll('.state')
                .attr('opacity',isBrushed? .4:.8)
                .attr('stroke-width',isBrushed? 1:2);
            if(isBrushed){
                mapGroupSelection.select('#'+props.brushedState)
                    .attr('opacity',1)
                    .attr('stroke-width',3);
            }
        }
    },[mapGroupSelection,props.brushedState]);
    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
*/
    


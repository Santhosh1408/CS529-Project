import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import '../styles/Dashboard.css';
import SankeyDiagram from './SankeyDiagram';
import BeeswarmPlot from './BeeswarmPlot';
import NeighboringStatesPlot from './NeighboringStatesPlot';
import RadarChart from './RadarChart';
import ParallelCoordinates from './ParallelCoordinates';
import USChoropleth from './UsChoropleth';
import DivergingBarChart from './DivergingBarChart';

const stateNameMapping = {
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

function Dashboard({ data }) {
  const [filters, setFilters] = useState({
    ageRange: [18, 80],
    bmiRange: [15, 50],
    gender: 'all'
  });

  const [selectedState, setSelectedState] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sankeyFilter, setSankeyFilter] = useState(null);
  const [viewMode, setViewMode] = useState('individual');
  const [patientSearchId, setPatientSearchId] = useState('');

  const filteredData = useMemo(() => {
    let filtered = data;
    filtered = filtered.filter(d => d.age >= filters.ageRange[0] && d.age <= filters.ageRange[1]);
    filtered = filtered.filter(d => d.bmi >= filters.bmiRange[0] && d.bmi <= filters.bmiRange[1]);
    if (filters.gender !== 'all') {
      filtered = filtered.filter(d => 
        (filters.gender === 'male' && d.gender === 1) ||
        (filters.gender === 'female' && d.gender === 2)
      );
    }
    if (selectedState) {
      filtered = filtered.filter(d => d.state === selectedState);
    }
    if (sankeyFilter) {
      filtered = filtered.filter(d => {
        const fiber = d.fiber || 0;
        const sugar = d.sugar || 0;
        const fiberGroup = fiber < 15 ? 'Low Fiber' : fiber < 25 ? 'Med Fiber' : 'High Fiber';
        const sugarGroup = sugar < 50 ? 'Low Sugar' : sugar < 100 ? 'Med Sugar' : 'High Sugar';
        const bmiGroup = d.bmi < 18.5 ? 'Underweight' : d.bmi < 25 ? 'Healthy' : d.bmi < 30 ? 'Overweight' : 'Obese';
        if (sankeyFilter.type === 'node') {
          const n = sankeyFilter.name;
          return fiberGroup === n || sugarGroup === n || bmiGroup === n;
        }
        if (sankeyFilter.type === 'link') {
          const { source, target } = sankeyFilter;
          return (
            (fiberGroup === source && sugarGroup === target) ||
            (sugarGroup === source && bmiGroup === target)
          );
        }
        return true;
      });
    }
    return filtered;
  }, [data, filters, selectedState, sankeyFilter]);

  const filteredDataForNeighbors = useMemo(() => {
    let filtered = data;
    filtered = filtered.filter(d => d.age >= filters.ageRange[0] && d.age <= filters.ageRange[1]);
    filtered = filtered.filter(d => d.bmi >= filters.bmiRange[0] && d.bmi <= filters.bmiRange[1]);
    if (filters.gender !== 'all') {
      filtered = filtered.filter(d => 
        (filters.gender === 'male' && d.gender === 1) ||
        (filters.gender === 'female' && d.gender === 2)
      );
    }
    return filtered;
  }, [data, filters]);

  const beeswarmData = useMemo(() => {
    let filtered = data;
    filtered = filtered.filter(d => d.age >= filters.ageRange[0] && d.age <= filters.ageRange[1]);
    filtered = filtered.filter(d => d.bmi >= filters.bmiRange[0] && d.bmi <= filters.bmiRange[1]);
    if (filters.gender !== 'all') {
      filtered = filtered.filter(d => 
        (filters.gender === 'male' && d.gender === 1) ||
        (filters.gender === 'female' && d.gender === 2)
      );
    }
    return filtered;
  }, [data, filters]);

  const selectedPatientData = useMemo(() => {
    if (!selectedPatient) return null;
    return data.find(d => d.id === selectedPatient);
  }, [selectedPatient, data]);

  const stateAggregates = useMemo(() => {
    const stateMap = new Map();
    filteredData.forEach(patient => {
      const state = patient.state;
      if (!state) return;
      if (!stateMap.has(state)) {
        stateMap.set(state, { patients: [], n_patients: 0 });
      }
      const stateData = stateMap.get(state);
      stateData.patients.push(patient);
      stateData.n_patients++;
    });
    const aggregates = [];
    stateMap.forEach((stateData, stateAbbr) => {
      const patients = stateData.patients;
      const n = patients.length;
      aggregates.push({
        state_abbr: stateAbbr,
        n_patients: n,
        avg_lifestyle_score_100: d3.mean(patients, d => d.lifestyleScore) || 0,
        avg_diet_score_100: d3.mean(patients, d => d.dietScore) || 0,
        avg_pa_score_100: d3.mean(patients, d => d.activityScore) || 0,
        avg_bmi_score_100: d3.mean(patients, d => d.bmiScore) || 0,
        avg_cancer_score_100: d3.mean(patients, d => d.cancerScore) || 0
      });
    });
    return aggregates;
  }, [filteredData]);

  const nationalAverages = useMemo(() => {
    return {
      avg_lifestyle_score_100: d3.mean(data, d => d.lifestyleScore) || 0,
      avg_diet_score_100: d3.mean(data, d => d.dietScore) || 0,
      avg_pa_score_100: d3.mean(data, d => d.activityScore) || 0,
      avg_bmi_score_100: d3.mean(data, d => d.bmiScore) || 0,
      avg_cancer_score_100: d3.mean(data, d => d.cancerScore) || 0
    };
  }, [data]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleStateClick = (stateName) => {
    setSelectedState(stateName);
    setSelectedPatient(null);
  };

  const handleSankeyClick = (filterData) => {
    if (filterData === null) {
      setSankeyFilter(null);
    } else {
      setSankeyFilter(filterData);
      setSelectedPatient(null);
    }
  };

  const handlePatientClick = (patientId) => {
    if (patientId === null) {
      setSelectedPatient(null);
    } else {
      setSelectedPatient(patientId);
      setSelectedState(null);
    }
  };

  const handlePatientSearch = () => {
    if (patientSearchId) {
      const patientId = parseInt(patientSearchId);
      const patient = data.find(d => d.id === patientId);
      if (patient) {
        handlePatientClick(patientId);
      } else {
        alert('Patient ID not found');
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Cancer Nutrition Analytics</h1>
        <p>Explore nutritional patterns and health outcomes across the United States</p>
      </header>

      <div className="filter-panel">
        <div className="filter-group">
          <label>Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}</label>
          <div className="range-inputs">
            <input 
              type="number" 
              value={filters.ageRange[0]} 
              onChange={(e) => handleFilterChange('ageRange', [parseInt(e.target.value), filters.ageRange[1]])}
              min="18"
              max="80"
            />
            <span>to</span>
            <input 
              type="number" 
              value={filters.ageRange[1]} 
              onChange={(e) => handleFilterChange('ageRange', [filters.ageRange[0], parseInt(e.target.value)])}
              min="18"
              max="80"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>BMI Range: {filters.bmiRange[0]} - {filters.bmiRange[1]}</label>
          <div className="range-inputs">
            <input 
              type="number" 
              value={filters.bmiRange[0]} 
              onChange={(e) => handleFilterChange('bmiRange', [parseInt(e.target.value), filters.bmiRange[1]])}
              min="15"
              max="50"
            />
            <span>to</span>
            <input 
              type="number" 
              value={filters.bmiRange[1]} 
              onChange={(e) => handleFilterChange('bmiRange', [filters.bmiRange[0], parseInt(e.target.value)])}
              min="15"
              max="50"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Gender</label>
          <select 
            value={filters.gender} 
            onChange={(e) => handleFilterChange('gender', e.target.value)}
          >
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="patient-search-group">
          <div className="patient-search-box">
            <span className="search-icon"></span>
            <input 
              type="text" 
              placeholder="Search Patient ID" 
              value={patientSearchId}
              onChange={(e) => setPatientSearchId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePatientSearch();
                }
              }}
            />
          </div>
        </div>

        <button 
          className="reset-btn" 
          onClick={() => {
            setFilters({ ageRange: [18, 80], bmiRange: [15, 50], gender: 'all' });
            setSelectedState(null);
            setSelectedPatient(null);
            setSankeyFilter(null);
            setPatientSearchId('');
            setViewMode('individual');
          }}
        >
          Reset All
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
          Showing: <strong>{beeswarmData.length}</strong> / {data.length} patients
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container bmi-chart">
          <h3>
            {viewMode === 'individual' 
              ? 'BMI Distribution - United States' 
              : 'State Comparison - Geographic Neighbors'}
          </h3>
          <p className="chart-instruction">
            {viewMode === 'individual' 
              ? 'Click on a dot to select a patient, or search by Patient ID above' 
              : 'Click region buttons to switch regions, click dots to select states and view on map'}
          </p>
          {viewMode === 'individual' ? (
            <BeeswarmPlot 
              data={beeswarmData}
              searchSeqn={selectedPatient}
              onPatientClick={handlePatientClick}
              selectedState={selectedState}
              sankeyFilter={sankeyFilter}
            />
          ) : (
            <NeighboringStatesPlot 
              data={filteredDataForNeighbors}
              metric="cancerRate"
              selectedState={selectedState}
              onStateClick={handleStateClick}
            />
          )}
        </div>

        <div className="chart-container map-radar-chart" style={{ position: 'relative' }}>
          {!selectedPatient ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>United States Map</h3>

                {selectedState && (
                  <div className={`view-toggle ${viewMode}`}>
                    <button 
                      className={viewMode === 'individual' ? 'active' : ''}
                      onClick={() => setViewMode('individual')}
                    >
                      Individual
                    </button>
                    <button 
                      className={viewMode === 'national' ? 'active' : ''}
                      onClick={() => setViewMode('national')}
                    >
                      National Avg
                    </button>
                  </div>
                )}
              </div>

              <p className="chart-instruction">Click on a state to view regional comparison and filter data by state</p>

              <USChoropleth 
                data={filteredData}
                onStateClick={handleStateClick}
                selectedState={selectedState}
              />

              {selectedState && (
                <button 
                  className="back-button"
                  onClick={() => {
                    setSelectedState(null);
                    setViewMode('individual');
                    setSankeyFilter(null);
                  }}
                >
                  ← Back
                </button>
              )}

            </>
          ) : (
            <>
              <h3>Nutritional Profile - Patient {selectedPatient}</h3>
              <p className="chart-instruction">Patient's nutritional metrics compared to national averages</p>
              <RadarChart patient={selectedPatientData} allData={data} />
            </>
          )}
        </div>

        <div className="chart-container flow-multivariate-chart">
          {!selectedPatient ? (
            <>
              {viewMode === 'individual' ? (
                <>
                  <h3>Patient Flow - {selectedState || 'All States'}</h3>
                  <p className="chart-instruction">Click on nodes or links to filter patients by fiber, sugar, and BMI categories</p>
                  <SankeyDiagram 
                    data={filteredData}
                    selectedState={selectedState}
                    onNodeClick={handleSankeyClick}
                    selectedFilter={sankeyFilter} 
                  />
                </>
              ) : (
                <>
                  <h3>
                    {selectedState 
                      ? `${stateNameMapping[selectedState] || selectedState} (${selectedState}) vs National Comparison` 
                      : 'State vs National Comparison'}
                  </h3>
                  <p className="chart-instruction">Green bars show scores above national average, red bars show scores below average</p>
                  <DivergingBarChart 
                    selectedState={selectedState}
                    stateData={stateAggregates}
                    nationalData={nationalAverages}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <h3>Daily Nutrition Comparison - Patient {selectedPatient}</h3>
              <p className="chart-instruction">Blue line is Day 1, orange line is Day 2, dashed line is the average between both days</p>
              <ParallelCoordinates 
                patient={selectedPatientData}
                allData={data}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';


const STATE_ABBREVIATIONS = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};


const METRIC_CONFIGS = [
  { key: 'avg_lifestyle_score_100', label: 'Lifestyle Score', color: '#3b82f6' },
  { key: 'avg_diet_score_100', label: 'Diet Score', color: '#10b981' },
  { key: 'avg_pa_score_100', label: 'Physical Activity', color: '#f59e0b' },
  { key: 'avg_bmi_score_100', label: 'BMI Score', color: '#ef4444' }
];


const MAX_SCORE = 100;
const DECIMAL_PRECISION = 1;


class StateDataModel {

  static async loadStateData(stateAbbr) {
    try {
      const url = process.env.PUBLIC_URL + '/state_level_scores_for_map.csv';
      const data = await d3.csv(url, d3.autoType);

      if (!data || data.length === 0) {
        console.warn("CSV returned empty — likely still loading");
        return null;
      }

      return data.find((d) => d.state_abbr === stateAbbr) || null;
    } catch (err) {
      console.error("Error loading state CSV:", err);
      return null;
    }
  }


  static getStateName(stateAbbr) {
    return STATE_ABBREVIATIONS[stateAbbr] || stateAbbr;
  }


  static formatScore(score) {
    const numericScore = Number(score);
    return isNaN(numericScore) ? '0.0' : numericScore.toFixed(DECIMAL_PRECISION);
  }
}


function MetricCard({ label, value, color }) {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    textAlign: 'center',
    boxShadow: isHovered ? '0 6px 12px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.06)',
    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default'
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ 
        fontSize: '11px', 
        color: '#6b7280', 
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: '600'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: color,
        lineHeight: '1'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '10px',
        color: '#9ca3af',
        marginTop: '4px'
      }}>
        out of {MAX_SCORE}
      </div>
    </div>
  );
}


function BackButton({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    padding: '8px 16px',
    background: isHovered ? '#2563eb' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'all 0.2s ease'
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Return to map view"
    >
      Back to Map
    </button>
  );
}


function LoadingView() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      color: '#999',
      fontSize: '14px'
    }}>
      Loading state data...
    </div>
  );
}


function ErrorView({ stateAbbr }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      color: '#dc2626',
      fontSize: '14px',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div>No data available for {stateAbbr}</div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        Please select a different state
      </div>
    </div>
  );
}


const StateComparison = ({ stateAbbr, onBackClick }) => {
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {
    const fetchStateData = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const data = await StateDataModel.loadStateData(stateAbbr);
        setStateData(data);
        
        if (data === null || data === undefined) {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStateData();
  }, [stateAbbr]);


  const handleBackgroundClick = (event) => {
    if (event.target === event.currentTarget && typeof onBackClick === 'function') {
      onBackClick();
    }
  };


  const handleBackButtonClick = () => {
    if (typeof onBackClick === 'function') {
      onBackClick();
    }
  };


  const stopEventPropagation = (event) => {
    event.stopPropagation();
  };


  if (loading) {
    return <LoadingView />;
  }


  if (error || !stateData) {
    return <ErrorView stateAbbr={stateAbbr} />;
  }

  const fullStateName = StateDataModel.getStateName(stateAbbr);
  const patientCount = stateData.n_patients || 0;

  return (
    <div 
      onClick={handleBackgroundClick}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={stopEventPropagation}
        style={{
          width: '100%',
          maxWidth: '1200px',
          cursor: 'default'
        }}
      >
        {/* Header with state name and navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0'
          }}>
            {fullStateName}
          </h2>
          
          <BackButton onClick={handleBackButtonClick} />
        </div>

        {/* Metric cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {METRIC_CONFIGS.map((config) => {
            const rawValue = stateData[config.key];
            const formattedValue = StateDataModel.formatScore(rawValue);
            
            return (
              <MetricCard 
                key={config.key}
                label={config.label} 
                value={formattedValue} 
                color={config.color}
              />
            );
          })}
        </div>

        {/* Footer with patient count */}
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          textAlign: 'center',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <strong style={{ color: '#1f2937' }}>{patientCount}</strong> patients in this state
        </div>
      </div>
    </div>
  );
};

export default StateComparison;
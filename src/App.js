import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import Dashboard from './components/Dashboard';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv(
          process.env.PUBLIC_URL + '/Complete_file_with_scores_and_states.csv',
          d => ({
            id: +d.SEQN,
            age: +d.RIDAGEYR,
            gender: +d.RIAGENDR,
            ethnicity: +d.RIDRETH3,
            bmi: +d.BMXBMI,
            fiber: +d.AVG_FIBE,
            sugar: +d.AVG_SUGR,
            calories: +d.AVG_KCAL,
            satFat: +d.AVG_SATFAT,
            protein: +d.AVG_PROT,
            alcohol: +d.AVG_ALCOHOL,
            fiberDay1: +d.DR1TFIBE,
            sugarDay1: +d.DR1TSUGR,
            caloriesDay1: +d.DR1TKCAL,
            proteinDay1: +d.DR1TPROT,
            satFatDay1: +d.DR1TS040,
            fiberDay2: +d.DR2TFIBE,
            sugarDay2: +d.DR2TSUGR,
            caloriesDay2: +d.DR2TKCAL,
            proteinDay2: +d.DR2TPROT,
            satFatDay2: +d.DR2TS040,
            dietScore: +d.DIET_SCORE_100,
            alcoholScore: +d.ALC_SCORE_100,
            activityScore: +d.PA_SCORE_100,
            bmiScore: +d.BMI_SCORE_100,
            cancerScore: +d.CANCER_SCORE_100,
            lifestyleScore: +d.LIFESTYLE_SCORE_100,
            cancer: +d.MCQ220,
            cancerBinary: +d.cancer_bin,
            cancerStatus: d.CANCER_STATUS_TEXT,
            state: d.synthetic_state_abbr,
            stateCode: +d.synthetic_state_code
          })
        );

        const cleanData = data.filter(
          d => !isNaN(d.age) && d.age > 0 && !isNaN(d.bmi) && d.bmi > 0
        );

        cleanData.forEach(d => {
          if (isNaN(d.fiber)) d.fiber = null;
          if (isNaN(d.sugar)) d.sugar = null;
          if (isNaN(d.calories)) d.calories = null;
          if (isNaN(d.protein)) d.protein = null;
          if (isNaN(d.satFat)) d.satFat = null;
          if (isNaN(d.alcohol)) d.alcohol = null;
          if (isNaN(d.fiberDay1)) d.fiberDay1 = null;
          if (isNaN(d.sugarDay1)) d.sugarDay1 = null;
          if (isNaN(d.caloriesDay1)) d.caloriesDay1 = null;
          if (isNaN(d.proteinDay1)) d.proteinDay1 = null;
          if (isNaN(d.satFatDay1)) d.satFatDay1 = null;
          if (isNaN(d.fiberDay2)) d.fiberDay2 = null;
          if (isNaN(d.sugarDay2)) d.sugarDay2 = null;
          if (isNaN(d.caloriesDay2)) d.caloriesDay2 = null;
          if (isNaN(d.proteinDay2)) d.proteinDay2 = null;
          if (isNaN(d.satFatDay2)) d.satFatDay2 = null;
        });

        console.log(`Loaded ${cleanData.length} valid patient records`);
        setCsvData(cleanData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Cancer Nutrition Data...</h2>
          <p style={{ color: '#666' }}>Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center', color: '#cc3311' }}>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            Make sure 'Complete_file_with_scores_and_states.csv' is in the /public folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Dashboard data={csvData} />
    </div>
  );
}

export default App;

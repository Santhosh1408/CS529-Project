# Visual Analytics for Cancer Nutrition Website Data

**Course:** CS 529 – Visual Data Science (Fall 2025)  
**University:** University of Illinois Chicago  
**Project Manager:** Santhosh Reddy Katasani Venkata  
**Team Members:** Madhura Dongare, Het Nagda  
**Client:** Dr. Jean Reading – Department of Family and Community Medicine, UI Health  

---

## Project Overview

This project develops an **interactive visualization system** for data generated from a *personalized nutrition website for cancer patients* being built by the Department of Family and Community Medicine at UI Health.  
The goal is to help clinicians and researchers explore how patients engage with AI-recommended recipes and how their dietary behaviors relate to key health metrics such as blood pressure, glucose, and weight.

The visualization system enables users to:
- Explore **recipe trends** and engagement patterns  
- Analyze **nutritional choices vs. health outcomes**  
- Compare results across demographics and cancer treatment stages  
- Identify **dietary patterns** linked to improved patient health  

Since the website is not yet deployed, sample and public datasets (BRFSS, NHANES, AICR) are used to simulate realistic data.

---

## Significance

This project demonstrates how **visual analytics** can make cancer nutrition data interpretable and actionable.  
It provides clinicians with intuitive dashboards to explore patient-level insights, while giving researchers a tool to investigate relationships between dietary behavior and health outcomes over time.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Visualization Library:** D3.js  
- **Data Processing:** Python  
- **Version Control:** Git & GitHub  
- **Hosting:** GitHub Pages  

---

## Data Sources

| Dataset | Source | Description |
|----------|---------|-------------|
| **BRFSS** | [CDC BRFSS](https://www.cdc.gov/brfss/annual_data/annual_data.htm) | Behavioral Risk Factor Surveillance System – diet and health behavior data |
| **NHANES** | [CDC NHANES](https://www.cdc.gov/nchs/nhanes/index.html) | National Health and Nutrition Examination Survey – nutrition and health metrics |
| **AICR** | [AICR Continuous Update Project](https://www.aicr.org/research/the-continuous-update-project/) | Cancer and nutrition research data |

---

## System Features

- Interactive D3.js dashboards  
- Real-time filtering, linking, and brushing  
- Comparative analysis between patient groups  
- Scalable structure for integration with real patient data in the future  
- Responsive and accessible design for non-technical users  

---

## Repository Setup

To run this project locally:

```bash
# Clone the repository
git clone https://github.com/Santhosh1408/CS529-Project

# Navigate into the project
cd CS529-Project

# Install dependencies
npm install

# Run the app locally
npm start

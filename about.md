I rebuilt the white-hat view to be clear, fair, and transparent. The state map is a choropleth that encodes deaths per 100,000 people (per-capita normalization using 2014 state populations) so large states don’t look worse just because they’re big. For color, I use D3 interpolateViridis, a colorblind-friendly sequential palette where darker = higher rate. City markers use circle area with d3.scaleSqrt so the dot’s visual size matches the count. Tooltips show the exact state/city, raw deaths, population, and deaths per 100k, with a clear note that rates are normalized by 2014 population. The legend reflects the actual data range, and zoom/pan/hover (brushing) still work.

For the bottom view, I replaced the playful scatter with a gender focused chart. Each state has grouped bars (Male vs Female) so you can compare gender counts side by side. Bars are sorted by total deaths for readability, and the tooltip shows both counts and each gender’s share. I also experimented with other views complete stacked bars (male vs female share by state), a Top-10 states per-100k bar chart, and a histogram of state rates and chose grouped bars for the clearest comparison. Overall, the design is “white-hat”: clear titles, honest scales, a sequential palette for one-sided data, and explicit disclosure of the data transform (per-capita normalization). No truncated axes, no misleading colors, and no hidden filtering.

Data & credits: 

Gun-death data: Slate dataset (processed JSON from the course repo)

State populations (2014): U.S. Census (public/state_populations.csv)

U.S. states GeoJSON: eric.clst.org (public/us-states.geojson)

Color palette: D3 interpolateViridis

Libraries/scaffold: D3, React, UIC EVL support code
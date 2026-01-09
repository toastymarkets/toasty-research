/**
 * Constants for NWS Discussion Widget
 * Meteorological keywords, definitions, and styling
 */

// Meteorological keywords to highlight, grouped by category
// See docs/FORECAST_KEYWORDS.md for full documentation
export const WEATHER_KEYWORDS = {
  // Temperature patterns
  temperature: [
    'warm air advection', 'cold air advection', 'warming trend', 'cooling trend',
    'above normal', 'below normal', 'near normal', 'above average', 'above-average temperature',
    'record high', 'record low', 'record-breaking', 'records',
    'freeze', 'frost', 'heat wave', 'cold snap', 'thermal trough',
    'warmer', 'cooler', 'warm', 'cold', 'dew point', 'dewpoint',
    'inversion', 'temperature inversion', 'radiational cooling',
  ],
  // Pressure/fronts
  synoptic: [
    'cold front', 'warm front', 'occluded front', 'stationary front',
    'frontal boundary', 'frontal passage',
    'low pressure', 'high pressure', 'trough', 'troughing', 'ridge', 'surface ridge', 'upper level',
    'surface low', 'surface high', 'shortwave', 'short wave', 'longwave',
    'cutoff low', 'closed low', 'upper low', 'blocking pattern', 'zonal flow',
    'return flow', 'upper level disturbance', 'Pacific front',
    'jet stream', 'polar vortex', 'pressure gradient', 'isobar',
    'positively tilted', 'negatively tilted', 'weak flow', 'nnw flow', 'nw flow',
    'ne flow', 'sw flow', 'se flow', 'westerly flow', 'easterly flow',
    'storm system', 'storm systems', 'synoptic waves', 'dynamic system',
    'kinematic forcing', 'moisture laden warm conveyer', 'warm conveyer',
    'secondary low', 'polar front', 'backdoor cold front',
    'upper-level support', 'reduced upper-level support',
  ],
  // Precipitation
  precipitation: [
    'rain chances', 'rain', 'snow', 'sleet', 'freezing rain', 'freezing', 'wintry mix', 'thunderstorm',
    'shower', 'showers', 'light shower', 'light showers', 'drizzle', 'downpour', 'heavy rain', 'light rain',
    'soaking rain', 'sprinkles', 'flurries', 'isolated shower', 'measurable snow',
    'accumulation', 'precip', 'precipitation', 'moisture', 'copious amounts',
    'convection', 'instability', 'cape', 'lifted index',
    'dry', 'low clouds', 'fog', 'dense fog', 'mist', 'virga',
    'stratus', 'cumulus', 'cirrus', 'cloud cover', 'overcast',
    'partly cloudy', 'partly to mostly cloudy', 'mostly cloudy', 'sunny skies', 'clear skies',
  ],
  // Wind
  wind: [
    'wind advisory', 'high wind', 'gust', 'gusts', 'gusty', 'gusty winds', 'gusty southerly winds',
    'gusty south winds', 'breezy', 'windy',
    'santa ana', 'chinook', 'offshore flow', 'onshore flow',
    'wind shift', 'veering', 'backing', 'jet', 'low level jet', 'mountain wave',
  ],
  // Confidence/uncertainty
  confidence: [
    'uncertainty', 'confidence', 'unlikely',
    'forecast', 'outlook', 'trend', 'timing',
    'models agree', 'model spread', 'ensemble', 'ensemble solutions',
    'model guidance', 'solution', 'model solution',
    'improving model agreement', 'uncertainty remains high',
  ],
  // Hazards - fire, severe weather, dangerous conditions
  hazards: [
    'fire weather', 'fire concerns', 'fuel moisture', 'red flag warning',
    'wind chill', 'heat index', 'severe', 'tornado', 'hail',
    'flash flood', 'flood', 'ice storm', 'blizzard',
    'advisory', 'warning', 'watch', 'freezing fog',
    'elevated fire weather', 'dense fog advisory',
  ],
  // Aviation / Technical terms
  aviation: [
    'VFR', 'MVFR', 'IFR', 'LIFR', 'ceiling', 'visibility', 'VSBY',
    'CWA', 'EPS', 'QPF',
  ],
  // Locations - city-specific geographic references
  locations: [
    // NY/OKX area
    'long island', 'hudson valley', 'manhattan', 'brooklyn', 'queens',
    'bronx', 'staten island', 'moriches inlet', 'jersey shore',
    'connecticut', 'new jersey',
    // Chicago/LOT area
    'lake michigan', 'lakefront', 'lake effect', 'lake enhanced',
    'wisconsin', 'indiana', 'i-88', 'i-90', 'i-80', 'northern il', 'moline',
    'southern plains',
    // LA/LOX area
    'point conception', 'pt conception', 'santa barbara', 'sba', 'ventura', 'los angeles county',
    'la county', 'los angeles basin', 'san fernando valley', 'antelope valley',
    'catalina', 'channel islands', 'san gabriel', 'central coast',
    'orange county', 'san diego', 'inland empire', 'high desert', 'slo', 'san luis obispo',
    'i-5 corridor', 'mountain passes',
    // Denver/BOU area
    'front range', 'palmer divide', 'i-25', 'i-70', 'boulder',
    'fort collins', 'denver metro', 'continental divide',
    'northern mountains', 'central mountains', 'southern mountains',
    'lower foothills', 'elevated terrain',
    // Austin/EWX area
    'hill country', 'edwards plateau', 'rio grande', 'south central texas',
    'balcones', 'i-35', 'i-10', 'san antonio', 'guadalupe',
    // Miami/MFL area
    'everglades', 'florida keys', 'keys', 'gulf stream', 'biscayne',
    'palm beach', 'broward', 'miami-dade', 'lake okeechobee',
    // General geographic terms
    'coastal waters', 'inland areas', 'mountains', 'valleys', 'foothills',
    'metro', 'interior', 'coastal', 'offshore', 'gulf coast', 'east coast',
    'atlantic', 'pacific',
  ],
};

// Build keyword lookup map (keyword -> category)
export const KEYWORD_MAP = new Map();
Object.entries(WEATHER_KEYWORDS).forEach(([category, keywords]) => {
  keywords.forEach(keyword => KEYWORD_MAP.set(keyword.toLowerCase(), category));
});

// All keywords sorted by length (longest first for regex matching)
export const ALL_KEYWORDS_SORTED = Array.from(KEYWORD_MAP.keys()).sort((a, b) => b.length - a.length);

// Category colors matching the glassmorphism design
export const CATEGORY_COLORS = {
  temperature: 'bg-orange-500/30 text-orange-300 hover:bg-orange-500/50',
  synoptic: 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/50',
  precipitation: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50',
  wind: 'bg-teal-500/30 text-teal-300 hover:bg-teal-500/50',
  confidence: 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/50',
  hazards: 'bg-red-500/30 text-red-300 hover:bg-red-500/50',
  aviation: 'bg-gray-500/30 text-gray-300 hover:bg-gray-500/50',
  tempRange: 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50',
  rainfallAmount: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50',
  degreeRange: 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50',
  locations: 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50',
};

// Glossary category colors
export const GLOSSARY_CATEGORY_COLORS = {
  locations: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30',
  phenomena: 'bg-teal-500/30 text-teal-300 border-teal-500/30',
  technical: 'bg-purple-500/30 text-purple-300 border-purple-500/30',
};

export const GLOSSARY_CATEGORY_LABELS = {
  locations: 'Locations',
  phenomena: 'Weather Phenomena',
  technical: 'Technical Terms',
};

// NWS-sourced definitions for meteorological terms
export const KEYWORD_DEFINITIONS = {
  // Temperature
  'warm air advection': 'Movement of warm air into a region by winds. Typically leads to temperature increases.',
  'cold air advection': 'Movement of cold air into a region by winds. Typically leads to temperature decreases.',
  'warming trend': 'A pattern of progressively higher temperatures over several days.',
  'cooling trend': 'A pattern of progressively lower temperatures over several days.',
  'above normal': 'Temperatures higher than the historical average for this time of year.',
  'below normal': 'Temperatures lower than the historical average for this time of year.',
  'near normal': 'Temperatures close to the historical average for this time of year.',
  'record high': 'The highest temperature ever recorded for this date.',
  'record low': 'The lowest temperature ever recorded for this date.',
  'freeze': 'When air temperature drops to 32°F (0°C) or below.',
  'frost': 'Ice crystals that form on surfaces when temperatures are near or below freezing.',
  'heat wave': 'Extended period of abnormally high temperatures.',
  'cold snap': 'A sudden, brief period of cold weather.',
  'thermal trough': 'An elongated area of low pressure caused by intense surface heating.',
  'storm system': 'An organized area of low pressure that brings unsettled weather and temperature changes.',
  'frontal passage': 'When a weather front moves through an area, often causing temperature shifts.',
  'cooler weather': 'Temperatures lower than recent days.',
  'warmer weather': 'Temperatures higher than recent days.',
  'cool days': 'Daytime temperatures below seasonal averages.',
  'cool nights': 'Overnight temperatures below seasonal averages.',
  'warm days': 'Daytime temperatures above seasonal averages.',
  'warm nights': 'Overnight temperatures above seasonal averages.',
  'cooler temperatures': 'A drop in temperature from current conditions.',
  'warmer temperatures': 'A rise in temperature from current conditions.',
  'high temperatures': 'The maximum temperature expected during the day.',
  'low temperatures': 'The minimum temperature expected, usually overnight.',
  'overnight lows': 'The coldest temperature expected during the night.',
  'daytime highs': 'The warmest temperature expected during daylight hours.',
  'polar high pressure': 'A strong high pressure system originating from polar regions, bringing very cold air.',
  'frontal boundary': 'The transition zone between two different air masses.',
  'weak clipper system': 'A fast-moving but less intense low pressure from Canada with light snow.',
  'pva': 'Positive Vorticity Advection - upward air motion that can trigger precipitation and storm development.',
  'nva': 'Negative Vorticity Advection - downward air motion associated with clearing and fair weather.',
  'rrq': 'Right Rear Quadrant - area of a jet stream with rising air, favorable for storm development.',
  'ulj': 'Upper Level Jet - fast winds at high altitude (30,000+ ft) that influence weather patterns.',
  'llj': 'Low Level Jet - strong winds at low altitude that can transport moisture and trigger storms.',
  'theta-e': 'Equivalent Potential Temperature - measure of air mass energy. Higher values indicate warmer, more humid air.',
  'ao': 'Arctic Oscillation - climate pattern affecting jet stream position. Negative (-AO) brings cold Arctic air south; positive (+AO) keeps cold air locked in Arctic.',
  'nao': 'North Atlantic Oscillation - pressure pattern over Atlantic. Negative (-NAO) favors cold/snowy East Coast; positive (+NAO) brings milder, wetter conditions.',
  '-ao': 'Negative Arctic Oscillation - weak polar vortex allows cold Arctic air to spill southward into mid-latitudes.',
  '-nao': 'Negative North Atlantic Oscillation - blocking pattern that can bring cold air and snow to the eastern US.',
  '+ao': 'Positive Arctic Oscillation - strong polar vortex keeps cold air trapped in Arctic, leading to milder mid-latitude temps.',
  '+nao': 'Positive North Atlantic Oscillation - strong westerly flow bringing mild, wet weather to eastern US.',
  'nbm': 'National Blend of Models - NWS guidance combining multiple weather models into a single forecast.',
  'pops': 'Probability of Precipitation - percent chance of measurable precipitation at a location.',
  'wx': 'Weather - shorthand used in NWS forecasts and discussions.',
  'sca': 'Small Craft Advisory - marine warning for hazardous conditions for small boats.',

  // Synoptic
  'high pressure': 'Area where atmospheric pressure is elevated. Associated with fair weather, clear skies, and light winds.',
  'low pressure': 'Area where atmospheric pressure is reduced. Typically brings clouds, precipitation, and wind.',
  'cold front': 'Boundary where cold air advances and replaces warmer air. Often brings rain, storms, and sharp weather changes.',
  'warm front': 'Boundary where warm air advances over colder air. Brings gradual weather changes with clouds and fog.',
  'occluded front': 'A front formed when a cold front overtakes a warm front, lifting warm air off the surface.',
  'stationary front': 'A boundary between air masses that is not moving. Can cause prolonged precipitation.',
  'trough': 'Elongated area of low pressure. Associated with cooler, unsettled weather.',
  'ridge': 'Elongated area of high pressure. Associated with warm, stable, sunny weather.',
  'upper level': 'Conditions in the upper atmosphere (above 18,000 ft) that influence surface weather.',
  'surface low': 'A low pressure system at ground level.',
  'surface high': 'A high pressure system at ground level.',
  'shortwave': 'Small-scale disturbance in upper atmosphere that moves quickly and can trigger precipitation.',
  'longwave': 'Large-scale wave pattern in the jet stream spanning thousands of miles.',
  'cutoff low': 'A low pressure system that has separated from the main jet stream flow.',
  'closed low': 'A low pressure area completely encircled by a pressure contour.',
  'blocking pattern': 'A persistent high pressure that blocks the normal west-to-east flow of weather systems.',
  'zonal flow': 'West-to-east wind pattern with little north-south movement. Generally brings mild weather.',
  'clipper': 'Fast-moving low pressure from Canada bringing light snow and rapid temperature drops.',
  'clipper system': 'Fast-moving low pressure from Canada bringing light snow and rapid temperature drops.',

  // Precipitation
  'rain': 'Liquid precipitation falling from clouds.',
  'snow': 'Frozen precipitation in the form of ice crystals.',
  'sleet': 'Frozen raindrops that bounce when hitting the ground.',
  'freezing rain': 'Rain that freezes on contact with cold surfaces, creating ice.',
  'wintry mix': 'A combination of rain, snow, sleet, or freezing rain.',
  'thunderstorm': 'A storm with lightning and thunder, often with heavy rain and gusty winds.',
  'shower': 'Brief period of precipitation from convective clouds.',
  'showers': 'Multiple brief periods of precipitation from convective clouds.',
  'light shower': 'Brief, light precipitation event.',
  'light showers': 'Multiple brief, light precipitation events.',
  'drizzle': 'Light precipitation with very small water droplets.',
  'downpour': 'Very heavy rainfall over a short period.',
  'heavy rain': 'Rainfall at a rate of 0.3 inches or more per hour.',
  'light rain': 'Rainfall at a rate of less than 0.1 inches per hour.',
  'accumulation': 'Total amount of snow or rain that has fallen.',
  'precip': 'Short for precipitation - any form of water falling from clouds.',
  'precipitation': 'Any form of water falling from clouds: rain, snow, sleet, hail.',
  'moisture': 'Water vapor in the atmosphere that can lead to precipitation.',
  'convection': 'Vertical air movement that can produce thunderstorms when moisture is present.',
  'instability': 'Atmospheric condition where air parcels rise easily, favoring storm development.',
  'cape': 'Convective Available Potential Energy - measure of storm potential. Higher values = more severe.',
  'lifted index': 'Stability measure. Negative values indicate unstable air and storm potential.',
  'partly cloudy': 'Sky coverage of 3/8 to 5/8 clouds.',
  'partly to mostly cloudy': 'Sky coverage transitioning from partly to mostly cloudy.',
  'mostly cloudy': 'Sky coverage of 5/8 to 7/8 clouds.',
  'sunny skies': 'Clear conditions with little to no cloud cover.',
  'clear skies': 'No clouds present, excellent visibility.',

  // Wind
  'wind advisory': 'Sustained winds of 31-39 mph and/or gusts to 57 mph expected.',
  'high wind': 'Sustained winds of 40+ mph or gusts of 58+ mph.',
  'gust': 'Brief increase in wind speed, typically lasting less than 20 seconds.',
  'breezy': 'Sustained winds of 15-25 mph.',
  'windy': 'Sustained winds of 20-30 mph.',
  'santa ana': 'Hot, dry winds in Southern California that blow from the desert.',
  'chinook': 'Warm, dry wind on the eastern side of the Rocky Mountains.',
  'offshore flow': 'Wind blowing from land toward the ocean.',
  'onshore flow': 'Wind blowing from ocean toward land, often bringing moisture.',
  'wind shift': 'A change in wind direction, often associated with frontal passage.',
  'veering': 'Wind direction changing clockwise (e.g., south to west). Indicates warming.',
  'backing': 'Wind direction changing counterclockwise (e.g., west to south). Indicates cooling.',

  // Confidence
  'uncertainty': 'Forecaster confidence is lower due to model disagreement or complex weather patterns.',
  'confidence': 'The degree of certainty in a weather forecast.',
  'likely': 'High probability (60-80%) that this weather event will occur.',
  'unlikely': 'Low probability (20-40%) that this weather event will occur.',
  'possible': 'Moderate probability (30-60%) that this weather event will occur.',
  'expected': 'High probability that this weather pattern will develop.',
  'forecast': 'A prediction of future weather conditions.',
  'outlook': 'An extended forecast, typically 3-7 days ahead.',
  'trend': 'The general direction weather patterns are moving.',
  'timing': 'When a weather event is expected to occur.',
  'models agree': 'Multiple weather models show similar predictions, increasing forecast confidence.',
  'model spread': 'Disagreement between weather models, indicating forecast uncertainty.',
  'ensemble': 'Collection of model runs used to assess forecast uncertainty.',
  'deterministic': 'A single model run, as opposed to an ensemble average.',
  'guidance': 'Computer model output used to inform forecasts.',
  'model guidance': 'Numerical weather prediction model output.',
  'solution': 'A specific forecast scenario predicted by a weather model.',
  'model solution': 'The predicted weather pattern from a specific model run.',

  // Additional temperature terms
  'dew point': 'Temperature at which air becomes saturated and dew forms. Higher dew points indicate more moisture.',
  'dewpoint': 'Temperature at which air becomes saturated and dew forms. Higher dew points indicate more moisture.',
  'inversion': 'Layer where temperature increases with height, trapping pollution and cold air below.',
  'temperature inversion': 'Layer where temperature increases with height instead of decreasing.',

  // Additional synoptic terms
  'upper low': 'Low pressure system in the upper atmosphere, often bringing unsettled weather.',
  'jet stream': 'Fast-moving river of air at 30,000+ ft that steers weather systems.',
  'polar vortex': 'Large area of cold air circling the poles. When it weakens, cold air spills south.',
  'pressure gradient': 'Change in pressure over distance. Stronger gradients mean stronger winds.',
  'isobar': 'Line on a weather map connecting points of equal atmospheric pressure.',
  'positively tilted': 'Trough or ridge tilted from northwest to southeast, usually less amplified.',
  'negatively tilted': 'Trough or ridge tilted from southwest to northeast, usually more amplified and dynamic.',
  'weak flow': 'Light winds in the upper atmosphere, often leading to slow-moving weather systems.',
  'nnw flow': 'North-northwest wind direction.',
  'nw flow': 'Northwest wind direction.',
  'ne flow': 'Northeast wind direction.',
  'sw flow': 'Southwest wind direction.',
  'se flow': 'Southeast wind direction.',
  'westerly flow': 'Winds from the west, typical pattern across mid-latitudes.',
  'easterly flow': 'Winds from the east, can bring maritime moisture or continental air.',

  // Additional precipitation terms
  'fog': 'Cloud at ground level reducing visibility below 1 mile.',
  'dense fog': 'Heavy fog reducing visibility to 1/4 mile or less.',
  'mist': 'Light precipitation with droplets smaller than drizzle, reducing visibility.',
  'virga': 'Precipitation that falls from clouds but evaporates before reaching the ground.',
  'stratus': 'Low, gray cloud layer that often brings drizzle or light rain.',
  'cumulus': 'Puffy, cotton-like clouds that can grow into thunderstorms.',
  'cirrus': 'Thin, wispy high clouds made of ice crystals, often indicating weather changes.',
  'cloud cover': 'Amount of sky covered by clouds, affecting temperature and precipitation.',
  'overcast': 'Sky completely covered by clouds.',

  // Additional wind terms
  'gusts': 'Brief increases in wind speed, typically lasting less than 20 seconds.',
  'jet': 'Short for jet stream or low-level jet - fast-moving air currents.',
  'low level jet': 'Fast winds at low altitudes (below 10,000 ft) that transport moisture and trigger storms.',

  // Additional hazards
  'advisory': 'Issued for weather conditions that may cause inconvenience or hazards.',
  'warning': 'Issued for dangerous weather conditions that pose a threat to life or property.',
  'watch': 'Conditions are favorable for hazardous weather to develop.',
  'freezing fog': 'Fog that occurs when temperatures are below freezing, coating surfaces with ice.',

  // Additional aviation terms
  'visibility': 'Distance at which objects can be clearly seen. Critical for flight safety.',
  'VSBY': 'NWS abbreviation for visibility in weather reports and forecasts.',

  // Locations
  'moriches inlet': 'Inlet on the south shore of Long Island, NY connecting Moriches Bay to the Atlantic.',
  'long island': 'Island extending east from NYC, includes Nassau and Suffolk counties.',
  'manhattan': 'Borough of New York City, center of the NYC metro area.',
  'hudson valley': 'Region along the Hudson River north of NYC.',
  'jersey shore': 'Coastal region of New Jersey along the Atlantic Ocean.',
  'san miguel island': 'Westernmost of California\'s Channel Islands, often referenced in marine forecasts.',
  'central coast': 'California coastal region from San Luis Obispo to Santa Barbara.',
  'santa barbara': 'Coastal city in Southern California, between LA and San Luis Obispo.',
  'sba': 'Abbreviation for Santa Barbara, coastal city in Southern California.',
  'ventura': 'Coastal county between Los Angeles and Santa Barbara.',
  'los angeles basin': 'Low-lying area containing LA and surrounding cities, often traps marine layer.',
  'la county': 'Los Angeles County, most populous county in the US.',
  'san fernando valley': 'Valley north of LA, often warmer than coastal areas.',
  'inland empire': 'Region east of LA including Riverside and San Bernardino, often hot and dry.',
  'high desert': 'Desert region of SoCal at higher elevation (3000+ ft), includes Victorville/Lancaster.',
  'antelope valley': 'Desert valley in northern LA County, known for temperature extremes.',
  'slo': 'Abbreviation for San Luis Obispo, coastal city on California\'s Central Coast.',
  'san luis obispo': 'Coastal city on California\'s Central Coast, often abbreviated as SLO.',
  'point conception': 'Critical coastal boundary where California coastline turns 90°, dividing marine forecast zones.',
  'pt conception': 'Abbreviation for Point Conception, critical coastal boundary where California coastline turns 90°.',
  'coastal waters': 'Ocean areas near the shoreline, typically within 60 miles.',
  'inland areas': 'Regions away from the coast, often with more extreme temperatures.',
  'mountains': 'Elevated terrain that affects local weather patterns.',
  'valleys': 'Low-lying areas between mountains, often trap cold air.',
  'foothills': 'Transitional zone between valleys and mountains.',
};

// Regex patterns for highlighting
export const PATTERNS = {
  // Temperature range - "highs in the 70s", "lows in the upper 40s", etc.
  tempRange: /\b(highs?|lows?|temperatures?)\s+(in the\s+|of\s+)?(lower\s+|mid\s+|upper\s+)?(\d{1,2}0s)(\s+to\s+(the\s+)?(lower\s+|mid\s+|upper\s+)?\d{1,2}0s)?\b/gi,
  // Rainfall amounts - "0.5-1\" rainfall", "1-2 inches of rain", etc.
  rainfall: /\b\d+\.?\d*\s*(-|to)\s*\d+\.?\d*\s*(inch(es)?|"|in)\s*(of\s+)?(rain(fall)?|precip(itation)?|liquid|snow|accumulation)?\b/gi,
  // Degree ranges - "40-50 degrees", "40 to 50 degrees", etc.
  degree: /\b\d{1,3}\s*(-|to)\s*\d{1,3}\s*degrees?\b/gi,
};

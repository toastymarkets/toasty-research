import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { FileText, X, ChevronRight, ChevronDown, ChevronLeft, Plus, Copy, Check, ExternalLink, BookOpen, Maximize2, Newspaper, AlertCircle } from 'lucide-react';
import { useNWSBulletins, formatBulletinTime } from '../../hooks/useNWSBulletins';
import GlassWidget from './GlassWidget';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';
import { getGlossaryForOffice, termAppearsInText } from '../../data/cityGlossaries';

// Meteorological keywords to highlight, grouped by category
// See docs/FORECAST_KEYWORDS.md for full documentation
const WEATHER_KEYWORDS = {
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

// Flatten keywords for lookup
const KEYWORD_MAP = new Map();
Object.entries(WEATHER_KEYWORDS).forEach(([category, keywords]) => {
  keywords.forEach(keyword => KEYWORD_MAP.set(keyword.toLowerCase(), category));
});

// Category colors matching the glassmorphism design
const CATEGORY_COLORS = {
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

// NWS-sourced definitions for meteorological terms
const KEYWORD_DEFINITIONS = {
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

/**
 * Insert discussion text into notes as a blockquote
 */
function insertDiscussionToNotes(text, source = 'NWS Discussion') {
  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'discussion',
      content: {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text }]
            }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'italic' }], text: `— ${source}` }
            ]
          }
        ]
      },
      rawData: { text, source },
    }
  });
  window.dispatchEvent(event);
}

/**
 * NWSDiscussionWidget - Shows NWS Area Forecast Discussion
 * Supports two modes:
 * - Compact: Small card that opens modal on click (default)
 * - Expanded: Inline expanded view that fills the grid area
 */
export default function NWSDiscussionWidget({
  lat,
  lon,
  citySlug,
  forecastOffice,
  loading: externalLoading = false,
  isExpanded = false,
  onToggleExpand = null,
}) {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch bulletins (PNS reports) for the forecast office
  const { latestBulletin, hasFreshBulletin, loading: bulletinsLoading } = useNWSBulletins(
    forecastOffice || discussion?.office,
    true // Always fetch when office is available
  );

  const fetchDiscussion = useCallback(async () => {
    if (!lat || !lon) return;

    const cacheKey = `nws_afd_v2_${citySlug}`;

    // Check cache (30 min for discussions)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setDiscussion(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) { /* ignore */ }

    setLoading(true);

    try {
      // Get grid point to find forecast office
      const pointsRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!pointsRes.ok) throw new Error('Failed to get grid point');

      const pointsData = await pointsRes.json();
      const cwa = pointsData.properties?.cwa;

      if (!cwa) throw new Error('No forecast office found');

      // Get latest AFD
      const afdListRes = await fetch(
        `https://api.weather.gov/products/types/AFD/locations/${cwa}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!afdListRes.ok) throw new Error('Failed to get AFD list');

      const afdList = await afdListRes.json();
      const latestAfd = afdList['@graph']?.[0];

      if (!latestAfd) throw new Error('No AFD available');

      // Get full AFD content
      const afdRes = await fetch(latestAfd['@id'], {
        headers: { 'User-Agent': 'Toasty Research App' }
      });

      if (!afdRes.ok) throw new Error('Failed to get AFD content');

      const afdData = await afdRes.json();
      const productText = afdData.productText || '';

      // Parse the discussion
      const result = parseDiscussion(productText, {
        office: cwa,
        issuanceTime: latestAfd.issuanceTime,
        officeName: afdData.issuingOffice,
      });

      // Cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore */ }

      setDiscussion(result);
      setError(null);
    } catch (err) {
      console.error('[NWSDiscussion] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug, lat, lon]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  if (loading || externalLoading) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size={isExpanded ? 'large' : 'small'}>
        <div className={`flex items-center justify-center h-full animate-pulse ${isExpanded ? 'min-h-[300px]' : ''}`}>
          <div className="w-full h-12 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (error || !discussion) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size={isExpanded ? 'large' : 'small'}>
        <div className={`flex items-center justify-center h-full text-white/40 text-xs ${isExpanded ? 'min-h-[300px]' : ''}`}>
          Unable to load discussion
        </div>
      </GlassWidget>
    );
  }

  // Extract keywords from synopsis, near term, and short term for preview
  const keywords = extractKeywords(
    (discussion.synopsis || '') + ' ' + (discussion.nearTerm || '') + ' ' + (discussion.shortTerm || '')
  );

  // Get synopsis excerpt for preview
  const synopsisExcerpt = extractSynopsisExcerpt(discussion.synopsis);

  // Handle click - either toggle expansion or open modal
  const handleClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  };

  // Render expanded inline view
  if (isExpanded) {
    return (
      <ExpandedDiscussionInline
        discussion={discussion}
        bulletin={latestBulletin}
        bulletinsLoading={bulletinsLoading}
        onCollapse={onToggleExpand}
      />
    );
  }

  // Render compact widget
  return (
    <>
      <GlassWidget
        title="DISCUSSION"
        icon={FileText}
        size="small"
        onClick={handleClick}
        className="cursor-pointer"
        headerRight={
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full hover:bg-blue-500/30 transition-colors whitespace-nowrap">
              More
              <ChevronRight className="w-3 h-3" />
            </span>
            {onToggleExpand && (
              <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
            )}
          </div>
        }
      >
        <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
          {/* Synopsis excerpt */}
          {synopsisExcerpt ? (
            <p className="text-[11px] text-white/70 leading-relaxed line-clamp-2">
              {synopsisExcerpt}
            </p>
          ) : (
            <p className="text-[11px] text-white/50 italic">
              Tap to view forecast discussion
            </p>
          )}

          {/* Keyword chips - wrapped, limited by widget height */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {keywords.map((kw, i) => {
                const baseColors = CATEGORY_COLORS[kw.category]?.replace('hover:bg-', '') || 'bg-white/20 text-white/80';
                return (
                  <span
                    key={i}
                    className={`${baseColors} px-2 py-0.5 rounded-full text-[10px] font-medium`}
                  >
                    {kw.text}
                  </span>
                );
              })}
            </div>
          )}

          {/* Footer - office & relative time */}
          <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
            <span className="font-medium">NWS {discussion.office}</span>
            <span>{formatRelativeTime(discussion.issuanceTime)}</span>
          </div>
        </div>
      </GlassWidget>

      {/* Detail Modal - only when not using inline expansion */}
      {isModalOpen && !onToggleExpand && (
        <DiscussionModal
          discussion={discussion}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

NWSDiscussionWidget.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  citySlug: PropTypes.string.isRequired,
  forecastOffice: PropTypes.string,
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * Parse AFD text into sections
 * Handles both standard format (.SYNOPSIS, .NEAR TERM, etc.) and
 * alternative format (.KEY MESSAGES, .DISCUSSION) used by some offices like Chicago
 * Section terminators: && or next .SECTION header
 */
function parseDiscussion(text, meta) {
  const sections = {};

  // Common section terminator pattern: && or next section header
  const sectionEnd = '(?=&&|\\n\\n\\.[A-Z])';

  // Extract synopsis (standard format)
  const synopsisMatch = text.match(new RegExp('\\.SYNOPSIS\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (synopsisMatch) {
    sections.synopsis = cleanText(synopsisMatch[1]);
  }

  // Extract key messages (alternative format - treat as synopsis)
  if (!sections.synopsis) {
    const keyMessagesMatch = text.match(new RegExp('\\.KEY MESSAGES\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
    if (keyMessagesMatch) {
      sections.synopsis = cleanText(keyMessagesMatch[1]);
    }
  }

  // Extract near term
  const nearTermMatch = text.match(new RegExp('\\.NEAR TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (nearTermMatch) {
    sections.nearTerm = cleanText(nearTermMatch[1]);
  }

  // Extract short term
  const shortTermMatch = text.match(new RegExp('\\.SHORT TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (shortTermMatch) {
    sections.shortTerm = cleanText(shortTermMatch[1]);
  }

  // Extract discussion (alternative format - some offices use this instead of near/short term)
  if (!sections.nearTerm && !sections.shortTerm) {
    const discussionMatch = text.match(new RegExp('\\.DISCUSSION\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
    if (discussionMatch) {
      sections.nearTerm = cleanText(discussionMatch[1]);
    }
  }

  // Extract long term
  const longTermMatch = text.match(new RegExp('\\.LONG TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (longTermMatch) {
    sections.longTerm = cleanText(longTermMatch[1]);
  }

  // Extract aviation
  const aviationMatch = text.match(new RegExp('\\.AVIATION[^.]*\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (aviationMatch) {
    sections.aviation = cleanText(aviationMatch[1]);
  }

  // Extract marine
  const marineMatch = text.match(new RegExp('\\.MARINE[^.]*\\.{3}\\s*([\\s\\S]*?)' + sectionEnd, 'i'));
  if (marineMatch) {
    sections.marine = cleanText(marineMatch[1]);
  }

  return {
    ...meta,
    ...sections,
    fullText: text,
  };
}

/**
 * Clean up text formatting
 */
function cleanText(text) {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format issuance time
 */
function formatTime(isoTime) {
  if (!isoTime) return '';
  const date = new Date(isoTime);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "12m ago", "2h ago")
 */
function formatRelativeTime(isoTime) {
  if (!isoTime) return '';
  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Extract a clean synopsis excerpt for preview
 * Returns first 1-2 sentences, max ~120 chars
 */
function extractSynopsisExcerpt(synopsis) {
  if (!synopsis) return null;

  // Clean up and normalize whitespace
  let text = synopsis.trim().replace(/\s+/g, ' ');

  // Remove common NWS prefixes:
  // - Date/time stamps like "03/242 AM." or "12/1045 PM."
  // - Forecaster signatures at start
  text = text.replace(/^\d{1,2}\/\d{3,4}\s*(AM|PM)\.?\s*/i, '');
  text = text.replace(/^\.{3}\s*/, ''); // Remove leading ellipsis

  // Try to get first sentence or two
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    // Get first sentence, or first two if first is short
    let excerpt = sentences[0].trim();
    if (excerpt.length < 60 && sentences.length > 1) {
      excerpt += ' ' + sentences[1].trim();
    }

    // Truncate if too long
    if (excerpt.length > 120) {
      excerpt = excerpt.slice(0, 117).trim() + '...';
    }
    return excerpt;
  }

  // Fallback: just truncate
  if (text.length > 120) {
    return text.slice(0, 117).trim() + '...';
  }
  return text;
}

/**
 * HighlightedKeyword - Clickable keyword with definition popup
 * Click: shows definition with option to add to notes
 */
function HighlightedKeyword({ text, category, office }) {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const colorClass = CATEGORY_COLORS[category] || 'bg-white/20 text-white/80';
  const definition = KEYWORD_DEFINITIONS[text.toLowerCase()];

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  const handleKeywordClick = (e) => {
    e.stopPropagation();
    if (definition) {
      setShowPopup(!showPopup);
    } else {
      // No definition, add directly to notes
      insertDiscussionToNotes(text, `NWS ${office}`);
    }
  };

  const handleAddToNotes = (e) => {
    e.stopPropagation();
    insertDiscussionToNotes(text, `NWS ${office}`);
    setShowPopup(false);
  };

  return (
    <span className="relative inline">
      <button
        ref={buttonRef}
        onClick={handleKeywordClick}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer transition-colors`}
      >
        {text}
      </button>
      {showPopup && definition && (
        <span
          ref={popupRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 text-[11px] bg-black/95 text-white rounded-lg shadow-xl z-50 leading-relaxed border border-white/10"
        >
          <span className="font-semibold text-white block mb-1.5 capitalize">{text}</span>
          <span className="text-white/80 block mb-3">{definition}</span>
          <button
            onClick={handleAddToNotes}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add to notes
          </button>
        </span>
      )}
    </span>
  );
}

/**
 * Extract key forecast keywords from text for widget preview
 * Prioritizes: temp ranges > precipitation > temperature keywords
 */
function extractKeywords(text) {
  if (!text) return [];

  const tempRanges = [];
  const tempKeywordsFound = [];
  const precipKeywordsFound = [];

  // Temperature range pattern - matches "highs in the 70s", "lows in the upper 40s", etc.
  const tempRangePattern = /\b(highs?|lows?|temperatures?)\s+(in the\s+|of\s+)?(lower\s+|mid\s+|upper\s+)?(\d{1,2}0s)(\s+to\s+(the\s+)?(lower\s+|mid\s+|upper\s+)?\d{1,2}0s)?\b/gi;

  let match;
  while ((match = tempRangePattern.exec(text)) !== null) {
    tempRanges.push({
      text: match[0].toLowerCase(),
      category: 'tempRange',
    });
  }

  // Check for static temperature keywords (warm, cold, warmer, cooler, etc.)
  const tempKeywords = WEATHER_KEYWORDS.temperature.sort((a, b) => b.length - a.length);
  const tempPattern = new RegExp(
    `\\b(${tempKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  while ((match = tempPattern.exec(text)) !== null) {
    const matchText = match[0].toLowerCase();
    if (!tempKeywordsFound.some(r => r.text === matchText)) {
      tempKeywordsFound.push({
        text: matchText,
        category: 'temperature',
      });
    }
  }

  // Check for precipitation keywords
  const precipKeywords = WEATHER_KEYWORDS.precipitation.sort((a, b) => b.length - a.length);
  const precipPattern = new RegExp(
    `\\b(${precipKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  while ((match = precipPattern.exec(text)) !== null) {
    const matchText = match[0].toLowerCase();
    if (!precipKeywordsFound.some(r => r.text === matchText)) {
      precipKeywordsFound.push({
        text: matchText,
        category: 'precipitation',
      });
    }
  }

  // Check for wind keywords
  const windKeywordsFound = [];
  const windKeywords = WEATHER_KEYWORDS.wind.sort((a, b) => b.length - a.length);
  const windPattern = new RegExp(
    `\\b(${windKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  while ((match = windPattern.exec(text)) !== null) {
    const matchText = match[0].toLowerCase();
    if (!windKeywordsFound.some(r => r.text === matchText)) {
      windKeywordsFound.push({
        text: matchText,
        category: 'wind',
      });
    }
  }

  // Build balanced results: temp range, temp keyword, wind, then precipitation
  const results = [];

  // Add first temp range
  if (tempRanges.length > 0) {
    results.push(tempRanges[0]);
  }

  // Add first temperature keyword
  if (tempKeywordsFound.length > 0) {
    results.push(tempKeywordsFound[0]);
  }

  // Add first wind keyword (prioritize longer phrases like "gusty southerly winds")
  if (windKeywordsFound.length > 0) {
    results.push(windKeywordsFound[0]);
  }

  // Fill remaining slots with precipitation, then others
  const remaining = [...precipKeywordsFound, ...tempRanges.slice(1), ...tempKeywordsFound.slice(1), ...windKeywordsFound.slice(1)];
  for (const item of remaining) {
    if (results.length >= 4) break;
    if (!results.some(r => r.text === item.text)) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Parse text and highlight meteorological keywords, temperature ranges, rainfall amounts, and degree ranges
 */
function parseAndHighlight(text, office) {
  if (!text) return null;

  // Build regex pattern from all keywords (sorted by length desc to match longer phrases first)
  const allKeywords = Array.from(KEYWORD_MAP.keys()).sort((a, b) => b.length - a.length);
  const keywordPattern = `\\b(${allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`;

  // Temperature range pattern - matches various formats:
  // "highs in the 70s", "lows in the upper 40s", "highs in the 70s to the lower 80s"
  // "temperatures in the mid 60s", "highs of 75 to 80"
  const tempRangePattern = `\\b(highs?|lows?|temperatures?)\\s+(in the\\s+|of\\s+)?(lower\\s+|mid\\s+|upper\\s+)?(\\d{1,2}0s)(\\s+to\\s+(the\\s+)?(lower\\s+|mid\\s+|upper\\s+)?\\d{1,2}0s)?\\b`;

  // Rainfall amount pattern - matches "0.5-1\" rainfall", "1-2 inches of rain", etc.
  const rainfallPattern = `\\b\\d+\\.?\\d*\\s*(-|to)\\s*\\d+\\.?\\d*\\s*(inch(es)?|"|in)\\s*(of\\s+)?(rain(fall)?|precip(itation)?|liquid|snow|accumulation)?\\b`;

  // Degree range pattern - matches "40-50 degrees", "40 to 50 degrees", etc.
  const degreePattern = `\\b\\d{1,3}\\s*(-|to)\\s*\\d{1,3}\\s*degrees?\\b`;

  // Combined pattern - longer patterns first to avoid partial matches, then keywords
  const combinedPattern = new RegExp(`(${tempRangePattern})|(${rainfallPattern})|(${degreePattern})|(${keywordPattern})`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];

    // Determine category by testing which pattern matched
    let category;
    if (/^(highs?|lows?|temperatures?)\s+/i.test(matchedText)) {
      category = 'tempRange';
    } else if (/\d+\.?\d*\s*(-|to)\s*\d+\.?\d*\s*(inch(es)?|"|in)/i.test(matchedText)) {
      category = 'rainfallAmount';
    } else if (/\d{1,3}\s*(-|to)\s*\d{1,3}\s*degrees?/i.test(matchedText)) {
      category = 'degreeRange';
    } else {
      category = KEYWORD_MAP.get(matchedText.toLowerCase());
    }

    parts.push(
      <HighlightedKeyword
        key={`${match.index}-${matchedText}`}
        text={matchedText}
        category={category}
        office={office}
      />
    );

    lastIndex = combinedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// Category colors for glossary
const GLOSSARY_CATEGORY_COLORS = {
  locations: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30',
  phenomena: 'bg-teal-500/30 text-teal-300 border-teal-500/30',
  technical: 'bg-purple-500/30 text-purple-300 border-purple-500/30',
};

const GLOSSARY_CATEGORY_LABELS = {
  locations: 'Locations',
  phenomena: 'Weather Phenomena',
  technical: 'Technical Terms',
};

/**
 * GlossaryContent - City-specific glossary of meteorological terms
 */
function GlossaryContent({ office, fullText }) {
  const glossary = getGlossaryForOffice(office);

  if (!glossary) {
    return (
      <div className="text-white/50 text-sm text-center py-8">
        No glossary available for this forecast office.
      </div>
    );
  }

  // Combine all text for checking if terms appear
  const allText = fullText || '';

  return (
    <div className="space-y-6">
      {Object.entries(glossary).map(([category, terms]) => (
        <div key={category}>
          {/* Category header */}
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-white/50" />
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {GLOSSARY_CATEGORY_LABELS[category] || category}
            </h4>
          </div>

          {/* Terms list */}
          <div className="space-y-3">
            {Object.entries(terms)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([term, definition]) => {
                const appearsInDiscussion = termAppearsInText(term, allText);
                const colorClass = GLOSSARY_CATEGORY_COLORS[category] || 'bg-white/10 text-white/70';

                return (
                  <div
                    key={term}
                    className={`p-3 rounded-lg border ${
                      appearsInDiscussion
                        ? 'bg-white/5 border-white/20'
                        : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`text-sm font-medium capitalize ${
                          appearsInDiscussion ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {term}
                      </span>
                      {appearsInDiscussion && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 whitespace-nowrap">
                          in discussion
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {definition}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DiscussionModal - Full forecast discussion with keyword highlighting
 */
function DiscussionModal({ discussion, onClose }) {
  const [activeSection, setActiveSection] = useState('synopsis');
  const [selectionPopup, setSelectionPopup] = useState(null);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  // Combine all discussion text for glossary term detection
  const fullDiscussionText = [
    discussion.synopsis,
    discussion.nearTerm,
    discussion.shortTerm,
    discussion.longTerm,
    discussion.aviation,
    discussion.marine,
  ].filter(Boolean).join(' ');

  // Check if glossary exists for this office
  const hasGlossary = !!getGlossaryForOffice(discussion.office);

  const sections = [
    { id: 'synopsis', label: 'Synopsis', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near Term', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short Term', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long Term', content: discussion.longTerm },
    { id: 'aviation', label: 'Aviation', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
    ...(hasGlossary ? [{ id: 'glossary', label: 'Glossary', isGlossary: true }] : []),
  ].filter(s => s.content || s.isGlossary);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSelectionPopup({
          text: selection.toString().trim(),
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top - 10,
        });
      }
    } else {
      setSelectionPopup(null);
    }
  }, []);

  // Handle adding selection to notes
  const handleAddSelectionToNotes = () => {
    if (selectionPopup?.text) {
      insertDiscussionToNotes(selectionPopup.text, `NWS ${discussion.office}`);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Handle copy all
  const handleCopyAll = async () => {
    const activeContent = sections.find(s => s.id === activeSection)?.content;
    if (activeContent) {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hide popup on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectionPopup(null);
        }
      }, 100);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Forecast Discussion</h2>
                <p className="text-sm text-white/60">
                  NWS {discussion.office} • {formatTime(discussion.issuanceTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://forecast.weather.gov/product.php?site=${discussion.office}&issuedby=${discussion.office}&product=AFD`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="View on NWS"
                >
                  <ExternalLink className="w-4 h-4 text-white/70" />
                </a>
                <button
                  onClick={handleCopyAll}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy section"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/70" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${activeSection === section.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="relative overflow-y-auto max-h-[55vh] p-4"
            onMouseUp={handleMouseUp}
          >
            {/* Selection popup */}
            {selectionPopup && (
              <button
                onClick={handleAddSelectionToNotes}
                className="absolute z-50 flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg transition-colors"
                style={{
                  left: `${selectionPopup.x}px`,
                  top: `${selectionPopup.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <Plus className="w-3 h-3" />
                Add to notes
              </button>
            )}

            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {section.label}
                </h3>
                {section.isGlossary ? (
                  <GlossaryContent
                    office={discussion.office}
                    fullText={fullDiscussionText}
                  />
                ) : (
                  <div className="text-sm text-white/70 leading-relaxed">
                    {parseAndHighlight(section.content, discussion.office)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Click highlighted terms or select text to add to notes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

DiscussionModal.propTypes = {
  discussion: PropTypes.shape({
    office: PropTypes.string,
    issuanceTime: PropTypes.string,
    synopsis: PropTypes.string,
    nearTerm: PropTypes.string,
    shortTerm: PropTypes.string,
    longTerm: PropTypes.string,
    aviation: PropTypes.string,
    marine: PropTypes.string,
    fullText: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * ExpandedDiscussionInline - Full forecast discussion rendered inline (not as modal)
 * Used when the widget is expanded in the grid
 */
function ExpandedDiscussionInline({ discussion, bulletin, bulletinsLoading, onCollapse }) {
  const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' | 'reports'
  const [activeSection, setActiveSection] = useState('synopsis');
  const [selectionPopup, setSelectionPopup] = useState(null);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  // Combine all discussion text for glossary term detection
  const fullDiscussionText = [
    discussion.synopsis,
    discussion.nearTerm,
    discussion.shortTerm,
    discussion.longTerm,
    discussion.aviation,
    discussion.marine,
  ].filter(Boolean).join(' ');

  // Check if glossary exists for this office
  const hasGlossary = !!getGlossaryForOffice(discussion.office);

  const sections = [
    { id: 'synopsis', label: 'Synopsis', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near Term', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short Term', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long Term', content: discussion.longTerm },
    { id: 'aviation', label: 'Aviation', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
    ...(hasGlossary ? [{ id: 'glossary', label: 'Glossary', isGlossary: true }] : []),
  ].filter(s => s.content || s.isGlossary);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSelectionPopup({
          text: selection.toString().trim(),
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top - 10,
        });
      }
    } else {
      setSelectionPopup(null);
    }
  }, []);

  // Handle adding selection to notes
  const handleAddSelectionToNotes = () => {
    if (selectionPopup?.text) {
      insertDiscussionToNotes(selectionPopup.text, `NWS ${discussion.office}`);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Handle copy all
  const handleCopyAll = async () => {
    const activeContent = sections.find(s => s.id === activeSection)?.content;
    if (activeContent) {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hide popup on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectionPopup(null);
        }
      }, 100);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="glass-widget h-full flex flex-col rounded-2xl overflow-hidden animate-[glass-scale-in_200ms_ease-out]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'discussion' ? (
              <FileText className="w-4 h-4 text-white/50" />
            ) : (
              <Newspaper className="w-4 h-4 text-white/50" />
            )}
            <div>
              <h2 className="text-sm font-semibold text-white">
                {activeTab === 'discussion' ? 'Forecast Discussion' : 'NWS Reports'}
              </h2>
              <p className="text-[10px] text-white/50">
                {activeTab === 'discussion' ? (
                  <>NWS {discussion.office} • {formatTime(discussion.issuanceTime)}</>
                ) : bulletin ? (
                  <>NWS {discussion.office} • {formatBulletinTime(bulletin.issuanceTime)}</>
                ) : (
                  <>NWS {discussion.office}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={activeTab === 'discussion'
                ? `https://forecast.weather.gov/product.php?site=${discussion.office}&issuedby=${discussion.office}&product=AFD`
                : `https://forecast.weather.gov/product.php?site=${discussion.office}&issuedby=${discussion.office}&product=PNS`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="View on NWS"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/70" />
            </a>
            {activeTab === 'discussion' && (
              <button
                onClick={handleCopyAll}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Copy section"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/70" />
                )}
              </button>
            )}
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Collapse"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
              </button>
            )}
          </div>
        </div>

        {/* Top-level tabs: Discussion | Reports */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'discussion'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Discussion
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Reports
            {bulletin && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-400" title="New report available" />
            )}
          </button>
        </div>

        {/* Section tabs (only for Discussion tab) */}
        {activeTab === 'discussion' && (
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all
                  ${activeSection === section.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }
                `}
              >
                {section.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative flex-1 overflow-y-auto p-4"
        onMouseUp={activeTab === 'discussion' ? handleMouseUp : undefined}
      >
        {/* Discussion content */}
        {activeTab === 'discussion' && (
          <>
            {/* Selection popup */}
            {selectionPopup && (
              <button
                onClick={handleAddSelectionToNotes}
                className="absolute z-50 flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg transition-colors"
                style={{
                  left: `${selectionPopup.x}px`,
                  top: `${selectionPopup.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <Plus className="w-3 h-3" />
                Add to notes
              </button>
            )}

            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                {section.isGlossary ? (
                  <GlossaryContent
                    office={discussion.office}
                    fullText={fullDiscussionText}
                  />
                ) : (
                  <div className="text-sm text-white/70 leading-relaxed">
                    {parseAndHighlight(section.content, discussion.office)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Reports/Bulletins content */}
        {activeTab === 'reports' && (
          <BulletinContent
            bulletin={bulletin}
            loading={bulletinsLoading}
            office={discussion.office}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex-shrink-0">
        <p className="text-[9px] text-white/40 text-center">
          {activeTab === 'discussion'
            ? 'Click highlighted terms or select text to add to notes'
            : 'Public Information Statements contain record weather data and climate summaries'
          }
        </p>
      </div>
    </div>
  );
}

ExpandedDiscussionInline.propTypes = {
  discussion: PropTypes.shape({
    office: PropTypes.string,
    issuanceTime: PropTypes.string,
    synopsis: PropTypes.string,
    nearTerm: PropTypes.string,
    shortTerm: PropTypes.string,
    longTerm: PropTypes.string,
    aviation: PropTypes.string,
    marine: PropTypes.string,
    fullText: PropTypes.string,
  }).isRequired,
  bulletin: PropTypes.shape({
    id: PropTypes.string,
    issuanceTime: PropTypes.string,
    headlines: PropTypes.arrayOf(PropTypes.string),
    body: PropTypes.string,
    office: PropTypes.string,
    timestamp: PropTypes.string,
  }),
  bulletinsLoading: PropTypes.bool,
  onCollapse: PropTypes.func,
};

/**
 * BulletinContent - Displays NWS Public Information Statement content
 */
function BulletinContent({ bulletin, loading, office }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Newspaper className="w-8 h-8 text-white/20 mb-2" />
        <p className="text-sm text-white/50">No recent reports available</p>
        <p className="text-xs text-white/30 mt-1">
          Public Information Statements are issued for notable weather events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headlines */}
      {bulletin.headlines && bulletin.headlines.length > 0 && (
        <div className="space-y-2">
          {bulletin.headlines.map((headline, idx) => (
            <div
              key={idx}
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300 font-medium leading-snug">
                  {headline}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body text - scrollable with max height */}
      {bulletin.body && (
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {parseAndHighlight(bulletin.body, office)}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {bulletin.timestamp && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-[10px] text-white/40">
            Issued: {bulletin.timestamp}
          </p>
        </div>
      )}
    </div>
  );
}

BulletinContent.propTypes = {
  bulletin: PropTypes.shape({
    headlines: PropTypes.arrayOf(PropTypes.string),
    body: PropTypes.string,
    timestamp: PropTypes.string,
  }),
  loading: PropTypes.bool,
  office: PropTypes.string,
};

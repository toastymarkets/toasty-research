/**
 * City-specific glossary definitions for NWS forecast discussions
 * Organized by NWS office code
 *
 * Categories:
 * - locations: Geographic features and place names
 * - phenomena: Weather phenomena specific to the region
 * - technical: Technical terms commonly used by this office
 */

export const CITY_GLOSSARIES = {
  // Los Angeles / Oxnard
  LOX: {
    locations: {
      'point conception': 'Critical coastal boundary where California\'s coastline turns 90° from north-south to east-west. Divides NWS marine forecast zones and marks where Pacific storms often intensify or weaken.',
      'santa barbara': 'Coastal county north of Los Angeles. Often the first area to receive incoming Pacific storms due to its position relative to Point Conception.',
      'ventura': 'Coastal county between Santa Barbara and Los Angeles. Weather often transitions between Central Coast and LA Basin patterns here.',
      'los angeles basin': 'Low-lying area surrounded by mountains where most of LA County\'s population lives. Can trap marine air and pollution.',
      'san fernando valley': 'Large valley north of downtown LA, separated by the Santa Monica Mountains. Often 10-15°F warmer than coastal areas.',
      'antelope valley': 'High desert valley in northern LA County. Experiences extreme temperature swings and strong winds.',
      'catalina': 'Santa Catalina Island, 22 miles offshore. Its position affects marine layer behavior and local wind patterns.',
      'channel islands': 'Chain of islands off the Southern California coast. Influence marine weather patterns and wave conditions.',
      'san gabriel': 'Mountain range north of LA Basin. Blocks desert air and enhances orographic precipitation.',
      'central coast': 'Coastal region from Point Conception northward. Has distinctly different weather from Southern California.',
    },
    phenomena: {
      'santa ana': 'Hot, dry winds that blow from inland deserts toward the coast, typically in fall/winter. Caused by high pressure over the Great Basin. Can cause extreme fire danger, low humidity (under 10%), and temperatures 15-30°F above normal.',
      'marine layer': 'Low stratus clouds and fog that form over cool ocean water and push inland, especially May-September. Usually burns off by afternoon but can persist ("June Gloom").',
      'catalina eddy': 'Counter-clockwise wind circulation that forms in the lee of Catalina Island. Can trap and deepen marine layer clouds over the LA Basin for days.',
      'offshore flow': 'Winds blowing from land toward the ocean. Associated with warmer, drier conditions and reduced marine influence.',
      'onshore flow': 'Winds blowing from ocean toward land. Brings cooler, more humid marine air and often low clouds.',
      'sundowner': 'Strong, hot, downslope winds that occur in the evening along the Santa Barbara coast. Can rapidly increase fire danger after sunset.',
    },
    technical: {
      'eddy circulation': 'Rotating wind pattern caused by terrain features. Common near Catalina Island and Point Conception.',
      'coastal trough': 'Elongated low pressure along the coast that can enhance onshore flow and marine layer.',
    },
  },

  // Chicago / Romeoville
  LOT: {
    locations: {
      'lake michigan': 'One of the five Great Lakes, bordering Chicago to the east. Major influence on local weather through lake effect precipitation and temperature moderation.',
      'lakefront': 'Area immediately adjacent to Lake Michigan. Often 5-15°F cooler in summer and warmer in winter than inland areas.',
      'wisconsin': 'State to the north. Weather systems often track through Wisconsin before affecting Chicago.',
      'indiana': 'State to the southeast. Important for tracking approaching weather systems.',
      'i-88': 'East-west corridor through northern Illinois. Often used as a boundary in forecasts.',
      'i-90': 'Major highway corridor. Weather conditions can vary significantly along its length.',
    },
    phenomena: {
      'lake effect': 'Enhanced snowfall that occurs when cold air passes over the warmer waters of Lake Michigan. Can produce intense, localized snow bands with rates of 2-3 inches per hour.',
      'lake enhanced': 'Precipitation that is intensified (but not caused) by moisture from Lake Michigan.',
      'lake breeze': 'Cool wind blowing from Lake Michigan toward land during warm afternoons. Can cause dramatic temperature drops near the lakefront.',
      'clipper': 'Fast-moving low pressure system originating from Alberta, Canada. Brings light snow (1-3 inches) and rapid temperature drops.',
      'alberta clipper': 'Same as clipper - named for the Canadian province where these systems often originate.',
    },
    technical: {
      'fetch': 'Distance wind travels over water. Longer fetch over Lake Michigan means more moisture pickup and stronger lake effect.',
      'warm core system': 'Low pressure with warmest air at its center, common with lake effect events.',
    },
  },

  // New York
  OKX: {
    locations: {
      'long island': 'Island extending 118 miles east of Manhattan. Creates distinct weather zones between North Shore, South Shore, and the East End.',
      'hudson valley': 'Valley of the Hudson River north of NYC. Can channel cold air southward and experiences different weather than the coast.',
      'manhattan': 'Core of NYC. Urban heat island effect makes it several degrees warmer than surrounding areas.',
      'brooklyn': 'Borough on western Long Island. Coastal location moderates temperatures.',
      'queens': 'Borough on western Long Island. Mix of urban and suburban influences on local weather.',
      'bronx': 'Northernmost NYC borough. More continental climate influence than coastal boroughs.',
      'staten island': 'Borough southwest of Manhattan. Surrounded by water, moderating temperature extremes.',
      'connecticut': 'State to the northeast. Important for tracking approaching weather systems.',
      'new jersey': 'State to the west and south. Weather often arrives from this direction.',
    },
    phenomena: {
      'coastal storm': 'Low pressure system that tracks along or near the Atlantic coast. Can bring heavy precipitation and strong winds.',
      'noreaster': 'Powerful coastal storm with northeast winds. Can bring heavy snow, rain, coastal flooding, and wind damage.',
      'backdoor cold front': 'Cold front that approaches from the northeast (opposite of typical direction). Brings sudden cooling to coastal areas.',
      'sea breeze': 'Afternoon wind from ocean to land. Can cause dramatic temperature drops near the coast.',
    },
    technical: {
      'miller a': 'Coastal storm type that forms over the Gulf of Mexico and tracks up the East Coast.',
      'miller b': 'Coastal storm type that forms near the Carolina coast as energy transfers from an inland system.',
      'benchmark': 'Reference point for coastal storm tracks. Determines snow vs. rain distribution.',
    },
  },

  // Denver / Boulder
  BOU: {
    locations: {
      'front range': 'Eastern edge of the Rocky Mountains from Wyoming to New Mexico. Where the mountains meet the plains, creating dramatic weather transitions.',
      'palmer divide': 'East-west ridge south of Denver separating the South Platte and Arkansas River drainages. Often a boundary for precipitation types.',
      'foothills': 'Transition zone between plains and mountains, typically 6,000-8,000 feet elevation. First area to receive upslope precipitation.',
      'boulder': 'City at the base of the Flatirons. Experiences intense downslope windstorms.',
      'fort collins': 'City north of Denver. Often experiences different weather due to Cheyenne Ridge influence.',
      'i-25': 'North-south highway corridor along the Front Range. Major reference for forecast boundaries.',
      'i-70': 'East-west highway crossing the Continental Divide. Critical mountain travel corridor.',
      'continental divide': 'Mountain crest separating Pacific and Atlantic watersheds. Major barrier to weather systems.',
      'denver metro': 'Greater Denver metropolitan area. Urban heat island affects local temperatures.',
    },
    phenomena: {
      'upslope': 'East winds that push moist air up the mountain slopes. Primary mechanism for Front Range precipitation, especially snow.',
      'downslope': 'West winds descending from the mountains. Causes rapid warming and drying (chinook conditions).',
      'chinook': 'Warm, dry wind descending the eastern slopes of the Rockies. Can raise temperatures 30-50°F in hours.',
      'dcvz': 'Denver Cyclone Vortex Zone - mesoscale circulation that can enhance or suppress precipitation over metro Denver.',
      'denver convergence zone': 'Area where different wind flows meet near Denver, often enhancing precipitation.',
      'bora': 'Strong, cold downslope wind. Can cause dangerous wind gusts along the foothills.',
    },
    technical: {
      'cap': 'Temperature inversion that suppresses storm development. Common over the plains in summer.',
      'dendritic zone': 'Temperature range (-12°C to -18°C) where snow crystals form the classic six-armed shape. Produces fluffy, high-ratio snow.',
    },
  },

  // Austin / San Antonio
  EWX: {
    locations: {
      'hill country': 'Scenic region of rolling hills west and north of Austin/San Antonio. Higher elevation creates cooler temperatures and enhanced rainfall.',
      'edwards plateau': 'Limestone plateau underlying the Hill Country. Affects drainage patterns and flash flood potential.',
      'rio grande': 'River forming the Texas-Mexico border. Southern boundary of forecast area with distinct climate.',
      'south central texas': 'NWS forecast region covering Austin, San Antonio, and surrounding areas.',
      'balcones': 'Escarpment (fault line) running through Austin and San Antonio. Marks boundary between Hill Country and Coastal Plains.',
      'san antonio': 'Major city in the forecast area. Urban heat island and proximity to Gulf influence local weather.',
      'i-35': 'Major north-south highway corridor. Often used as forecast boundary.',
      'i-10': 'Major east-west highway. Connects San Antonio to Houston and El Paso.',
      'guadalupe': 'River and county in the region. Important for flood forecasting.',
    },
    phenomena: {
      'return flow': 'Southerly winds bringing warm, moist air from the Gulf of Mexico back into Texas after a cold front passage. Signals warming and increasing humidity.',
      'dry line': 'Boundary between moist Gulf air and dry desert air. Common trigger for severe thunderstorms in spring.',
      'sea breeze': 'Gulf breeze that can penetrate inland to Austin/San Antonio during summer, bringing brief cooling.',
      'flash flood': 'Rapid flooding from intense rainfall, especially dangerous in Hill Country canyons and low-water crossings.',
    },
    technical: {
      'cap': 'Temperature inversion that suppresses thunderstorm development. When it breaks, explosive storm development can occur.',
      'outflow boundary': 'Cool air spreading from thunderstorm downdrafts. Can trigger new storms.',
    },
  },

  // Miami / South Florida
  MFL: {
    locations: {
      'everglades': 'Vast wetland ecosystem in South Florida. Affects local weather through moisture and temperature moderation.',
      'florida keys': 'Island chain extending from mainland Florida. Maritime climate with warm, stable temperatures.',
      'keys': 'Shortened form of Florida Keys.',
      'gulf stream': 'Warm ocean current flowing north along Florida\'s east coast. Major influence on coastal temperatures and storm development.',
      'biscayne': 'Biscayne Bay area between Miami and Miami Beach. Open water moderates local temperatures.',
      'palm beach': 'County in the northern part of the South Florida forecast area.',
      'broward': 'County between Palm Beach and Miami-Dade. Fort Lauderdale is the county seat.',
      'miami-dade': 'Southernmost major county on Florida\'s east coast. Contains the city of Miami.',
      'lake okeechobee': 'Large freshwater lake in central-south Florida. Can enhance or suppress precipitation depending on wind direction.',
    },
    phenomena: {
      'sea breeze': 'Afternoon wind from ocean to land. A daily occurrence in South Florida that can trigger afternoon thunderstorms.',
      'land breeze': 'Nighttime wind from land to ocean. Weaker than sea breeze but can push storms offshore.',
      'trade winds': 'Persistent easterly winds in the tropics. Provide steady weather patterns when dominant.',
      'tropical wave': 'Disturbance in the tropical easterlies that can enhance showers or develop into a tropical system.',
      'saharan air layer': 'Dry, dusty air from Africa that suppresses tropical development and creates hazy conditions.',
    },
    technical: {
      'mjo': 'Madden-Julian Oscillation - tropical pattern affecting storminess on 30-60 day cycles.',
      'invest': 'Area being investigated for possible tropical cyclone development.',
    },
  },
};

/**
 * Get glossary for a specific NWS office
 * @param {string} office - NWS office code (e.g., 'LOX', 'LOT')
 * @returns {object|null} - Glossary object with categories, or null if not found
 */
export function getGlossaryForOffice(office) {
  return CITY_GLOSSARIES[office?.toUpperCase()] || null;
}

/**
 * Get all glossary terms as a flat array for a specific office
 * @param {string} office - NWS office code
 * @returns {Array} - Array of {term, definition, category} objects
 */
export function getFlatGlossary(office) {
  const glossary = getGlossaryForOffice(office);
  if (!glossary) return [];

  const terms = [];
  for (const [category, items] of Object.entries(glossary)) {
    for (const [term, definition] of Object.entries(items)) {
      terms.push({ term, definition, category });
    }
  }
  return terms.sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Check if a term appears in text (case-insensitive)
 * @param {string} term - Term to search for
 * @param {string} text - Text to search in
 * @returns {boolean}
 */
export function termAppearsInText(term, text) {
  if (!term || !text) return false;
  const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

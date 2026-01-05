import PropTypes from 'prop-types';
import { X, CloudRain, Droplets } from 'lucide-react';

/**
 * RainHistoryModal - Shows monthly climate normals for precipitation
 * Displays 30-year average (1991-2020) from NOAA Climate Normals
 */
export default function RainHistoryModal({
  isOpen,
  onClose,
  cityName,
  monthlyNormals = [],
  annualNormal,
  stationName,
}) {
  if (!isOpen) return null;

  // Group months into seasons for display
  const winter = monthlyNormals.filter(m => [12, 1, 2].includes(m.month));
  const spring = monthlyNormals.filter(m => [3, 4, 5].includes(m.month));
  const summer = monthlyNormals.filter(m => [6, 7, 8].includes(m.month));
  const fall = monthlyNormals.filter(m => [9, 10, 11].includes(m.month));

  // Calculate seasonal totals
  const seasonTotals = {
    winter: winter.reduce((sum, m) => sum + m.precipitation, 0),
    spring: spring.reduce((sum, m) => sum + m.precipitation, 0),
    summer: summer.reduce((sum, m) => sum + m.precipitation, 0),
    fall: fall.reduce((sum, m) => sum + m.precipitation, 0),
  };

  // Find the wettest month
  const wettestMonth = monthlyNormals.reduce((max, m) =>
    m.precipitation > max.precipitation ? m : max,
    { precipitation: 0 }
  );

  // Find the driest month
  const driestMonth = monthlyNormals.reduce((min, m) =>
    m.precipitation < min.precipitation ? m : min,
    { precipitation: Infinity }
  );

  // Month card component
  const MonthCard = ({ month }) => {
    const isWettest = month.month === wettestMonth.month;
    const isDriest = month.month === driestMonth.month;

    return (
      <div
        className={`
          p-2 rounded-lg text-center
          ${isWettest ? 'bg-blue-500/20 ring-1 ring-blue-500/30' : ''}
          ${isDriest ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : ''}
          ${!isWettest && !isDriest ? 'bg-white/5' : ''}
        `}
      >
        <div className="text-xs text-white/50 mb-1">{month.monthAbbrev}</div>
        <div className={`text-sm font-medium ${isWettest ? 'text-blue-400' : isDriest ? 'text-amber-400' : 'text-white'}`}>
          {month.precipitation.toFixed(2)}"
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="glass-elevated relative w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Monthly Normals</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-sm text-white/60 mt-1">
              {cityName} {stationName && `• ${stationName}`}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              30-Year Average (1991-2020)
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[70vh] glass-scroll">
            {monthlyNormals.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                No climate normals data available for this location.
              </div>
            ) : (
              <>
                {/* Annual Total */}
                <div className="px-4 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white/70">Annual Total</span>
                    </div>
                    <span className="text-2xl font-light text-white">
                      {annualNormal?.toFixed(2)}"
                    </span>
                  </div>
                </div>

                {/* Monthly Grid */}
                <div className="px-4 py-4">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">
                    Monthly Precipitation
                  </h3>

                  {/* First row: Jan - Jun */}
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {monthlyNormals.slice(0, 6).map(month => (
                      <MonthCard key={month.month} month={month} />
                    ))}
                  </div>

                  {/* Second row: Jul - Dec */}
                  <div className="grid grid-cols-6 gap-2">
                    {monthlyNormals.slice(6, 12).map(month => (
                      <MonthCard key={month.month} month={month} />
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-blue-500/40" />
                      Wettest
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-amber-500/30" />
                      Driest
                    </span>
                  </div>
                </div>

                {/* Seasonal Summary */}
                <div className="px-4 py-4 border-t border-white/10">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">
                    Seasonal Totals
                  </h3>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/40 mb-1">Winter</div>
                      <div className="text-sm font-medium text-white">
                        {seasonTotals.winter.toFixed(1)}"
                      </div>
                      <div className="text-[10px] text-white/30">Dec-Feb</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/40 mb-1">Spring</div>
                      <div className="text-sm font-medium text-white">
                        {seasonTotals.spring.toFixed(1)}"
                      </div>
                      <div className="text-[10px] text-white/30">Mar-May</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/40 mb-1">Summer</div>
                      <div className="text-sm font-medium text-white">
                        {seasonTotals.summer.toFixed(1)}"
                      </div>
                      <div className="text-[10px] text-white/30">Jun-Aug</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/40 mb-1">Fall</div>
                      <div className="text-sm font-medium text-white">
                        {seasonTotals.fall.toFixed(1)}"
                      </div>
                      <div className="text-[10px] text-white/30">Sep-Nov</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/10">
                  <p className="text-xs text-white/40 text-center">
                    Data from NOAA NCEI Climate Normals (1991-2020)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

RainHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cityName: PropTypes.string,
  monthlyNormals: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.number,
      monthName: PropTypes.string,
      monthAbbrev: PropTypes.string,
      precipitation: PropTypes.number,
    })
  ),
  annualNormal: PropTypes.number,
  stationName: PropTypes.string,
};

/**
 * Full-page hand-drawn education / village scene (decorative; see index.css for timing).
 */
export default function LoginSketchBg() {
  return (
    <div className="login-page-sketch-layer" aria-hidden="true">
      {/* Distant copy of landscape (lighter) */}
      <svg
        className="login-page-sketch login-page-sketch--land-far"
        viewBox="0 0 420 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M0 100 Q100 30 200 50 Q300 20 420 60"
        />
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M30 100 L30 60 L60 60 L60 100 M20 60 L45 30 L70 60 M180 100 L180 50 L250 50 L250 100 M170 50 L210 5 L255 50"
        />
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M12 100 L12 40 M12 40 Q-5 20 12 2 Q30 20 12 40 M400 100 L400 45 M400 45 Q380 20 400 0 Q420 20 400 45"
        />
      </svg>

      {/* Sky */}
      <svg
        className="login-page-sketch login-page-sketch--sky"
        viewBox="0 0 360 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="login-page-sketch-drift-slow">
          <path
            className="login-page-sketch-stroke"
            d="M10 60 Q8 40 32 38 Q50 22 78 32 Q100 20 128 32 Q150 25 160 45 Q150 60 120 60 Q90 70 60 60 Q32 70 10 60Z"
          />
          <path
            className="login-page-sketch-stroke login-page-sketch-stroke--soft"
            d="M180 30 Q175 12 200 10 Q220 0 255 8 Q300 0 320 20 Q330 40 300 50 Q260 55 220 50 Q200 60 180 30Z"
          />
        </g>
        <g className="login-page-sketch-drift-slow" style={{ animationDelay: '-3s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M50 20 Q40 5 60 0 Q80 -5 100 4 Q120 0 130 20 Q120 40 100 40 Q80 50 50 20Z"
          />
        </g>
        <g className="login-page-sketch-drift-slow" style={{ animationDelay: '-7s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M220 70 Q230 50 255 50 Q280 40 300 55 Q320 50 330 70 Q320 90 280 90 Q255 100 230 90 Q220 80 220 70Z"
          />
        </g>
        <circle className="login-page-sketch-sun" cx="310" cy="24" r="12" />
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M0 75 Q60 60 120 70 T240 65 T360 75"
        />
      </svg>

      {/* Birds */}
      <svg
        className="login-page-sketch login-page-sketch--birds"
        viewBox="0 0 400 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="login-page-sketch-drift-slow" style={{ animationDuration: '10s' }}>
          <path className="login-page-sketch-stroke" d="M20 30 Q32 20 45 30" />
          <path className="login-page-sketch-stroke" d="M38 32 Q50 18 64 32" />
          <path className="login-page-sketch-stroke" d="M120 20 Q140 5 160 20" />
          <path className="login-page-sketch-stroke login-page-sketch-stroke--soft" d="M200 40 Q220 25 240 40" />
          <path className="login-page-sketch-stroke" d="M280 15 Q300 0 320 16" />
          <path className="login-page-sketch-stroke" d="M340 28 Q360 12 380 30" />
        </g>
      </svg>

      {/* Kite */}
      <svg
        className="login-page-sketch login-page-sketch--kite"
        viewBox="0 0 120 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke"
          d="M60 5 L100 50 L60 60 L20 50 Z M60 5 L60 60 M20 50 L100 50 M60 60 L45 100"
        />
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M45 100 Q30 90 20 100 Q10 88 0 100"
        />
      </svg>

      {/* Side trees (left) */}
      <svg
        className="login-page-sketch login-page-sketch--side login-page-sketch--side-l"
        viewBox="0 0 80 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke"
          d="M40 200 L40 100 M40 100 Q20 60 40 20 Q60 60 40 100 M8 200 L8 120 M8 120 Q-5 80 8 50 Q25 80 8 120 M60 200 L60 110 M60 110 Q75 70 60 30 Q45 70 60 110"
        />
      </svg>
      <svg
        className="login-page-sketch login-page-sketch--side login-page-sketch--side-r"
        viewBox="0 0 80 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke"
          d="M40 200 L40 100 M40 100 Q20 60 40 20 Q60 60 40 100 M8 200 L8 120 M8 120 Q-5 80 8 50 Q25 80 8 120 M60 200 L60 110 M60 110 Q75 70 60 30 Q45 70 60 110"
        />
      </svg>

      {/* Main landscape */}
      <svg
        className="login-page-sketch login-page-sketch--land"
        viewBox="0 0 420 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M0 88 Q100 45 200 60 Q320 40 420 80"
        />
        <path
          className="login-page-sketch-stroke login-page-sketch-road"
          d="M-5 150 Q105 140 210 150 Q315 162 430 145"
        />
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M0 160 Q200 150 420 168"
        />

        <g className="login-page-sketch-sway">
          <path
            className="login-page-sketch-stroke"
            d="M28 150 L28 100 L70 100 L70 150 M20 100 L49 70 L80 100 M42 150 L42 120 L55 120 L55 150"
          />
        </g>

        <g>
          <path
            className="login-page-sketch-stroke"
            d="M100 150 L100 70 L255 70 L255 150 M90 70 L178 32 L265 70 M120 100 L150 100 L150 120 L120 120 Z M180 100 L210 100 L210 120 L180 120 Z M220 100 L250 100 L250 120 L220 120 Z M165 150 L165 120 L195 120 L195 150 M178 32 L178 8 L200 20 L178 30"
          />
        </g>

        <g className="login-page-sketch-sway" style={{ animationDelay: '-1.2s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M300 150 L300 110 L360 110 L360 150 M290 110 L330 80 L375 110 M320 150 L320 128 L345 128 L345 150"
          />
        </g>

        <g className="login-page-sketch-sway" style={{ animationDelay: '-0.6s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M12 150 L12 100 M12 100 Q-5 80 12 60 Q30 80 12 100"
          />
        </g>
        <g className="login-page-sketch-sway" style={{ animationDelay: '-1.5s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M380 150 L380 95 M380 95 Q355 70 380 50 Q405 70 380 95"
          />
        </g>
        <g className="login-page-sketch-sway" style={{ animationDelay: '-2.2s' }}>
          <path
            className="login-page-sketch-stroke"
            d="M45 150 L45 108 M45 108 Q32 90 45 75 Q60 90 45 108"
          />
        </g>

        <g className="login-page-sketch-bounce">
          <circle className="login-page-sketch-stroke" cx="198" cy="128" r="5" fill="none" />
          <path
            className="login-page-sketch-stroke"
            d="M198 135 L198 150 M198 150 L192 168 M198 150 L204 168 M198 140 L190 130 M198 140 L206 130"
          />
          <circle className="login-page-sketch-stroke" cx="175" cy="145" r="4" fill="none" />
          <circle className="login-page-sketch-stroke" cx="250" cy="128" r="5" fill="none" />
          <path
            className="login-page-sketch-stroke"
            d="M250 135 L250 150 M250 150 L244 168 M250 150 L256 168 M250 140 L242 128 M250 140 L260 128"
          />
        </g>

        <g>
          <path
            className="login-page-sketch-stroke"
            d="M320 170 L360 160 L400 170 L360 180 Z M360 160 L360 180 M350 170 L360 160 L370 170 L360 180 M95 180 L95 150 L120 150 L120 180 M100 150 L110 120 L120 150"
          />
          <path
            className="login-page-sketch-stroke login-page-sketch-stroke--soft"
            d="M30 180 L30 160 L50 150 L50 180 M30 160 L20 150 L0 160 L0 180 L30 180"
          />
        </g>
      </svg>

      {/* Foreground grass */}
      <svg
        className="login-page-sketch login-page-sketch--bottom"
        viewBox="0 0 400 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="login-page-sketch-stroke login-page-sketch-stroke--soft"
          d="M0 20 Q20 0 40 20 T80 20 T120 8 T160 20 T200 4 T240 20 T280 6 T320 20 T360 8 T400 20"
        />
        <path
          className="login-page-sketch-stroke"
          d="M0 35 Q50 20 100 32 Q150 15 200 32 Q250 12 300 32 Q350 18 400 30"
        />
      </svg>
    </div>
  );
}

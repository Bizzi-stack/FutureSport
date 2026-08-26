export default function JerseyIcon({ number, color = '#22c55e', size = 44, style = {} }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                flexShrink: 0,
                ...style 
            }}
        >
            {/* Main Jersey Body & Short Sleeves */}
            <path 
                d="M 30 18 L 16 32 L 28 44 L 28 84 L 72 84 L 72 44 L 84 32 L 70 18 C 62 26 38 26 30 18 Z" 
                fill={color} 
                stroke="#ffffff" 
                strokeWidth="4"
                strokeLinejoin="round"
            />
            {/* Crewneck Collar Cutout */}
            <path 
                d="M 36 18 C 42 27 58 27 64 18" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="4" 
                strokeLinecap="round" 
            />
            {/* Left Sleeve Trim */}
            <path d="M 21 27 L 27 34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            {/* Right Sleeve Trim */}
            <path d="M 79 27 L 73 34" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            
            {/* Centered Jersey Number */}
            <text 
                x="50" 
                y="63" 
                textAnchor="middle" 
                fill="#ffffff" 
                fontSize="34" 
                fontWeight="900" 
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}
            >
                {number != null ? number : '1'}
            </text>
        </svg>
    );
}

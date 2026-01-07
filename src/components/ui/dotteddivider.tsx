import React from "react";

interface DottedDividerProps {
  className?: string;
  height?: number;
  colorClass?: string;
}

const DottedDivider: React.FC<DottedDividerProps> = ({
  className = "",
  height = 8,
  colorClass = "text-gray-500",
}) => {
  const patternId = React.useId();

  return (
    <div
      className={`w-full ${colorClass} ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          <pattern
            id={patternId}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="0.5" cy="0.5" r="0.5" fill="currentColor" />
            <circle cx="0.5" cy="7.5" r="0.5" fill="currentColor" />
            <circle cx="4" cy="4" r="0.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

export default DottedDivider;

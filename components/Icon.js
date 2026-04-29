export default function Icon({ name, className = "", filled = false, style = {} }) {
  const mergedStyle = filled ? { fontVariationSettings: "'FILL' 1", ...style } : style;
  return (
    <span className={`material-symbols-outlined ${className}`} style={mergedStyle}>
      {name}
    </span>
  );
}

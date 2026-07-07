export default function PixelSlider({ label, value, min = 0, max = 100, onChange }) {
  return (
    <label className="pixel-slider">
      <span className="pixel-slider__label">
        <span>{label}</span>
        <span>{value}%</span>
      </span>
      <input
        className="pixel-slider__input"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function ResourceBar({ icon, label, value, percent }) {
  return (
    <div className="resource-bar">
      <div className="resource-bar__top">
        <span>
          {icon} {label}
        </span>
        <span>{value}</span>
      </div>
      <div className="resource-bar__track">
        <div
          className="resource-bar__fill"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

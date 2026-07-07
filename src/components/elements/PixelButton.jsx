export default function PixelButton({
  children,
  icon,
  variant = 'primary',
  size = 'normal',
  className = '',
  ...props
}) {
  const classes = ['pixel-button', `pixel-button--${variant}`];
  if (size !== 'normal') classes.push(`pixel-button--${size}`);
  if (className) classes.push(className);

  return (
    <button className={classes.join(' ')} {...props}>
      {icon ? <span className="pixel-button__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

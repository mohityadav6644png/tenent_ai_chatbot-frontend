export function Button({
  children,
  className = '',
  variant,
  type = 'button',
  ...props
}) {
  const variantClass = variant && ['dark'].includes(variant) ? `button--${variant}` : '';
  return (
    <button className={`button ${variantClass} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  );
}

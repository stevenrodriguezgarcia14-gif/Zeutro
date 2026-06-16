import { type CSSProperties } from "react";

/**
 * Isotipo de Zentro (versión corregida según auditoría):
 * Z geométrica plana de un solo peso + nodo central en Verde Zentro
 * que simboliza el "centro de control". Funciona a 16px y en una tinta.
 */
export function ZentroMark({
  size = 32,
  className,
  nodeColor = "var(--color-brand)",
  style,
}: {
  size?: number;
  className?: string;
  nodeColor?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      role="img"
      aria-label="Zentro"
    >
      <path
        d="M13 13 H35 L13 35 H35"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="4.5" fill={nodeColor} />
    </svg>
  );
}

/** Logo horizontal completo: isotipo + wordmark "Zentro". */
export function ZentroLogo({
  className,
  markSize = 30,
  textClassName = "",
}: {
  className?: string;
  markSize?: number;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <ZentroMark size={markSize} />
      <span
        className={`font-display text-[1.35rem] font-bold tracking-tight ${textClassName}`}
      >
        Zentro
      </span>
    </span>
  );
}

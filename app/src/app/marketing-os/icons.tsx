// Set de iconos SVG del Marketing OS (estilo lucide: trazo 1.75, esquinas
// redondeadas, un solo lenguaje visual). Nada de emojis como iconos.

type IconProps = { className?: string };

function Base({ d, className, extra }: { d: string; className?: string; extra?: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? "h-4 w-4"}
    >
      <path d={d} />
      {extra}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Base {...p} d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" extra={<path d="M9.5 21v-6h5v6" />} />
);
export const IconCalendar = (p: IconProps) => (
  <Base {...p} d="M7 2v4M17 2v4M3.5 9h17" extra={<rect x="3.5" y="4" width="17" height="17.5" rx="2.5" />} />
);
export const IconFilm = (p: IconProps) => (
  <Base {...p} d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4" extra={<rect x="3" y="3" width="18" height="18" rx="2.5" />} />
);
export const IconImage = (p: IconProps) => (
  <Base {...p} d="m4 17 4.5-4.5a1.5 1.5 0 0 1 2.1 0L17 19M14 15l2-2a1.5 1.5 0 0 1 2.1 0L21 15.9" extra={<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="9" r="1.6" /></>} />
);
export const IconBulb = (p: IconProps) => (
  <Base {...p} d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.6 1 2.5h6c0-.9.2-1.8 1-2.5A6 6 0 0 0 12 3Z" />
);
export const IconBox = (p: IconProps) => (
  <Base {...p} d="M21 8.5 12 13 3 8.5M12 13v8.5M3 8.5v8L12 21.5l9-5v-8L12 3.5 3 8.5Z" />
);
export const IconCheckSquare = (p: IconProps) => (
  <Base {...p} d="m8.5 12 2.5 2.5L16 9" extra={<rect x="3.5" y="3.5" width="17" height="17" rx="3" />} />
);
export const IconChart = (p: IconProps) => (
  <Base {...p} d="M4 20V4M4 20h16M8.5 16v-5M13 16V8M17.5 16v-8" />
);
export const IconBook = (p: IconProps) => (
  <Base {...p} d="M4 19.5V5a2 2 0 0 1 2-2h14v16.5M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
);
export const IconSparkle = (p: IconProps) => (
  <Base {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
);
export const IconCamera = (p: IconProps) => (
  <Base {...p} d="M4 8h3l2-3h6l2 3h3v12H4V8Z" extra={<circle cx="12" cy="13.5" r="3.5" />} />
);
export const IconScissors = (p: IconProps) => (
  <Base {...p} d="M20 4 8.5 15.5M20 20 8.5 8.5" extra={<><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /></>} />
);
export const IconSend = (p: IconProps) => (
  <Base {...p} d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />
);
export const IconEye = (p: IconProps) => (
  <Base {...p} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" extra={<circle cx="12" cy="12" r="3" />} />
);
export const IconClock = (p: IconProps) => (
  <Base {...p} d="M12 7v5l3.5 2" extra={<circle cx="12" cy="12" r="9" />} />
);
export const IconCheck = (p: IconProps) => <Base {...p} d="m4.5 12.5 5 5L19.5 7" />;
export const IconPlus = (p: IconProps) => <Base {...p} d="M12 5v14M5 12h14" />;
export const IconX = (p: IconProps) => <Base {...p} d="M6 6l12 12M18 6 6 18" />;
export const IconChevronL = (p: IconProps) => <Base {...p} d="m14.5 6-6 6 6 6" />;
export const IconChevronR = (p: IconProps) => <Base {...p} d="m9.5 6 6 6-6 6" />;
export const IconGrip = (p: IconProps) => (
  <Base {...p} d="M9 5.5h.01M9 12h.01M9 18.5h.01M15 5.5h.01M15 12h.01M15 18.5h.01" />
);
export const IconTarget = (p: IconProps) => (
  <Base {...p} d="" extra={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>} />
);
export const IconMic = (p: IconProps) => (
  <Base {...p} d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15.5ZM6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6" />
);
export const IconFlame = (p: IconProps) => (
  <Base {...p} d="M12 3s5.5 4.5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 1-4 2.5-5.5 0 0 .5 2 2 2.5C10.5 8 12 3 12 3Z" />
);
export const IconAlert = (p: IconProps) => (
  <Base {...p} d="M12 8.5V13M12 16.5h.01M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
);
export const IconArrowR = (p: IconProps) => <Base {...p} d="M4 12h16m0 0-6-6m6 6-6 6" />;
export const IconDots = (p: IconProps) => (
  <Base {...p} d="M5 12h.01M12 12h.01M19 12h.01" />
);
export const IconTrash = (p: IconProps) => (
  <Base {...p} d="M4.5 6.5h15M9 6.5V4.5h6v2M7 6.5 8 20h8l1-13.5M10.5 10.5v6M13.5 10.5v6" />
);
export const IconRefresh = (p: IconProps) => (
  <Base {...p} d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" />
);
export const IconTag = (p: IconProps) => (
  <Base {...p} d="m3.5 12.5 8-8H20v8.5l-8 8-8.5-8.5Z" extra={<circle cx="16" cy="8" r="1.2" />} />
);
export const IconUser = (p: IconProps) => (
  <Base {...p} d="M20 21a8 8 0 0 0-16 0" extra={<circle cx="12" cy="8.5" r="4" />} />
);

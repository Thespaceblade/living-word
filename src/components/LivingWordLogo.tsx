type LogoSize = "sm" | "md" | "lg";

type Props = {
  size?: LogoSize;
  showWordmark?: boolean;
  className?: string;
};

export function LivingWordLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: Props) {
  return (
    <span className={`lw-logo lw-logo--${size} ${className}`.trim()}>
      <svg
        className="lw-logo__mark"
        viewBox="0 0 32 32"
        aria-hidden={showWordmark}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : "Living Word"}
      >
        {/* Living leaf */}
        <path
          d="M16 2.8c2.6 1.4 4 3.6 4 6.2-1.7-.4-3-.6-4-.6s-2.3.2-4 .6c0-2.6 1.4-4.8 4-6.2Z"
          fill="currentColor"
        />
        <path
          d="M16 4.2v5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* Open book */}
        <path
          d="M5 12.2c3.2.4 7.2 1.3 11 2.1 3.8-.8 7.8-1.7 11-2.1v13.2c-3.4.7-7.4 1.8-11 2.7-3.6-.9-7.6-2-11-2.7V12.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M16 14.3v13.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark ? (
        <span className="lw-logo__word">Living Word</span>
      ) : null}
    </span>
  );
}

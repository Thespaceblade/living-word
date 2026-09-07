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
        {/* Open book */}
        <path
          d="M16 11.2C12.4 10.4 7.6 9.6 4.8 9.4v14.2c2.9.5 7.2 1.5 11.2 2.4 4-.9 8.3-1.9 11.2-2.4V9.4c-2.8.2-7.6 1-11.2 1.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M16 11.2v14.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        {/* Living leaf */}
        <path
          d="M16 11.1c0-2.4 1.2-4.4 3.1-5.6-2.5.7-3.9 2.6-4.1 5.1-.2-2.5-1.6-4.4-4.1-5.1 1.9 1.2 3.1 3.2 3.1 5.6Z"
          fill="currentColor"
        />
      </svg>
      {showWordmark ? (
        <span className="lw-logo__word">Living Word</span>
      ) : null}
    </span>
  );
}

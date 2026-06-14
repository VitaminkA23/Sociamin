import { getAvatarColor, getInitials } from "../../utils/format";
import type { Author } from "../../types/post";

interface AvatarProps {
  author: Author;
  size?: number;
  isOnline?: boolean;
}

export function Avatar({ author, size = 40, isOnline = false }: AvatarProps) {
  const bg = getAvatarColor(author.id);
  const initials = getInitials(author);
  const fontSize = Math.round(size * 0.38);

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.02em",
          userSelect: "none",
          flexShrink: 0,
          overflow: "hidden",
        }}
        aria-label={`Avatar for ${initials}`}
      >
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={initials}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          initials
        )}
      </div>
      {isOnline && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size * 0.27,
            height: size * 0.27,
            borderRadius: "50%",
            background: "#22C55E",
            border: "2px solid white",
          }}
          aria-label="Online"
        />
      )}
    </div>
  );
}

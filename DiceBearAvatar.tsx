import type React from "react";

interface DiceBearAvatarProps {
  seed: string; // e.g., user name, email, or ID
  size?: number; // avatar size in px
  style?: string; // DiceBear style, e.g., "initials", "avataaars"
  backgroundColor?: string; // hex without #
}

const DiceBearAvatar: React.FC<DiceBearAvatarProps> = ({
  seed,
  size = 64,
  style = "initials",
  backgroundColor = "b6e3f4", // light blue
}) => {
  const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=${backgroundColor}`;

  return (
    <img
      src={url}
      alt="User Avatar"
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      loading="lazy"
    />
  );
};

export default DiceBearAvatar;

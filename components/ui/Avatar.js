const Avatar = ({ username, size = 40, className = "" }) => {
  const getAvatarUrl = (username) => {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}&size=${size}`;
  };

  return (
    <img
      src={getAvatarUrl(username)}
      alt={`${username} avatar`}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
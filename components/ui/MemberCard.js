import React from 'react';

const getAvatarUrl = (username) => `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

const MemberCard = ({
  member,
  capacity = 176, // 22 days * 8 hours
  showProgress = true,
  className = '',
  onClick
}) => {
  const progressPercentage = Math.min((member.totalHours / capacity) * 100, 100);
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`flex items-center border-b border-gray-100 p-3 last:border-b-0 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${className}`}
      onClick={onClick}
    >
      <img
        src={getAvatarUrl(member.user.username)}
        alt="avatar"
        className="mr-4 h-10 w-10 rounded-full"
      />
      <div className="flex-grow">
        <div className="font-semibold uppercase text-black">
          {member.user.name || member.user.username}
        </div>
        <div className="text-xs text-gray-500">
          {member.user.teamName || 'No Team Assigned'}
        </div>
        {showProgress && (
          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-black transition-all duration-300"
              style={{
                width: `${progressPercentage}%`
              }}
            />
          </div>
        )}
      </div>
      <div className="ml-4 min-w-[80px] text-right">
        <span className="text-xl font-light text-black">
          {member.totalHours.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">/{capacity}</span>
      </div>
    </Component>
  );
};

export default MemberCard;
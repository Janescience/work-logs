import React from 'react';
import MemberCard from './MemberCard';

const TeamGrid = ({
  title,
  data = [],
  teams = [],
  capacity = 176,
  className = '',
  emptyMessage = 'No members found.',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <h2 className="mb-4 text-2xl font-light text-black">{title}</h2>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {teams.map((team) => {
          const teamMembers = data.filter(
            (item) => item?.user?.type === team.type,
          );

          return (
            <div key={team.type} className="border border-black p-4 bg-white">
              <h3 className="mb-3 border-b pb-2 font-semibold">
                {team.label}
              </h3>
              <div className="space-y-1">
                {teamMembers.length > 0 ? (
                  teamMembers.map((item, index) => (
                    <MemberCard
                      key={item.user?._id || index}
                      member={item}
                      capacity={capacity}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-gray-500">
                    {emptyMessage}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamGrid;


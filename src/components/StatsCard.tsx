import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, change }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-green-600 text-sm mt-1">{change}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
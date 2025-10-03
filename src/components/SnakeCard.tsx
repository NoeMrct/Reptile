import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Scale, Ruler } from 'lucide-react';
import { Snake } from '../types';
import { differenceInYears } from 'date-fns';

interface SnakeCardProps {
  snake: Snake;
}

const SnakeCard: React.FC<SnakeCardProps> = ({ snake }) => {
  const age = differenceInYears(new Date(), new Date(snake.birthDate));

  return (
    <Link
      to={`/snake/${snake.id}`}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center space-x-4">
        {snake.imageUrl && (
          <img
            src={snake.imageUrl}
            alt={snake.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{snake.name}</h3>
          </div>
          
          <p className="text-gray-600 mb-2">
            {snake.species} {snake.morph && `• ${snake.morph}`} • {snake.sex}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{age} years old</span>
            </div>
            <div className="flex items-center">
              <Scale className="h-4 w-4 mr-1" />
              <span>{snake.weight}g</span>
            </div>
            <div className="flex items-center">
              <Ruler className="h-4 w-4 mr-1" />
              <span>{snake.length}cm</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SnakeCard;
import React from 'react';
import { Calendar, Scale, Activity, Stethoscope, Hand, FileText } from 'lucide-react';
import { Event } from '../types';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  snakeName: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, snakeName }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'shed':
        return <Scale className="h-5 w-5 text-purple-600" />;
      case 'vet_visit':
        return <Stethoscope className="h-5 w-5 text-green-600" />;
      case 'handling':
        return <Hand className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'feeding':
        return 'bg-blue-50 border-blue-200';
      case 'shed':
        return 'bg-purple-50 border-purple-200';
      case 'vet_visit':
        return 'bg-green-50 border-green-200';
      case 'handling':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`border rounded-lg p-4 ${getEventColor(event.type)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getEventIcon(event.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {formatEventType(event.type)} - {snakeName}
            </h4>
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(event.date), 'MMM dd, yyyy')}
            </span>
          </div>
          
          {event.notes && (
            <p className="text-gray-600 text-sm mt-1">{event.notes}</p>
          )}
          
          {event.weight && (
            <p className="text-gray-600 text-sm mt-1">
              Weight: {event.weight}g
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
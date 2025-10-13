import React from "react";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from "lucide-react";
import { useSeason } from "../contexts/SeasonContext";

const SeasonSelector: React.FC = () => {
  const { currentSeason, setCurrentSeason, seasons, hasUserManuallyChangedSeason, resetToAutoMode, isLoadingSeasons } = useSeason();
  
  const currentSeasonIndex = seasons.findIndex(s => s.id === currentSeason.id);

  const nextSeason = () => {
    if (currentSeasonIndex < seasons.length - 1) {
      setCurrentSeason(seasons[currentSeasonIndex + 1]);
    }
  };

  const prevSeason = () => {
    if (currentSeasonIndex > 0) {
      setCurrentSeason(seasons[currentSeasonIndex - 1]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return {
          backgroundColor: `${currentSeason.theme.primary}20`,
          color: currentSeason.theme.primary,
          borderColor: currentSeason.theme.primary
        };
      case "upcoming":
        return {
          backgroundColor: `${currentSeason.theme.secondary}20`,
          color: currentSeason.theme.secondary,
          borderColor: currentSeason.theme.secondary
        };
      case "completed":
        return {
          backgroundColor: "#F3F4F6",
          color: "#6B7280",
          borderColor: "#D1D5DB"
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#6B7280",
          borderColor: "#D1D5DB"
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  if (isLoadingSeasons) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 web3-card">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
            <div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-8 bg-gray-300 rounded-full w-24"></div>
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 web3-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div 
            className="p-3 rounded-full mr-4"
            style={{ 
              backgroundColor: currentSeason.theme.primary,
              background: `linear-gradient(135deg, ${currentSeason.theme.primary}, ${currentSeason.theme.secondary})` 
            }}
          >
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl text-[#060F32] custom-font font-bold">
              {currentSeason.name}
            </h2>
            <p className="text-sm text-[#828DB3]">
              Season {currentSeason.id} • {currentSeason.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={prevSeason}
            disabled={currentSeasonIndex === 0}
            className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F9FAFF] rounded-full">
            <span className="text-sm font-medium text-[#060F32]">
              Season {currentSeason.id}
            </span>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium border"
              style={getStatusColor(currentSeason.status)}
            >
              {getStatusText(currentSeason.status)}
            </div>
          </div>
          
          <button
            onClick={nextSeason}
            disabled={currentSeasonIndex === seasons.length - 1}
            className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {hasUserManuallyChangedSeason && (
            <button
              onClick={resetToAutoMode}
              className="p-2 rounded-full transition-colors"
              title="Reset to auto mode (follow active season)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonSelector;

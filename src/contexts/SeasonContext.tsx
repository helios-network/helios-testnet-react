import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

export interface Season {
  id: number;
  identifier: string;
  name: string;
  status: "active" | "upcoming" | "completed";
  startDate: string;
  endDate?: string;
  description: string;
  color: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    gradient: string;
    icon: string;
  };
  content: {
    title: string;
    subtitle: string;
    mainDescription: string;
    features: {
      title: string;
      description: string;
      icon: string;
    }[];
  };
}

interface SeasonContextType {
  currentSeason: Season;
  setCurrentSeason: (season: Season) => void;
  seasons: Season[];
  hasUserManuallyChangedSeason: boolean;
  resetToAutoMode: () => void;
  isLoadingSeasons: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);


const updateSeasonStatus = (season: Season): Season => {
  // Force Beta Mainnet to display as active in the app, regardless of dates
  if (season.identifier === 'beta-mainnet') {
    return { ...season, status: 'active' };
  }

  const now = new Date();
  const startDate = new Date(season.startDate);
  const endDate = season.endDate ? new Date(season.endDate) : null;
  
  let status: "active" | "upcoming" | "completed";
  
  if (now < startDate) {
    status = "upcoming";
  } else if (endDate && now > endDate) {
    status = "completed";
  } else {
    status = "active";
  }
  
  return { ...season, status };
};

const pickDefaultSeason = (seasons: Season[]): Season => {
  // Prefer beta-mainnet by default
  const beta = seasons.find(s => s.identifier === 'beta-mainnet');
  if (beta) return beta;

  // Fallback to active by date
  const now = new Date();
  for (const season of seasons) {
    const startDate = new Date(season.startDate);
    const endDate = season.endDate ? new Date(season.endDate) : null;
    if (now >= startDate && (!endDate || now <= endDate)) {
      return season;
    }
  }
  return seasons[0];
};

export const SeasonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [hasUserManuallyChangedSeason, setHasUserManuallyChangedSeason] = useState(false);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setIsLoadingSeasons(true);
        const response = await api.getSeasons();
        
        if (response.success && response.seasons) {
          const seasonsWithUpdatedStatus = response.seasons
            .map(updateSeasonStatus)
            .map(s => s.identifier === 'path' || s.identifier === 'genesis' ? { ...s, status: 'completed' } : s);
          setSeasons(seasonsWithUpdatedStatus);
          
          // Set current season only if user hasn't manually changed it
          if (!hasUserManuallyChangedSeason) {
            const defaultSeason = pickDefaultSeason(seasonsWithUpdatedStatus);
            console.log('SeasonContext: Default season picked:', defaultSeason.identifier);
            setCurrentSeason(defaultSeason);
          } else {
            // If user has manually changed season, update the current season with fresh data
            const updatedCurrentSeason = seasonsWithUpdatedStatus.find(s => s.id === currentSeason?.id);
            if (updatedCurrentSeason) {
              setCurrentSeason(updatedCurrentSeason);
            }
          }
        } else {
          console.error('API returned unsuccessful response');
        }
      } catch (error) {
        console.error('Failed to fetch seasons:', error);
      } finally {
        setIsLoadingSeasons(false);
      }
    };

    fetchSeasons();
  }, [currentSeason?.id, hasUserManuallyChangedSeason]);

  const handleSetCurrentSeason = (season: Season) => {
    console.log('SeasonContext: Manually setting season to:', season.identifier);
    setCurrentSeason(season);
    setHasUserManuallyChangedSeason(true);
  };

  const resetToAutoMode = () => {
    setHasUserManuallyChangedSeason(false);
    const defaultSeason = pickDefaultSeason(seasons);
    setCurrentSeason(defaultSeason);
  };

  // Don't render children until we have seasons data
  if (isLoadingSeasons || !currentSeason) {
    return (
      <SeasonContext.Provider value={{ 
        currentSeason: seasons[0] || { id: 0, identifier: 'loading', name: 'Loading...', status: 'active', startDate: new Date().toISOString(), description: 'Loading seasons...', color: '', theme: { primary: '#000', secondary: '#000', accent: '#000', background: '', gradient: '', icon: '' }, content: { title: 'Loading...', subtitle: 'Loading...', mainDescription: 'Loading...', features: [] } },
        setCurrentSeason: handleSetCurrentSeason, 
        seasons: seasons,
        hasUserManuallyChangedSeason,
        resetToAutoMode,
        isLoadingSeasons: true
      }}>
        {children}
      </SeasonContext.Provider>
    );
  }

  return (
    <SeasonContext.Provider value={{ 
      currentSeason, 
      setCurrentSeason: handleSetCurrentSeason, 
      seasons,
      hasUserManuallyChangedSeason,
      resetToAutoMode,
      isLoadingSeasons
    }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};

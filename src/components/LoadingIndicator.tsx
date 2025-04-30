import React from 'react';
import styles from '../styles/loading.module.scss';

interface LoadingIndicatorProps {
  isLoading?: boolean;
  text?: string;
  fullScreen?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  isLoading = true, 
  text = "Loading Helios Testnet...",
  fullScreen = true
}) => {
  if (!isLoading) return null;

  return (
    <div className={`${styles.loadingContainer} ${!isLoading ? styles.fadeOut : ''}`} 
         style={!fullScreen ? { position: 'absolute' } : undefined}>
      <div className="flex flex-col items-center">
        <div className={styles.spinner}></div>
        {text && <p className={styles.loadingText}>{text}</p>}
      </div>
    </div>
  );
};

export default LoadingIndicator; 
import { useContext } from 'react';
import { SensorContext } from '../context/SensorContext';

export const useSensorData = () => {
    const context = useContext(SensorContext);
    if (context === undefined) {
        throw new Error('useSensorData must be used within a SensorProvider');
    }
    return context;
};

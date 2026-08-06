import React, { createContext, useState, useEffect } from 'react';
import { wsService } from '../services/websocket';
import { toast } from 'react-toastify'; // Assume react-toastify is available or can be added

export const SensorContext = createContext(null);

export const SensorProvider = ({ children }) => {
    const [sensorData, setSensorData] = useState({
        temperature: null,
        humidity: null,
        soilMoisture: null,
        soilPH: null,
        light: null,
        rain: null,
        battery: null,
        signalStrength: null,
        timestamp: null,
    });
    
    const [deviceStatus, setDeviceStatus] = useState('OFFLINE'); // ONLINE, RECONNECTING, OFFLINE, NO_DATA
    const [history, setHistory] = useState([]); // Keep last 50 readings
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    useEffect(() => {
        wsService.connect();

        const unsubscribe = wsService.subscribe((message) => {
            if (message.type === 'STATUS') {
                setDeviceStatus(message.payload);
                if (message.payload === 'OFFLINE') {
                    toast.error("Device is Offline");
                } else if (message.payload === 'ONLINE') {
                    toast.success("Device is Online");
                } else if (message.payload === 'RECONNECTING') {
                    toast.warning("Reconnecting to Device...");
                }
            } else if (message.type === 'DATA') {
                const data = message.payload;
                
                // Alerting System
                if (data.temperature > 40) toast.error("Alert: High Temperature! (>40°C)");
                if (data.humidity > 80) toast.error("Alert: High Humidity! (>80%)");
                if (data.humidity < 20) toast.error("Alert: Low Humidity! (<20%)");
                if (data.soilMoisture > 80) toast.error("Alert: High Moisture! (>80%)");
                if (data.battery < 15) toast.error("Alert: Low Battery!");
                if (data.signalStrength < -80) toast.error("Alert: Poor Signal Strength!");

                setSensorData({
                    temperature: data.temperature,
                    humidity: data.humidity,
                    soilMoisture: data.soilMoisture,
                    soilPH: data.soilPH,
                    light: data.light,
                    rain: data.rain,
                    battery: data.battery,
                    signalStrength: data.signalStrength,
                    timestamp: data.timestamp,
                });
                
                setLastUpdateTime(Date.now());
                
                setHistory(prev => {
                    const newHistory = [...prev, { ...data, time: new Date(data.timestamp).toLocaleTimeString() }];
                    if (newHistory.length > 50) {
                        return newHistory.slice(newHistory.length - 50);
                    }
                    return newHistory;
                });
            }
        });

        return () => {
            unsubscribe();
            wsService.disconnect();
        };
    }, []);

    // Check for no data for 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdateTime && Date.now() - lastUpdateTime > 10000 && deviceStatus === 'ONLINE') {
                setDeviceStatus('NO_DATA');
                toast.error("No sensor update for 10 seconds");
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [lastUpdateTime, deviceStatus]);

    return (
        <SensorContext.Provider value={{ ...sensorData, deviceStatus, history }}>
            {children}
        </SensorContext.Provider>
    );
};

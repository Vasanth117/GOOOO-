class WebSocketService {
    constructor() {
        this.ws = null;
        this.url = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001/ws';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.subscribers = [];
        this.heartbeatInterval = null;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WebSocket Connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.notifySubscribers({ type: 'STATUS', payload: 'ONLINE' });
        };

        this.ws.onmessage = (event) => {
            if (event.data === 'pong') return; // Heartbeat response
            try {
                const data = JSON.parse(event.data);
                this.notifySubscribers({ type: 'DATA', payload: data });
            } catch (err) {
                console.error('Invalid WebSocket message', err);
            }
        };

        this.ws.onclose = () => {
            console.warn('WebSocket Disconnected');
            this.notifySubscribers({ type: 'STATUS', payload: 'OFFLINE' });
            this.stopHeartbeat();
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket Error', error);
            this.ws.close();
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, 30000); // 30 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.notifySubscribers({ type: 'STATUS', payload: 'RECONNECTING' });
            const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, backoffTime);
        } else {
            this.notifySubscribers({ type: 'STATUS', payload: 'OFFLINE' });
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    notifySubscribers(message) {
        this.subscribers.forEach(callback => callback(message));
    }
}

export const wsService = new WebSocketService();

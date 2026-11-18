import mqtt from 'mqtt';

const PRIMARY_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const FALLBACK_BROKER = 'wss://broker.emqx.io:8084/mqtt';

// Generate a random client identifier for this tab/device
const CLIENT_ID = 'clothesline_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

export { CLIENT_ID };

export class IoTCloudSync {
  constructor(homeId = 'ent600-home', onRemoteAction, onStateSnapshot, onStatusChange) {
    this.homeId = homeId;
    this.onRemoteAction = onRemoteAction;
    this.onStateSnapshot = onStateSnapshot;
    this.onStatusChange = onStatusChange;
    this.client = null;
    this.status = 'connecting'; // connecting | connected | offline
    this.currentBrokerIndex = 0;
    this.brokers = [PRIMARY_BROKER, FALLBACK_BROKER];
    this.topicPrefix = `ent600/clothesline/${this.homeId}`;
    this.connect();
  }

  connect() {
    const brokerUrl = this.brokers[this.currentBrokerIndex];
    this.updateStatus('connecting');

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: CLIENT_ID,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
      });

      this.client.on('connect', () => {
        this.updateStatus('connected');
        // Subscribe to action stream and state snapshot topic
        this.client.subscribe(`${this.topicPrefix}/actions`, { qos: 0 });
        this.client.subscribe(`${this.topicPrefix}/state`, { qos: 0 });

        // Request initial state from any active peer
        this.publishMessage(`${this.topicPrefix}/actions`, {
          type: 'REQUEST_STATE',
          senderId: CLIENT_ID,
          timestamp: Date.now(),
        });
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (!data || data.senderId === CLIENT_ID) {
            // Ignore messages sent by ourselves
            return;
          }

          if (topic === `${this.topicPrefix}/actions`) {
            if (data.type === 'REQUEST_STATE') {
              // Peer asks for state: trigger callback to broadcast our current state
              if (this.onRemoteAction) {
                this.onRemoteAction({ type: 'PEER_REQUESTED_STATE', senderId: data.senderId });
              }
            } else if (this.onRemoteAction) {
              this.onRemoteAction(data);
            }
          } else if (topic === `${this.topicPrefix}/state`) {
            if (this.onStateSnapshot && data.state) {
              this.onStateSnapshot(data.state, data.senderId);
            }
          }
        } catch (err) {
          console.warn('[IoT Sync] Error parsing message:', err);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[IoT Sync] MQTT error:', err);
        this.tryNextBroker();
      });

      this.client.on('close', () => {
        this.updateStatus('offline');
      });

      this.client.on('reconnect', () => {
        this.updateStatus('connecting');
      });
    } catch (e) {
      console.warn('[IoT Sync] Connection failure:', e);
      this.tryNextBroker();
    }
  }

  tryNextBroker() {
    if (this.client) {
      try { this.client.end(true); } catch (_) {}
    }
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokers.length;
    setTimeout(() => this.connect(), 1500);
  }

  updateStatus(status) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  publishAction(actionType, payload = {}) {
    if (!this.client || this.status !== 'connected') return;
    const msg = {
      type: actionType,
      payload,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };
    this.publishMessage(`${this.topicPrefix}/actions`, msg);
  }

  broadcastState(state) {
    if (!this.client || this.status !== 'connected') return;
    const msg = {
      state,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };
    // Retain so any device opening later immediately receives latest state
    this.client.publish(`${this.topicPrefix}/state`, JSON.stringify(msg), { qos: 0, retain: true });
  }

  publishMessage(topic, obj) {
    try {
      this.client.publish(topic, JSON.stringify(obj), { qos: 0 });
    } catch (e) {
      console.warn('[IoT Sync] Publish error:', e);
    }
  }

  setHomeId(newHomeId) {
    if (newHomeId === this.homeId) return;
    if (this.client) {
      this.client.unsubscribe(`${this.topicPrefix}/actions`);
      this.client.unsubscribe(`${this.topicPrefix}/state`);
    }
    this.homeId = newHomeId;
    this.topicPrefix = `ent600/clothesline/${this.homeId}`;
    if (this.client && this.status === 'connected') {
      this.client.subscribe(`${this.topicPrefix}/actions`, { qos: 0 });
      this.client.subscribe(`${this.topicPrefix}/state`, { qos: 0 });
      this.publishMessage(`${this.topicPrefix}/actions`, {
        type: 'REQUEST_STATE',
        senderId: CLIENT_ID,
        timestamp: Date.now(),
      });
    }
  }

  destroy() {
    if (this.client) {
      try { this.client.end(true); } catch (_) {}
    }
  }
}


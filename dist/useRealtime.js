"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRealtime = useRealtime;
var react_1 = require("react");
function useRealtime(options) {
    var url = options.url, _a = options.autoConnect, autoConnect = _a === void 0 ? true : _a, _b = options.autoReconnect, autoReconnect = _b === void 0 ? true : _b, _c = options.reconnectAttempts, reconnectAttempts = _c === void 0 ? 10 : _c, _d = options.reconnectInterval, reconnectInterval = _d === void 0 ? 3000 : _d, _e = options.heartbeat, heartbeat = _e === void 0 ? { enabled: false, interval: 30000, message: 'ping' } : _e, _f = options.messageQueue, messageQueue = _f === void 0 ? { enabled: true, maxSize: 100 } : _f, _g = options.debug, debug = _g === void 0 ? false : _g;
    // Fixed: Separate types for setTimeout and setInterval
    var wsRef = (0, react_1.useRef)(null);
    var reconnectTimeoutRef = (0, react_1.useRef)(null);
    var heartbeatIntervalRef = (0, react_1.useRef)(null);
    var reconnectAttemptsRef = (0, react_1.useRef)(0);
    var eventsRef = (0, react_1.useRef)({});
    var messageQueueRef = (0, react_1.useRef)([]);
    var _h = (0, react_1.useState)({
        connected: false,
        connecting: false,
        reconnecting: false,
        error: null,
        lastMessageAt: null,
        connectionId: null,
    }), connection = _h[0], setConnection = _h[1];
    var log = (0, react_1.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (debug)
            console.log.apply(console, __spreadArray(['[useRealtime]'], args, false));
    }, [debug]);
    var connect = (0, react_1.useCallback)(function () {
        if (wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN ||
                wsRef.current.readyState === WebSocket.CONNECTING)) {
            log('Connection already open or connecting');
            return;
        }
        setConnection(function (prev) { return (__assign(__assign({}, prev), { connecting: true, reconnecting: false, error: null })); });
        try {
            var ws_1 = new WebSocket(url);
            wsRef.current = ws_1;
            ws_1.onopen = function () {
                log('Connected to', url);
                setConnection(function (prev) { return (__assign(__assign({}, prev), { connected: true, connecting: false, reconnecting: false, error: null, connectionId: Math.random().toString(36).substring(7) })); });
                reconnectAttemptsRef.current = 0;
                if (heartbeat.enabled) {
                    heartbeatIntervalRef.current = setInterval(function () {
                        if (ws_1.readyState === WebSocket.OPEN) {
                            ws_1.send(JSON.stringify(heartbeat.message));
                            log('Heartbeat sent');
                        }
                    }, heartbeat.interval);
                }
                if (messageQueue.enabled && messageQueueRef.current.length > 0) {
                    log('Flushing queued messages:', messageQueueRef.current.length);
                    var queueCopy = __spreadArray([], messageQueueRef.current, true);
                    messageQueueRef.current = [];
                    queueCopy.forEach(function (msg) {
                        if (ws_1.readyState === WebSocket.OPEN) {
                            ws_1.send(JSON.stringify(msg));
                        }
                        else {
                            // Re-queue if not connected
                            messageQueueRef.current.push(msg);
                        }
                    });
                }
            };
            ws_1.onclose = function (event) {
                log("Connection closed: Code ".concat(event.code, ", Reason: ").concat(event.reason || 'No reason provided'));
                setConnection(function (prev) { return (__assign(__assign({}, prev), { connected: false, connecting: false, lastMessageAt: prev.lastMessageAt })); });
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }
                if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    setConnection(function (prev) { return (__assign(__assign({}, prev), { reconnecting: true })); });
                    reconnectTimeoutRef.current = setTimeout(function () {
                        log("Reconnecting (attempt ".concat(reconnectAttemptsRef.current, "/").concat(reconnectAttempts, ")"));
                        connect();
                    }, reconnectInterval);
                }
                else {
                    setConnection(function (prev) { return (__assign(__assign({}, prev), { reconnecting: false })); });
                }
            };
            ws_1.onerror = function (error) {
                log('WebSocket error:', error);
                setConnection(function (prev) { return (__assign(__assign({}, prev), { error: new Error('WebSocket connection error') })); });
            };
            ws_1.onmessage = function (event) {
                try {
                    var data_1 = JSON.parse(event.data);
                    var timestamp_1 = new Date();
                    setConnection(function (prev) { return (__assign(__assign({}, prev), { lastMessageAt: timestamp_1 })); });
                    // Handle specific events
                    if (data_1.event && eventsRef.current[data_1.event]) {
                        eventsRef.current[data_1.event].forEach(function (callback) { return callback(data_1.data); });
                    }
                    // Handle generic messages
                    if (eventsRef.current['message']) {
                        eventsRef.current['message'].forEach(function (callback) { return callback(data_1); });
                    }
                    // Handle all messages (wildcard)
                    if (eventsRef.current['*']) {
                        eventsRef.current['*'].forEach(function (callback) { return callback({ event: data_1.event, data: data_1.data }); });
                    }
                }
                catch (error) {
                    log('Failed to parse message:', event.data, error);
                }
            };
        }
        catch (error) {
            log('Failed to create WebSocket:', error);
            setConnection(function (prev) { return (__assign(__assign({}, prev), { connecting: false, error: error })); });
        }
    }, [url, autoReconnect, reconnectAttempts, reconnectInterval, heartbeat, messageQueue.enabled, log]);
    var disconnect = (0, react_1.useCallback)(function () {
        log('Disconnecting...');
        // Clear timeouts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }
        setConnection({
            connected: false,
            connecting: false,
            reconnecting: false,
            error: null,
            lastMessageAt: null,
            connectionId: null,
        });
    }, [log]);
    var reconnect = (0, react_1.useCallback)(function () {
        log('Manual reconnect triggered');
        disconnect();
        reconnectAttemptsRef.current = 0;
        setTimeout(function () { return connect(); }, 100);
    }, [connect, disconnect, log]);
    var subscribe = (0, react_1.useCallback)(function (event, callback) {
        if (!eventsRef.current[event]) {
            eventsRef.current[event] = [];
        }
        eventsRef.current[event].push(callback);
        log("Subscribed to event: ".concat(event));
        // Return unsubscribe function
        return function () {
            if (eventsRef.current[event]) {
                eventsRef.current[event] = eventsRef.current[event].filter(function (cb) { return cb !== callback; });
                log("Unsubscribed from event: ".concat(event));
            }
        };
    }, [log]);
    var unsubscribe = (0, react_1.useCallback)(function (event, callback) {
        if (eventsRef.current[event]) {
            eventsRef.current[event] = eventsRef.current[event].filter(function (cb) { return cb !== callback; });
            log("Unsubscribed from event: ".concat(event));
        }
    }, [log]);
    var emit = (0, react_1.useCallback)(function (event, data) {
        var _a;
        var message = {
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            id: Math.random().toString(36).substring(7)
        };
        if (((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            log("Event emitted: ".concat(event), data);
        }
        else if (messageQueue.enabled) {
            if (messageQueueRef.current.length < (messageQueue.maxSize || 100)) {
                messageQueueRef.current.push(message);
                log("Message queued (".concat(messageQueueRef.current.length, "/").concat(messageQueue.maxSize, "): ").concat(event));
            }
            else {
                log('Message queue full, dropping message:', event);
            }
        }
        else {
            log('WebSocket not connected and message queue disabled:', event);
        }
    }, [messageQueue.enabled, messageQueue.maxSize, log]);
    var send = (0, react_1.useCallback)(function (data) {
        emit('message', data);
    }, [emit]);
    var getQueueSize = (0, react_1.useCallback)(function () {
        return messageQueueRef.current.length;
    }, []);
    var flushQueue = (0, react_1.useCallback)(function () {
        var count = messageQueueRef.current.length;
        messageQueueRef.current = [];
        log("Message queue flushed (".concat(count, " messages removed)"));
    }, [log]);
    var clearSubscriptions = (0, react_1.useCallback)(function () {
        var eventCount = Object.keys(eventsRef.current).length;
        eventsRef.current = {};
        log("All subscriptions cleared (".concat(eventCount, " events)"));
    }, [log]);
    // Auto-connect on mount
    (0, react_1.useEffect)(function () {
        if (autoConnect) {
            log('Auto-connecting...');
            connect();
        }
        return function () {
            log('Cleaning up...');
            disconnect();
        };
    }, [connect, disconnect, autoConnect, log]);
    return {
        connect: connect,
        disconnect: disconnect,
        reconnect: reconnect,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        emit: emit,
        send: send,
        connection: connection,
        isConnected: connection.connected,
        isConnecting: connection.connecting,
        isReconnecting: connection.reconnecting,
        getQueueSize: getQueueSize,
        flushQueue: flushQueue,
        clearSubscriptions: clearSubscriptions,
    };
}

export default (function() {
  const url = location.origin.replace(/http|https/, 'ws');
  const socket = new WebSocket(url), events = {}, api = {};

  socket.onmessage = function(message) {
    const { event, data } = JSON.parse(message.data);
    for (const listener of events[event]) {
      listener(data);
    }
  };

  api.socket = {
    ready: new Promise(resolve => {
      if (socket.readyState) {
        resolve();
      } else {
        let interval = setInterval(() => {
          if (socket.readyState) {
            resolve();
            clearInterval(interval);
          }
        });
      }
    }),
    on: function(event, listener) {
      if (event in events) {
        events[event].push(listener);
      } else {
        events[event] = [ listener ];
      }
    },
    send: function(event, data) {
      socket.send(JSON.stringify({
        event,
        data
      }));
    }
  };

  return api;
});
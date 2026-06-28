
const metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
};

function incrementRequests() {
  metrics.requests++;
}

function incrementErrors() {
  metrics.errors++;
}

function getMetrics() {
  return {
    requests: metrics.requests,
    errors: metrics.errors,
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000), // seconds
  };
}

module.exports = { incrementRequests, incrementErrors, getMetrics };
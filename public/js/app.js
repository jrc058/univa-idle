console.log("Univa Raids - Ready for adventure");

// API helper
async function api(path, opts) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// Check server health
api("/health").then(data => {
  console.log("Server status:", data);
});

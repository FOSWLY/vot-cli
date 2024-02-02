export default function parseProxy(proxyString) {
  // proxyString is a string in format [<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]
  try {
    const parsedData = new URL(proxyString);
    const { protocol, hostname, port, username, password } = parsedData;
    if (!protocol.startsWith("http")) {
      console.error("Only HTTP and HTTPS proxies are supported");
      return false;
    }

    return {
      protocol: protocol.replace(":", ""),
      host: hostname,
      port,
      ...(username && password
        ? {
            auth: {
              username,
              password,
            },
          }
        : {}),
    };
  } catch (e) {
    console.error("Failed to parse entered proxy. Error:", e);
    return false;
  }
}

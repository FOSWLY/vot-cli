function clearFileName(name) {
  return name.replace(/[^\w.-]/g, "");
}

export { clearFileName };

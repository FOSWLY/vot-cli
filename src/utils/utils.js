function clearFileName(name) {
  name = name.replace("/", "");
  name = name.replace("\\", "");
  name = name.replace("|", "");
  name = name.replace(":", "");
  name = name.replace("*", "");
  name = name.replace('"', "");
  name = name.replace("<", "");
  name = name.replace(">", "");
  return name;
}

export { clearFileName };

const os = require("os");

if (typeof os.availableParallelism !== "function") {
  os.availableParallelism = () => (os.cpus() ? os.cpus().length : 1);
}

import winston, { format } from "winston";

const logger = winston.createLogger({
  level: "error",
  transports: [new winston.transports.File({ filename: "logs/error.log" })],
  format: format.combine(format.timestamp(), format.json()),
});

export default logger;

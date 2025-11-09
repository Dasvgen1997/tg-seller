// Обертка для импорта StringSession из CommonJS модуля
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sessions = require("telegram/sessions");
export const StringSession = sessions.StringSession;


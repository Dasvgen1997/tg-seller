import "dotenv/config";
import express, { Request, Response } from "express";
import { TelegramClient } from "telegram";
import { StringSession } from "./telegram-sessions.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";

// Загружаем секретные данные из переменных окружения
const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "", 10);
const apiHash: string = process.env.TELEGRAM_API_HASH || "";
const telegramPassword: string = process.env.TELEGRAM_PASSWORD || "";
const port: number = parseInt(process.env.PORT || "3000", 10);

// Проверяем наличие обязательных переменных
if (!apiId || !apiHash) {
  throw new Error(
    "TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены в .env файле"
  );
}

// Путь к файлу с сессией
const SESSION_FILE = path.join(process.cwd(), "session.txt");

// Загружаем сохраненную сессию, если она есть
let savedSession = "";
if (fs.existsSync(SESSION_FILE)) {
  savedSession = fs.readFileSync(SESSION_FILE, "utf-8").trim();
  console.log("Загружена сохраненная сессия");
}

const stringSession = new StringSession(savedSession);

const app = express();

app.use(express.json());

interface SendMessageRequest {
  chat: string | number;
  message: string;
}

let client: TelegramClient | null = null;

async function getClient(): Promise<TelegramClient> {
  if (!client) {
    client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();

    // Проверяем авторизацию и авторизуемся, если необходимо
    if (!(await client.checkAuthorization())) {
      console.log(
        "Клиент не авторизован. Начинаем авторизацию через QR-код..."
      );
      console.log("Откройте Telegram на вашем телефоне и отсканируйте QR-код:");
      console.log("");

      try {
        await client.signInUserWithQrCode(
          { apiId, apiHash },
          {
            qrCode: async (qr: { token: Buffer }) => {
              // Отображаем QR-код в консоли
              // qr.token - это Buffer, нужно преобразовать в правильный формат
              // Telegram QR-код имеет формат: tg://login?token=...
              const token = qr.token.toString("base64url");
              const qrString = `tg://login?token=${token}`;
              qrcode.generate(qrString, { small: true });
              console.log("");
              console.log("Ожидание сканирования QR-кода...");
            },
            password: async () => telegramPassword,
            onError: (err: any) => {
              console.error("Ошибка авторизации:", err);
            },
          }
        );

        console.log("Авторизация успешна!");

        // Сохраняем сессию после успешной авторизации
        const sessionString = stringSession.save() as string;

        // Сохраняем сессию в файл
        fs.writeFileSync(SESSION_FILE, sessionString, "utf-8");
        console.log("Сессия сохранена в файл:", SESSION_FILE);
        console.log("Сессия:", sessionString);
      } catch (error) {
        console.error("Ошибка при авторизации:", error);
        throw error;
      }
    } else {
      console.log("Клиент уже авторизован с сохраненной сессией");
    }
  }
  return client;
}

app.post(
  "/send",
  async (req: Request<{}, {}, SendMessageRequest>, res: Response) => {
    try {
      const { chat, message } = req.body;

      if (!chat || !message) {
        return res.status(400).json({ error: "chat и message обязательны" });
      }

      const client = await getClient();
      await client.sendMessage(chat, { message });

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      res.status(500).json({
        error: "Ошибка при отправке сообщения",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

app.listen(port, () => console.log(`API запущен на порту ${port}`));

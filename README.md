# Telegram Mailer API

Простой API для отправки сообщений в Telegram через Express.js.

## Установка

```bash
npm install
```

## Настройка

Перед запуском необходимо настроить:
- `apiId` - ваш API ID из Telegram
- `apiHash` - ваш API Hash из Telegram
- `stringSession` - строка сессии Telegram

## Запуск

Сборка проекта:

```bash
npm run build
```

Запуск собранного проекта:

```bash
npm start
```

Для разработки с автоперезагрузкой (TypeScript):

```bash
npm run dev
```

## Использование

API будет доступен на `http://localhost:3000`

### Отправка сообщения

```bash
POST /send
Content-Type: application/json

{
  "chat": "username_or_chat_id",
  "message": "Текст сообщения"
}
```


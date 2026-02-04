import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <h1 className="text-3xl font-display font-bold mb-8">
          Условия использования
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            Последнее обновление: Февраль 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Общие положения</h2>
            <p>
              Настоящие Условия регулируют использование сервиса Toilab для
              планирования мероприятий. Используя сервис, вы соглашаетесь с
              данными условиями.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Услуги</h2>
            <p>Toilab предоставляет следующие услуги:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Создание и управление мероприятиями</li>
              <li>Управление списком гостей и RSVP</li>
              <li>Планирование бюджета</li>
              <li>Создание электронных приглашений</li>
              <li>Чек-листы для подготовки</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Аккаунт пользователя</h2>
            <p>
              Вы несёте ответственность за сохранность данных вашего аккаунта.
              Не передавайте свои учётные данные третьим лицам.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Оплата</h2>
            <p>
              Стоимость услуг указана на странице тарифов. Оплата производится
              через Kaspi Pay. Возврат средств возможен в течение 14 дней с
              момента оплаты.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Ограничение ответственности</h2>
            <p>
              Сервис предоставляется «как есть». Мы не несём ответственности за
              убытки, связанные с использованием сервиса.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Контакты</h2>
            <p>
              По вопросам использования сервиса: support@toilab.kz
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

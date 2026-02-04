import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Политика конфиденциальности
        </h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            Последнее обновление: Февраль 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Сбор информации</h2>
            <p>
              Мы собираем информацию, которую вы предоставляете при регистрации
              и использовании сервиса Toilab: имя, email, данные о мероприятиях
              и списки гостей.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Использование информации</h2>
            <p>Собранная информация используется для:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Предоставления и улучшения сервиса</li>
              <li>Отправки уведомлений о мероприятиях</li>
              <li>Технической поддержки пользователей</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Защита данных</h2>
            <p>
              Мы принимаем все необходимые меры для защиты ваших персональных
              данных от несанкционированного доступа, изменения или уничтожения.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Передача данных третьим лицам</h2>
            <p>
              Мы не продаём и не передаём ваши персональные данные третьим лицам,
              за исключением случаев, предусмотренных законодательством.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Контакты</h2>
            <p>
              По вопросам конфиденциальности обращайтесь: support@toilab.kz
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  Calendar,
  Users,
  Wallet,
  CheckSquare,
  Mail,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Бюджет",
    description: "Контролируйте расходы по категориям. Знайте, сколько потратили и сколько осталось.",
  },
  {
    icon: Users,
    title: "Гости и RSVP",
    description: "Управляйте списком гостей. Отправляйте приглашения и отслеживайте подтверждения.",
  },
  {
    icon: Mail,
    title: "Приглашения",
    description: "Красивые электронные приглашения с персональными ссылками для каждого гостя.",
  },
  {
    icon: CheckSquare,
    title: "Чек-лист",
    description: "Готовые списки задач по типу мероприятия. Ничего не забудете.",
  },
  {
    icon: Calendar,
    title: "Подрядчики",
    description: "Ведите учёт всех подрядчиков: фотограф, ведущий, декор. Статусы оплаты.",
  },
  {
    icon: Sparkles,
    title: "AI-генерация",
    description: "Создавайте уникальные приглашения с помощью искусственного интеллекта.",
  },
];

const plans = [
  {
    name: "Toilab",
    price: "0 ₸",
    description: "Попробуйте бесплатно",
    features: ["Бюджет и расходы", "Чек-лист задач", "1 мероприятие"],
    cta: "Начать бесплатно",
    highlight: false,
  },
  {
    name: "Toilab Pro",
    price: "7 990 ₸",
    description: "Для вашего мероприятия",
    features: [
      "Все функции",
      "Список гостей и RSVP",
      "Рассадка гостей",
      "Программа вечера",
      "Учёт подарков",
      "Поделиться с командой",
    ],
    cta: "Выбрать Pro",
    highlight: true,
  },
  {
    name: "Toilab Studio",
    price: "24 990 ₸",
    period: "/мес",
    description: "Для вашего агентства",
    features: [
      "Всё из Pro",
      "До 10 мероприятий",
      "Приоритетная поддержка",
      "Командный доступ",
    ],
    cta: "Выбрать Studio",
    highlight: false,
  },
];

const weddingFeatures = [
  "Список гостей и RSVP",
  "Бюджет и расходы",
  "Чек-лист задач",
  "Приглашения",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-display text-xl font-semibold">Toilab</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Возможности
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Тарифы
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-ghost btn-sm hidden sm:flex">
                Войти
              </Link>
              <Link href="/login" className="btn-primary btn-sm">
                Начать бесплатно
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Тойды жоспарла өзің!
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 animate-slide-up">
              Планируйте{" "}
              <span className="text-primary">свадьбу</span>
              <br />
              легко и красиво
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Гости, бюджет, задачи, приглашения — всё в одном месте.
              <br />
              Организуйте идеальную свадьбу без стресса.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/login" className="btn-primary btn-lg w-full sm:w-auto">
                Создать мероприятие
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#features" className="btn-outline btn-lg w-full sm:w-auto">
                Узнать больше
              </a>
            </div>
          </div>

          {/* Wedding features */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {weddingFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm"
              >
                <Check className="w-4 h-4 text-primary" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Всё для вашего мероприятия
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Инструменты, которые помогут организовать идеальное торжество
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Простые тарифы
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Выберите подходящий тариф. Без скрытых платежей.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${
                  plan.highlight ? "border-primary shadow-lg scale-105" : ""
                }`}
              >

                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    {plan.period && <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`w-full ${plan.highlight ? "btn-primary" : "btn-outline"} btn-md`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Оплата через Kaspi Pay. Мгновенное подключение.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Готовы начать планирование?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Создайте первое мероприятие бесплатно и оцените все возможности
          </p>
          <Link href="/login" className="btn bg-white text-primary hover:bg-white/90 btn-lg">
            Создать мероприятие
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-display text-xl font-semibold">Toilab</span>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2024 Toilab. Все права защищены.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

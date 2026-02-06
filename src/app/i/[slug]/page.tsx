"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { invitation } from "@/lib/api";
import { InvitationData } from "@/lib/types";

// Replace placeholders with actual event data
function renderTemplate(html: string, event: InvitationData["event"]): string {
  return html
    .replace(/\{\{person1\}\}/g, event.person1 || "")
    .replace(/\{\{person2\}\}/g, event.person2 || "")
    .replace(/\{\{date\}\}/g, event.date || "")
    .replace(/\{\{time\}\}/g, event.time || "")
    .replace(/\{\{venue\}\}/g, event.venue?.name || "")
    .replace(/\{\{address\}\}/g, event.venue?.address || "")
    .replace(/\{\{greeting\}\}/g, event.greetingRu || "")
    .replace(/\{\{greetingKz\}\}/g, event.greetingKz || "")
    .replace(/\{\{hashtag\}\}/g, event.hashtag || "");
}

export default function InvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [slug]);

  async function loadInvitation() {
    try {
      const invData = await invitation.get(slug);
      setData(invData);
    } catch (err) {
      console.error("Failed to load invitation:", err);
      setError("Приглашение не найдено");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-gray-800 mb-2">
            Приглашение не найдено
          </h1>
          <p className="text-gray-600">
            Проверьте ссылку или обратитесь к организаторам
          </p>
        </div>
      </div>
    );
  }

  const { event, template } = data;

  // If there's a custom HTML template, render it full-page
  if (template?.htmlTemplate) {
    const renderedHtml = renderTemplate(template.htmlTemplate, event);
    return (
      <iframe
        srcDoc={renderedHtml}
        className="w-full h-screen border-0"
        title="Приглашение"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  // Fallback: simple default template
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="text-center px-4">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
          {event.person1} <span className="text-rose-500">&</span> {event.person2}
        </h1>
        <p className="text-xl text-gray-600">
          {event.greetingRu || "Приглашаем вас на наше торжество"}
        </p>
        {event.date && <p className="mt-4 text-gray-500">{event.date}</p>}
      </div>
    </div>
  );
}

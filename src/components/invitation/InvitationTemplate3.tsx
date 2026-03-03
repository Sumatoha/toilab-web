"use client";

import { useEffect, useRef, useState } from "react";

interface InvitationTemplate3Props {
  person1: string;
  person2: string;
  eventDate: string;
  eventTime: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  guestName?: string;
  onConfirm?: () => void;
  onDecline?: () => void;
  showRsvpButtons?: boolean;
}

export function InvitationTemplate3({
  person1,
  person2,
  eventDate,
  eventTime,
  venueName,
  venueAddress,
  venueCity,
  guestName,
  onConfirm,
  onDecline,
  showRsvpButtons = false,
}: InvitationTemplate3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState({ days: "000", hours: "00", mins: "00", secs: "00" });
  const [isEventDay, setIsEventDay] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursor2Ref = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);

  // Parse date
  const dateObj = eventDate ? new Date(eventDate) : null;
  const day = dateObj ? dateObj.getDate() : 15;
  const month = dateObj ? dateObj.toLocaleDateString("ru-RU", { month: "long" }) : "июля";
  const year = dateObj ? dateObj.getFullYear() : 2026;
  const weekday = dateObj ? dateObj.toLocaleDateString("ru-RU", { weekday: "long" }) : "среда";
  const formattedDate = `${day} ${month} ${year}`;
  const shortDate = dateObj ? `${String(day).padStart(2, "0")} · ${String(dateObj.getMonth() + 1).padStart(2, "0")} · ${year}` : "15 · 07 · 2026";

  // Get first letters for monogram
  const initial1 = person1 ? person1.charAt(0).toUpperCase() : "А";
  const initial2 = person2 ? person2.charAt(0).toUpperCase() : "А";

  // Cursor effect
  useEffect(() => {
    const cursor = cursorRef.current;
    const cursor2 = cursor2Ref.current;
    if (!cursor || !cursor2) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let tx = mx;
    let ty = my;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    };

    const animate = () => {
      tx += (mx - tx) * 0.14;
      ty += (my - ty) * 0.14;
      cursor2.style.transform = `translate(${tx - 14}px, ${ty - 14}px)`;
      requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (scrollBarRef.current) {
        const progress = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        scrollBarRef.current.style.height = `${progress}%`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("on");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".rv").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Petal particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    class Petal {
      x: number = 0;
      y: number = 0;
      sz: number = 0;
      vy: number = 0;
      vx: number = 0;
      rot: number = 0;
      rs: number = 0;
      op: number = 0;
      c: boolean = false;

      constructor(initial: boolean) {
        this.reset(initial);
      }

      reset(initial: boolean) {
        this.x = Math.random() * canvas!.width;
        this.y = initial ? Math.random() * canvas!.height : -16;
        this.sz = Math.random() * 7 + 3;
        this.vy = Math.random() * 0.5 + 0.2;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.rot = Math.random() * Math.PI * 2;
        this.rs = (Math.random() - 0.5) * 0.018;
        this.op = Math.random() * 0.35 + 0.08;
        this.c = Math.random() > 0.5;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.y * 0.016) * 0.3;
        this.rot += this.rs;
        if (this.y > canvas!.height + 16) this.reset(false);
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot);
        ctx!.globalAlpha = this.op;
        ctx!.beginPath();
        ctx!.moveTo(0, -this.sz);
        ctx!.bezierCurveTo(this.sz * 0.7, -this.sz * 0.5, this.sz * 0.7, this.sz * 0.4, 0, this.sz * 0.25);
        ctx!.bezierCurveTo(-this.sz * 0.7, this.sz * 0.4, -this.sz * 0.7, -this.sz * 0.5, 0, -this.sz);
        ctx!.fillStyle = this.c ? "#D4897A" : "#A8C5A0";
        ctx!.fill();
        ctx!.restore();
      }
    }

    const petals = Array.from({ length: 30 }, () => new Petal(true));

    let animationId: number;
    const loop = () => {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      petals.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Click float symbols
  useEffect(() => {
    const fsyms = ["✦", "◇", "❧", "·", "—", "♦"];
    const fcols = ["#B85C38", "#A8C5A0", "#D4897A", "#8C7B6B"];

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 4; i++) {
        const el = document.createElement("div");
        el.className = "floating-sym";
        el.textContent = fsyms[Math.floor(Math.random() * fsyms.length)];
        el.style.cssText = `left:${e.clientX + (Math.random() - 0.5) * 30}px;top:${e.clientY}px;color:${fcols[Math.floor(Math.random() * fcols.length)]};animation-duration:${2 + Math.random() * 2}s;font-size:${12 + Math.random() * 14}px;animation-delay:${Math.random() * 0.2}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Countdown
  useEffect(() => {
    if (!eventDate) return;

    const targetDate = new Date(`${eventDate}T${eventTime || "18:00"}:00`);
    const pad = (n: number) => String(n).padStart(2, "0");

    const tick = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setIsEventDay(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({
        days: String(d).padStart(3, "0"),
        hours: pad(h),
        mins: pad(m),
        secs: pad(s),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  // Music toggle
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.volume = 0;
      audio.play().then(() => {
        setIsPlaying(true);
        let v = 0;
        const fadeIn = setInterval(() => {
          v = Math.min(v + 0.03, 0.5);
          audio.volume = v;
          if (v >= 0.5) clearInterval(fadeIn);
        }, 80);
      }).catch(() => {});
    } else {
      let v = audio.volume;
      const fadeOut = setInterval(() => {
        v = Math.max(v - 0.04, 0);
        audio.volume = v;
        if (v <= 0) {
          clearInterval(fadeOut);
          audio.pause();
          setIsPlaying(false);
        }
      }, 60);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@200;300;400&family=Bodoni+Moda:ital,wght@1,400;1,500&display=swap');

        :root {
          --ink: #0F0C09;
          --stone: #3A342C;
          --dust: #8C7B6B;
          --linen: #F8F3EC;
          --cream: #FDF9F4;
          --white: #FFFFFF;
          --blush: #F2DDD5;
          --sage: #D4E0D0;
          --warm: #E8DDD0;
          --accent: #B85C38;
        }

        body {
          cursor: none !important;
        }

        .t3-cur {
          width: 6px;
          height: 6px;
          background: var(--ink);
          border-radius: 50%;
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999;
        }

        .t3-cur2 {
          width: 28px;
          height: 28px;
          border: 1px solid var(--ink);
          border-radius: 50%;
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9998;
          transition: transform 0.12s ease, width 0.2s, height 0.2s;
        }

        .t3-spg {
          position: fixed;
          left: 0;
          top: 0;
          width: 1px;
          height: 0%;
          background: var(--ink);
          z-index: 999;
          opacity: 0.3;
        }

        .t3-mb {
          position: fixed;
          top: 28px;
          right: 32px;
          z-index: 1000;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(15, 12, 9, 0.25);
          border-radius: 50%;
          background: rgba(253, 249, 244, 0.85);
          backdrop-filter: blur(12px);
          cursor: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s;
        }

        .t3-mb:hover {
          border-color: var(--ink);
        }

        .t3-bars {
          display: flex;
          gap: 2.5px;
          align-items: flex-end;
          height: 16px;
        }

        .t3-bars span {
          display: block;
          width: 2.5px;
          background: var(--ink);
          border-radius: 1px;
          animation: t3-bd 0.8s ease-in-out infinite alternate;
        }

        .t3-bars span:nth-child(1) { height: 8px; }
        .t3-bars span:nth-child(2) { height: 14px; animation-delay: 0.14s; }
        .t3-bars span:nth-child(3) { height: 6px; animation-delay: 0.28s; }
        .t3-bars span:nth-child(4) { height: 11px; animation-delay: 0.07s; }

        .t3-bars.off span {
          animation-play-state: paused;
        }

        @keyframes t3-bd {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }

        .t3-page {
          display: flex;
          flex-direction: column;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          overflow-x: hidden;
        }

        .t3-hero {
          width: 100%;
          min-height: 100vh;
          background: var(--linen);
          display: grid;
          grid-template-rows: auto 1fr auto;
          position: relative;
          overflow: hidden;
        }

        .t3-hero-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 60px;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          border-bottom: 1px solid rgba(15, 12, 9, 0.08);
          position: relative;
          z-index: 2;
        }

        .t3-hero-stage {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: end;
          padding: 0 60px;
          position: relative;
          z-index: 2;
        }

        .t3-hero-left {
          padding-bottom: 80px;
        }

        .t3-issue-no {
          font-size: 10px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .t3-issue-no::before {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: var(--dust);
        }

        .t3-hero-names {
          font-family: 'Playfair Display', serif;
          font-size: clamp(64px, 8vw, 108px);
          font-weight: 400;
          line-height: 0.93;
          color: var(--ink);
          letter-spacing: -2px;
        }

        .t3-hero-names .italic {
          font-style: italic;
          color: var(--accent);
        }

        .t3-hero-names .block {
          display: block;
        }

        .t3-hero-subline {
          margin-top: 36px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .t3-hero-subline .date-str {
          font-size: 13px;
          font-weight: 300;
          letter-spacing: 2px;
          color: var(--stone);
        }

        .t3-hero-subline .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--dust);
        }

        .t3-hero-right {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding-bottom: 80px;
        }

        .t3-deco-num {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(200px, 28vw, 360px);
          font-weight: 400;
          color: var(--blush);
          line-height: 1;
          position: absolute;
          right: -20px;
          bottom: -40px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.7;
        }

        .t3-hero-right-text {
          position: relative;
          z-index: 2;
          text-align: right;
        }

        .t3-hero-right-text .label {
          font-size: 9px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          margin-bottom: 12px;
        }

        .t3-hero-right-text .place {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-style: italic;
          color: var(--stone);
          line-height: 1.2;
        }

        .t3-hero-right-text .place-sub {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--dust);
          margin-top: 6px;
          font-weight: 300;
        }

        .t3-hero-bottom {
          border-top: 1px solid rgba(15, 12, 9, 0.08);
          padding: 20px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          position: relative;
          z-index: 2;
        }

        .t3-hb-ticker {
          display: flex;
          gap: 40px;
        }

        .t3-pcanvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 3;
        }

        .t3-bar {
          background: var(--ink);
          color: var(--cream);
          padding: 40px 60px;
          display: flex;
          align-items: center;
          gap: 60px;
          overflow: hidden;
          position: relative;
        }

        .t3-bar-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(22px, 3vw, 34px);
          font-weight: 400;
          color: var(--linen);
          max-width: 640px;
          line-height: 1.5;
          flex-shrink: 0;
        }

        .t3-bar-quote em {
          color: var(--blush);
          font-style: normal;
        }

        .t3-bar-meta {
          margin-left: auto;
          text-align: right;
          flex-shrink: 0;
        }

        .t3-bar-meta .bm-num {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          font-style: italic;
          color: var(--warm);
          line-height: 1;
        }

        .t3-bar-meta .bm-lbl {
          font-size: 9px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(248, 243, 236, 0.4);
          font-weight: 300;
          margin-top: 4px;
        }

        .t3-cols {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          background: var(--cream);
        }

        .t3-col-cell {
          padding: 70px 48px;
          border-right: 1px solid rgba(15, 12, 9, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          transition: background 0.4s;
        }

        .t3-col-cell:last-child {
          border-right: none;
        }

        .t3-col-cell:hover {
          background: var(--linen);
        }

        .t3-col-num {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 80px;
          font-weight: 400;
          color: var(--warm);
          line-height: 1;
          margin-bottom: 16px;
        }

        .t3-col-label {
          font-size: 9px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          margin-bottom: 10px;
        }

        .t3-col-val {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 2.5vw, 30px);
          font-weight: 400;
          color: var(--ink);
          line-height: 1.2;
        }

        .t3-col-sub {
          font-size: 12px;
          font-weight: 300;
          color: var(--dust);
          margin-top: 10px;
          line-height: 1.5;
        }

        .t3-col-icon {
          width: 36px;
          height: 1px;
          background: var(--warm);
          margin-bottom: 24px;
        }

        .t3-marquee {
          background: var(--blush);
          padding: 18px 0;
          overflow: hidden;
          border-top: 1px solid rgba(15, 12, 9, 0.06);
          border-bottom: 1px solid rgba(15, 12, 9, 0.06);
        }

        .t3-marquee-track {
          display: flex;
          gap: 0;
          width: max-content;
          animation: t3-marquee 22s linear infinite;
        }

        .t3-marquee-item {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 18px;
          font-weight: 400;
          color: var(--stone);
          white-space: nowrap;
          padding: 0 32px;
        }

        .t3-marquee-sep {
          color: var(--accent);
          padding: 0 8px;
        }

        @keyframes t3-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .t3-venue {
          display: grid;
          grid-template-columns: 5fr 4fr;
          background: var(--sage);
          min-height: 70vh;
        }

        .t3-venue-left {
          padding: 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid rgba(15, 12, 9, 0.1);
        }

        .t3-venue-eyebrow {
          font-size: 9px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: var(--stone);
          font-weight: 300;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .t3-venue-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--stone);
        }

        .t3-venue-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(44px, 6vw, 80px);
          font-weight: 400;
          color: var(--ink);
          line-height: 1;
          margin-bottom: 16px;
        }

        .t3-venue-title em {
          font-style: italic;
          color: var(--stone);
        }

        .t3-venue-addr {
          font-size: 14px;
          font-weight: 300;
          color: var(--stone);
          letter-spacing: 0.5px;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .t3-venue-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--ink);
          padding: 12px 24px;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--ink);
          transition: background 0.3s, color 0.3s;
          cursor: none;
          background: transparent;
        }

        .t3-venue-tag:hover {
          background: var(--ink);
          color: var(--cream);
        }

        .t3-venue-tag svg {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
        }

        .t3-venue-right {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
        }

        .t3-botanical {
          width: min(340px, 80%);
          opacity: 0.85;
        }

        .t3-countdown {
          background: var(--ink);
          padding: 100px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .t3-cd-eyebrow {
          font-size: 9px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: rgba(248, 243, 236, 0.35);
          font-weight: 300;
          margin-bottom: 48px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .t3-cd-eyebrow::before,
        .t3-cd-eyebrow::after {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: rgba(248, 243, 236, 0.2);
        }

        .t3-cd-row {
          display: flex;
          align-items: flex-start;
          gap: 0;
          border-top: 1px solid rgba(248, 243, 236, 0.1);
          border-left: 1px solid rgba(248, 243, 236, 0.1);
        }

        .t3-cd-cell {
          padding: 40px 48px;
          border-right: 1px solid rgba(248, 243, 236, 0.1);
          border-bottom: 1px solid rgba(248, 243, 236, 0.1);
          text-align: center;
          flex: 1;
          min-width: 130px;
          transition: background 0.3s;
        }

        .t3-cd-cell:hover {
          background: rgba(248, 243, 236, 0.04);
        }

        .t3-cd-big {
          font-family: 'Playfair Display', serif;
          font-size: clamp(52px, 7vw, 88px);
          font-weight: 400;
          font-style: italic;
          color: var(--linen);
          line-height: 1;
          letter-spacing: -2px;
          transition: opacity 0.18s;
        }

        .t3-cd-lbl {
          font-size: 8px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: rgba(248, 243, 236, 0.3);
          font-weight: 300;
          margin-top: 12px;
        }

        .t3-cd-done {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(36px, 5vw, 56px);
          color: var(--blush);
          text-align: center;
        }

        .t3-rsvp {
          background: var(--blush);
          padding: 120px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
          position: relative;
          overflow: hidden;
        }

        .t3-rsvp-left .eyebrow {
          font-size: 9px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: var(--dust);
          font-weight: 300;
          margin-bottom: 20px;
        }

        .t3-rsvp-left .big {
          font-family: 'Playfair Display', serif;
          font-size: clamp(48px, 7vw, 88px);
          font-weight: 400;
          line-height: 0.95;
          color: var(--ink);
          margin-bottom: 16px;
        }

        .t3-rsvp-left .big em {
          font-style: italic;
          color: var(--accent);
        }

        .t3-rsvp-left .sub {
          font-size: 13px;
          font-weight: 300;
          color: var(--stone);
          line-height: 1.6;
        }

        .t3-rsvp-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        .t3-rsvp-btn {
          padding: 18px 48px;
          background: var(--ink);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 4px;
          text-transform: uppercase;
          border: none;
          cursor: none;
          position: relative;
          overflow: hidden;
          transition: opacity 0.3s;
        }

        .t3-rsvp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .t3-rsvp-btn:hover::after {
          transform: scaleX(1);
        }

        .t3-rsvp-btn span {
          position: relative;
          z-index: 1;
        }

        .t3-rsvp-btn-decline {
          padding: 18px 48px;
          background: transparent;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 4px;
          text-transform: uppercase;
          border: 1px solid var(--ink);
          cursor: none;
          transition: background 0.3s, color 0.3s;
        }

        .t3-rsvp-btn-decline:hover {
          background: var(--ink);
          color: var(--cream);
        }

        .t3-rsvp-deco {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(100px, 16vw, 200px);
          font-weight: 400;
          color: rgba(15, 12, 9, 0.05);
          line-height: 1;
          position: absolute;
          right: -20px;
          bottom: -20px;
          pointer-events: none;
          white-space: nowrap;
        }

        .t3-footer {
          background: var(--ink);
          padding: 32px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .t3-footer-l {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 22px;
          color: rgba(248, 243, 236, 0.5);
        }

        .t3-footer-r {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(248, 243, 236, 0.2);
          font-weight: 300;
        }

        .t3-footer-r a {
          color: rgba(248, 243, 236, 0.3);
          text-decoration: none;
          transition: color 0.2s;
        }

        .t3-footer-r a:hover {
          color: rgba(248, 243, 236, 0.6);
        }

        .rv {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .rv.on {
          opacity: 1;
          transform: none;
        }

        .rv1 { transition-delay: 0.12s; }
        .rv2 { transition-delay: 0.24s; }
        .rv3 { transition-delay: 0.38s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ha0 { opacity: 0; animation: fadeUp 0.9s 0.1s ease forwards; }
        .ha1 { opacity: 0; animation: fadeUp 1s 0.3s ease forwards; }
        .ha2 { opacity: 0; animation: fadeUp 0.8s 0.6s ease forwards; }
        .ha3 { opacity: 0; animation: fadeUp 0.8s 0.8s ease forwards; }
        .ha4 { opacity: 0; animation: fadeUp 0.8s 1s ease forwards; }

        .floating-sym {
          position: fixed;
          pointer-events: none;
          z-index: 10;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          animation: fsym linear forwards;
          opacity: 0;
        }

        @keyframes fsym {
          0% { opacity: 0; transform: translateY(0) scale(0.4); }
          8% { opacity: 0.7; }
          90% { opacity: 0.2; }
          100% { opacity: 0; transform: translateY(-110vh) scale(1.2); }
        }

        @media (max-width: 800px) {
          .t3-hero-nav { padding: 24px 28px; }
          .t3-hero-stage { grid-template-columns: 1fr; padding: 0 28px; }
          .t3-hero-right { display: none; }
          .t3-hero-bottom { padding: 16px 28px; flex-wrap: wrap; gap: 8px; }
          .t3-bar { padding: 32px 28px; flex-direction: column; gap: 24px; }
          .t3-bar-meta { margin-left: 0; text-align: left; }
          .t3-cols { grid-template-columns: 1fr; }
          .t3-col-cell { border-right: none; border-bottom: 1px solid rgba(15, 12, 9, 0.08); padding: 48px 28px; }
          .t3-venue { grid-template-columns: 1fr; }
          .t3-venue-right { display: none; }
          .t3-venue-left { padding: 60px 28px; }
          .t3-rsvp { grid-template-columns: 1fr; padding: 80px 28px; gap: 40px; }
          .t3-countdown { padding: 80px 28px; }
          .t3-cd-cell { padding: 28px 20px; min-width: 80px; }
          .t3-footer { padding: 24px 28px; }
        }
      `}</style>

      <div ref={cursorRef} className="t3-cur" />
      <div ref={cursor2Ref} className="t3-cur2" />
      <div ref={scrollBarRef} className="t3-spg" />
      <canvas ref={canvasRef} className="t3-pcanvas" />

      <audio ref={audioRef} loop>
        <source src="https://www.bensound.com/bensound-music/bensound-romantic.mp3" type="audio/mpeg" />
      </audio>
      <button className="t3-mb" onClick={toggleMusic}>
        <div className={`t3-bars ${!isPlaying ? "off" : ""}`}>
          <span></span><span></span><span></span><span></span>
        </div>
      </button>

      <div className="t3-page">
        {/* HERO */}
        <section className="t3-hero">
          <nav className="t3-hero-nav ha0">
            <span>{person1} &amp; {person2}</span>
            <span>Свадебное торжество</span>
            <span>{shortDate}</span>
          </nav>

          <div className="t3-hero-stage">
            <div className="t3-hero-left">
              <div className="t3-issue-no ha1">
                {guestName ? `Приглашение для ${guestName}` : "Приглашение"}
              </div>
              <h1 className="t3-hero-names ha2">
                <span className="block">{person1}</span>
                <span className="block italic">&amp; {person2}</span>
              </h1>
              <div className="t3-hero-subline ha3">
                <span className="date-str">{weekday}, {formattedDate}</span>
                <div className="dot"></div>
                <span className="date-str">{venueCity || "Алматы"}</span>
                <div className="dot"></div>
                <span className="date-str">{eventTime || "18:00"}</span>
              </div>
            </div>
            <div className="t3-hero-right ha3">
              <div className="t3-deco-num">{day}</div>
              <div className="t3-hero-right-text">
                <div className="label">Место проведения</div>
                <div className="place">{venueName || "Grand Hall"}</div>
                <div className="place-sub">{venueAddress || ""}</div>
              </div>
            </div>
          </div>

          <div className="t3-hero-bottom ha4">
            <span>С любовью приглашаем вас</span>
            <div className="t3-hb-ticker">
              <span>Церемония · {eventTime || "18:00"}</span>
              <span>Банкет · 19:00</span>
              <span>Вечерний дресс-код</span>
            </div>
          </div>
        </section>

        {/* INK BAR */}
        <div className="t3-bar rv">
          <div className="t3-bar-quote">
            Разделите этот <em>особенный вечер</em> с нами.
          </div>
          <div className="t3-bar-meta">
            <div className="bm-num">{countdown.days}</div>
            <div className="bm-lbl">дней осталось</div>
          </div>
        </div>

        {/* THREE COLS */}
        <section className="t3-cols">
          <div className="t3-col-cell rv">
            <div className="t3-col-icon"></div>
            <div className="t3-col-num">01</div>
            <div className="t3-col-label">Время начала</div>
            <div className="t3-col-val">{eventTime || "18:00"}</div>
            <div className="t3-col-sub">Церемония — {eventTime || "18:00"}<br />Торжественный банкет — 19:00<br />Конец вечера — 23:30</div>
          </div>
          <div className="t3-col-cell rv rv1">
            <div className="t3-col-icon"></div>
            <div className="t3-col-num">02</div>
            <div className="t3-col-label">Дресс-код</div>
            <div className="t3-col-val">Вечерний</div>
            <div className="t3-col-sub">Цвета: чёрный, пудровый,<br />лаванда, шампань,<br />глубокий синий</div>
          </div>
          <div className="t3-col-cell rv rv2">
            <div className="t3-col-icon"></div>
            <div className="t3-col-num">03</div>
            <div className="t3-col-label">Просьба</div>
            <div className="t3-col-val">RSVP</div>
            <div className="t3-col-sub">Подтвердите участие<br />до {Number(day) - 14 > 0 ? Number(day) - 14 : 1} {month} {year}</div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="t3-marquee">
          <div className="t3-marquee-track">
            <span className="t3-marquee-item">{person1} <span className="t3-marquee-sep">&amp;</span> {person2}</span>
            <span className="t3-marquee-item">{formattedDate} <span className="t3-marquee-sep">·</span> {venueCity || "Алматы"}</span>
            <span className="t3-marquee-item">{venueName || "Grand Hall"} <span className="t3-marquee-sep">·</span> {venueAddress || ""}</span>
            <span className="t3-marquee-item">Церемония <span className="t3-marquee-sep">·</span> Банкет <span className="t3-marquee-sep">·</span> Вечер</span>
            <span className="t3-marquee-item">{person1} <span className="t3-marquee-sep">&amp;</span> {person2}</span>
            <span className="t3-marquee-item">{formattedDate} <span className="t3-marquee-sep">·</span> {venueCity || "Алматы"}</span>
            <span className="t3-marquee-item">{venueName || "Grand Hall"} <span className="t3-marquee-sep">·</span> {venueAddress || ""}</span>
            <span className="t3-marquee-item">Церемония <span className="t3-marquee-sep">·</span> Банкет <span className="t3-marquee-sep">·</span> Вечер</span>
          </div>
        </div>

        {/* VENUE */}
        <section className="t3-venue">
          <div className="t3-venue-left rv">
            <div className="t3-venue-eyebrow">Место торжества</div>
            <h2 className="t3-venue-title">{venueName || "Grand Hall"}<br /><em>{venueCity || "Almaty"}</em></h2>
            <p className="t3-venue-addr">{venueAddress || ""}<br />{venueCity || "Алматы"}, Казахстан</p>
            <button className="t3-venue-tag">
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
              <span>Посмотреть на карте</span>
            </button>
          </div>
          <div className="t3-venue-right rv rv1">
            <svg className="t3-botanical" viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M170 400 C170 350 165 300 160 240" stroke="#6B8C6B" strokeWidth="2" fill="none" />
              <path d="M170 400 C170 350 175 300 180 240" stroke="#6B8C6B" strokeWidth="1.5" fill="none" />
              <path d="M170 400 C155 360 140 320 120 270" stroke="#7A9470" strokeWidth="1.5" fill="none" />
              <path d="M170 400 C185 360 200 320 220 270" stroke="#7A9470" strokeWidth="1.5" fill="none" />
              <path d="M160 320 C140 305 110 300 80 310" stroke="#6B8C6B" strokeWidth="1.5" fill="none" />
              <path d="M180 320 C200 305 230 300 260 310" stroke="#6B8C6B" strokeWidth="1.5" fill="none" />
              <path d="M160 320 C140 305 110 300 80 310 C100 285 140 290 160 320Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1.2" opacity=".85" />
              <path d="M120 270 C95 252 70 258 50 272 C68 248 105 250 120 270Z" fill="#BDD4B5" stroke="#6B8C6B" strokeWidth="1.2" opacity=".75" />
              <path d="M180 320 C200 305 230 300 260 310 C240 285 200 290 180 320Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1.2" opacity=".85" />
              <path d="M220 270 C245 252 270 258 290 272 C272 248 235 250 220 270Z" fill="#BDD4B5" stroke="#6B8C6B" strokeWidth="1.2" opacity=".75" />
              <circle cx="165" cy="200" r="42" fill="#E8D0C8" stroke="#B89080" strokeWidth="1.5" opacity=".4" />
              <circle cx="165" cy="200" r="32" fill="#F0D8D0" stroke="#B89080" strokeWidth="1.5" opacity=".6" />
              <circle cx="165" cy="200" r="22" fill="#F5DED5" stroke="#C09888" strokeWidth="1.5" opacity=".8" />
              <circle cx="165" cy="200" r="12" fill="#FAE8E0" stroke="#C09888" strokeWidth="1.5" />
              <circle cx="165" cy="200" r="5" fill="#D4897A" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(0 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(45 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(90 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(135 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(180 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(225 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(270 165 200)" />
              <ellipse cx="165" cy="158" rx="10" ry="18" fill="#F0D0C5" stroke="#B89080" strokeWidth="1" opacity=".7" transform="rotate(315 165 200)" />
              <path d="M100 170 C85 155 80 130 95 115" stroke="#6B8C6B" strokeWidth="1.5" fill="none" />
              <circle cx="92" cy="125" r="20" fill="#E8D4D0" stroke="#B89080" strokeWidth="1.2" opacity=".5" />
              <circle cx="92" cy="125" r="12" fill="#F0DDD8" stroke="#B89080" strokeWidth="1.2" opacity=".7" />
              <circle cx="92" cy="125" r="5" fill="#E0A898" />
              <path d="M92 105 C78 95 72 78 80 64 C86 80 88 95 92 105Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1" opacity=".8" />
              <path d="M92 125 C75 122 65 110 68 95 C78 108 85 120 92 125Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1" opacity=".8" />
              <path d="M230 170 C245 155 250 130 235 115" stroke="#6B8C6B" strokeWidth="1.5" fill="none" />
              <circle cx="238" cy="125" r="20" fill="#E8D4D0" stroke="#B89080" strokeWidth="1.2" opacity=".5" />
              <circle cx="238" cy="125" r="12" fill="#F0DDD8" stroke="#B89080" strokeWidth="1.2" opacity=".7" />
              <circle cx="238" cy="125" r="5" fill="#E0A898" />
              <path d="M238 105 C252 95 258 78 250 64 C244 80 242 95 238 105Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1" opacity=".8" />
              <path d="M238 125 C255 122 265 110 262 95 C252 108 245 120 238 125Z" fill="#A8C5A0" stroke="#6B8C6B" strokeWidth="1" opacity=".8" />
              <circle cx="130" cy="245" r="3" fill="#D4897A" opacity=".6" />
              <circle cx="205" cy="250" r="2.5" fill="#D4897A" opacity=".5" />
              <circle cx="145" cy="160" r="2" fill="#6B8C6B" opacity=".5" />
              <circle cx="185" cy="155" r="2" fill="#6B8C6B" opacity=".5" />
            </svg>
          </div>
        </section>

        {/* COUNTDOWN */}
        <section className="t3-countdown">
          <div className="t3-cd-eyebrow rv">До торжества</div>
          {!isEventDay ? (
            <div className="t3-cd-row rv rv1">
              <div className="t3-cd-cell"><div className="t3-cd-big">{countdown.days}</div><div className="t3-cd-lbl">дней</div></div>
              <div className="t3-cd-cell"><div className="t3-cd-big">{countdown.hours}</div><div className="t3-cd-lbl">часов</div></div>
              <div className="t3-cd-cell"><div className="t3-cd-big">{countdown.mins}</div><div className="t3-cd-lbl">минут</div></div>
              <div className="t3-cd-cell"><div className="t3-cd-big">{countdown.secs}</div><div className="t3-cd-lbl">секунд</div></div>
            </div>
          ) : (
            <p className="t3-cd-done rv rv1">Сегодня наш день</p>
          )}
        </section>

        {/* RSVP */}
        <section className="t3-rsvp">
          <div className="t3-rsvp-left rv">
            <div className="eyebrow">Подтверждение участия</div>
            <div className="big">Разделите<br /><em>этот вечер</em></div>
            <p className="sub">Просим подтвердить ваше участие<br />до {Number(day) - 14 > 0 ? Number(day) - 14 : 1} {month} {year} года.</p>
          </div>
          <div className="t3-rsvp-right rv rv1">
            {showRsvpButtons && (
              <>
                <button className="t3-rsvp-btn" onClick={onConfirm}>
                  <span>Подтвердить присутствие</span>
                </button>
                <button className="t3-rsvp-btn-decline" onClick={onDecline}>
                  <span>К сожалению, не смогу</span>
                </button>
              </>
            )}
          </div>
          <div className="t3-rsvp-deco">{initial1}&amp;{initial2}</div>
        </section>

        {/* FOOTER */}
        <footer className="t3-footer">
          <div className="t3-footer-l">{person1} &amp; {person2} · {year}</div>
          <div className="t3-footer-r">Сделано с любовью при помощи <a href="https://toilab.kz" target="_blank" rel="noopener noreferrer">Toilab</a></div>
        </footer>
      </div>
    </>
  );
}

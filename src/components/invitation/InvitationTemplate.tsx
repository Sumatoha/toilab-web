"use client";

import { useEffect, useRef, useState } from "react";

interface InvitationTemplateProps {
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

export function InvitationTemplate({
  person1,
  person2,
  eventDate,
  eventTime,
  venueName,
  venueAddress,
  onConfirm,
  onDecline,
  showRsvpButtons = true,
}: InvitationTemplateProps) {
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const petalsCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isEventPassed, setIsEventPassed] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showMusicTooltip, setShowMusicTooltip] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse date
  const eventDateTime = eventDate ? new Date(eventDate) : null;
  if (eventDateTime && eventTime) {
    const [hours, minutes] = eventTime.split(":").map(Number);
    eventDateTime.setHours(hours, minutes, 0, 0);
  }

  const day = eventDateTime?.getDate() || 15;
  const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
  const month = eventDateTime ? monthNames[eventDateTime.getMonth()] : "Июля";
  const year = eventDateTime?.getFullYear() || 2026;

  // Cursor effect
  useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - 3.5}px, ${my - 3.5}px)`;
      }
    };

    const animateRing = () => {
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate(${mx - 15}px, ${my - 15}px)`;
      }
      animationId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", handleMouseMove);
    animateRing();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Scroll bar
  useEffect(() => {
    const handleScroll = () => {
      const p = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollBarRef.current) {
        scrollBarRef.current.style.height = `${p}%`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Stars canvas
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: { x: number; y: number; r: number; speed: number; phase: number }[] = [];
    let animationId: number;

    const initStars = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.007 + 0.002,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawStars = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const a = ((Math.sin(t * s.speed + s.phase) + 1) / 2) * 0.72 + 0.08;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,213,163,${a})`;
        ctx.fill();
      });
    };

    const loop = (t: number) => {
      drawStars(t * 0.001);
      animationId = requestAnimationFrame(loop);
    };

    initStars();
    animationId = requestAnimationFrame(loop);

    const handleResize = () => initStars();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Petals canvas
  useEffect(() => {
    const canvas = petalsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    class Petal {
      x: number = 0;
      y: number = 0;
      sz: number = 0;
      vy: number = 0;
      vx: number = 0;
      rot: number = 0;
      rs: number = 0;
      op: number = 0;
      gold: boolean = false;

      constructor(init: boolean) {
        this.reset(init);
      }

      reset(init: boolean) {
        this.x = Math.random() * canvas!.width;
        this.y = init ? Math.random() * canvas!.height : -20;
        this.sz = Math.random() * 10 + 4;
        this.vy = Math.random() * 0.65 + 0.25;
        this.vx = (Math.random() - 0.5) * 0.55;
        this.rot = Math.random() * Math.PI * 2;
        this.rs = (Math.random() - 0.5) * 0.022;
        this.op = Math.random() * 0.42 + 0.12;
        this.gold = Math.random() > 0.5;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.y * 0.018) * 0.35;
        this.rot += this.rs;
        if (this.y > canvas!.height + 20) this.reset(false);
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot);
        ctx!.globalAlpha = this.op;
        const [r, g, b] = this.gold ? [201, 168, 76] : [212, 137, 122];
        ctx!.beginPath();
        ctx!.moveTo(0, -this.sz);
        ctx!.bezierCurveTo(this.sz * 0.8, -this.sz * 0.5, this.sz * 0.8, this.sz * 0.5, 0, this.sz * 0.28);
        ctx!.bezierCurveTo(-this.sz * 0.8, this.sz * 0.5, -this.sz * 0.8, -this.sz * 0.5, 0, -this.sz);
        ctx!.fillStyle = `rgba(${r},${g},${b},.85)`;
        ctx!.fill();
        ctx!.restore();
      }
    }

    let petals: Petal[] = [];
    let animationId: number;

    const initPetals = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      petals = Array.from({ length: 40 }, () => new Petal(true));
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(loop);
    };

    initPetals();
    animationId = requestAnimationFrame(loop);

    const handleResize = () => initPetals();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (!eventDateTime) return;

    const tick = () => {
      const now = new Date();
      const diff = eventDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsEventPassed(true);
        return;
      }

      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [eventDateTime]);

  // Scroll reveal
  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Music tooltip
  useEffect(() => {
    const t1 = setTimeout(() => setShowMusicTooltip(true), 2000);
    const t2 = setTimeout(() => setShowMusicTooltip(false), 5800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Click effect
  const handleClick = (e: React.MouseEvent) => {
    const syms = ["♡", "❀", "✦", "✫", "❅", "♢", "❧"];
    const cols = ["#c9a84c", "#e8d5a3", "#d4897a", "rgba(255,255,255,.5)"];

    for (let i = 0; i < 5; i++) {
      const el = document.createElement("div");
      el.className = "floating-sym";
      el.innerHTML = syms[Math.floor(Math.random() * syms.length)];
      el.style.cssText = `left:${e.clientX + (Math.random() - 0.5) * 48}px;top:${e.clientY}px;color:${cols[Math.floor(Math.random() * cols.length)]};animation-duration:${1.8 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.3}s;font-size:${9 + Math.random() * 14}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
  };

  // Music toggle
  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicPlaying) {
      audio.volume = 0;
      audio.play().then(() => {
        setMusicPlaying(true);
        let v = 0;
        const fi = setInterval(() => {
          v = Math.min(v + 0.03, 0.55);
          audio.volume = v;
          if (v >= 0.55) clearInterval(fi);
        }, 80);
      }).catch(() => {});
    } else {
      let v = audio.volume;
      const fo = setInterval(() => {
        v = Math.max(v - 0.04, 0);
        audio.volume = v;
        if (v <= 0) {
          clearInterval(fo);
          audio.pause();
          setMusicPlaying(false);
        }
      }, 60);
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="invitation-page" onClick={handleClick}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Great+Vibes&family=Montserrat:wght@200;300;400&display=swap');

        .invitation-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .invitation-page {
          --gold: #c9a84c;
          --gold-light: #e8d5a3;
          --gold-dark: #8b6914;
          --cream: #fdf6e9;
          --dark: #0d0a05;
          --rose: #d4897a;
          background: var(--dark);
          font-family: 'Montserrat', sans-serif;
          overflow-x: hidden;
          cursor: none;
          color: var(--cream);
          min-height: 100vh;
        }
        .cursor { width: 7px; height: 7px; background: var(--gold); border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); }
        .cursor-ring { width: 30px; height: 30px; border: 1px solid rgba(201,168,76,.45); border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9998; transform: translate(-50%, -50%); }
        .music-btn { position: fixed; top: 28px; right: 32px; z-index: 1000; width: 48px; height: 48px; border: 1px solid rgba(201,168,76,.5); border-radius: 50%; background: rgba(13,10,5,.75); backdrop-filter: blur(10px); cursor: none; display: flex; align-items: center; justify-content: center; transition: border-color .3s, transform .3s; }
        .music-btn:hover { border-color: var(--gold); transform: scale(1.1); }
        .music-bars { display: flex; gap: 3px; align-items: flex-end; height: 18px; }
        .music-bars span { display: block; width: 3px; background: var(--gold); border-radius: 2px; animation: bar-dance .8s ease-in-out infinite alternate; }
        .music-bars span:nth-child(1) { height: 10px; animation-delay: 0s; }
        .music-bars span:nth-child(2) { height: 16px; animation-delay: .15s; }
        .music-bars span:nth-child(3) { height: 8px; animation-delay: .3s; }
        .music-bars span:nth-child(4) { height: 14px; animation-delay: .1s; }
        .music-bars.paused span { animation-play-state: paused; }
        @keyframes bar-dance { from { transform: scaleY(.4); } to { transform: scaleY(1); } }
        .music-tooltip { position: fixed; top: 32px; right: 92px; background: rgba(13,10,5,.9); border: 1px solid rgba(201,168,76,.25); color: var(--gold-light); font-size: 10px; letter-spacing: 2px; padding: 8px 16px; pointer-events: none; opacity: 0; transition: opacity .4s; font-weight: 200; }
        .music-tooltip.show { opacity: 1; }
        .scroll-bar { position: fixed; left: 0; top: 0; width: 2px; height: 0%; background: linear-gradient(180deg, var(--gold), var(--rose)); z-index: 999; }
        #stars-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        #petals-canvas { position: fixed; inset: 0; z-index: 2; pointer-events: none; }
        .page { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 100%; }

        .s-hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; width: 100%; }
        .ornament-svg { width: clamp(260px, 50vw, 360px); opacity: 0; animation: fadeUp 1.2s .3s forwards; }
        .invite-label { font-weight: 200; font-size: 10px; letter-spacing: 7px; text-transform: uppercase; color: var(--gold); margin-top: 40px; opacity: 0; animation: fadeUp 1s .7s forwards; }
        .names-wrap { margin-top: 20px; opacity: 0; animation: fadeUp 1.2s 1s forwards; text-align: center; }
        .name-a, .name-b { font-family: 'Great Vibes', cursive; font-size: clamp(68px, 11vw, 120px); color: var(--gold-light); line-height: .95; text-shadow: 0 0 80px rgba(201,168,76,.25); }
        .names-amp { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: clamp(30px, 4vw, 46px); color: var(--gold); line-height: 1.3; display: block; margin: 2px 0; }
        .hero-divider { display: flex; align-items: center; gap: 16px; margin-top: 36px; width: min(400px, 90vw); opacity: 0; animation: fadeUp 1s 1.4s forwards; }
        .hdl { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .hdd { width: 7px; height: 7px; border: 1px solid var(--gold); transform: rotate(45deg); animation: spin-slow 8s linear infinite; flex-shrink: 0; }
        @keyframes spin-slow { to { transform: rotate(405deg); } }
        .hero-date { margin-top: 28px; text-align: center; opacity: 0; animation: fadeUp 1s 1.7s forwards; }
        .hero-date-num { font-family: 'Cormorant Garamond', serif; font-size: clamp(56px, 9vw, 88px); font-weight: 300; color: var(--cream); line-height: 1; letter-spacing: -3px; }
        .hero-date-sub { font-weight: 200; font-size: 11px; letter-spacing: 6px; color: var(--gold); text-transform: uppercase; margin-top: 6px; }

        .s-divider { width: 100%; display: flex; justify-content: center; padding: 20px 0; }
        .s-divider svg { width: clamp(200px, 40vw, 300px); }

        .s-details { padding: 60px 24px 80px; width: 100%; max-width: 800px; margin: 0 auto; }
        .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; border: 1px solid rgba(201,168,76,.15); background: rgba(201,168,76,.08); }
        .detail-card { background: rgba(13,10,5,.85); padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; transition: background .4s; }
        .detail-card:hover { background: rgba(201,168,76,.06); }
        .detail-icon-wrap { width: 44px; height: 44px; border: 1px solid rgba(201,168,76,.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .detail-icon-wrap svg { width: 20px; height: 20px; fill: none; stroke: var(--gold); stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
        .detail-label { font-size: 8px; letter-spacing: 5px; text-transform: uppercase; color: var(--gold-dark); font-weight: 300; }
        .detail-val { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; color: var(--cream); line-height: 1.3; }

        .s-rings { padding: 40px 24px 80px; display: flex; flex-direction: column; align-items: center; width: 100%; }
        .rings-outer-wrap { position: relative; width: 160px; height: 160px; margin: 0 auto; }
        .ring { position: absolute; border-radius: 50%; border: 1px solid var(--gold); }
        .ring-1 { width: 160px; height: 160px; top: 0; left: 0; opacity: .12; animation: pr 4s ease-in-out infinite; }
        .ring-2 { width: 120px; height: 120px; top: 20px; left: 20px; opacity: .25; animation: pr 4s .6s ease-in-out infinite; }
        .ring-3 { width: 82px; height: 82px; top: 39px; left: 39px; opacity: .55; border-color: var(--gold-light); animation: pr 4s 1.2s ease-in-out infinite; }
        .ring-4 { width: 44px; height: 44px; top: 58px; left: 58px; opacity: .9; border-color: var(--cream); animation: pr 4s 1.8s ease-in-out infinite; }
        .ring-center { width: 10px; height: 10px; background: var(--gold); border-radius: 50%; position: absolute; top: 75px; left: 75px; animation: glow-dot 2.5s ease-in-out infinite; }
        @keyframes pr { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes glow-dot { 0%, 100% { box-shadow: 0 0 6px var(--gold); } 50% { box-shadow: 0 0 24px var(--gold), 0 0 50px rgba(201,168,76,.35); } }
        .rings-caption { margin-top: 32px; font-family: 'Great Vibes', cursive; font-size: clamp(28px, 5vw, 42px); color: var(--gold-light); text-align: center; }
        .rings-sub { font-size: 10px; letter-spacing: 5px; text-transform: uppercase; color: var(--gold-dark); font-weight: 200; margin-top: 8px; }

        .s-venue { padding: 60px 24px 80px; width: 100%; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
        .section-label { font-size: 9px; letter-spacing: 7px; text-transform: uppercase; color: var(--gold-dark); font-weight: 200; margin-bottom: 20px; }
        .venue-card { border: 1px solid rgba(201,168,76,.2); padding: 56px 48px; display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; background: rgba(201,168,76,.03); position: relative; }
        .venue-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .venue-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .venue-icon { width: 48px; height: 48px; border: 1px solid rgba(201,168,76,.35); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .venue-icon svg { width: 22px; height: 22px; fill: none; stroke: var(--gold); stroke-width: 1.2; stroke-linecap: round; }
        .venue-label-text { font-size: 8px; letter-spacing: 6px; text-transform: uppercase; color: var(--gold-dark); font-weight: 200; }
        .venue-name { font-family: 'Cormorant Garamond', serif; font-size: clamp(26px, 4vw, 36px); font-weight: 300; color: var(--cream); text-align: center; line-height: 1.2; }
        .venue-addr { font-size: 11px; letter-spacing: 3px; color: rgba(253,246,233,.4); text-transform: uppercase; font-weight: 200; text-align: center; }
        .venue-sep { width: 40px; height: 1px; background: rgba(201,168,76,.3); }

        .s-countdown { padding: 80px 24px; width: 100%; display: flex; flex-direction: column; align-items: center; }
        .countdown-wrap { display: flex; align-items: center; gap: 0; margin-top: 32px; flex-wrap: wrap; justify-content: center; }
        .cd-unit { display: flex; flex-direction: column; align-items: center; gap: 12px; min-width: 120px; padding: 32px 16px; }
        .cd-num { font-family: 'Cormorant Garamond', serif; font-size: clamp(56px, 9vw, 88px); font-weight: 300; color: var(--cream); line-height: 1; letter-spacing: -2px; position: relative; transition: opacity .2s; }
        .cd-num::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 30px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .cd-label { font-size: 8px; letter-spacing: 6px; text-transform: uppercase; color: var(--gold-dark); font-weight: 200; margin-top: 12px; }
        .cd-sep { display: flex; flex-direction: column; align-items: center; gap: 5px; padding-bottom: 28px; opacity: .4; }
        .cd-sep span { width: 3px; height: 3px; border-radius: 50%; background: var(--gold); }
        .cd-sep span:nth-child(2) { opacity: .5; }
        .cd-done { font-family: 'Great Vibes', cursive; font-size: clamp(36px, 6vw, 56px); color: var(--gold-light); text-align: center; margin-top: 24px; }
        @media (max-width: 500px) { .cd-unit { min-width: 80px; padding: 24px 8px; } .cd-sep { display: none; } }

        .s-rsvp { padding: 80px 24px 120px; display: flex; flex-direction: column; align-items: center; width: 100%; }
        .rsvp-label { font-size: 9px; letter-spacing: 7px; text-transform: uppercase; color: var(--gold-dark); font-weight: 200; margin-bottom: 24px; }
        .rsvp-heading { font-family: 'Great Vibes', cursive; font-size: clamp(44px, 7vw, 72px); color: var(--gold-light); text-align: center; line-height: 1; margin-bottom: 8px; }
        .rsvp-sub { font-size: 11px; letter-spacing: 3px; color: rgba(253,246,233,.35); text-transform: uppercase; font-weight: 200; margin-bottom: 40px; text-align: center; }
        .rsvp-buttons { display: flex; flex-direction: column; gap: 16px; align-items: center; }
        .rsvp-btn { padding: 16px 56px; border: 1px solid var(--gold); background: transparent; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase; color: var(--gold); cursor: none; position: relative; overflow: hidden; transition: color .4s; }
        .rsvp-btn::before { content: ''; position: absolute; inset: 0; background: var(--gold); transform: translateX(-101%); transition: transform .4s ease; }
        .rsvp-btn:hover::before { transform: translateX(0); }
        .rsvp-btn:hover { color: var(--dark); }
        .rsvp-btn span { position: relative; z-index: 1; }
        .rsvp-btn-decline { border-color: rgba(201,168,76,.3); color: rgba(201,168,76,.5); }
        .rsvp-btn-decline::before { background: rgba(201,168,76,.2); }
        .rsvp-btn-decline:hover { color: var(--cream); }

        .s-footer { padding: 32px 24px 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; border-top: 1px solid rgba(201,168,76,.1); }
        .footer-names { font-family: 'Great Vibes', cursive; font-size: 28px; color: rgba(201,168,76,.4); }
        .footer-year { font-size: 9px; letter-spacing: 5px; text-transform: uppercase; color: rgba(253,246,233,.15); font-weight: 200; }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity .9s ease, transform .9s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: .1s; }
        .reveal-d2 { transition-delay: .22s; }
        .reveal-d3 { transition-delay: .36s; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .floating-sym { position: fixed; pointer-events: none; z-index: 10; animation: float-sym linear forwards; opacity: 0; }
        @keyframes float-sym { 0% { opacity: 0; transform: translateY(0) scale(.5) rotate(0deg); } 10% { opacity: .8; } 90% { opacity: .3; } 100% { opacity: 0; transform: translateY(-120vh) scale(1.4) rotate(25deg); } }

        @media (max-width: 600px) {
          .details-grid { grid-template-columns: 1fr; }
          .detail-card { padding: 28px 20px; flex-direction: row; text-align: left; gap: 18px; }
          .venue-card { padding: 36px 24px; }
        }
      `}</style>

      <div className="cursor" ref={cursorRef}></div>
      <div className="cursor-ring" ref={cursorRingRef}></div>
      <div className="scroll-bar" ref={scrollBarRef}></div>
      <canvas id="stars-canvas" ref={starsCanvasRef}></canvas>
      <canvas id="petals-canvas" ref={petalsCanvasRef}></canvas>

      <audio ref={audioRef} loop>
        <source src="https://www.bensound.com/bensound-music/bensound-romantic.mp3" type="audio/mpeg" />
      </audio>

      <button className="music-btn" onClick={toggleMusic}>
        <div className={`music-bars ${!musicPlaying ? "paused" : ""}`}>
          <span></span><span></span><span></span><span></span>
        </div>
      </button>
      <div className={`music-tooltip ${showMusicTooltip ? "show" : ""}`}>♪ нажмите для музыки</div>

      <div className="page">
        {/* HERO */}
        <section className="s-hero">
          <svg className="ornament-svg" viewBox="0 0 360 56" fill="none">
            <line x1="0" y1="28" x2="130" y2="28" stroke="url(#og1)" strokeWidth=".7"/>
            <path d="M140 28L152 16L164 28L152 40Z" stroke="#c9a84c" strokeWidth=".8" fill="none"/>
            <path d="M162 28L172 19L182 28L172 37Z" stroke="#c9a84c" strokeWidth=".5" fill="none" opacity=".5"/>
            <circle cx="180" cy="28" r="2.5" fill="#c9a84c"/>
            <path d="M198 28L188 19L178 28L188 37Z" stroke="#c9a84c" strokeWidth=".5" fill="none" opacity=".5"/>
            <path d="M220 28L208 16L196 28L208 40Z" stroke="#c9a84c" strokeWidth=".8" fill="none"/>
            <line x1="230" y1="28" x2="360" y2="28" stroke="url(#og2)" strokeWidth=".7"/>
            <defs>
              <linearGradient id="og1" x1="0" y1="0" x2="130" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c" stopOpacity="0"/><stop offset="100%" stopColor="#c9a84c"/></linearGradient>
              <linearGradient id="og2" x1="230" y1="0" x2="360" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c"/><stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/></linearGradient>
            </defs>
          </svg>
          <p className="invite-label">С радостью приглашаем вас на торжество</p>
          <div className="names-wrap">
            <div className="name-a">{person1 || "Имя"}</div>
            <span className="names-amp">&amp;</span>
            <div className="name-b">{person2 || "Имя"}</div>
          </div>
          <div className="hero-divider">
            <div className="hdl"></div><div className="hdd"></div><div className="hdl"></div>
          </div>
          <div className="hero-date">
            <div className="hero-date-num">{day}</div>
            <div className="hero-date-sub">{month} &nbsp;·&nbsp; {year}</div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="s-divider reveal">
          <svg viewBox="0 0 240 30" fill="none">
            <line x1="0" y1="15" x2="90" y2="15" stroke="url(#sd3)" strokeWidth=".6"/>
            <path d="M95 15L103 8L111 15L103 22Z" stroke="#c9a84c" strokeWidth=".7" fill="none"/>
            <circle cx="120" cy="15" r="1.5" fill="#c9a84c" opacity=".5"/>
            <path d="M129 15L137 8L145 15L137 22Z" stroke="#c9a84c" strokeWidth=".7" fill="none"/>
            <line x1="150" y1="15" x2="240" y2="15" stroke="url(#sd4)" strokeWidth=".6"/>
            <defs>
              <linearGradient id="sd3" x1="0" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c" stopOpacity="0"/><stop offset="100%" stopColor="#c9a84c" stopOpacity=".4"/></linearGradient>
              <linearGradient id="sd4" x1="150" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c" stopOpacity=".4"/><stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/></linearGradient>
            </defs>
          </svg>
        </div>

        {/* DETAILS */}
        <section className="s-details reveal" style={{ width: "100%" }}>
          <div className="details-grid">
            <div className="detail-card reveal">
              <div className="detail-icon-wrap">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 15.5"/></svg>
              </div>
              <div>
                <div className="detail-label">Начало церемонии</div>
                <div className="detail-val">{eventTime || "18:00"}</div>
              </div>
            </div>
            <div className="detail-card reveal reveal-d1">
              <div className="detail-icon-wrap">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <div className="detail-label">Дресс-код</div>
                <div className="detail-val">Вечерний</div>
              </div>
            </div>
            <div className="detail-card reveal reveal-d2">
              <div className="detail-icon-wrap">
                <svg viewBox="0 0 24 24"><path d="M8 3h8l-1.5 9H9.5z"/><path d="M9.5 12L12 21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>
              </div>
              <div>
                <div className="detail-label">Банкет</div>
                <div className="detail-val">19:00</div>
              </div>
            </div>
          </div>
        </section>

        {/* RINGS */}
        <section className="s-rings">
          <div className="rings-outer-wrap reveal">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
            <div className="ring ring-4"></div>
            <div className="ring-center"></div>
          </div>
          <p className="rings-caption reveal reveal-d1">Навсегда</p>
          <p className="rings-sub reveal reveal-d2">{day} · {String(eventDateTime?.getMonth() ? eventDateTime.getMonth() + 1 : 7).padStart(2, "0")} · {year}</p>
        </section>

        {/* VENUE */}
        {(venueName || venueAddress) && (
          <section className="s-venue">
            <p className="section-label reveal">Место торжества</p>
            <div className="venue-card reveal reveal-d1">
              <div className="venue-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <p className="venue-label-text">Место проведения</p>
              {venueName && <p className="venue-name">{venueName}</p>}
              <div className="venue-sep"></div>
              {venueAddress && <p className="venue-addr">{venueAddress}</p>}
            </div>
          </section>
        )}

        {/* DIVIDER */}
        <div className="s-divider reveal">
          <svg viewBox="0 0 300 40" fill="none">
            <line x1="0" y1="20" x2="115" y2="20" stroke="url(#sd5)" strokeWidth=".6"/>
            <path d="M120 20L130 12L140 20L130 28Z" stroke="#c9a84c" strokeWidth=".7" fill="none"/>
            <circle cx="150" cy="20" r="2" fill="#c9a84c" opacity=".6"/>
            <path d="M160 20L170 12L180 20L170 28Z" stroke="#c9a84c" strokeWidth=".7" fill="none"/>
            <line x1="185" y1="20" x2="300" y2="20" stroke="url(#sd6)" strokeWidth=".6"/>
            <defs>
              <linearGradient id="sd5" x1="0" y1="0" x2="115" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c" stopOpacity="0"/><stop offset="100%" stopColor="#c9a84c" stopOpacity=".4"/></linearGradient>
              <linearGradient id="sd6" x1="185" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c9a84c" stopOpacity=".4"/><stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/></linearGradient>
            </defs>
          </svg>
        </div>

        {/* COUNTDOWN */}
        <section className="s-countdown">
          <p className="section-label reveal">До торжества осталось</p>
          {isEventPassed ? (
            <p className="cd-done">Сегодня наш день ❁</p>
          ) : (
            <div className="countdown-wrap reveal reveal-d1">
              <div className="cd-unit">
                <div className="cd-num">{pad(countdown.days)}</div>
                <div className="cd-label">дней</div>
              </div>
              <div className="cd-sep"><span></span><span></span><span></span></div>
              <div className="cd-unit">
                <div className="cd-num">{pad(countdown.hours)}</div>
                <div className="cd-label">часов</div>
              </div>
              <div className="cd-sep"><span></span><span></span><span></span></div>
              <div className="cd-unit">
                <div className="cd-num">{pad(countdown.mins)}</div>
                <div className="cd-label">минут</div>
              </div>
              <div className="cd-sep"><span></span><span></span><span></span></div>
              <div className="cd-unit">
                <div className="cd-num">{pad(countdown.secs)}</div>
                <div className="cd-label">секунд</div>
              </div>
            </div>
          )}
        </section>

        {/* RSVP */}
        {showRsvpButtons && (
          <section className="s-rsvp">
            <p className="rsvp-label reveal">Подтверждение</p>
            <p className="rsvp-heading reveal reveal-d1">Ждём вас</p>
            <p className="rsvp-sub reveal reveal-d2">Просим подтвердить присутствие</p>
            <div className="rsvp-buttons">
              <button className="rsvp-btn reveal reveal-d3" onClick={onConfirm}>
                <span>Подтвердить присутствие</span>
              </button>
              <button className="rsvp-btn rsvp-btn-decline reveal reveal-d3" onClick={onDecline}>
                <span>К сожалению, не смогу</span>
              </button>
            </div>
          </section>
        )}

        {/* FOOTER ORNAMENT */}
        <div className="s-divider reveal">
          <svg viewBox="0 0 300 50" fill="none">
            <path d="M150 6C130 6 118 17 118 27C118 37 130 45 150 45C170 45 182 37 182 27C182 17 170 6 150 6Z" stroke="#c9a84c" strokeWidth=".6" fill="none" opacity=".3"/>
            <path d="M150 15C136 15 128 20 128 27C128 34 136 38 150 38C164 38 172 34 172 27C172 20 164 15 150 15Z" stroke="#c9a84c" strokeWidth=".6" fill="none" opacity=".55"/>
            <circle cx="150" cy="27" r="3" fill="#c9a84c" opacity=".7"/>
            <path d="M117 27Q90 15 58 19Q35 21 12 17" stroke="#c9a84c" strokeWidth=".6" fill="none" opacity=".4"/>
            <path d="M58 19Q52 10 45 15" stroke="#c9a84c" strokeWidth=".5" fill="none" opacity=".35"/>
            <path d="M35 21Q30 13 22 18" stroke="#c9a84c" strokeWidth=".4" fill="none" opacity=".25"/>
            <path d="M183 27Q210 15 242 19Q265 21 288 17" stroke="#c9a84c" strokeWidth=".6" fill="none" opacity=".4"/>
            <path d="M242 19Q248 10 255 15" stroke="#c9a84c" strokeWidth=".5" fill="none" opacity=".35"/>
            <path d="M265 21Q270 13 278 18" stroke="#c9a84c" strokeWidth=".4" fill="none" opacity=".25"/>
          </svg>
        </div>

        <footer className="s-footer">
          <p className="footer-names">{person1} &amp; {person2}</p>
          <p className="footer-year">{year}</p>
        </footer>
      </div>
    </div>
  );
}

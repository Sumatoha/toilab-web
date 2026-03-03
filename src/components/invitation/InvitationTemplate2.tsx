"use client";

import { useEffect, useRef, useState } from "react";

interface InvitationTemplate2Props {
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

export function InvitationTemplate2({
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
}: InvitationTemplate2Props) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursor2Ref = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicBarsRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);

  // Parse date
  const eventDateTime = eventDate ? new Date(eventDate) : null;
  const day = eventDateTime ? eventDateTime.getDate() : "15";
  const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
  const month = eventDateTime ? monthNames[eventDateTime.getMonth()] : "Июля";
  const year = eventDateTime ? eventDateTime.getFullYear() : "2026";

  // Parse time
  const mainTime = eventTime || "18:00";
  const [hours] = mainTime.split(":");
  const banquetHour = hours ? String(Number(hours) + 1).padStart(2, "0") + ":00" : "19:00";
  const endHour = hours ? String(Number(hours) + 5).padStart(2, "0") + ":30" : "23:30";

  // City parsing
  const city = venueCity || "Алматы";

  useEffect(() => {
    // Cursor animation
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let t2x = mx;
    let t2y = my;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - 8}px, ${my - 8}px)`;
      }
    };

    const animateCursor2 = () => {
      t2x += (mx - t2x) * 0.18;
      t2y += (my - t2y) * 0.18;
      if (cursor2Ref.current) {
        cursor2Ref.current.style.transform = `translate(${t2x - 5}px, ${t2y - 5}px)`;
      }
      requestAnimationFrame(animateCursor2);
    };

    document.addEventListener("mousemove", handleMouseMove);
    animateCursor2();

    // Scroll progress
    const handleScroll = () => {
      if (scrollBarRef.current) {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        scrollBarRef.current.style.width = `${scrollPercent}%`;
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Reveal animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Burst effect on click
    const handleClick = (e: MouseEvent) => {
      burst(e.clientX, e.clientY);
    };
    document.addEventListener("click", handleClick);

    // Countdown
    const targetDate = eventDateTime || new Date("2026-07-15T18:00:00");
    const countdownInterval = setInterval(() => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        const doneEl = document.getElementById("cd-done");
        const rowEl = document.querySelector(".cd-row");
        if (doneEl) doneEl.style.display = "block";
        if (rowEl) (rowEl as HTMLElement).style.display = "none";
        clearInterval(countdownInterval);
        return;
      }
      const daysEl = document.getElementById("cd-days");
      const hoursEl = document.getElementById("cd-hours");
      const minsEl = document.getElementById("cd-mins");
      const secsEl = document.getElementById("cd-secs");

      if (daysEl) daysEl.textContent = String(Math.floor(diff / 86400000)).padStart(3, "0");
      if (hoursEl) flipValue(hoursEl, String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"));
      if (minsEl) flipValue(minsEl, String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"));
      if (secsEl) flipValue(secsEl, String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"));
    }, 1000);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      clearInterval(countdownInterval);
      observer.disconnect();
    };
  }, [eventDateTime]);

  const flipValue = (el: HTMLElement, val: string) => {
    if (el.textContent !== val) {
      el.style.opacity = "0";
      setTimeout(() => {
        el.textContent = val;
        el.style.opacity = "1";
      }, 170);
    }
  };

  const burst = (ex: number, ey: number) => {
    const syms = ["★", "♡", "✦", "✿", "◆", "●"];
    const cols = ["#FFD030", "#FF7EB3", "#7ED9B0", "#5BB4F5", "#A07EE8", "#FF8C5A"];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("div");
      el.className = "burst";
      el.textContent = syms[Math.floor(Math.random() * syms.length)];
      const a = Math.random() * Math.PI * 2;
      const d = 50 + Math.random() * 70;
      el.style.cssText = `left:${ex}px;top:${ey}px;color:${cols[Math.floor(Math.random() * cols.length)]};--bx:${Math.cos(a) * d}px;--by:${Math.sin(a) * d}px;font-size:${14 + Math.floor(Math.random() * 18)}px;animation-delay:${Math.random() * 0.12}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  };

  const handleMusicToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.volume = 0;
      audio.play().then(() => {
        setIsPlaying(true);
        musicBarsRef.current?.classList.remove("paused");
        let v = 0;
        const fadeIn = setInterval(() => {
          v = Math.min(v + 0.04, 0.55);
          audio.volume = v;
          if (v >= 0.55) clearInterval(fadeIn);
        }, 80);
      }).catch(() => {});
    } else {
      let v = audio.volume;
      const fadeOut = setInterval(() => {
        v = Math.max(v - 0.05, 0);
        audio.volume = v;
        if (v <= 0) {
          clearInterval(fadeOut);
          audio.pause();
          setIsPlaying(false);
          musicBarsRef.current?.classList.add("paused");
        }
      }, 60);
    }
  };

  const handleRsvpClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    setRsvpDone(true);
    btn.textContent = "Ура! До встречи! ✨";
    btn.style.background = "var(--mint2)";
    const r = btn.getBoundingClientRect();
    const symbols = ["★", "♡", "✿", "✦", "🎉"];
    const colors = ["#FFD030", "#FF7EB3", "#7ED9B0", "#A07EE8"];
    for (let i = 0; i < 20; i++) {
      const el = document.createElement("div");
      el.className = "burst";
      el.textContent = symbols[Math.floor(Math.random() * 5)];
      const a = Math.random() * Math.PI * 2;
      const d = 70 + Math.random() * 100;
      el.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;color:${colors[Math.floor(Math.random() * 4)]};--bx:${Math.cos(a) * d}px;--by:${Math.sin(a) * d}px;font-size:${18 + Math.floor(Math.random() * 20)}px;animation-delay:${Math.random() * 0.25}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
    if (onConfirm) onConfirm();
  };

  return (
    <>
      <style jsx global>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --peach:#FFD6C0;--peach2:#FFB899;--peach3:#FF8C5A;
          --mint:#C8F0E0;--mint2:#7ED9B0;
          --sky:#C4E4FF;--sky2:#5BB4F5;
          --lav:#E2D4FF;--lav2:#A07EE8;
          --yell:#FFF0A0;--yell2:#FFD030;
          --pink:#FFD6E7;--pink2:#FF7EB3;
          --dark:#1E1408;--mid:#7A5C3A;--lite:#FFFBF5;
        }
        html{scroll-behavior:smooth}
        body{background:var(--lite);font-family:'Nunito',sans-serif;overflow-x:hidden;cursor:none;color:var(--dark)}

        .cursor{width:16px;height:16px;border-radius:50%;background:var(--pink2);position:fixed;top:0;left:0;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:multiply}
        .cursor2{width:10px;height:10px;border-radius:50%;background:var(--yell2);position:fixed;top:0;left:0;pointer-events:none;z-index:9998;transform:translate(-50%,-50%)}

        .music-btn{position:fixed;top:20px;right:20px;z-index:1000;width:54px;height:54px;border:3px solid var(--dark);border-radius:50%;background:var(--yell);cursor:none;display:flex;align-items:center;justify-content:center;box-shadow:4px 4px 0 var(--dark);transition:transform .15s,box-shadow .15s}
        .music-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--dark)}
        .music-bars{display:flex;gap:3px;align-items:flex-end;height:20px}
        .music-bars span{display:block;width:4px;background:var(--dark);border-radius:2px;animation:bd .7s ease-in-out infinite alternate}
        .music-bars span:nth-child(1){height:10px}
        .music-bars span:nth-child(2){height:18px;animation-delay:.12s}
        .music-bars span:nth-child(3){height:8px;animation-delay:.25s}
        .music-bars span:nth-child(4){height:14px;animation-delay:.08s}
        .music-bars.paused span{animation-play-state:paused}
        @keyframes bd{from{transform:scaleY(.3)}to{transform:scaleY(1)}}

        .scroll-bar{position:fixed;top:0;left:0;width:0%;height:5px;background:repeating-linear-gradient(90deg,var(--peach2) 0,var(--peach2) 12px,var(--pink2) 12px,var(--pink2) 24px,var(--yell2) 24px,var(--yell2) 36px,var(--mint2) 36px,var(--mint2) 48px);z-index:999}

        .page{display:flex;flex-direction:column;width:100%;overflow:hidden}

        .s-hero{
          min-height:100vh;width:100%;
          background:var(--yell);
          position:relative;display:grid;
          grid-template-columns:1fr 1fr;
          align-items:center;
          padding:80px 60px 140px;
          gap:40px;
          overflow:hidden;
        }
        .s-hero::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:100px;background:var(--lite);clip-path:polygon(0 100%,100% 100%,100% 30%,75% 0%,50% 60%,25% 0%,0 30%)}

        .hero-left{position:relative;z-index:2}
        .hero-tag{display:inline-block;background:var(--dark);color:var(--yell);font-family:'Caveat',cursive;font-size:18px;font-weight:700;padding:6px 18px;border-radius:4px;letter-spacing:1px;margin-bottom:20px;transform:rotate(-2deg)}
        .hero-title{font-family:'Caveat',cursive;font-weight:700;font-size:clamp(60px,8vw,96px);line-height:.95;color:var(--dark)}
        .hero-title .line2{color:var(--pink2);display:block;transform:rotate(-1.5deg);margin-left:8px}
        .hero-title .amp{color:var(--peach3);font-size:.6em;display:inline-block;animation:rock 3s ease-in-out infinite}
        @keyframes rock{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
        .hero-date-pill{display:inline-flex;align-items:center;gap:12px;background:white;border:3px solid var(--dark);border-radius:999px;padding:12px 24px;box-shadow:5px 5px 0 var(--dark);margin-top:28px}
        .hero-date-pill .num{font-family:'Caveat',cursive;font-size:36px;font-weight:700;color:var(--dark);line-height:1}
        .hero-date-pill .sep{width:2px;height:32px;background:var(--dark);border-radius:1px}
        .hero-date-pill .text{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--mid);line-height:1.3}

        .hero-right{position:relative;z-index:2;display:flex;justify-content:center;align-items:center}
        .hero-illo{width:min(320px,80vw);height:min(320px,80vw);animation:float 5s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}

        .bg-shape{position:absolute;pointer-events:none;z-index:1}

        .zigzag{width:100%;height:32px;background:var(--dark);flex-shrink:0;clip-path:polygon(0 0,2% 100%,4% 0,6% 100%,8% 0,10% 100%,12% 0,14% 100%,16% 0,18% 100%,20% 0,22% 100%,24% 0,26% 100%,28% 0,30% 100%,32% 0,34% 100%,36% 0,38% 100%,40% 0,42% 100%,44% 0,46% 100%,48% 0,50% 100%,52% 0,54% 100%,56% 0,58% 100%,60% 0,62% 100%,64% 0,66% 100%,68% 0,70% 100%,72% 0,74% 100%,76% 0,78% 100%,80% 0,82% 100%,84% 0,86% 100%,88% 0,90% 100%,92% 0,94% 100%,96% 0,98% 100%,100% 0,100% 100%,0 100%)}

        .s-split{display:grid;grid-template-columns:1fr 1fr;min-height:60vh;width:100%}
        .split-left{background:var(--mint);padding:80px 60px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
        .split-right{background:var(--lav);padding:80px 60px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
        .split-label{font-size:10px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:var(--mid);margin-bottom:12px}
        .split-big{font-family:'Caveat',cursive;font-size:clamp(36px,5vw,60px);font-weight:700;color:var(--dark);line-height:1.1;margin-bottom:16px}
        .split-val{font-family:'Caveat',cursive;font-size:clamp(52px,8vw,88px);font-weight:700;color:var(--dark);line-height:1}
        .split-sub{font-size:13px;font-weight:600;color:var(--mid);margin-top:8px}
        .swatches{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
        .swatch{width:44px;height:44px;border-radius:50%;border:3px solid var(--dark);box-shadow:3px 3px 0 var(--dark);transition:transform .2s;cursor:none}
        .swatch:hover{transform:scale(1.15) rotate(10deg)}

        .s-venue{width:100%;background:var(--peach);padding:80px 60px;position:relative;overflow:hidden}
        .venue-inner{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1000px;margin:0 auto}
        .venue-text .sticker{display:inline-block;background:var(--dark);color:white;font-family:'Caveat',cursive;font-size:16px;font-weight:700;padding:4px 16px;border-radius:4px;margin-bottom:16px;transform:rotate(2deg)}
        .venue-name-big{font-family:'Caveat',cursive;font-size:clamp(44px,6vw,72px);font-weight:700;color:var(--dark);line-height:1;margin-bottom:12px}
        .venue-addr-line{font-size:15px;font-weight:700;color:var(--mid);margin-bottom:24px}
        .venue-badge{display:inline-flex;gap:10px;align-items:center;background:white;border:3px solid var(--dark);border-radius:16px;padding:12px 20px;box-shadow:4px 4px 0 var(--dark)}
        .venue-badge svg{width:20px;height:20px;fill:none;stroke:var(--dark);stroke-width:2.5;stroke-linecap:round}
        .venue-badge span{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
        .venue-map-card{background:white;border:4px solid var(--dark);border-radius:28px;overflow:hidden;box-shadow:8px 8px 0 var(--dark);height:280px;position:relative;display:flex;align-items:center;justify-content:center}
        .venue-map-card .map-placeholder{width:100%;height:100%}

        .s-countdown{width:100%;background:var(--sky);padding:80px 40px;display:flex;flex-direction:column;align-items:center;position:relative;overflow:hidden}
        .cd-title{font-family:'Caveat',cursive;font-size:clamp(36px,5vw,56px);font-weight:700;color:var(--dark);text-align:center;margin-bottom:40px}
        .cd-row{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;justify-content:center}
        .cd-box{background:white;border:4px solid var(--dark);border-radius:20px;padding:24px 20px;text-align:center;box-shadow:6px 6px 0 var(--dark);min-width:120px;transition:transform .15s}
        .cd-box:hover{transform:translateY(-6px) rotate(-1deg)}
        .cd-num{font-family:'Caveat',cursive;font-size:clamp(52px,8vw,80px);font-weight:700;color:var(--dark);line-height:1;transition:opacity .18s}
        .cd-lbl{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--mid);margin-top:6px}
        .cd-sep{font-family:'Caveat',cursive;font-size:64px;font-weight:700;color:var(--peach2);margin-top:16px;animation:blink .9s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        .cd-done{font-family:'Caveat',cursive;font-size:clamp(36px,6vw,56px);font-weight:700;color:var(--pink2);text-align:center}

        .s-rsvp{width:100%;background:var(--pink);padding:100px 40px 120px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center}
        .s-rsvp::before{content:'';position:absolute;top:-3px;left:0;right:0;height:80px;background:var(--sky);clip-path:polygon(0 0,100% 0,100% 100%,0 100%);clip-path:ellipse(55% 100% at 50% 0%)}
        .rsvp-big{font-family:'Caveat',cursive;font-size:clamp(56px,10vw,110px);font-weight:700;color:var(--dark);text-align:center;line-height:.9;margin-bottom:8px}
        .rsvp-big span{color:var(--pink2);display:block}
        .rsvp-note{font-size:14px;font-weight:700;color:var(--mid);text-align:center;margin-bottom:36px;letter-spacing:.5px}
        .rsvp-btn{font-family:'Caveat',cursive;font-size:28px;font-weight:700;color:white;background:var(--dark);border:4px solid var(--dark);border-radius:999px;padding:16px 52px;box-shadow:6px 6px 0 var(--mid);cursor:none;transition:transform .15s,box-shadow .15s;display:inline-block}
        .rsvp-btn:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--mid)}
        .rsvp-btn-decline{font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:var(--mid);background:transparent;border:3px solid var(--mid);border-radius:999px;padding:12px 36px;cursor:none;transition:transform .15s;display:inline-block;margin-top:16px}
        .rsvp-btn-decline:hover{transform:scale(1.05)}
        .rsvp-contact{margin-top:24px;font-size:14px;font-weight:700;color:var(--mid)}
        .rsvp-contact a{color:var(--dark);text-decoration:underline 2px}

        .rsvp-doodle{position:absolute;opacity:.15;pointer-events:none}

        .s-footer{background:var(--dark);padding:40px 24px;text-align:center}
        .footer-names{font-family:'Caveat',cursive;font-size:40px;font-weight:700;color:var(--yell)}
        .footer-heart{font-size:24px;margin-top:6px}
        .footer-toilab{font-size:10px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,.25);margin-top:16px;text-transform:uppercase}
        .footer-toilab a{color:rgba(255,255,255,.35);text-decoration:none}
        .footer-toilab a:hover{color:rgba(255,255,255,.6)}

        .reveal{opacity:0;transform:translateY(20px);transition:opacity .65s,transform .65s}
        .reveal.visible{opacity:1;transform:translateY(0)}
        .rv1{transition-delay:.1s}.rv2{transition-delay:.2s}.rv3{transition-delay:.32s}

        .burst{position:fixed;pointer-events:none;z-index:9999;animation:bfx .85s ease-out forwards}
        @keyframes bfx{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(var(--bx),var(--by)) scale(.2) rotate(180deg)}}

        @keyframes popIn{from{opacity:0;transform:scale(.5) rotate(-5deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}

        @media(max-width:700px){
          .s-hero{grid-template-columns:1fr;padding:60px 24px 120px;text-align:center}
          .hero-right{display:none}
          .s-split{grid-template-columns:1fr}
          .venue-inner{grid-template-columns:1fr}
          .venue-map-card{height:200px}
          .split-left,.split-right{padding:60px 28px}
          .s-venue{padding:60px 28px}
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:wght@300;400;600;700;800&display=swap" rel="stylesheet" />

      <div className="cursor" ref={cursorRef}></div>
      <div className="cursor2" ref={cursor2Ref}></div>
      <div className="scroll-bar" ref={scrollBarRef}></div>

      <audio ref={audioRef} loop>
        <source src="https://www.bensound.com/bensound-music/bensound-romantic.mp3" type="audio/mpeg" />
      </audio>
      <button className="music-btn" onClick={handleMusicToggle}>
        <div className={`music-bars ${isPlaying ? "" : "paused"}`} ref={musicBarsRef}>
          <span></span><span></span><span></span><span></span>
        </div>
      </button>

      <div className="page">
        {/* HERO */}
        <section className="s-hero">
          {/* bg scattered shapes */}
          <svg className="bg-shape" style={{top:"8%",left:"5%",width:"60px",opacity:0.4,animation:"rock 4s infinite"}} viewBox="0 0 60 60"><path d="M30 5l6 18h19l-15 11 6 18L30 41 14 52l6-18L5 23h19z" fill="none" stroke="#1E1408" strokeWidth="2.5"/></svg>
          <svg className="bg-shape" style={{top:"15%",right:"5%",width:"44px",opacity:0.3,animation:"rock 5s 1s infinite"}} viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="#1E1408" strokeWidth="2.5" strokeDasharray="5 4"/></svg>
          <svg className="bg-shape" style={{bottom:"25%",left:"3%",width:"36px",opacity:0.35,animation:"rock 6s 2s infinite"}} viewBox="0 0 36 36"><rect x="4" y="4" width="28" height="28" rx="6" fill="none" stroke="#1E1408" strokeWidth="2.5" transform="rotate(15 18 18)"/></svg>
          <svg className="bg-shape" style={{bottom:"18%",right:"8%",width:"28px",opacity:0.3,animation:"rock 3.5s infinite"}} viewBox="0 0 28 28"><polygon points="14,2 26,24 2,24" fill="none" stroke="#1E1408" strokeWidth="2.5"/></svg>
          {/* confetti dots */}
          <svg className="bg-shape" style={{top:"40%",left:"48%",width:"80px",opacity:0.25}} viewBox="0 0 80 80">
            <circle cx="10" cy="10" r="5" fill="#FF7EB3"/><circle cx="30" cy="25" r="4" fill="#FFD030"/><circle cx="55" cy="8" r="6" fill="#7ED9B0"/><circle cx="70" cy="35" r="4" fill="#A07EE8"/><circle cx="20" cy="55" r="5" fill="#5BB4F5"/><circle cx="60" cy="60" r="3" fill="#FF8C5A"/>
          </svg>

          <div className="hero-left">
            <span className="hero-tag" style={{opacity:0,animation:"popIn .4s .2s forwards"}}>💍 Приглашение на свадьбу</span>
            <div className="hero-title" style={{opacity:0,animation:"popIn .5s .4s cubic-bezier(.34,1.56,.64,1) forwards"}}>
              {person1}
              <span className="amp">&</span>
              <span className="line2">{person2}</span>
            </div>
            <div style={{opacity:0,animation:"popIn .5s .9s cubic-bezier(.34,1.56,.64,1) forwards"}}>
              <div className="hero-date-pill">
                <div className="num">{day}</div>
                <div className="sep"></div>
                <div className="text">{month}<br/>{year}</div>
                <div className="sep"></div>
                <div className="text">{city}<br/>Казахстан</div>
              </div>
            </div>
          </div>

          <div className="hero-right" style={{opacity:0,animation:"popIn .7s .6s cubic-bezier(.34,1.56,.64,1) forwards"}}>
            {/* hand-drawn couple illustration */}
            <svg className="hero-illo" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* ground */}
              <ellipse cx="160" cy="295" rx="110" ry="16" fill="#1E1408" opacity=".08"/>
              {/* flowers */}
              <g opacity=".9">
                <circle cx="55" cy="270" r="12" fill="#FFD6E7" stroke="#1E1408" strokeWidth="2.5"/>
                <circle cx="55" cy="270" r="5" fill="#FFD030" stroke="#1E1408" strokeWidth="1.5"/>
                <line x1="55" y1="282" x2="55" y2="298" stroke="#1E1408" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="78" cy="278" r="9" fill="#C8F0E0" stroke="#1E1408" strokeWidth="2.5"/>
                <circle cx="78" cy="278" r="4" fill="#FFD030" stroke="#1E1408" strokeWidth="1.5"/>
                <line x1="78" y1="287" x2="78" y2="298" stroke="#1E1408" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="255" cy="272" r="11" fill="#E2D4FF" stroke="#1E1408" strokeWidth="2.5"/>
                <circle cx="255" cy="272" r="5" fill="#FFD030" stroke="#1E1408" strokeWidth="1.5"/>
                <line x1="255" y1="283" x2="255" y2="298" stroke="#1E1408" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="232" cy="280" r="8" fill="#FFD6C0" stroke="#1E1408" strokeWidth="2.5"/>
                <circle cx="232" cy="280" r="3.5" fill="#FFD030" stroke="#1E1408" strokeWidth="1.5"/>
                <line x1="232" y1="288" x2="232" y2="298" stroke="#1E1408" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
              {/* groom body */}
              <rect x="88" y="190" width="68" height="90" rx="12" fill="#1E1408" stroke="#1E1408" strokeWidth="2"/>
              {/* groom shirt/tie */}
              <rect x="112" y="192" width="20" height="50" rx="3" fill="white" stroke="#1E1408" strokeWidth="1.5"/>
              <path d="M120 200 L122 230 L120 240 L118 230 Z" fill="#FF7EB3" stroke="#1E1408" strokeWidth="1.5"/>
              {/* groom head */}
              <ellipse cx="122" cy="170" rx="26" ry="28" fill="#FFDDB8" stroke="#1E1408" strokeWidth="2.5"/>
              {/* groom hair */}
              <path d="M96 162 Q100 142 122 140 Q144 142 148 162 Q140 150 122 150 Q104 150 96 162Z" fill="#1E1408"/>
              {/* groom eyes */}
              <ellipse cx="113" cy="170" rx="4" ry="4.5" fill="white" stroke="#1E1408" strokeWidth="1.5"/>
              <ellipse cx="131" cy="170" rx="4" ry="4.5" fill="white" stroke="#1E1408" strokeWidth="1.5"/>
              <circle cx="114" cy="171" r="2" fill="#1E1408"/>
              <circle cx="132" cy="171" r="2" fill="#1E1408"/>
              {/* groom smile */}
              <path d="M112 181 Q122 190 132 181" stroke="#1E1408" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* groom legs */}
              <rect x="92" y="272" width="24" height="22" rx="8" fill="#1E1408"/>
              <rect x="128" y="272" width="24" height="22" rx="8" fill="#1E1408"/>
              {/* groom shoes */}
              <ellipse cx="104" cy="294" rx="15" ry="7" fill="#1E1408"/>
              <ellipse cx="140" cy="294" rx="15" ry="7" fill="#1E1408"/>

              {/* bride body - dress */}
              <path d="M170 215 Q158 240 148 295 L220 295 Q210 240 198 215 Z" fill="#FFD6E7" stroke="#1E1408" strokeWidth="2.5"/>
              {/* dress top */}
              <rect x="164" y="190" width="40" height="28" rx="8" fill="#FFD6E7" stroke="#1E1408" strokeWidth="2.5"/>
              {/* belt */}
              <rect x="160" y="212" width="48" height="8" rx="4" fill="#FF7EB3" stroke="#1E1408" strokeWidth="2"/>
              {/* bride head */}
              <ellipse cx="184" cy="168" rx="26" ry="28" fill="#FFDDB8" stroke="#1E1408" strokeWidth="2.5"/>
              {/* bride hair */}
              <path d="M158 158 Q160 136 184 134 Q208 136 210 158" fill="#1E1408" stroke="#1E1408" strokeWidth="1"/>
              <path d="M158 158 Q154 175 158 185" fill="#1E1408" stroke="#1E1408" strokeWidth="1"/>
              <path d="M210 158 Q214 175 210 185" fill="#1E1408" stroke="#1E1408" strokeWidth="1"/>
              {/* veil */}
              <path d="M184 136 Q220 130 226 200" stroke="#1E1408" strokeWidth="1.5" fill="rgba(255,255,255,0.6)" strokeDasharray="4 3"/>
              {/* bride eyes */}
              <ellipse cx="175" cy="168" rx="4" ry="4.5" fill="white" stroke="#1E1408" strokeWidth="1.5"/>
              <ellipse cx="193" cy="168" rx="4" ry="4.5" fill="white" stroke="#1E1408" strokeWidth="1.5"/>
              <circle cx="176" cy="169" r="2" fill="#1E1408"/>
              <circle cx="194" cy="169" r="2" fill="#1E1408"/>
              {/* bride blush */}
              <ellipse cx="168" cy="175" rx="6" ry="4" fill="#FFB0C0" opacity=".6"/>
              <ellipse cx="200" cy="175" rx="6" ry="4" fill="#FFB0C0" opacity=".6"/>
              {/* bride smile */}
              <path d="M174 179 Q184 188 194 179" stroke="#1E1408" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* bouquet */}
              <circle cx="150" cy="228" r="18" fill="#C8F0E0" stroke="#1E1408" strokeWidth="2.5"/>
              <circle cx="144" cy="222" r="9" fill="#FFD6E7" stroke="#1E1408" strokeWidth="2"/>
              <circle cx="157" cy="222" r="9" fill="#E2D4FF" stroke="#1E1408" strokeWidth="2"/>
              <circle cx="150" cy="232" r="9" fill="#FFF0A0" stroke="#1E1408" strokeWidth="2"/>
              <circle cx="150" cy="224" r="4" fill="#FFD030" stroke="#1E1408" strokeWidth="1.5"/>

              {/* hands joined */}
              <path d="M156 228 Q152 248 148 255" stroke="#FFDDB8" strokeWidth="8" strokeLinecap="round"/>
              <path d="M164 228 Q160 248 156 255" stroke="#FFDDB8" strokeWidth="8" strokeLinecap="round"/>

              {/* floating hearts above */}
              <text x="145" y="112" fontSize="22" fill="#FF7EB3" opacity=".9" style={{animation:"float 3s ease-in-out infinite"}}>♡</text>
              <text x="175" y="95" fontSize="16" fill="#FFD030" opacity=".8" style={{animation:"float 3s .5s ease-in-out infinite"}}>♡</text>
              <text x="200" y="108" fontSize="19" fill="#A07EE8" opacity=".85" style={{animation:"float 3s 1s ease-in-out infinite"}}>♡</text>
            </svg>
          </div>
        </section>

        <div className="zigzag"></div>

        {/* SPLIT: TIME + DRESS */}
        <section className="s-split">
          <div className="split-left reveal">
            <div className="split-label">Время</div>
            <div className="split-big">Церемония начинается</div>
            <div className="split-val">{mainTime}</div>
            <div className="split-sub">Банкет — {banquetHour} · Конец — {endHour}</div>
            {/* mini clock illustration */}
            <svg style={{marginTop:"28px",width:"90px",opacity:0.7}} viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="38" fill="var(--yell)" stroke="#1E1408" strokeWidth="3"/>
              <circle cx="45" cy="45" r="3" fill="#1E1408"/>
              <line x1="45" y1="45" x2="45" y2="18" stroke="#1E1408" strokeWidth="3" strokeLinecap="round"/>
              <line x1="45" y1="45" x2="64" y2="52" stroke="#1E1408" strokeWidth="2.5" strokeLinecap="round"/>
              <text x="42" y="74" fontFamily="Caveat" fontSize="12" fill="#7A5C3A" fontWeight="700">6 pm</text>
            </svg>
          </div>
          <div className="split-right reveal rv1">
            <div className="split-label">Дресс-код</div>
            <div className="split-big">Цветовая палитра</div>
            <div className="swatches">
              <div className="swatch" style={{background:"#1E1408"}} title="Чёрный"></div>
              <div className="swatch" style={{background:"#FFDDB8"}} title="Нюд"></div>
              <div className="swatch" style={{background:"#E2D4FF"}} title="Лаванда"></div>
              <div className="swatch" style={{background:"#C8F0E0"}} title="Мятный"></div>
              <div className="swatch" style={{background:"#FFD6E7"}} title="Пудровый"></div>
            </div>
            <div className="split-sub" style={{marginTop:"16px"}}>Вечерний · нарядный</div>
            {/* dress doodle */}
            <svg style={{marginTop:"20px",width:"70px",opacity:0.7}} viewBox="0 0 70 100" fill="none">
              <path d="M20 20 Q15 35 10 95 L60 95 Q55 35 50 20Z" fill="var(--pink)" stroke="#1E1408" strokeWidth="2.5"/>
              <rect x="22" y="8" width="26" height="16" rx="6" fill="var(--pink)" stroke="#1E1408" strokeWidth="2.5"/>
              <path d="M22 22 Q35 32 48 22" stroke="#1E1408" strokeWidth="2" fill="none"/>
              <ellipse cx="35" cy="6" rx="8" ry="8" fill="var(--peach)" stroke="#1E1408" strokeWidth="2.5"/>
            </svg>
          </div>
        </section>

        <div className="zigzag" style={{transform:"rotate(180deg)"}}></div>

        {/* VENUE */}
        <section className="s-venue">
          <div className="venue-inner">
            <div className="venue-text reveal">
              <span className="sticker">Где?</span>
              <div className="venue-name-big">{venueName || "Grand Hall"}<br/>{city}</div>
              <div className="venue-addr-line">{venueAddress || `пр. Аль-Фараби 77, ${city}`}</div>
              <div className="venue-badge">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span>Посмотреть на карте</span>
              </div>
            </div>
            <div className="reveal rv1">
              <div className="venue-map-card">
                {/* stylized map illustration */}
                <svg className="map-placeholder" viewBox="0 0 400 280" fill="none">
                  <rect width="400" height="280" fill="#E8F4E8"/>
                  {/* roads */}
                  <rect x="0" y="120" width="400" height="14" fill="white" stroke="#ccc" strokeWidth="1"/>
                  <rect x="180" y="0" width="14" height="280" fill="white" stroke="#ccc" strokeWidth="1"/>
                  <rect x="0" y="60" width="400" height="10" fill="white" stroke="#ccc" strokeWidth="1"/>
                  <rect x="0" y="200" width="400" height="10" fill="white" stroke="#ccc" strokeWidth="1"/>
                  <rect x="80" y="0" width="10" height="280" fill="white" stroke="#ccc" strokeWidth="1"/>
                  <rect x="300" y="0" width="10" height="280" fill="white" stroke="#ccc" strokeWidth="1"/>
                  {/* blocks */}
                  <rect x="20" y="80" width="52" height="32" rx="4" fill="#d4e8d4"/>
                  <rect x="100" y="80" width="70" height="32" rx="4" fill="#d4e8d4"/>
                  <rect x="20" y="140" width="52" height="52" rx="4" fill="#d4e8d4"/>
                  <rect x="100" y="140" width="70" height="52" rx="4" fill="#d4e8d4"/>
                  <rect x="200" y="80" width="90" height="32" rx="4" fill="#d4e8d4"/>
                  <rect x="320" y="80" width="62" height="32" rx="4" fill="#d4e8d4"/>
                  <rect x="200" y="140" width="90" height="52" rx="4" fill="#d4e8d4"/>
                  <rect x="320" y="140" width="62" height="52" rx="4" fill="#d4e8d4"/>
                  {/* label */}
                  <text x="40" y="116" fontFamily="Nunito" fontSize="9" fill="#888" fontWeight="700">пр. Аль-Фараби</text>
                  {/* pin */}
                  <ellipse cx="200" cy="132" rx="14" ry="6" fill="#1E1408" opacity=".2"/>
                  <path d="M200 86 C188 86 178 96 178 108 C178 126 200 148 200 148 C200 148 222 126 222 108 C222 96 212 86 200 86Z" fill="#FF7EB3" stroke="#1E1408" strokeWidth="3"/>
                  <circle cx="200" cy="108" r="8" fill="white" stroke="#1E1408" strokeWidth="2.5"/>
                  {/* heart in pin */}
                  <path d="M196 106 Q196 103 200 105 Q204 103 204 106 Q204 109 200 113 Q196 109 196 106Z" fill="#FF7EB3"/>
                </svg>
              </div>
            </div>
          </div>
          {/* bg deco */}
          <svg style={{position:"absolute",bottom:"20px",right:"30px",width:"80px",opacity:0.15}} viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="#1E1408" strokeWidth="3" strokeDasharray="8 5"/></svg>
        </section>

        <div className="zigzag"></div>

        {/* COUNTDOWN */}
        <section className="s-countdown">
          <div className="cd-title reveal">До свадьбы осталось...</div>
          <div className="cd-row reveal rv1">
            <div className="cd-box"><div className="cd-num" id="cd-days">000</div><div className="cd-lbl">дней</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><div className="cd-num" id="cd-hours">00</div><div className="cd-lbl">часов</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><div className="cd-num" id="cd-mins">00</div><div className="cd-lbl">минут</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><div className="cd-num" id="cd-secs">00</div><div className="cd-lbl">секунд</div></div>
          </div>
          <p className="cd-done" id="cd-done" style={{display:"none"}}>Сегодня тот самый день! 🎉</p>
          {/* bg star doodles */}
          <svg style={{position:"absolute",left:"5%",top:"20%",width:"50px",opacity:0.2,animation:"rock 5s infinite"}} viewBox="0 0 50 50"><path d="M25 3l4 13h14l-11 8 4 13-11-8-11 8 4-13-11-8h14z" fill="none" stroke="#1E1408" strokeWidth="2"/></svg>
          <svg style={{position:"absolute",right:"6%",bottom:"20%",width:"40px",opacity:0.2,animation:"rock 7s 1s infinite"}} viewBox="0 0 50 50"><path d="M25 3l4 13h14l-11 8 4 13-11-8-11 8 4-13-11-8h14z" fill="#FFD030" stroke="#1E1408" strokeWidth="2"/></svg>
        </section>

        <div className="zigzag" style={{transform:"rotate(180deg)"}}></div>

        {/* RSVP */}
        <section className="s-rsvp">
          {/* bg doodles */}
          <svg className="rsvp-doodle" style={{left:"3%",top:"10%",width:"120px"}} viewBox="0 0 120 120"><text y="100" fontSize="100" fill="#FF7EB3">♡</text></svg>
          <svg className="rsvp-doodle" style={{right:"4%",bottom:"15%",width:"90px",transform:"rotate(20deg)"}} viewBox="0 0 120 120"><text y="100" fontSize="100" fill="#FFD030">★</text></svg>
          <svg className="rsvp-doodle" style={{left:"12%",bottom:"10%",width:"60px"}} viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="#A07EE8" strokeWidth="4" strokeDasharray="6 4"/></svg>

          {guestName && (
            <p className="reveal" style={{fontFamily:"'Caveat', cursive",fontSize:"24px",color:"var(--mid)",marginBottom:"16px"}}>
              Дорогой(ая) {guestName}!
            </p>
          )}

          <div className="rsvp-big reveal">
            Приходите<span>отмечать!</span>
          </div>
          <p className="rsvp-note reveal rv1">Подтвердите участие до {Number(day) - 14 > 0 ? Number(day) - 14 : 1} {month.toLowerCase()} {year}</p>

          {showRsvpButtons && !rsvpDone && (
            <div className="reveal rv2" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <button className="rsvp-btn" onClick={handleRsvpClick}>Я буду! 🎉</button>
              {onDecline && (
                <button className="rsvp-btn-decline" onClick={onDecline}>К сожалению, не смогу</button>
              )}
            </div>
          )}

          {rsvpDone && (
            <div className="reveal rv2" style={{textAlign:"center"}}>
              <p style={{fontFamily:"'Caveat', cursive",fontSize:"32px",color:"var(--mint2)"}}>Ура! До встречи! ✨</p>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="s-footer">
          <div className="footer-names">{person1} & {person2} · {year}</div>
          <div className="footer-heart">♡</div>
          <div className="footer-toilab">Сделано с любовью при помощи <a href="https://toilab.kz" target="_blank" rel="noopener noreferrer">Toilab</a></div>
        </footer>
      </div>
    </>
  );
}

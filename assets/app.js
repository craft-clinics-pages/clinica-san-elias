const { useState, useEffect, useRef } = React;

/* ─── TWEAKS PANEL (inlined) ─────────────────── */
const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
    border-radius:50%;background:#fff;border:.5px solid rgba(0,0,0,.12);
    box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;background:rgba(0,0,0,.06)}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2}
  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
`;

function useTweaks(defaults) {
  const [values, setValues] = useState(defaults);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return { tweaks: values, setTweak };
}

function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;
  const clamp = React.useCallback(() => {
    const p = dragRef.current; if (!p) return;
    const maxR = Math.max(PAD, window.innerWidth - p.offsetWidth - PAD);
    const maxB = Math.max(PAD, window.innerHeight - p.offsetHeight - PAD);
    offsetRef.current = { x: Math.min(maxR, Math.max(PAD, offsetRef.current.x)), y: Math.min(maxB, Math.max(PAD, offsetRef.current.y)) };
    p.style.right = offsetRef.current.x + 'px';
    p.style.bottom = offsetRef.current.y + 'px';
  }, []);
  useEffect(() => {
    if (open) clamp();
  }, [open, clamp]);
  useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => { setOpen(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); };
  const onDragStart = (e) => {
    const p = dragRef.current; if (!p) return;
    const r = p.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const sr = window.innerWidth - r.right, sb = window.innerHeight - r.bottom;
    const move = (ev) => { offsetRef.current = { x: sr - (ev.clientX - sx), y: sb - (ev.clientY - sy) }; clamp(); };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}><b>{title}</b>
          <button className="twk-x" onMouseDown={e => e.stopPropagation()} onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

function TweakSection({ label, children }) {
  return <><div className="twk-sect">{label}</div>{children}</>;
}
function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'} onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}
function TweakRadio({ label, value, options, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const opts = options.map(o => typeof o === 'object' ? o : { value: o, label: o });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const valueRef = useRef(value); valueRef.current = value;
  const segAt = (cx) => { const r = trackRef.current.getBoundingClientRect(); return opts[Math.max(0, Math.min(n-1, Math.floor(((cx - r.left - 2) / (r.width - 4)) * n)))].value; };
  const onPointerDown = (e) => {
    setDragging(true); const v0 = segAt(e.clientX); if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => { const v = segAt(ev.clientX); if (v !== valueRef.current) onChange(v); };
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-row"><div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} className={dragging ? 'twk-seg dragging' : 'twk-seg'} onPointerDown={onPointerDown}>
        <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {opts.map(o => <button key={o.value} type="button">{o.label}</button>)}
      </div>
    </div>
  );
}
function TweakColor({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input type="color" className="twk-swatch" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
/* ─── END TWEAKS PANEL ───────────────────────── */

/* ─── SVG ICONS ──────────────────────────────── */
const IconStethoscope = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>
  </svg>
);

const IconScalpel = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 8-4 4"/>
    <path d="m22 2-7.5 7.5"/>
    <path d="M9 15 2 22"/>
    <path d="m14 14-5 5"/>
    <path d="m8 8 1.5-1.5"/>
  </svg>
);

const IconScan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>
);

const IconFlask = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6l3 9-9 9-9-9z" opacity=".2" fill="currentColor" stroke="none"/>
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 18.5A1 1 0 0 0 5.535 20h12.93a1 1 0 0 0 .814-1.5l-5.069-8.077A2 2 0 0 1 14 9.527V2"/>
    <path d="M8.5 2h7"/>
    <path d="M7 16h10"/>
  </svg>
);

const IconBed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4v16"/>
    <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
    <path d="M2 17h20"/>
    <path d="M6 8v9"/>
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="2,6 5,9 10,3"/>
  </svg>
);

const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--color-accent)'}}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 13 19.79 19.79 0 0 1 1.75 4.37 2 2 0 0 1 3.73 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{color:'var(--color-accent)'}}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{color:'var(--color-accent)'}}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const PawSVG = () => (
  <svg width="280" height="280" viewBox="0 0 100 100" fill="white" opacity="1" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="35" cy="28" rx="8" ry="10"/>
    <ellipse cx="55" cy="22" rx="8" ry="10"/>
    <ellipse cx="72" cy="33" rx="7" ry="9"/>
    <ellipse cx="20" cy="38" rx="6" ry="8"/>
    <path d="M50 45 C30 45, 18 58, 22 72 C26 86, 42 90, 50 90 C58 90, 74 86, 78 72 C82 58, 70 45, 50 45 Z"/>
  </svg>
);

/* ─── NAVBAR ─────────────────────────────────── */
function Navbar({ onCita }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : 'transparent'}>
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          <img
            src="media/img/logo.webp"
            alt="San Elías Clínica Veterinaria"
            style={{
              height: '48px', width: 'auto',
              filter: scrolled ? 'none' : 'brightness(0) invert(1)',
              transition: 'filter 0.3s ease'
            }}
          />
        </a>
        <ul className="nav-links">
          <li><a href="#servicios">Servicios</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="#horarios">Horarios</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
        <a
          className="nav-cta"
          href="#"
          onClick={e => { e.preventDefault(); onCita(); }}
        >
          Agendar cita
        </a>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────── */
function Hero({ onCita }) {
  return (
    <section className="hero" id="inicio">
      <div className="hero-grid"></div>
      <div className="paw-watermark"><PawSVG /></div>
      <div className="hero-content">
        {/* LEFT */}
        <div>
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Clínica Veterinaria Profesional
          </div>
          <h1>
            Porque salvar vidas<br />
            <span>no es un trabajo,</span><br />
            es nuestra vocación.
          </h1>
          <p className="hero-sub">
            En San Elías cuidamos a tu mascota con la tecnología, experiencia y el amor que merece. Atención integral para perros, gatos y más.
          </p>
          <div className="hero-actions">
            <a
              className="btn btn-primary"
              href="#"
              onClick={e => { e.preventDefault(); onCita(); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Agendar una cita
            </a>
            <a
              className="btn btn-outline"
              href="https://wa.me/593998946766"
              target="_blank"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">10<span>+</span></div>
              <div className="hero-stat-label">Años de experiencia</div>
            </div>
            <div style={{width:'1px', background:'rgba(255,255,255,0.15)'}}></div>
            <div>
              <div className="hero-stat-num">5<span>k+</span></div>
              <div className="hero-stat-label">Mascotas atendidas</div>
            </div>
            <div style={{width:'1px', background:'rgba(255,255,255,0.15)'}}></div>
            <div>
              <div className="hero-stat-num">5</div>
              <div className="hero-stat-label">Servicios especializados</div>
            </div>
          </div>
        </div>

        {/* RIGHT — floating cards */}
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card hero-card-main">
              <div className="hero-img-placeholder">
                <PawSVG />
                <span style={{fontSize:'11px'}}>foto clínica / equipo</span>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'2px', marginTop:'8px'}}>
                {['Consulta','Cirugía','Ecografía','Lab','Hospitalización'].map(s => (
                  <span key={s} className="service-pill">
                    <span className="service-pill-icon">+</span>{s}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero-card hero-card-float">
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px'}}>
                <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'var(--color-accent)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <IconClock />
                </div>
                <span style={{color:'white', fontSize:'13px', fontWeight:'600', fontFamily:'var(--font-display)'}}>Atención hoy</span>
              </div>
              <div style={{color:'rgba(255,255,255,0.8)', fontSize:'13px', lineHeight:'1.6'}}>
                Lun–Sáb<br />
                <strong style={{color:'white', fontSize:'17px', fontFamily:'var(--font-display)'}}>9 am – 6 pm</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST BAR ──────────────────────────────── */
function TrustBar() {
  const items = [
    { icon: <IconCheck />, text: 'Médicos veterinarios certificados' },
    { icon: <IconCheck />, text: 'Equipos de diagnóstico modernos' },
    { icon: <IconCheck />, text: 'Atención personalizada' },
    { icon: <IconCheck />, text: 'Urgencias y emergencias' },
  ];
  return (
    <div className="trust-bar">
      <div className="trust-bar-inner">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="2,6 5,9 10,3"/>
                </svg>
              </div>
              {item.text}
            </div>
            {i < items.length - 1 && <div className="trust-divider"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── SERVICIOS ──────────────────────────────── */
const services = [
  {
    icon: <IconStethoscope />,
    title: 'Consulta Externa',
    desc: 'Evaluación clínica completa de tu mascota. Revisión preventiva, vacunación y diagnóstico a cargo de médicos veterinarios especializados.'
  },
  {
    icon: <IconScalpel />,
    title: 'Cirugía',
    desc: 'Procedimientos quirúrgicos con equipos modernos y anestesia segura. Tu mascota está en las mejores manos durante todo el proceso.'
  },
  {
    icon: <IconScan />,
    title: 'Ecografía',
    desc: 'Diagnóstico por imagen de alta resolución. Detectamos problemas internos de forma rápida, segura y sin dolor para tu mascota.'
  },
  {
    icon: <IconFlask />,
    title: 'Laboratorio',
    desc: 'Análisis clínicos in situ: hemograma, química sanguínea, uroanálisis y más. Resultados rápidos para un diagnóstico oportuno.'
  },
  {
    icon: <IconBed />,
    title: 'Hospitalización',
    desc: 'Cuidado continuo en un ambiente seguro y supervisado. Monitoreo constante para que tu mascota se recupere de la mejor manera.'
  },
];

function Servicios({ onCita }) {
  return (
    <section className="section-services" id="servicios">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Nuestros servicios</div>
          <h2>Atención integral para tu mascota</h2>
          <p>Contamos con las instalaciones y el talento humano para ofrecer una atención veterinaria completa, compasiva y de calidad.</p>
        </div>
        <div className="services-grid">
          {services.map((s, i) => (
            <div className="service-card" key={i}>
              <div className="service-icon-wrap">{s.icon}</div>
              <div className="service-title">{s.title}</div>
              <p className="service-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center', marginTop:'48px'}}>
          <a
            className="btn btn-primary"
            href="#"
            onClick={e => { e.preventDefault(); onCita(); }}
          >
            Agenda tu cita ahora
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── POR QUÉ NOSOTROS ───────────────────────── */
function PorQueNosotros() {
  const features = [
    { strong: 'Vocación real:', text: 'Para nosotros no es solo un trabajo — es un compromiso con cada vida animal.' },
    { strong: 'Equipo especializado:', text: 'Médicos veterinarios con formación continua y experiencia en múltiples especialidades.' },
    { strong: 'Tecnología de diagnóstico:', text: 'Ecografía, laboratorio clínico y equipos modernos disponibles en un solo lugar.' },
    { strong: 'Trato humano:', text: 'Entendemos el vínculo entre tú y tu mascota. Te acompañamos con empatía y claridad.' },
    { strong: 'Atención en horario amplio:', text: 'De lunes a sábado con horario extendido y domingos con atención matutina.' },
  ];
  return (
    <section className="section-why" id="nosotros">
      <div className="container">
        <div className="why-grid">
          <div className="why-text">
            <div className="section-label">¿Por qué elegirnos?</div>
            <h2>Salud animal con <span>corazón</span></h2>
            <p>
              Desde nuestra apertura hemos atendido miles de mascotas con la misma dedicación: la de quien ama lo que hace. La Clínica Veterinaria San Elías nació de la vocación de cuidar, y eso se siente en cada consulta.
            </p>
            <ul className="features-list">
              {features.map((f, i) => (
                <li className="feature-item" key={i}>
                  <div className="feature-check"><IconCheck /></div>
                  <div className="feature-text"><strong>{f.strong}</strong> {f.text}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="why-visual">
            <div className="why-stat-card">
              <div className="why-num">10<span>+</span></div>
              <div className="why-label">Años de experiencia</div>
              <div className="why-sublabel">en medicina veterinaria</div>
            </div>
            <div className="why-stat-card">
              <div className="why-num">5<span>k</span></div>
              <div className="why-label">Mascotas atendidas</div>
              <div className="why-sublabel">y contando</div>
            </div>
            <div className="why-stat-card accent-card" style={{display:'flex', alignItems:'center', gap:'24px'}}>
              <div>
                <div style={{display:'flex', gap:'3px', marginBottom:'8px'}}>
                  {[1,2,3,4,5].map(n => <IconStar key={n} />)}
                </div>
                <div className="why-label" style={{fontSize:'15px', color:'white', fontWeight:'600'}}>Atención de excelencia</div>
                <div className="why-sublabel" style={{marginTop:'4px'}}>La confianza de nuestros clientes nos impulsa cada día</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── HORARIOS Y CONTACTO ────────────────────── */
function HorariosContacto({ onCita }) {
  return (
    <section className="section-hours" id="horarios">
      <div className="container">
        <div style={{textAlign:'center', marginBottom:'56px'}}>
          <div className="section-label">Visítanos</div>
          <h2 style={{fontFamily:'var(--font-display)', fontSize:'clamp(28px,3.5vw,40px)', color:'var(--color-primary)', marginBottom:'12px'}}>
            Horarios y contacto
          </h2>
          <p style={{maxWidth:'480px', margin:'0 auto'}}>Estamos aquí cuando más lo necesitas. Ven a vernos o contáctanos directamente.</p>
        </div>
        <div className="hours-grid">
          <div className="hours-card">
            <h3>🗓 Horario de atención</h3>
            {[
              { day: 'Lunes a Sábado', time: '9:00 am – 6:00 pm' },
              { day: 'Domingos', time: '9:00 am – 2:00 pm' },
              { day: 'Feriados', time: '9:00 am – 2:00 pm' },
            ].map((h, i) => (
              <div className="hours-row" key={i}>
                <span className="hours-day">{h.day}</span>
                <span className="hours-time">{h.time}</span>
              </div>
            ))}
          </div>
          <div className="contact-card" id="contacto">
            <div>
              <div className="section-label">Contáctanos</div>
              <h3>Estamos a una llamada de distancia</h3>
              <p>Agenda tu cita o resuelve tus dudas directamente con nuestro equipo.</p>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <a className="phone-link" href="tel:+593998946766">
                <span className="phone-icon"><IconPhone /></span>
                0998 946 766
              </a>
              <a className="phone-link" href="tel:+593998515164">
                <span className="phone-icon"><IconPhone /></span>
                0998 515 164
              </a>
            </div>
            <div className="emergency-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{color:'oklch(55% 0.15 25)', flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Para emergencias, llámanos directamente o escríbenos por WhatsApp.</span>
            </div>
            <a
              className="btn btn-primary"
              href="#"
              onClick={e => { e.preventDefault(); onCita(); }}
              style={{width:'100%', justifyContent:'center'}}
            >
              Agendar cita en línea
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA FINAL ──────────────────────────────── */
function CTAFinal({ onCita }) {
  return (
    <section className="section-cta">
      <div className="container">
        <div className="cta-inner">
          <div className="section-label" style={{color:'rgba(255,255,255,0.9)', justifyContent:'center'}}>Tu mascota nos importa</div>
          <h2>¿Listo para darle la mejor atención a tu mascota?</h2>
          <p>Agenda tu cita hoy y descubre por qué miles de familias confían en la Clínica Veterinaria San Elías.</p>
          <div className="cta-actions">
            <a
              className="btn-white"
              href="#"
              onClick={e => { e.preventDefault(); onCita(); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Agendar cita
            </a>
            <a
              className="btn btn-outline"
              href="https://wa.me/593998946766?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20servicios%20de%20la%20Cl%C3%ADnica%20San%20El%C3%ADas"
              target="_blank"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Escríbenos al WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────── */
function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="media/img/logo.webp" alt="San Elías" style={{height:'44px', filter:'brightness(0) invert(1)', opacity:0.85}} />
            <p>
              Clínica Veterinaria San Elías: atención integral, compasiva y profesional para tu mascota. Porque salvar vidas es nuestra vocación.
            </p>
          </div>
          <div className="footer-col">
            <h4>Servicios</h4>
            <ul className="footer-links">
              {['Consulta Externa','Cirugía','Ecografía','Laboratorio','Hospitalización'].map(s => (
                <li key={s}><a href="#servicios">{s}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <div className="footer-phone">
              <IconPhone />
              <a href="tel:+593998946766">0998 946 766</a>
            </div>
            <div className="footer-phone">
              <IconPhone />
              <a href="tel:+593998515164">0998 515 164</a>
            </div>
            <div style={{marginTop:'16px', display:'flex', alignItems:'flex-start', gap:'10px'}}>
              <IconClock />
              <div style={{fontSize:'13px', lineHeight:'1.7'}}>
                <div style={{color:'white', fontWeight:'600'}}>Lun–Sáb: 9am–6pm</div>
                <div>Dom y Feriados: 9am–2pm</div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Clínica Veterinaria San Elías. Todos los derechos reservados.</span>
          <span>Hecho por <a href="https://craftmarketing.agency/" target="_blank" rel="noopener noreferrer">Craft Agency</a></span>
        </div>
      </div>
    </footer>
  );
}

/* ─── TWEAKS ─────────────────────────────────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#2ab8d4",
  "primaryColor": "#1a4a7a",
  "showStats": true,
  "roundness": "medium"
}/*EDITMODE-END*/;

function TweaksApp() {
  const { tweaks, setTweak } = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', tweaks.accentColor);
    document.documentElement.style.setProperty('--color-accent-dark', tweaks.accentColor);
    document.documentElement.style.setProperty('--color-primary', tweaks.primaryColor);
    document.documentElement.style.setProperty('--color-primary-dark', tweaks.primaryColor);
    const radii = { small: '6px', medium: '12px', large: '20px' };
    const r = radii[tweaks.roundness] || '12px';
    document.documentElement.style.setProperty('--radius-md', r);
    document.documentElement.style.setProperty('--radius-lg', tweaks.roundness === 'small' ? '12px' : tweaks.roundness === 'large' ? '28px' : '20px');
  }, [tweaks]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Colores de marca">
        <TweakColor label="Color acento (cyan)" id="accentColor" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
        <TweakColor label="Color primario (navy)" id="primaryColor" value={tweaks.primaryColor} onChange={v => setTweak('primaryColor', v)} />
      </TweakSection>
      <TweakSection label="Estilo">
        <TweakRadio label="Bordes" id="roundness" value={tweaks.roundness}
          options={[{label:'Suave', value:'small'},{label:'Medio', value:'medium'},{label:'Grande', value:'large'}]}
          onChange={v => setTweak('roundness', v)} />
      </TweakSection>
      <TweakSection label="Contenido">
        <TweakToggle label="Estadísticas en hero" id="showStats" value={tweaks.showStats} onChange={v => setTweak('showStats', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ─── APP ────────────────────────────────────── */
function App() {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
    document.getElementById('citaModal').classList.add('active');
  };
  const closeModalFn = () => {
    setModalOpen(false);
    document.getElementById('citaModal').classList.remove('active');
  };

  useEffect(() => {
    window.closeModal = closeModalFn;
    const overlay = document.getElementById('citaModal');
    const handler = (e) => { if (e.target === overlay) closeModalFn(); };
    overlay.addEventListener('click', handler);
    return () => overlay.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <TweaksApp />
      <Navbar onCita={openModal} />
      <Hero onCita={openModal} />
      <TrustBar />
      <Servicios onCita={openModal} />
      <PorQueNosotros />
      <HorariosContacto onCita={openModal} />
      <CTAFinal onCita={openModal} />
      <section className="section-map" id="ubicacion">
        <div className="container">
          <div style={{textAlign:'center', marginBottom:'40px'}}>
            <div className="section-label">Ubicación</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:'clamp(28px,3.5vw,40px)', color:'var(--color-primary)', marginBottom:'12px'}}>
              Cómo llegar
            </h2>
            <p style={{maxWidth:'480px', margin:'0 auto'}}>
              Estamos ubicados en el centro de la ciudad. Ven a visitarnos.
            </p>
          </div>
          <div className="map-wrapper">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3989.7604284792847!2d-78.5476990250354!3d-0.30865289968831117!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMMKwMTgnMzEuMiJTIDc4wrAzMic0Mi41Ilc!5e0!3m2!1ses!2sec!4v1777605248694!5m2!1ses!2sec"
              width="100%"
              height="400"
              style={{border:0, borderRadius:'var(--radius-lg)'}}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

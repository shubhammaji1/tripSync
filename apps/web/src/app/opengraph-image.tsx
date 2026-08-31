import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TripSync — Collaborative Group Travel Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          background: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #064e3b 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* Top Bar: Brand Logo & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Minimalist Pin & Plane Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                fontSize: '26px',
              }}
            >
              🧭
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                }}
              >
                TripSync
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}
              >
                PLATFORM
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '14px',
              fontWeight: 700,
              color: '#34d399',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>Collaborative Travel Cloud</span>
          </div>
        </div>

        {/* Center: Main Headline & Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(to right, #ffffff 30%, #a7f3d0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Plan Together. Travel Smarter.
          </div>
          <div
            style={{
              fontSize: '22px',
              lineHeight: 1.45,
              color: '#94a3b8',
              fontWeight: 500,
              maxWidth: '820px',
            }}
          >
            The all-in-one platform for modern group expeditions — Live collaborative itineraries, smart bill splits with UPI settlements, document vault, and offline mountain mode.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🗺️', label: 'Live Day-by-Day Itineraries' },
            { icon: '💸', label: 'Split Bills & Instant UPI' },
            { icon: '📁', label: 'PIN-Protected Vault' },
            { icon: '🛰️', label: 'Live Crew Activity Feed' },
            { icon: '🏔️', label: 'Mountain Offline Cache' },
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '10px 18px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                fontWeight: 700,
                color: '#e2e8f0',
              }}
            >
              <span>{feat.icon}</span>
              <span>{feat.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

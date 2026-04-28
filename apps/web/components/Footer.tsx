export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark)] border-t border-white/5 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-green)] flex items-center justify-center">
            <span
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-white font-bold text-[10px]"
            >
              ON
            </span>
          </div>
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-white/60 font-semibold text-sm"
          >
            Outfit Now
          </span>
        </div>

        {/* Links */}
        <div className="flex gap-6">
          {['Confidentialité', 'CGU', 'Contact'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="text-xs text-white/20">© 2026 Outfit Now · Paris</div>
      </div>
    </footer>
  );
}

import type { UserDto } from "../services/auth";
import { Icon } from "./Icon";

const outlineButton =
  "font-narrow rounded-full border border-[#8b5e3c]/50 text-[#8b5e3c] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] transition hover:border-[#8b5e3c] hover:bg-white";
const filledButton =
  "font-narrow inline-flex items-center gap-1.5 rounded-full bg-[#8b5e3c] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#6a4429]";

type HeaderProps = {
  user: UserDto | null;
  /** True while a stored login is still being checked. */
  checking: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
  onTickets: () => void;
  /** Only passed for admins: customers never see "Create event". */
  onCreate?: (() => void) | undefined;
};

export function Header({ user, checking, onLogin, onSignup, onLogout, onTickets, onCreate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dccfba] bg-[#f5efe3]">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <button className="text-left" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="font-display text-2xl tracking-[-0.03em]">Meeting Point</span>
        </button>
        <span className="hidden text-sm text-[#8a7767] lg:block">Events that bring people together</span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button className={outlineButton} onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}>Explore events</button>
          {user ? (
            <>
              <button className={outlineButton} onClick={onTickets}>My tickets</button>
              {onCreate && (
                <button className={filledButton} onClick={onCreate}>
                  <Icon name="plus" size={13} /> Create event
                </button>
              )}
              <span className="hidden text-sm text-[#8a7767] sm:inline">{user.name}</span>
              <button className={outlineButton} onClick={onLogout}>Log out</button>
            </>
          ) : (
            !checking && (
              <>
                <button className={outlineButton} onClick={onLogin}>Log in</button>
                <button className={filledButton} onClick={onSignup}>Sign up</button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero-texture mx-auto max-w-[90rem] px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-12">
      <div className="grid items-end gap-10 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <span className="mb-8 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8b5e3c]"><span className="h-px w-8 bg-[#8b5e3c]/60" /> Summer is over, But the year isn't.</span>
          <h1 className="font-display max-w-5xl text-5xl leading-[0.9] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Find something to <em className="font-normal text-[#8b5e3c]">gather</em> around. Moments become memories.</h1>
        </div>
        <p className="max-w-sm border-l border-[#b59d82] pl-6 text-base leading-relaxed text-[#7b6858] lg:mb-3">Discover small and big experiences near you made for curiosity, community and really good days.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#3b2a20] px-5 py-12 text-[#f8f2e6] sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[90rem] flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div><div className="font-display text-2xl">Meeting Point</div><p className="mt-2 text-sm text-white/55">More meetups. More memories. Closer to you.</p></div>
        <p className="text-xs text-white/40">© 2026 Meeting Point</p>
      </div>
    </footer>
  );
}

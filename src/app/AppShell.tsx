import { Link, NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../state/store';
import { Icon, type IconName } from '../ui/Icon';

const navItems: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/home', label: '今日', icon: 'home' },
  { to: '/scenes', label: '场景', icon: 'scenes' },
  { to: '/chunks', label: '句块', icon: 'chunks' },
  { to: '/profile', label: '我的', icon: 'profile' },
];

export function AppShell() {
  const streak = useProgress((state) => state.progress.streak.current);

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/home" aria-label="开口英语 OpenSay 首页">
          <span className="brand__mark" />
          <span>开口英语</span>
          <span className="brand__en">OpenSay</span>
        </Link>
        <span className="streak-pill" title="连续练习天数">
          <Icon name="flame" size={14} />
          {streak} 天
        </span>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="bottom-nav__item">
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

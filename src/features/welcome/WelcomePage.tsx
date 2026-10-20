import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <div className="welcome">
      <header className="welcome__hero">
        <p className="eyebrow">零基础 · 4 周 · 每天 10 分钟</p>
        <h1 className="display">
          <span>每天 10 分钟</span>
          <br />
          <em>练明天要用的那句英语。</em>
        </h1>
        <p className="lede">
          从一杯咖啡开始。先听懂，再敢说，最后能在真实的柜台前把这几个来回走完。
        </p>
      </header>

      <div className="welcome__sample" aria-label="咖啡店对话示例">
        <div className="bubble bubble--npc">
          What can I get for you?
          <small>你好，想要点什么？</small>
        </div>
        <div className="bubble bubble--you">
          How much is this?
          <small>这个多少钱？</small>
        </div>
        <div className="bubble bubble--npc">
          Four fifty. For here or to go?
          <small>四块五。在这儿喝还是带走？</small>
        </div>
      </div>

      <div className="welcome__meta">
        <span className="pill pill--accent">咖啡店起步</span>
        <span className="pill">5 个生存场景</span>
        <span className="pill">4 必说 + 8 能懂</span>
        <span className="pill pill--sage">录音只存本机</span>
      </div>

      <div className="welcome__actions">
        <Link className="button button--primary button--lg button--block" to="/assessment">
          开始，说出第一句
        </Link>
        <Link className="button button--ghost button--block" to="/home">
          先看看怎么练
        </Link>
        <p className="welcome__foot">不需要注册 · 不需要邮箱 · 进度保存在这台设备</p>
      </div>
    </div>
  );
}

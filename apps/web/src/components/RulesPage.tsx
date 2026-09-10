import React from 'react';
import { useGame } from '../GameContext.js';

export function RulesPage() {
  const { setScreen } = useGame();

  return (
    <div className="info-screen">
      <div className="info-back">
        <button className="btn btn-ghost" onClick={() => setScreen('menu')}>← 返回主菜单</button>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        📖 规则说明 v0.1
      </h1>

      <div className="info-section">
        <h2>🎯 游戏目标</h2>
        <p>4-8 名玩家共同进入「萌境」，通过收集心愿碎片、完成心愿任务来修复碎裂的「大心愿星」。但每个人都有隐藏身份——有人想修复，有人想破坏，有人只追求自己的愿望。</p>
        <p><strong>标准人数：</strong>5 人（推荐）· <strong>单局时间：</strong>15-25 分钟</p>
      </div>

      <div className="info-section">
        <h2>🎭 隐藏身份</h2>
        <ul>
          <li><strong style={{ color: '#4A90D9' }}>引路人</strong>：推动团队修复大心愿星，心愿进度 ≥ 4 即胜利。</li>
          <li><strong style={{ color: '#32CD32' }}>守护伙伴</strong>：暗中保护引路人，引路人存活且达成目标时一同胜利。</li>
          <li><strong style={{ color: '#FF6347' }}>捣蛋客</strong>：让心愿修复失败，终局时心愿进度 {'<'} 4 即胜利。</li>
          <li><strong style={{ color: '#9370DB' }}>追梦者</strong>：独立目标——终局时友情 ≥ 5 或心愿碎片 ≥ 3，与团队胜负无关。</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>🔄 回合流程</h2>
        <ol style={{ paddingLeft: 'var(--space-lg)', lineHeight: 2 }}>
          <li><strong>翻开场景牌</strong>：每轮开始时翻开一张场景牌，改变本轮规则。</li>
          <li><strong>补充手牌</strong>：所有玩家补牌至 4 张。</li>
          <li><strong>依次行动</strong>：按行动顺序，每名玩家执行一个回合。</li>
          <li><strong>结算效果</strong>：结算持续效果和场景影响。</li>
          <li><strong>检查胜利</strong>：检查身份胜利条件。</li>
          <li><strong>下一轮</strong>：最多 8 轮后强制终局结算。</li>
        </ol>
      </div>

      <div className="info-section">
        <h2>🎮 玩家回合可执行</h2>
        <ul>
          <li><strong>抽牌</strong>：摸 1 张牌（每回合一次）。</li>
          <li><strong>出牌</strong>：打出 1 张行动牌。</li>
          <li><strong>技能</strong>：使用角色技能（每回合一次）。</li>
          <li><strong>赠送</strong>：将 1 张手牌送给其他玩家。</li>
          <li><strong>交换</strong>：与其他玩家交换 1 张手牌。</li>
          <li><strong>防守</strong>：获得 1 层护盾。</li>
          <li><strong>积蓄</strong>：获得 1 点友情值。</li>
          <li><strong>结束回合</strong>：轮到下一名玩家。</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>💕 友情值系统</h2>
        <p>友情值是本游戏的核心资源（上限 6 点）。通过帮助他人、赠送卡牌、完成共同任务获得。可用于：</p>
        <ul>
          <li>发动强力角色技能</li>
          <li>抵消负面效果</li>
          <li>救回失去活力的角色</li>
          <li>建立羁绊</li>
          <li>完成特殊胜利条件</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>🔗 羁绊系统</h2>
        <p>两名玩家互相帮助后可形成临时羁绊，获得共享手牌信息、联合出牌、互相承担负面效果等优势。羁绊可因背叛、失去活力或场景变化而解除。一二和布布拥有专属羁绊「星兔共鸣」。</p>
      </div>

      <div className="info-section">
        <h2>💤 失败与旁观</h2>
        <p>活力降至 0 的玩家进入「梦境旁观者」状态，不会死亡。仍可每轮提供一次小帮助（+1 友情 +1 手牌给任意玩家），继续完成个人目标。</p>
      </div>

      <div className="info-section">
        <h2>🃏 卡牌分类</h2>
        <ul>
          <li><strong>互动牌（24张）</strong>：对其他玩家造成影响——伤害、查看手牌、交换、改变顺序等。</li>
          <li><strong>守护牌（14张）</strong>：护盾、免疫、转移伤害、保护队友。</li>
          <li><strong>活力牌（8张）</strong>：恢复活力、救回旁观者。</li>
          <li><strong>奇遇牌（10张）</strong>：查看牌堆、复制效果、回收弃牌、随机事件。</li>
          <li><strong>道具牌（8张）</strong>：强力效果但有副作用风险（玩具暴走场景增强）。</li>
          <li><strong>友情牌（8张）</strong>：获得友情、建立羁绊、团队增益。</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>🌍 场景牌（8张）</h2>
        <p>甜品派对 · 梦幻迷宫 · 星光舞台 · 玩具暴走 · 云朵暴雨 · 礼物交换日 · 安静午后 · 心愿流星</p>
        <p>每轮场景不同，让每局游戏产生不同的故事和策略。</p>
      </div>

      <div className="info-section">
        <h2>🏆 胜利判定</h2>
        <p>当心愿进度 ≥ 4 或到达第 8 轮时进行终局结算：</p>
        <ul>
          <li>引路人胜：心愿进度 ≥ 4</li>
          <li>守护伙伴胜：引路人胜且引路人存活</li>
          <li>捣蛋客胜：心愿进度 {'<'} 4</li>
          <li>追梦者胜：友情 ≥ 5 或碎片 ≥ 3</li>
        </ul>
        <p>多种身份可同时胜利！</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
        <button className="btn btn-primary btn-lg" onClick={() => setScreen('menu')}>开始冒险！</button>
      </div>
    </div>
  );
}

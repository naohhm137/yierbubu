import { CARDS, CONSTANTS, categoryName } from '@yierbubu/shared';
import type { CardCategory } from '@yierbubu/shared';
import { useGame } from '../GameContext.js';
import { MenuIcon } from './MainMenu.js';

const categories: CardCategory[] = ['interact', 'guard', 'vitality', 'adventure', 'item', 'friendship'];

export function RulesPage() {
  const { room, setScreen, characters } = useGame();
  const returnScreen = room?.phase === 'playing' ? 'game' : room?.phase === 'finished' ? 'result' : room ? 'lobby' : 'menu';
  const returnLabel = returnScreen === 'game' ? '返回对局' : returnScreen === 'result' ? '查看结算' : returnScreen === 'lobby' ? '返回大厅' : '返回茶会';
  const goBack = () => setScreen(returnScreen);

  return (
    <main className="rules-screen" aria-labelledby="rules-title">
      <div className="rules-shell">
        <button type="button" className="rules-back" onClick={goBack}><MenuIcon name="back" />{returnLabel}</button>
        <h1 id="rules-title" className="rules-title">茶会怎么玩</h1>
        <p className="rules-intro">{CONSTANTS.MIN_PLAYERS}–{CONSTANTS.MAX_PLAYERS} 人围坐一桌。每个人都有一个秘密心愿，帮助与淘气都藏在同一副牌里。第一次来，可以从首页的「先练习一局」开始。</p>
        <nav className="rules-toc" aria-label="规则目录">
          <a href="#rules-turn">轮到你时</a><a href="#rules-goal">身份与胜负</a><a href="#rules-bears">双熊与技能</a><a href="#rules-cards">卡牌与场景</a>
        </nav>

        <section id="rules-turn" className="rules-section">
          <h2>轮到你时，做一个选择</h2>
          <p>每轮翻开一张场景牌，仍在行动中的玩家补牌至 {CONSTANTS.BASE_HAND} 张，再按当前顺序行动。场景会改变规则，先看桌面上的场景提示。</p>
          <ol>
            <li><strong>可选：抽 1 张牌。</strong>每回合最多一次，和主要行动分开计算。</li>
            <li><strong>选择一次主要行动。</strong>出牌、使用技能、赠送、交换、防守或积蓄，六选一；也可以直接结束回合。</li>
            <li><strong>点击「结束回合」。</strong>把行动权交给下一位伙伴；手牌超出角色上限时，系统自动弃置最早获得的牌，直到回到上限。</li>
          </ol>
          <ul>
            <li><strong>出牌：</strong>选择一张手牌，按牌面要求指定目标。需要友情的牌会扣除相应费用。</li>
            <li><strong>技能：</strong>按角色说明指定目标；技能也占用本回合的主要行动。</li>
            <li><strong>赠送：</strong>把选中的牌送给另一位行动中的玩家，自己获得 1 点友情。</li>
            <li><strong>交换：</strong>用选中的牌，换取另一位行动中玩家的一张随机手牌；双方各获得 1 点友情。</li>
            <li><strong>防守：</strong>获得 1 层护盾，每层抵消 1 点伤害。</li>
            <li><strong>积蓄：</strong>获得 1 点友情。友情上限为 {CONSTANTS.MAX_FRIENDSHIP}。</li>
          </ul>
          <p className="rules-note">尚未轮到你时，可以查看手牌、身份和行动记录；不能替其他玩家行动。无效操作不会消耗主要行动。</p>
        </section>

        <section id="rules-goal" className="rules-section">
          <h2>身份是秘密，胜利各有条件</h2>
          <p>角色装扮与隐藏身份分别分配。角色决定技能，身份决定你要达成的目标。</p>
          <ul>
            <li><strong>引路人：</strong>团队心愿进度达到 {CONSTANTS.WISH_GOAL}，获得胜利。</li>
            <li><strong>守护伙伴：</strong>引路人获胜，并且引路人的活力大于 0，获得胜利。</li>
            <li><strong>捣蛋客：</strong>终局时心愿进度低于 {CONSTANTS.WISH_GOAL}，获得胜利。</li>
            <li><strong>追梦者：</strong>终局时自己的友情至少 {CONSTANTS.DREAMER_FRIENDSHIP_GOAL}，或个人心愿碎片至少 {CONSTANTS.DREAMER_FRAGMENT_GOAL}，获得个人胜利。</li>
          </ul>
          <p>心愿进度达到目标会立即结算；所有玩家都进入梦境旁观状态，或完成第 {CONSTANTS.MAX_ROUNDS} 轮，也会结算。追梦者可以和其他身份同时获胜。</p>
          <p className="rules-note">心愿碎片与团队心愿进度是不同的数值。部分卡牌和「心愿流星」会推动进度，以桌面数值和记录为准。</p>
          <h2 style={{ marginTop: '1.6rem' }}>活力耗尽，仍能陪伴</h2>
          <p>活力降至 0 后成为梦境旁观者，不再执行普通回合。每轮可以帮助一名仍在行动中的玩家一次：对方获得 1 点友情并抽 1 张牌。带有救回效果的卡牌可以让旁观者重回对局。</p>
        </section>

        <section id="rules-bears" className="rules-section">
          <h2>一二和布布的小默契</h2>
          <p>十二套装扮都来自奶油白熊一二与可可棕熊布布。不同装扮的能力和手牌上限不同，可以在图鉴里查看。</p>
          <p>一二与布布的<strong>本体角色</strong>第一次向彼此赠送或交换手牌时，触发专属羁绊：双方各抽 1 张牌、获得 1 点友情，并建立羁绊。每局只触发一次；其他装扮不会触发这项奖励。</p>
          <p className="rules-note">友情牌也能建立或解除羁绊。羁绊本身不开放对方的手牌，也不提供联合出牌或自动代受伤害。</p>
          <details className="rules-skill-list">
            <summary>查看十二套装扮的技能</summary>
            <dl>{characters.map(character => <div key={character.id}>
              <dt>{character.name} · {character.skill.name}</dt>
              <dd>{character.skill.effect}</dd>
            </div>)}</dl>
          </details>
        </section>

        <section id="rules-cards" className="rules-section">
          <h2>一副牌，八种茶会故事</h2>
          <p>共有 {CARDS.length} 张手牌：{categories.map(category => `${categoryName(category)} ${CARDS.filter(card => card.category === category).length} 张`).join('、')}。卡牌可以造成伤害、提供护盾、恢复活力、交换资源或改变心愿进度。</p>
          <p>每轮会出现一种场景：甜品派对、梦幻迷宫、星光舞台、玩具暴走、云朵暴雨、礼物交换日、安静午后或心愿流星。</p>
          <ul>
            <li><strong>甜品派对：</strong>本轮第一次赠送时，收牌的一方也获得 1 点友情。</li>
            <li><strong>星光舞台：</strong>本轮第一次发动技能免除友情费用，仍需满足手牌等其他条件。</li>
            <li><strong>礼物交换日：</strong>系统在轮开始时随机传递手牌，再补牌；不需要手动选礼物。</li>
            <li><strong>心愿流星：</strong>本轮第一个赠送卡牌，或打出指定目标的治疗、护盾、友情、救回、羁绊效果牌的玩家，获得 1 枚碎片并推动心愿进度。</li>
          </ul>
          <p className="rules-note">查看手牌、牌堆等私密信息，只会出现在发动者自己的记录里。牌堆用完后，会将弃牌重新洗回。</p>
        </section>
        <button type="button" className="rules-return" onClick={goBack}>{returnLabel}</button>
      </div>
    </main>
  );
}

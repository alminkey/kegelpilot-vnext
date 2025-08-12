import { writable, get } from 'svelte/store';

export type RankGoal = { rank:number; day:number; length:number; percent:number };
export type TodayProgress = { done:number; target:number };

type State = {
  today: TodayProgress;
  goal: RankGoal;
  sessionActive: boolean;
  devShort: boolean;
};

const init: State = {
  today: { done: 0, target: 2 },
  goal: { rank: 1, day: 1, length: 5, percent: 0 },
  sessionActive: false,
  devShort: true
};

const s = writable<State>(init);

export const kpStore = {
  subscribe: s.subscribe,
  getTodayProgress(): TodayProgress { return get(s).today; },
  getRankGoal(): RankGoal { return get(s).goal; },
  startSession() {
    if (get(s).sessionActive) return;
    s.update(st => ({...st, sessionActive:true}));
    const secs = get(s).devShort ? 3 : 75; // ~1.25 min fallback
    setTimeout(()=>{
      kpStore.finishSession();
    }, secs * 1000);
  },
  finishSession(){
    s.update(st => {
      const done = Math.min(st.today.target, st.today.done + 1);
      const day = st.goal.day;
      const length = st.goal.length;
      const percent = Math.min(1, (day-1 + done/st.today.target) / length);
      return {...st, sessionActive:false, today:{...st.today, done}, goal:{...st.goal, percent}};
    });
    document.dispatchEvent(new CustomEvent('progress-updated'));
  },
  abortSession(){
    s.update(st => ({...st, sessionActive:false}));
    document.dispatchEvent(new CustomEvent('progress-updated'));
  },
  resetToday(){
    s.update(st => ({...st, today:{...st.today, done:0}}));
    document.dispatchEvent(new CustomEvent('progress-updated'));
  }
};

(() => {
  const CAT_COLOR = '#4caf50';
  const CAT_SECONDARY = '#388e3c';
  const NOSE_COLOR = '#ff7eb3';
  const EYE_COLOR = '#fff';

  const style = document.createElement('style');
  style.textContent = `
    .youvet-cat {
      position: fixed;
      bottom: 18px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      animation: catWalk linear infinite;
    }

    @keyframes catWalk {
      from { transform: translateX(110vw) scaleX(-1); }
      49%  { transform: translateX(-120px) scaleX(-1); }
      50%  { transform: translateX(-120px) scaleX(1); }
      99%  { transform: translateX(110vw) scaleX(1); }
      to   { transform: translateX(110vw) scaleX(-1); }
    }

    .youvet-cat-body {
      animation: catBounce 0.45s ease-in-out infinite;
    }

    @keyframes catBounce {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-3px); }
    }

    .youvet-cat-ears {
      display: flex;
      justify-content: space-between;
      width: 28px;
      margin-bottom: -2px;
    }

    .youvet-cat-ear {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid ${CAT_COLOR};
    }

    .youvet-cat-head {
      width: 28px;
      height: 24px;
      background: ${CAT_COLOR};
      border-radius: 50% 50% 45% 45%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .youvet-cat-eyes {
      display: flex;
      gap: 6px;
      margin-top: -2px;
    }

    .youvet-cat-eye {
      width: 5px; height: 5px;
      background: ${EYE_COLOR};
      border-radius: 50%;
      animation: catBlink 4s ease-in-out infinite;
    }
    .youvet-cat-eye:nth-child(2) { animation-delay: 0.1s; }

    @keyframes catBlink {
      0%, 88%, 100% { transform: scaleY(1); }
      92%            { transform: scaleY(0.1); }
    }

    .youvet-cat-nose {
      position: absolute;
      bottom: 5px; left: 50%;
      transform: translateX(-50%);
      width: 4px; height: 3px;
      background: ${NOSE_COLOR};
      border-radius: 50%;
    }

    .youvet-cat-torso {
      width: 24px; height: 18px;
      background: ${CAT_COLOR};
      border-radius: 40% 40% 50% 50%;
      margin-top: -1px;
      position: relative;
    }

    .youvet-cat-tail {
      position: absolute;
      right: -13px; bottom: 5px;
      width: 16px; height: 5px;
      background: ${CAT_SECONDARY};
      border-radius: 0 4px 4px 0;
      transform-origin: left center;
      animation: catTail 0.9s ease-in-out infinite alternate;
    }

    @keyframes catTail {
      from { transform: rotate(-30deg); }
      to   { transform: rotate(30deg); }
    }

    .youvet-cat-legs {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: -1px;
    }

    .youvet-cat-leg {
      width: 5px; height: 10px;
      background: ${CAT_COLOR};
      border-radius: 0 0 3px 3px;
    }

    .youvet-cat-leg:nth-child(1) { animation: legA 0.45s ease-in-out infinite; }
    .youvet-cat-leg:nth-child(2) { animation: legB 0.45s ease-in-out infinite; }
    .youvet-cat-leg:nth-child(3) { animation: legB 0.45s ease-in-out infinite; }
    .youvet-cat-leg:nth-child(4) { animation: legA 0.45s ease-in-out infinite; }

    @keyframes legA {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-5px); }
    }
    @keyframes legB {
      0%, 100% { transform: translateY(-5px); }
      50%       { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  function createCat(duration) {
    const cat = document.createElement('div');
    cat.className = 'youvet-cat';
    cat.style.animationDuration = duration + 's';
    cat.innerHTML = `
      <div class="youvet-cat-body">
        <div class="youvet-cat-ears">
          <div class="youvet-cat-ear"></div>
          <div class="youvet-cat-ear"></div>
        </div>
        <div class="youvet-cat-head">
          <div class="youvet-cat-eyes">
            <div class="youvet-cat-eye"></div>
            <div class="youvet-cat-eye"></div>
          </div>
          <div class="youvet-cat-nose"></div>
        </div>
        <div class="youvet-cat-torso">
          <div class="youvet-cat-tail"></div>
        </div>
        <div class="youvet-cat-legs">
          <div class="youvet-cat-leg"></div>
          <div class="youvet-cat-leg"></div>
          <div class="youvet-cat-leg"></div>
          <div class="youvet-cat-leg"></div>
        </div>
      </div>
    `;
    return cat;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cat = createCat(18);
    document.body.appendChild(cat);
  });
})();

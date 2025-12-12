/* SPA router + quiz logic (improved) */
document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();

  const QUIZZES = {
    gk: {
      title: 'General Knowledge',
      questions: [
        {q: 'What is the capital of France?', opts:['Paris','Rome','Madrid','Lisbon'], a:0},
        {q: 'Which planet is known as the Red Planet?', opts:['Venus','Mars','Jupiter','Saturn'], a:1},
        {q: 'What is 5 × 6?', opts:['11','30','56','25'], a:1},
      ]
    },
    web: {
      title: 'Web Development',
      questions: [
        {q:'Which tag is used for the largest heading in HTML?', opts:['<h6>','<h1>','<header>','<title>'], a:1},
        {q:'Which CSS property changes text color?', opts:['background','color','font','text-color'], a:1}
      ]
    },
    science: {
      title: 'Science',
      questions: [
        {q:'Water freezes at what temperature (°C)?', opts:['0','100','-10','32'], a:0},
        {q:'Sun is a: ', opts:['Planet','Star','Asteroid','Comet'], a:1}
      ]
    }
  };

  function navigateTo(route, replace=false) {
    const alias = {
      'welcome':'welcome',
      'choose-quiz':'choose-quiz',
      'quiz':'quiz',
      'result':'result',
      'features':'features',
      'dashboard':'dashboard'
    };
    const r = alias[route] || route;
    pages.forEach(p => p.dataset.route === r ? p.classList.add('active') : p.classList.remove('active'));
    const hash = `#${r}`;
    if (replace) history.replaceState(null,null,hash);
    else if (location.hash !== hash) location.hash = hash;
    const active = document.querySelector('.page.active');
    if (active) {
      const focusable = active.querySelector('button, [tabindex], a, input');
      if (focusable) focusable.focus({preventScroll:true});
    }
  }

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-route]');
    if (btn) {
      e.preventDefault();
      const route = btn.getAttribute('data-route');
      navigateTo(route);
      return;
    }
    const start = e.target.closest('.start-quiz');
    if (start) {
      e.preventDefault();
      startQuiz(start.dataset.quiz);
      return;
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#','') || 'welcome';
    navigateTo(hash, true);
  });

  const initial = location.hash.replace('#','') || 'welcome';
  navigateTo(initial, true);

  /* ----- QUIZ ENGINE ----- */
  let currentQuiz = null;
  let currentIndex = 0;
  let score = 0;
  let timerInterval = null;
  const qIndexEl = document.getElementById('q-index');
  const qTotalEl = document.getElementById('q-total');
  const qTextEl = document.getElementById('question-text');
  const optionsEl = document.getElementById('options');
  const nextBtn = document.getElementById('nextBtn');
  const scoreEl = document.getElementById('score');
  const scoreTotalEl = document.getElementById('score-total');
  const resultText = document.getElementById('result-text');
  const timerEl = document.getElementById('timer');

  function startQuiz(quizId) {
    const qdata = QUIZZES[quizId];
    if (!qdata) return alert('Quiz not found');
    currentQuiz = qdata;
    currentIndex = 0;
    score = 0;
    renderQuestion();
    navigateTo('quiz');
  }

  function renderQuestion() {
    clearTimer();
    const qs = currentQuiz.questions;
    qIndexEl.textContent = currentIndex + 1;
    qTotalEl.textContent = qs.length;
    qTextEl.textContent = qs[currentIndex].q;
    optionsEl.innerHTML = '';
    qs[currentIndex].opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.type = 'button';
      btn.innerText = opt;
      btn.dataset.index = idx;
      btn.addEventListener('click', onSelectOption);
      optionsEl.appendChild(btn);
    });
    // start timer (optional) - 30s per question
    startTimer(30);
  }

  function onSelectOption(ev) {
    const btn = ev.currentTarget;
    // ignore clicks if disabled
    if (btn.disabled) return;
    // clear any shakes
    optionsEl.classList.remove('shake');
    // mark selected
    optionsEl.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
    // enable Next button (visual) - we keep logic in Next click
  }

  // Next button handler: require selection
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const selected = optionsEl.querySelector('.option.selected');
      if (!selected) {
        // shake options area to indicate selection required
        optionsEl.classList.remove('shake');
        // force reflow to restart animation
        void optionsEl.offsetWidth;
        optionsEl.classList.add('shake');
        return;
      }
      // if selected, check answer and proceed
      const chosen = Number(selected.dataset.index);
      const correct = currentQuiz.questions[currentIndex].a;
      if (chosen === correct) score++;
      // disable options to prevent double clicks
      optionsEl.querySelectorAll('.option').forEach(o => o.disabled = true);
      clearTimer();
      currentIndex++;
      if (currentIndex >= currentQuiz.questions.length) {
        showResult();
      } else {
        // small delay to show selection feedback
        setTimeout(() => renderQuestion(), 350);
      }
    });
  }

  function showResult() {
    navigateTo('result');
    if (scoreEl) scoreEl.textContent = score;
    if (scoreTotalEl) scoreTotalEl.textContent = currentQuiz.questions.length;
    if (resultText) resultText.textContent = `You answered ${score} out of ${currentQuiz.questions.length} correctly.`;
    currentQuiz = null;
  }

  function startTimer(seconds) {
    clearTimer();
    let remaining = seconds;
    if (timerEl) timerEl.textContent = `00:${String(remaining).padStart(2,'0')}`;
    timerInterval = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = `00:${String(remaining).padStart(2,'0')}`;
      if (remaining <= 0) {
        clearTimer();
        // treat as wrong and move on
        currentIndex++;
        if (currentIndex >= (currentQuiz?.questions?.length || 0)) showResult();
        else renderQuestion();
      }
    }, 1000);
  }
  function clearTimer(){ if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

  // Ensure start-quiz card buttons wired (in case of older DOM)
  document.querySelectorAll('.start-quiz').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const qid = btn.dataset.quiz;
      startQuiz(qid);
    });
  });

  // defensive redirect for unknown hashes
  window.addEventListener('load', () => {
    const h = location.hash.replace('#','');
    const valid = Array.from(pages).some(p => p.dataset.route === h);
    if (!valid) navigateTo('welcome', true);
  });

  // SVG grid init (decorative)
  try {
    const linesGroup = document.querySelector('#lines');
    if(linesGroup && linesGroup.namespaceURI) {
      while(linesGroup.firstChild) linesGroup.removeChild(linesGroup.firstChild);
      for(let i=3;i<100;i+=3){
        const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('x1','0'); ln.setAttribute('x2','100'); ln.setAttribute('y1',String(i)); ln.setAttribute('y2',String(i));
        ln.setAttribute('stroke-width','0.12'); linesGroup.appendChild(ln);
      }
      for(let i=3;i<100;i+=4){
        const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('y1','0'); ln.setAttribute('y2','100'); ln.setAttribute('x1',String(i)); ln.setAttribute('x2',String(i));
        ln.setAttribute('stroke-width','0.12'); linesGroup.appendChild(ln);
      }
    }
  } catch(e){ console.warn('grid init failed', e); }

});

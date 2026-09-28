const questions=[
  {time:20,text:'What does an equal sign mean in an equation?',options:['Both sides have the same value','The left side is larger','Add every number','There is no answer'],correct:0},
  {time:60,text:'If x + 4 = 10, what is the value of x?',options:['4','6','10','14'],correct:1}
];
const menuButton=document.querySelector('#menuButton'),sideMenu=document.querySelector('#sideMenu'),menuBackdrop=document.querySelector('#menuBackdrop');
function setMenu(open){sideMenu.classList.toggle('open',open);menuBackdrop.classList.toggle('visible',open);menuButton.setAttribute('aria-expanded',open);menuButton.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')}
menuButton.onclick=()=>setMenu(!sideMenu.classList.contains('open'));document.querySelector('#closeMenu').onclick=()=>setMenu(false);menuBackdrop.onclick=()=>setMenu(false);
const themeToggle=document.querySelector('#themeToggle');
if(themeToggle){
  const savedTheme=localStorage.getItem('theme');
  if(savedTheme==='dark'||(!savedTheme&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
    document.body.classList.add('dark-mode');
    themeToggle.textContent='☾';
    themeToggle.setAttribute('aria-label','Switch to light mode');
  }
  themeToggle.onclick=()=>{
    const isDark=document.body.classList.toggle('dark-mode');
    themeToggle.textContent=isDark?'☾':'☼';
    themeToggle.setAttribute('aria-label',isDark?'Switch to light mode':'Switch to dark mode');
    localStorage.setItem('theme',isDark?'dark':'light');
  };
}
const flagQuestionButton=document.querySelector('#flagQuestionButton'),helpMessage=document.querySelector('#helpMessage');
flagQuestionButton.onclick=()=>{const isActive=flagQuestionButton.classList.toggle('active');flagQuestionButton.setAttribute('aria-pressed',isActive);flagQuestionButton.setAttribute('aria-label',isActive?'Cancel help request':'Ask for help with this question');flagQuestionButton.title=isActive?'Cancel help request':'Ask for help';helpMessage.textContent=isActive?'You asked for help':'Help request cancelled';helpMessage.classList.remove('hidden');if(!isActive)setTimeout(()=>helpMessage.classList.add('hidden'),1800)};
const chatToggles=document.querySelectorAll('.chat-toggle'),chatPanel=document.querySelector('#chatPanel'),chatForm=document.querySelector('#chatForm'),chatInput=document.querySelector('#chatInput'),chatMessages=document.querySelector('#chatMessages');
function setChat(open){chatPanel.classList.toggle('open',open);chatToggles.forEach(btn=>{btn.setAttribute('aria-expanded',open);btn.setAttribute('aria-label',open?'Close lesson chat':'Open lesson chat');btn.classList.toggle('active',open)});if(open)chatInput.focus()}
chatToggles.forEach(btn=>{btn.onclick=()=>setChat(!chatPanel.classList.contains('open'))});document.querySelector('#closeChat').onclick=()=>setChat(false);chatForm.onsubmit=event=>{event.preventDefault();const message=chatInput.value.trim();if(!message)return;const bubble=document.createElement('p');bubble.className='chat-bubble';bubble.textContent=message;chatMessages.append(bubble);chatInput.value='';chatMessages.scrollTop=chatMessages.scrollHeight};
let player,active=-1;const completed=new Set();
const activeBox=document.querySelector('#activeQuestion'),waiting=document.querySelector('#waitingQuestion'),answers=document.querySelector('#answers'),feedback=document.querySelector('#feedback'),continueButton=document.querySelector('#continueButton');
const tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';document.head.append(tag);
// Replace this videoId with the ID from the YouTube URL your teacher chooses.
window.onYouTubeIframeAPIReady=()=>{player=new YT.Player('youtubePlayer',{videoId:'M7lc1UVf-VE',playerVars:{rel:0,modestbranding:1,playsinline:1},events:{onReady:event=>{event.target.mute();event.target.playVideo();setInterval(checkVideoTime,250)},onStateChange:event=>{if(event.data===YT.PlayerState.PLAYING)document.querySelector('#videoLoader').classList.add('hidden')}}})};
function checkVideoTime(){if(!player||active>-1)return;const next=questions.findIndex((q,i)=>!completed.has(i)&&player.getCurrentTime()>=q.time);if(next>-1)showQuestion(next)}
function showQuestion(index){active=index;const q=questions[index];player.pauseVideo();document.querySelector('#questionBox').classList.remove('hidden');waiting.classList.add('hidden');activeBox.classList.remove('hidden');document.querySelector('#questionCount').textContent=`QUESTION ${index+1} OF ${questions.length}`;document.querySelector('#questionText').textContent=q.text;feedback.textContent='';continueButton.disabled=true;continueButton.textContent='Choose an answer to continue';answers.innerHTML=q.options.map((option,i)=>`<button class="answer" data-answer="${i}">${option}</button>`).join('');document.querySelector('#questionBox').scrollIntoView({behavior:'smooth',block:'start'})}
answers.onclick=event=>{const button=event.target.closest('.answer');if(!button||active<0)return;const q=questions[active],choice=Number(button.dataset.answer);answers.querySelectorAll('button').forEach((item,i)=>{item.disabled=true;if(i===q.correct)item.classList.add('correct')});if(choice!==q.correct)button.classList.add('wrong');feedback.textContent=choice===q.correct?'Correct — well done!':`Not quite. The correct answer is “${q.options[q.correct]}”.`;completed.add(active);updateProgress();continueButton.disabled=false;continueButton.textContent=completed.size===questions.length?'Finish lesson':'Continue video'};
continueButton.onclick=()=>{activeBox.classList.add('hidden');document.querySelector('#questionBox').classList.add('hidden');document.querySelector('.video-card').scrollIntoView({behavior:'smooth',block:'start'});if(completed.size<questions.length)player.playVideo();active=-1};
function updateProgress(){const label=document.querySelector('#progressLabel'),bar=document.querySelector('#progressBar'),list=document.querySelector('#checkpointList');if(label)label.textContent=`${completed.size} / ${questions.length}`;if(bar)bar.style.width=`${completed.size/questions.length*100}%`;if(list)list.innerHTML=questions.map((q,i)=>`<li class="${completed.has(i)?'done':''}"><span class="number">${completed.has(i)?'✓':i+1}</span>Checkpoint ${i+1}</li>`).join('')};updateProgress();

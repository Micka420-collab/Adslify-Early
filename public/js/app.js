
    // Modal
    let currentPlan = 'Explorer';
    let currentAmount = 79;
    
    // URL Success Notification
    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        const plan = params.get('plan') || '';
        setTimeout(() => alert(`Merci pour ta contribution au plan ${plan} ! Ton paiement Stripe est validé.`), 500);
      }
      if (params.get('canceled') === 'true') {
        setTimeout(() => alert("Le paiement Stripe a été annulé."), 500);
      }
    });

    function openModal(plan, amount, access) {
      currentPlan = plan;
      currentAmount = amount;
      document.getElementById('mTitle').textContent = 'Plan ' + plan;
      document.getElementById('mSub').textContent = 'Tu rejoins la communauté de lancement Adslify avec le plan ' + plan + '.';
      document.getElementById('mPlan').textContent = plan;
      document.getElementById('mAccess').textContent = access;
      document.getElementById('mPrice').textContent = amount + '€';
      
      document.getElementById('mName').classList.remove('error');
      document.getElementById('mEmail').classList.remove('error');
      document.getElementById('mError').classList.remove('show');
      
      document.getElementById('mContent').style.display = 'block';
      document.getElementById('mSuccessPane').style.display = 'none';
      
      const btn = document.getElementById('btnPay');
      btn.innerHTML = 'Payer via Stripe →';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      
      document.getElementById('overlay').classList.add('open');
    }

    function closeModal() { document.getElementById('overlay').classList.remove('open'); }
    function overlayClick(e) { if (e.target === document.getElementById('overlay')) closeModal(); }

    async function pay() {
      const nameEl = document.getElementById('mName');
      const emailEl = document.getElementById('mEmail');
      const errEl = document.getElementById('mError');
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      
      nameEl.classList.remove('error');
      emailEl.classList.remove('error');
      errEl.classList.remove('show');

      if (!name || !email) { 
        if (!name) nameEl.classList.add('error');
        if (!email) emailEl.classList.add('error');
        errEl.classList.add('show');
        return; 
      }
      
      // Loading State
      const btn = document.getElementById('btnPay');
      btn.innerHTML = '<span class="spinner"></span> Redirection...';
      btn.style.opacity = '0.9';
      btn.style.pointerEvents = 'none';

      // Option B : Firebase Hosting (Statique) - Redirection vers Stripe Payment Links
      const stripeLinks = {
        'Explorer': 'https://buy.stripe.com/test_remplacez_ceci_explorer',
        'Pioneer': 'https://buy.stripe.com/test_remplacez_ceci_pioneer',
        'Builder': 'https://buy.stripe.com/test_remplacez_ceci_builder'
      };

      const paymentUrl = stripeLinks[currentPlan];

      if (!paymentUrl) {
        alert("Lien de paiement non configuré.");
        btn.innerHTML = 'Payer via Stripe →';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        return;
      }

      // On simule un léger chargement pour l'UX puis on redirige vers Stripe
      // L'email saisi est pré-rempli sur la page Stripe Checkout via ?prefilled_email=
      setTimeout(() => {
        window.location.href = `${paymentUrl}?prefilled_email=${encodeURIComponent(email)}`;
      }, 600);
    }

    // Animate bar on scroll
    const bar = document.getElementById('barFill');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => { bar.style.width = '0%'; }, 300);
        }
      });
    }, { threshold: 0.5 });
    if (document.querySelector('.funding-block')) observer.observe(document.querySelector('.funding-block'));

    // Enrichi Scroll animations (Stagger fade and slide)
    const animEls = document.querySelectorAll('.plan, .rm-item, .trans-card, .preview-card, .feature-card, .ag-item, .tech-stack-bar');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.filter = 'blur(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    animEls.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.filter = 'blur(4px)';
      el.style.transform = 'translateY(24px) scale(0.98)';
      const delay = (index % 3) * 120 + 50;
      el.style.transition = `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, filter 0.6s ease ${delay}ms`;
      obs.observe(el);
    });

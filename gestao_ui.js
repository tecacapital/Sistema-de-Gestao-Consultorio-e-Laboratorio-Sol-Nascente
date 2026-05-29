/**
 * ============================================================
 * FUNÇÕES DO MENU MOBILE
 * ============================================================
 */

// Abrir menu lateral
function openMobileMenu() {
    const sheet = document.querySelector('.mobile-menu-sheet');
    if (sheet) {
        sheet.classList.add('open');
        document.body.classList.add('sidebar-open');
    }
}

// Fechar menu lateral
function closeMobileMenu() {
    const sheet = document.querySelector('.mobile-menu-sheet');
    if (sheet) {
        sheet.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    }
}

// Alternar menu
function toggleMobileMenu() {
    const sheet = document.querySelector('.mobile-menu-sheet');
    if (sheet && sheet.classList.contains('open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// Fechar menu ao clicar no overlay
document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('sidebar-overlay')) {
        closeMobileMenu();
    }
});

// Fechar menu ao pressionar ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// Atualizar informações do menu com dados do utilizador
function updateMobileMenuInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameEl = document.querySelector('.mobile-user-name');
        const userRoleEl = document.querySelector('.mobile-user-role');
        if (userNameEl) userNameEl.textContent = user.nome;
        if (userRoleEl) userRoleEl.textContent = user.funcao;
    }
}

// Destacar item activo no menu mobile
function highlightActiveMobileNav(page) {
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
}
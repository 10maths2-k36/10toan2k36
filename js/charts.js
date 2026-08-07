document.addEventListener('DOMContentLoaded', async function () {
const tenDaysAgo = new Date();
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
const cutoffDateStr = tenDaysAgo.toISOString().split('T')[0];
await supabaseClient
    .from('class_activities')
    .delete()
    .lt('date', cutoffDateStr);
    const canvas = document.getElementById('classActivityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function getColors() {
        const isLight = document.body.classList.contains('light-mode');
        return {
            textColor: isLight ? '#1f2937' : '#f8fafc'
        };
    }
    let initialColors = getColors();
    const classActivityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lượt Khách', 'Lượt Thành Viên', 'Thư Viện', 'Thành Tích'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#38bdf8', 
                    '#34d399', 
                    '#f59e0b', 
                    '#ec4899'  
                ],
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            cutout: '70%', 
            animation: {
                animateScale: true,
                animateRotate: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 14, 
                        boxHeight: 14, 
                        borderRadius: 7,
                        font: { family: 'inherit', size: 12, weight: '700' },
                        color: initialColors.textColor, 
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13, weight: '600' },
                    padding: 14, 
                    cornerRadius: 12, 
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.15)', 
                    borderWidth: 1
                }
            }
        }
    });
    function animateValue(element, start, end, duration) {
        if (!element) return;
        const innerSpan = element.querySelector('.slot-number');
        if (!innerSpan) {
            element.innerText = end.toLocaleString();
            return;
        }
        let current = start;
        innerSpan.innerText = current.toLocaleString();
        if (start === end) return;
        const stepTime = Math.max(Math.min(duration / Math.abs(end - start), 150), 30);
        function step() {
            if (current < end) {
                let increment = (current === 9 && end >= 10) ? 2 : 1;
                let nextVal = Math.min(current + increment, end);
                innerSpan.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
                innerSpan.style.transform = 'translateY(100%)';
                innerSpan.style.opacity = '0';
                setTimeout(() => {
                    current = nextVal;
                    innerSpan.innerText = current.toLocaleString();
                    innerSpan.style.transition = 'none';
                    innerSpan.style.transform = 'translateY(-100%)';
                    innerSpan.style.opacity = '0';
                    setTimeout(() => {
                        innerSpan.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
                        innerSpan.style.transform = 'translateY(0)';
                        innerSpan.style.opacity = '1';
                    }, 20);
                    if (current < end) {
                        setTimeout(step, stepTime);
                    }
                }, 250);
            }
        }
        setTimeout(step, 200);
    }
    const observer = new MutationObserver(() => {
        const updatedColors = getColors();
        classActivityChart.options.plugins.legend.labels.color = updatedColors.textColor;
        classActivityChart.update();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (!document.getElementById('svg-border-anim-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'svg-border-anim-style';
        styleEl.innerHTML = `
            @keyframes svgPauseLoop {
                0% { stroke-dashoffset: 300; }
                80% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 0; }
            }
            .svg-btn-wrapper {
                position: relative;
                display: inline-block;
                border-radius: 10px;
                overflow: hidden;
            }
            .svg-btn-wrapper svg {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
                border-radius: 10px;
            }
            .svg-btn-wrapper .animated-path {
                fill: none;
                stroke-width: 2px;
                stroke-dasharray: 60, 240;
                stroke-linecap: round;
                animation: svgPauseLoop 2.5s ease-in-out infinite;
            }
        `;
        document.head.appendChild(styleEl);
    }
    async function trackAndLoadData(shouldIncrement = false) {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            const isMemberLoggedIn = !authError && user !== null;
            const [galleryRes, achievementsRes] = await Promise.all([
                supabaseClient.from('gallery').select('*', { count: 'exact', head: true }),
                supabaseClient.from('achievements').select('*', { count: 'exact', head: true })
            ]);
            const totalGallery = galleryRes.error ? 0 : (galleryRes.count || 0);
            const totalAchievements = achievementsRes.error ? 0 : (achievementsRes.count || 0);
            let { data: rows } = await supabaseClient.from('class_activities').select('*').eq('date', todayStr);
            let existingData = (rows && rows.length > 0) ? rows[0] : null;
            let guestViews = existingData ? (existingData.guest_views || 0) : 0;
            let memberViews = existingData ? (existingData.member_views || 0) : 0;
            if (shouldIncrement) {
                if (isMemberLoggedIn) {
                    memberViews += 1;
                } else {
                    guestViews += 1;
                }
                if (existingData) {
                    await supabaseClient.from('class_activities').update({
                        guest_views: guestViews,
                        member_views: memberViews,
                        documents: totalGallery
                    }).eq('id', existingData.id);
                } else {
                    await supabaseClient.from('class_activities').insert([{
                        date: todayStr,
                        guest_views: guestViews,
                        member_views: memberViews,
                        documents: totalGallery
                    }]);
                }
            }
            const { data: chartRows } = await supabaseClient
                .from('class_activities')
                .select('*')
                .order('date', { ascending: false })
                .limit(10);
            let totalGuestViews = 0;
            let totalMemberViews = 0;
            let oldestDate = '--/--/----';
            let newestDate = '--/--/----';
            if (chartRows && chartRows.length > 0) {
                chartRows.forEach(item => {
                    totalGuestViews += (item.guest_views || 0);
                    totalMemberViews += (item.member_views || 0);
                });
                const sortedRows = chartRows.sort((a, b) => new Date(a.date) - new Date(b.date));
                const formatDate = (dStr) => {
                    if (!dStr) return '--/--/----';
                    const parts = dStr.split('-');
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                };
                oldestDate = formatDate(sortedRows[0].date);
                newestDate = formatDate(sortedRows[sortedRows.length - 1].date);
            }
            const totalViews = totalGuestViews + totalMemberViews;
            classActivityChart.data.datasets[0].data = [totalGuestViews, totalMemberViews, totalGallery, totalAchievements];
            classActivityChart.update();
            let dateRangeEl = document.getElementById('date-range');
            if (!dateRangeEl) {
                const titleEl = document.querySelector('h2, .section-title, [style*="Thống Kê"]');
                if (titleEl) {
                    dateRangeEl = document.createElement('div');
                    dateRangeEl.id = 'date-range';
                    dateRangeEl.style.cssText = 'font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 6px 0 12px 0; font-weight: 500;';
                    titleEl.parentNode.insertBefore(dateRangeEl, titleEl.nextSibling);
                }
            }
            if (dateRangeEl) {
                dateRangeEl.innerHTML = `Từ ngày: <span style="color: var(--text-color); font-weight: 600;">${oldestDate} đến ${newestDate}</span>`;
            }
            const guestEl = document.getElementById('stat-guest-views');
            const memberEl = document.getElementById('stat-member-views');
            const libEl = document.getElementById('stat-library'); 
            const achEl = document.getElementById('stat-achievements'); 
            if (guestEl) animateValue(guestEl, 0, totalGuestViews, 1000);
            if (memberEl) animateValue(memberEl, 0, totalMemberViews, 1000);
            if (libEl) animateValue(libEl, 0, totalGallery, 1000);
            if (achEl) animateValue(achEl, 0, totalAchievements, 1000);
            const [docsDataRes, imagesDataRes, achievementsDataRes] = await Promise.all([
                supabaseClient.from('gallery').select('title, link').is('image_url', null).order('id', { ascending: false }).limit(3),
                supabaseClient.from('gallery').select('title, link').not('image_url', 'is', null).order('id', { ascending: false }).limit(3),
                supabaseClient.from('achievements').select('title, student_name, link').order('id', { ascending: false }).limit(3)
            ]);
            const recentDocs = docsDataRes.data || [];
            const recentImages = imagesDataRes.data || [];
            const recentAchievements = achievementsDataRes.data || [];
            const previewContainer = document.getElementById('recentDocsPreview');
            if (previewContainer && recentDocs.length > 0) {
                previewContainer.innerHTML = `
                    <div style="background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                                <i class="ri-file-text-line" style="color: #38bdf8; font-size: 1.1rem;"></i> Tài Liệu Mới
                            </div>
                            <a href="gallery.html#documents" class="dynamic-text-color" style="font-size: 0.82rem; text-decoration: none; font-weight: 600; opacity: 0.9;">Xem tất cả &rarr;</a>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${recentDocs.map(doc => `
                                <a href="gallery.html#documents" class="doc-preview-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; text-decoration: none;">
                                    <span class="dynamic-text-color" style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; display: flex; align-items: center; gap: 8px;">
                                        <i class="ri-file-list-line" style="color: #38bdf8; font-size: 1rem;"></i> ${doc.title || 'Tài liệu học tập'}
                                    </span>
                                    <div class="svg-btn-wrapper">
                                        <span style="display: inline-block; font-size: 0.78rem; color: #38bdf8; padding: 5px 14px; font-weight: 800;">Chi tiết &rarr;</span>
                                        <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                                            <rect x="1" y="1" width="98" height="34" rx="8" class="animated-path" stroke="#38bdf8" />
                                        </svg>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Lỗi đồng bộ dữ liệu thống kê:", err);
        }
    }
    trackAndLoadData(true);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            trackAndLoadData(true);
        }
    });
});